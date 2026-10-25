import dicomParser from 'dicom-parser';
import { parseNumberList } from './series.js';

const MAX_HEADER_SCAN = 8 * 1024 * 1024;

export async function inspectFile(file) {
  if (!file || file.name.toUpperCase() === 'DICOMDIR') return null;
  let lastError;
  for (const limit of [1024 * 1024, 4 * 1024 * 1024, MAX_HEADER_SCAN]) {
    try {
      // Lectura parcial: evita cargar en RAM todos los píxeles al clasificar la serie.
      const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, limit)).arrayBuffer());
      const data = dicomParser.parseDicom(bytes, { untilTag: 'x7fe00010' });
      const sopUID = data.string('x00080016');
      const rows = data.uint16('x00280010');
      const columns = data.uint16('x00280011');
      if (!sopUID || !rows || !columns) throw new Error('No contiene una imagen DICOM válida');
      const count = Math.max(1, Math.min(Number(data.string('x00280008')) || 1, 10000));
      return {
        file,
        filename: file.webkitRelativePath || file.name,
        studyUID: data.string('x0020000d'),
        seriesUID: data.string('x0020000e'),
        sopInstanceUID: data.string('x00080018'),
        description: (data.string('x0008103e') || '').trim().slice(0, 100),
        modality: (data.string('x00080060') || 'OT').trim(),
        instance: Number.parseInt(data.string('x00200013'), 10),
        orientation: parseNumberList(data.string('x00200037'), 6),
        position: parseNumberList(data.string('x00200032'), 3),
        rows,
        columns,
        frames: count,
      };
    } catch (error) {
      lastError = error;
      if (file.size <= limit) break;
    }
  }
  throw lastError || new Error('Formato no compatible');
}

export async function inspectFiles(files, onProgress = () => {}) {
  const images = [];
  const warnings = [];
  const unique = new Set();
  let processed = 0;
  for (const file of files) {
    try {
      const metadata = await inspectFile(file);
      if (metadata) {
        const fingerprint = metadata.studyUID && metadata.seriesUID && metadata.sopInstanceUID
          ? `${metadata.studyUID}|${metadata.seriesUID}|${metadata.sopInstanceUID}`
          : `${metadata.filename}|${file.size}`;
        if (!unique.has(fingerprint)) {
          images.push(metadata);
          unique.add(fingerprint);
        }
      }
    } catch {
      // Los directorios de estudios pueden contener PNG, PDF, DICOMDIR y otros adjuntos.
      warnings.push(file.name);
    }
    processed += 1;
    if (processed % 12 === 0 || processed === files.length) onProgress(processed, files.length);
  }
  return { images, warnings };
}
