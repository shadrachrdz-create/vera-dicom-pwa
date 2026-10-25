import './styles.css';
import { RenderingEngine, Enums as coreEnums, init as coreInit } from '@cornerstonejs/core';
import { init as dicomInit, wadouri } from '@cornerstonejs/dicom-image-loader';
import {
  init as toolsInit, addTool, ToolGroupManager, Enums as toolsEnums,
  WindowLevelTool, PanTool, ZoomTool, StackScrollTool,
} from '@cornerstonejs/tools';
import { inspectFiles } from './dicom.js';
import { groupSeries } from './series.js';

const $ = (id) => document.getElementById(id);
const ENGINE_ID = 'VERA_ENGINE';
const VIEWPORT_ID = 'VERA_STACK';
const GROUP_ID = 'VERA_TOOLS';
const PRESETS = {
  soft: { center: 40, width: 400 },
  lung: { center: -600, width: 1500 },
  bone: { center: 300, width: 1500 },
  brain: { center: 40, width: 80 },
};

let engine;
let viewport;
let group;
let series = [];
let activeSeries = null;
let activeImageIds = [];
let index = 0;
let navigating = false;
let queuedIndex = null;
let mode = 'window';
let bootPromise;

function status(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}

function initViewer() {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    await coreInit();
    await dicomInit({ maxWebWorkers: 2 });
    await toolsInit();
    for (const tool of [WindowLevelTool, PanTool, ZoomTool, StackScrollTool]) addTool(tool);
    engine = new RenderingEngine(ENGINE_ID);
    engine.enableElement({ viewportId: VIEWPORT_ID, type: coreEnums.ViewportType.STACK, element: $('viewer') });
    viewport = engine.getViewport(VIEWPORT_ID);
    group = ToolGroupManager.createToolGroup(GROUP_ID);
    for (const tool of [WindowLevelTool, PanTool, ZoomTool, StackScrollTool]) group.addTool(tool.toolName);
    group.addViewport(VIEWPORT_ID, ENGINE_ID);
    group.setToolActive(StackScrollTool.toolName, { bindings: [{ mouseButton: toolsEnums.MouseBindings.Wheel }] });
    setMode(mode);
    window.addEventListener('resize', () => engine?.resize(true, false));
  })().catch((error) => {
    bootPromise = null;
    throw error;
  });
  return bootPromise;
}

function setMode(newMode) {
  mode = newMode;
  document.querySelectorAll('[data-mode]').forEach((el) => {
    el.classList.toggle('is-selected', el.dataset.mode === mode);
  });
  $('toolInfo').textContent = `Modo: ${mode === 'window' ? 'ventana / nivel' : mode === 'pan' ? 'desplazar' : 'zoom'}`;
  if (!group) return;
  for (const tool of [WindowLevelTool, PanTool, ZoomTool]) group.setToolPassive(tool.toolName);
  const selected = mode === 'pan' ? PanTool : mode === 'zoom' ? ZoomTool : WindowLevelTool;
  group.setToolActive(selected.toolName, {
    bindings: [
      { mouseButton: toolsEnums.MouseBindings.Primary },
      { numTouchPoints: 1 },
      ...(mode === 'zoom' ? [{ numTouchPoints: 2 }] : []),
    ],
  });
  if (mode !== 'zoom') group.setToolActive(ZoomTool.toolName, {
    bindings: [{ mouseButton: toolsEnums.MouseBindings.Secondary }, { numTouchPoints: 2 }],
  });
}

function makeImageIds(selected) {
  const ids = [];
  // File object permanece local en el dispositivo; no se sube por HTTP.
  for (const item of selected.items) {
    const imageId = wadouri.fileManager.add(item.file);
    if (item.frames === 1) ids.push(imageId);
    else {
      for (let frame = 1; frame <= item.frames; frame += 1) {
        ids.push(`${imageId}${imageId.includes('?') ? '&' : '?'}frame=${frame}`);
      }
    }
  }
  return ids;
}

function displayCount() {
  const total = activeImageIds.length;
  $('imageIndex').textContent = total ? `Corte ${index + 1} / ${total}` : '—';
  $('sliceSlider').value = String(index);
  $('sliceSlider').max = String(Math.max(0, total - 1));
  $('sliceSlider').disabled = total <= 1;
  $('prevImage').disabled = total <= 1 || index <= 0;
  $('nextImage').disabled = total <= 1 || index >= total - 1;
}

async function chooseSeries(seriesIndex) {
  const selected = series[seriesIndex];
  if (!selected) return;
  status('Preparando la serie y su primer corte…');
  activeSeries = selected;
  activeImageIds = makeImageIds(selected);
  index = 0;
  queuedIndex = null;
  try {
    await initViewer();
    // setStack solo decodifica lo que necesita mostrar, no genera un volumen 3D.
    await viewport.setStack(activeImageIds, 0);
    viewport.render();
    engine.resize(true, false);
    $('emptyMessage').hidden = true;
    $('seriesDetails').textContent = `${selected.modality} · ${selected.description} · ${selected.items.length} archivo(s)`;
    const sample = selected.items[0];
    $('scanInfo').textContent = `${sample.rows} × ${sample.columns} px · ${activeImageIds.length} imagen(es)`;
    displayCount();
    status(`Serie preparada en la tablet. ${activeImageIds.length} imagen(es) disponibles. Los datos permanecen locales.`);
  } catch (error) {
    status(`No se pudo renderizar la serie. Compruebe que la codificación DICOM es compatible. Detalle técnico: ${error?.message || String(error)}`, true);
  }
}

