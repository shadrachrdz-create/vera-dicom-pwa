import test from 'node:test';
import assert from 'node:assert/strict';
import { orderInstances, groupSeries, spatialPosition, parseNumberList } from '../src/series.js';

test('ordena una serie axial por localización anatómica', () => {
  const orient = [1, 0, 0, 0, 1, 0];
  const make = (z, n) => ({ filename: `CT${n}.dcm`, position: [0, 0, z], orientation: orient, instance: n });
  assert.deepEqual(orderInstances([make(6, 4), make(2, 2), make(4, 3)]).map((x) => x.position[2]), [2, 4, 6]);
  assert.equal(spatialPosition(make(13, 7)), 13);
});

test('ordena por instancia cuando falta geometría', () => {
  assert.deepEqual(orderInstances([{ filename: 'image9', instance: 9 }, { filename: 'image1', instance: 1 }]).map((x) => x.instance), [1, 9]);
});

test('separa estudios por StudyInstanceUID y SeriesInstanceUID', () => {
  const a = { studyUID: 'study1', seriesUID: 'seriesA', modality: 'CT', filename: '1.dcm', instance: 1 };
  const b = { studyUID: 'study2', seriesUID: 'seriesA', modality: 'CT', filename: '2.dcm', instance: 2 };
  assert.equal(groupSeries([a, b]).length, 2);
});

test('rechaza vectores DICOM incompletos', () => {
  assert.deepEqual(parseNumberList('1\\0\\0\\0\\1\\0', 6), [1, 0, 0, 0, 1, 0]);
  assert.equal(parseNumberList('1\\a', 2), null);
});
