# Instrucciones para continuar este proyecto en Codex

Necesito que trabajes sobre el repositorio `shadrachrdz-create/vera-dicom-pwa`, una PWA para visualizar series médicas DICOM desde una Samsung Galaxy Tab S10+ con Android/Chrome. El objetivo es lectura LOCAL de CT, MR y radiografías DICOM sin transmitir estudios ni metadatos a servidores. La interfaz debe seguir en español.

## Tarea inmediata
1. Revisa dependencias, compatibilidad y versiones de `@cornerstonejs/core`, `@cornerstonejs/tools` y `@cornerstonejs/dicom-image-loader`; ejecuta `npm test`, `npm run build` y corrige los fallos de imports, bundles, workers, codecs WASM, CSP o service worker.
2. Realiza pruebas con DICOM sintéticos o desidentificados, nunca datos reales de pacientes. Prueba Part 10 16-bit, JPEG Lossless, JPEG2000 y multiframe si dispones de estudios de muestra.
3. Verifica metadatos de series, orden por normal de corte, multiframe, memoria entre series, gestos táctiles, offline y codecs.
4. Agrega pruebas automatizadas E2E y de selección de archivos, agrupación y geometría; no destruyas las pruebas existentes.
5. Revisa el flujo GitHub Actions y el despliegue GitHub Pages. Verifica modo avión tras una primera carga. No añadas servidores ni analítica.
6. Reporta exactamente qué formatos y transfer syntaxes funcionan realmente. Mantén visible el aviso de prototipo sin validación diagnóstica.
7. Solicita autorización antes de habilitar envíos de información clínica fuera del dispositivo.

## Segunda etapa (después de validar la primera)
- MPR axial/coronal/sagital con geometría verificada.
- Medidas calibradas, consulta HU, ventanas y presets.
- CBCT dental, MIP, 3D y navegación optimizada para estudios grandes.
- Lectura opcional de ZIP y DICOMDIR.

## Restricciones
- Nada de subir datos DICOM, identificadores de pacientes o metadatos a APIs, nubes o telemetría.
- No afirmar que es software certificado o apto para diagnóstico sin validación.
- No interpolar ni reordenar datos clínicos sin verificar geometría DICOM.
- No reproducir el logo oficial VERAMEDIC sin su archivo original.