function goToImage(request) {
  if (!viewport || activeImageIds.length < 1) return;
  queuedIndex = Math.max(0, Math.min(activeImageIds.length - 1, Number(request) || 0));
  if (navigating) return;
  navigating = true;
  (async () => {
    while (queuedIndex !== null) {
      const requested = queuedIndex;
      queuedIndex = null;
      try {
        await viewport.setImageIdIndex(requested);
        index = requested;
        viewport.render();
        displayCount();
      } catch (error) {
        status(`No se pudo leer el corte ${requested + 1}: ${error?.message || String(error)}`, true);
      }
    }
  })().finally(() => { navigating = false; });
}

function setWindow(center, width) {
  if (!viewport || activeImageIds.length === 0) return status('Abra una serie DICOM antes de modificar la ventana.', true);
  if (!Number.isFinite(center) || !Number.isFinite(width) || width <= 0) return status('Centro y ancho de ventana deben ser numéricos; el ancho debe ser mayor que cero.', true);
  viewport.setProperties({ voiRange: { lower: center - width / 2, upper: center + width / 2 } });
  viewport.render();
  $('wwCenter').value = String(center);
  $('wwWidth').value = String(width);
  status(`Ventana aplicada: C ${center} · A ${width}. Valores orientativos para TC; no equivalen a calibración diagnóstica.`);
}

async function addFiles(files) {
  if (files.length === 0) return;
  if (files.length > 5000) return status('Demasiados archivos para este prototipo. Seleccione una serie más pequeña.', true);
  status(`Leyendo metadatos locales de ${files.length} archivo(s)…`);
  $('seriesSelect').disabled = true;
  try {
    const result = await inspectFiles(files, (done, total) => status(`Clasificando DICOM… ${done}/${total}`));
    series = groupSeries(result.images);
    if (series.length === 0) {
      status('No encontré imágenes DICOM Part 10 compatibles. Si el estudio viene en .ZIP, extráigalo primero.', true);
      return;
    }
    const select = $('seriesSelect');
    select.replaceChildren();
    series.forEach((serie, position) => {
      const option = document.createElement('option');
      option.value = String(position);
      const frameCount = serie.items.reduce((n, item) => n + item.frames, 0);
      option.textContent = `${serie.modality} · ${serie.description} (${frameCount} cortes)`;
      select.append(option);
    });
    select.disabled = false;
    status(`Se encontraron ${series.length} serie(s), ${result.images.length} archivo(s) DICOM. ${result.warnings.length} elemento(s) no legibles/omitidos.`);
    await chooseSeries(0);
  } catch (error) {
    status(`Error al abrir archivos: ${error?.message || String(error)}`, true);
  }
}

async function chooseDirectory() {
  if ('showDirectoryPicker' in window) {
    try {
      const folder = await window.showDirectoryPicker({ mode: 'read' });
      const files = [];
      async function walk(dir, depth) {
        if (depth > 5) return;
        for await (const handle of dir.values()) {
          if (handle.kind === 'directory') await walk(handle, depth + 1);
          else {
            files.push(await handle.getFile());
            if (files.length > 5000) throw new Error('Máximo 5000 archivos por selección');
          }
        }
      }
      await walk(folder, 0);
      return addFiles(files);
    } catch (error) {
      if (error?.name !== 'AbortError') status(`No se pudo acceder a la carpeta: ${error?.message || String(error)}`, true);
      return;
    }
  }
  $('folderInput').click();
}

$('openFiles').addEventListener('click', () => $('filesInput').click());
$('openFolder').addEventListener('click', chooseDirectory);
$('filesInput').addEventListener('change', (e) => { const chosen = [...e.target.files]; e.target.value = ''; addFiles(chosen); });
$('folderInput').addEventListener('change', (e) => { const chosen = [...e.target.files]; e.target.value = ''; addFiles(chosen); });
$('resetApp').addEventListener('click', () => window.location.reload()); // libera buffers/objetos de estudio en memoria
$('seriesSelect').addEventListener('change', (e) => chooseSeries(Number(e.target.value)));
$('prevImage').addEventListener('click', () => goToImage(index - 1));
$('nextImage').addEventListener('click', () => goToImage(index + 1));
$('sliceSlider').addEventListener('input', (e) => goToImage(Number(e.target.value)));
document.querySelectorAll('[data-mode]').forEach((el) => el.addEventListener('click', () => setMode(el.dataset.mode)));
document.querySelectorAll('[data-preset]').forEach((el) => el.addEventListener('click', () => {
  const preset = PRESETS[el.dataset.preset];
  setWindow(preset.center, preset.width);
}));
$('applyWindow').addEventListener('click', () => setWindow(Number($('wwCenter').value), Number($('wwWidth').value)));
$('resetView').addEventListener('click', () => { if (!viewport) return; viewport.resetCamera(); viewport.render(); });
$('fullScreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $('viewerShell').requestFullscreen();
    engine?.resize(true, false);
  } catch { status('El navegador no permitió activar pantalla completa.', true); }
});
window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); goToImage(index - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); goToImage(index + 1); }
});

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      status('La aplicación funciona en línea, pero no se pudo instalar el modo sin conexión.', true);
    });
  });
}
