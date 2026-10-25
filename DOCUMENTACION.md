# VERA DICOM — PWA local para tablet Android

Versión 0.1. **Prototipo experimental NO VALIDADO para diagnóstico.**

Visor de series DICOM en Android (Galaxy Tab S10+) con Cornerstone3D. Los estudios se seleccionan en la tablet y se procesan en el navegador. No incluye un servidor ni funciones de subir estudios. Repositorio público: **no almacenar archivos clínicos aquí**.

## Qué incluye
- Importación local de archivos DICOM y carpetas según soporte del navegador.
- Agrupación de archivos por StudyInstanceUID y SeriesInstanceUID y ordenación por posición geométrica cuando está disponible.
- Visor de pila 2D, botones y barra para navegar cortes.
- Zoom, paneo, ventana/nivel y presets orientativos para TC.
- Interfaz táctil en español y PWA instalable con recursos estáticos en caché.
- Cuatro pruebas unitarias de organización geométrica/series.

## Qué todavía NO incluye
- MPR, 3D, MIP, segmentación, herramientas de medida calibradas, exportación médica.
- Lectura ZIP, DICOMDIR, PACS, DICOMweb.
- Compatibilidad garantizada con Enhanced CT/MR multiframe, todos los codecs o formatos comprimidos.
- Certificación, validación clínica o prueba confirmada en Galaxy Tab S10+.

## Desarrollo
Requiere Node.js 20+.
```bash
npm install
npm test
npm run dev
npm run build
```

El script de build genera iconos provisionales, compila Vite y crea el manifiesto de precarga offline. Los PNG de `public/icons` son generados en cada build y no forman parte del código versionado.

## Publicación con GitHub Pages
El flujo `.github/workflows/deploy.yml` está configurado para compilar y desplegar desde `main`. En GitHub abrir **Settings → Pages → Build and deployment → Source → GitHub Actions**. Después revisar la pestaña **Actions**. Si se publica correctamente, la URL esperada es:

https://shadrachrdz-create.github.io/vera-dicom-pwa/

La disponibilidad real del sitio depende de la configuración de Pages y de que el flujo complete sin fallos. Esta URL no se debe considerar activa hasta verificarla.

## Instalar en tablet
1. Desde Chrome (Android), abrir la URL HTTPS publicada.
2. Menú ⋮ → Instalar aplicación o Agregar a pantalla principal.
3. Copiar DICOM desidentificados a almacenamiento interno o USB-C. Si vienen en ZIP, descomprimirlos en Mis archivos.
4. Desde la PWA pulsar **Abrir archivos DICOM** o **Abrir carpeta**, seleccionar la serie, desplazarse por los cortes y cambiar las ventanas.
5. Antes de uso offline, abrir la PWA con conexión y comprobarla después en modo avión.

## Privacidad
La intención del código es procesar archivos localmente sin transmitirlos. Esta afirmación requiere auditoría del bundle final, registros de red, hosting y dependencias. No usar pacientes identificables para desarrollo ni prueba sin controles adecuados.

## Validación pendiente
- Comprobar instalación de dependencias, compilación y carga en Chrome/Android.
- Contrastar cortes, orientación/lateralidad, orden, fotometría y pendiente/intercepto con un visor DICOM de referencia.
- Probar transfer syntaxes reales con compresión, multiframe y series grandes.
- Verificar rendimiento, memoria, controles táctiles, instalación offline y ausencia de cargas de información clínica.
- Evaluar requisitos normativos antes de uso diagnóstico.

**El monograma “VD” de la versión inicial es provisional y no reemplaza el logo oficial VERAMEDIC.**

Ver [CODEX_PROMPT.md](./CODEX_PROMPT.md) para continuar el proyecto con Codex.
