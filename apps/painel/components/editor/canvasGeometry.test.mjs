import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('./canvasGeometry.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { getCanvasGeometry, fitCanvasScale, boundCanvasItem } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

for (const orientation of ['horizontal', 'vertical']) {
  test(orientation + ': grid coordinates match the Player percentages', () => {
    const geometry = getCanvasGeometry(orientation);
    assert.equal(geometry.width / geometry.cols, 40);
    assert.equal(geometry.height / geometry.rows, 40);
    for (const viewport of [[1200, 680], [680, 480], [320, 280]]) {
      const scale = fitCanvasScale(...viewport, geometry);
      const x = 5, y = 7, w = 8, h = 6;
      assert.ok(Math.abs(x * 40 * scale - (x / geometry.cols) * geometry.width * scale) < 1e-9);
      assert.ok(Math.abs(y * 40 * scale - (y / geometry.rows) * geometry.height * scale) < 1e-9);
      assert.ok(Math.abs(w * 40 * scale / (h * 40 * scale) - w / h) < 1e-9);
      assert.ok(geometry.width * scale + 10 <= viewport[0] + 1e-9);
      assert.ok(geometry.height * scale + 16 <= viewport[1] + 1e-9);
    }
  });

  test(orientation + ': dragging and resizing cannot exceed the TV', () => {
    const geometry = getCanvasGeometry(orientation);
    for (const input of [
      { i: 'one', x: -10, y: -4, w: 8, h: 6 },
      { i: 'two', x: 500, y: 500, w: 6, h: 4 },
      { i: 'three', x: 12, y: 18, w: 100, h: 100 },
      { i: 'four', x: 20, y: 25, w: 0, h: -2 },
    ]) {
      const item = boundCanvasItem(input, geometry);
      assert.ok(item.x >= 0 && item.y >= 0);
      assert.ok(item.w >= 1 && item.h >= 1);
      assert.ok(item.x + item.w <= geometry.cols);
      assert.ok(item.y + item.h <= geometry.rows);
      assert.notEqual(item, input, 'do not mutate persisted input');
    }
  });
}

test('hidden or collapsed workspace produces no negative scale', () => {
  assert.equal(fitCanvasScale(0, 0, getCanvasGeometry('horizontal')), 0);
});

test('videowall: 3 TVs horizontais empilhadas somam a grade e marcam 2 divisões', async () => {
  const { getWallSeams, crossesWallSeam } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
  const geometry = getCanvasGeometry('horizontal', { cols: 1, rows: 3 });
  assert.equal(geometry.width, 1920);
  assert.equal(geometry.height, 3240);
  assert.equal(geometry.cols, 48);
  assert.equal(geometry.rows, 81);
  assert.deepEqual(getWallSeams(geometry), { x: [], y: [27, 54] });
  assert.equal(crossesWallSeam({ i: 'a', x: 0, y: 20, w: 10, h: 10 }, geometry), true);
  assert.equal(crossesWallSeam({ i: 'b', x: 0, y: 0, w: 10, h: 27 }, geometry), false);
  assert.equal(getCanvasGeometry('vertical', { cols: 99, rows: 0 }).wallCols, 6);
});
