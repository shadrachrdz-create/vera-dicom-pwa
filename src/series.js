// Funciones puras, sin datos personales ni dependencias de navegador.
export function spatialPosition(item) {
  const orient = item.orientation;
  const pos = item.position;
  if (!Array.isArray(orient) || orient.length !== 6 || !Array.isArray(pos) || pos.length !== 3) return null;
  if (![...orient, ...pos].every(Number.isFinite)) return null;
  const cross = [
    orient[1] * orient[5] - orient[2] * orient[4],
    orient[2] * orient[3] - orient[0] * orient[5],
    orient[0] * orient[4] - orient[1] * orient[3],
  ];
  return cross[0] * pos[0] + cross[1] * pos[1] + cross[2] * pos[2];
}

export function orderInstances(items) {
  return [...items].sort((a, b) => {
    // No mezclar criterios espaciales si alguno de los dos no los tiene.
    const aZ = spatialPosition(a);
    const bZ = spatialPosition(b);
    if (aZ !== null && bZ !== null && aZ !== bZ) return aZ - bZ;
    if (Number.isFinite(a.instance) && Number.isFinite(b.instance) && a.instance !== b.instance) return a.instance - b.instance;
    return a.filename.localeCompare(b.filename, 'es', { numeric: true });
  });
}

export function groupSeries(items) {
  const groups = new Map();
  for (const item of items) {
    // Nunca agrupar estudios sin UID entre sí accidentalmente.
    const key = item.studyUID && item.seriesUID
      ? `${item.studyUID}::${item.seriesUID}`
      : `unknown::${item.filename}::${groups.size}`;
    if (!groups.has(key)) groups.set(key, { key, modality: item.modality || 'DICOM', description: item.description || 'Serie sin descripción', items: [] });
    groups.get(key).items.push(item);
  }
  return [...groups.values()].map((group) => ({ ...group, items: orderInstances(group.items) }))
    .sort((a, b) => b.items.length - a.items.length);
}

export function parseNumberList(value, expected) {
  if (!value) return null;
  const numbers = String(value).split('\\').map((s) => Number(s.trim()));
  return numbers.length === expected && numbers.every(Number.isFinite) ? numbers : null;
}
