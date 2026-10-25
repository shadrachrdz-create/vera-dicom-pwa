# VERA DICOM — visor DICOM para Galaxy Tab S10+

**Prototipo experimental 0.1. No está validado ni certificado para diagnóstico médico.**

Aplicación web progresiva (PWA) en español, hecha con Vite, Cornerstone3D y dicom-parser. Abre DICOM seleccionados desde el almacenamiento de la tablet; no requiere subir los estudios al repositorio ni a un servidor.

## Instalarla desde GitHub Pages

1. Abre en GitHub este repositorio y entra a **Settings → Pages**.
2. En **Build and deployment → Source**, elige **GitHub Actions**.
3. Revisa en la pestaña **Actions** el flujo **Publicar VERA DICOM**. Si hay un error, abre el registro de ejecución para identificarlo.
4. Una vez publicado correctamente, abre desde Chrome Android: https://shadrachrdz-create.github.io/vera-dicom-pwa/
5. En Chrome selecciona ⋮ → **Instalar aplicación** (o **Agregar a pantalla principal**).
6. Abre primero una serie DICOM **desidentificada** para probar los controles. Si el estudio está en ZIP, extráelo previamente en «Mis archivos».

## Código y funciones

- `src/main.js`: motor de visualización Cornerstone, navegación por cortes, herramientas táctiles y ventanas CT.
- `src/dicom.js`: inspección de metadatos DICOM locales.
- `src/series.js`: agrupación y ordenación geométrica de imágenes.
- `src/styles.css`: interfaz responsive.
- `public/sw.js`: caché de recursos estáticos, no de estudios.
- `scripts/generate-icons.mjs`: genera iconos de instalación provisionales.
- `.github/workflows/deploy.yml`: compila, ejecuta pruebas y publica en Pages.
- `tests/series.test.js`: cuatro pruebas unitarias.
- `CODEX_PROMPT.md`: instrucciones para continuar el proyecto desde Codex.
- `DOCUMENTACION.md`: guía extensa de uso, límites y validaciones pendientes.

## Desarrollo con Node.js 20+

```bash
npm install
npm test
npm run dev
npm run build
```

Las pruebas de agrupación y ordenamiento pasaron localmente. **La instalación de dependencias y la compilación Vite/Cornerstone aún no se han podido verificar en este entorno**; se debe revisar el resultado real de GitHub Actions antes de considerar publicada la PWA.

**Privacidad:** no subas archivos DICOM, imágenes de pacientes, datos identificables ni credenciales a este repositorio público. La arquitectura apunta a procesar los estudios localmente; es necesaria una revisión técnica de red y seguridad antes de usar datos reales.

**Alcance:** visor 2D inicial; MPR, 3D, CBCT avanzado, ZIP/DICOMDIR y validación diagnóstica son etapas posteriores.
