import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const compiled = await build({ entryPoints: [new URL('../src/mysql-manager/relation-camera.ts', import.meta.url).pathname], bundle: true, write: false, format: 'esm', platform: 'node' })
const { frameCamera, fitCamera, zoomCamera, wheelCamera, MIN_RELATION_ZOOM, MAX_RELATION_ZOOM } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'))
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`)
test('pinch zoom preserves the graph point beneath the pointer, including clamped zoom', () => {
  const camera = { x: -120, y: 75, scale: .85 }, anchor = { x: 322, y: 190 }
  for (const scale of [1.6, .3, 99, .001]) {
    const next = zoomCamera(camera, scale, anchor)
    near((anchor.x - next.x) / next.scale, (anchor.x - camera.x) / camera.scale)
    near((anchor.y - next.y) / next.scale, (anchor.y - camera.y) / camera.scale)
    assert.ok(next.scale >= MIN_RELATION_ZOOM && next.scale <= MAX_RELATION_ZOOM)
  }
})
test('trackpad scroll pans both axes, pinch changes scale; wheel units are normalized', () => {
  const camera = { x: 50, y: 70, scale: 1 }, anchor = { x: 120, y: 160 }
  const event = { deltaX: 12, deltaY: 20, deltaMode: 0, ctrlKey: false, metaKey: false }
  assert.deepEqual(wheelCamera(camera, event, anchor, 500), { x: 38, y: 50, scale: 1 })
  assert.deepEqual(wheelCamera(camera, { ...event, deltaX: 1, deltaY: 2, deltaMode: 1 }, anchor, 500), { x: 34, y: 38, scale: 1 })
  const pinchIn = wheelCamera(camera, { ...event, deltaY: -20, ctrlKey: true }, anchor, 500)
  assert.ok(pinchIn.scale > 1)
  const pinchOut = wheelCamera(pinchIn, { ...event, deltaY: 20, ctrlKey: true }, anchor, 500)
  near(pinchOut.x, camera.x); near(pinchOut.y, camera.y); near(pinchOut.scale, camera.scale)
})
test('fit centers the whole graph and recovers from an arbitrarily panned viewport', () => {
  const camera = fitCamera(900, 500, 1000, 700)
  near(camera.x + 1000 * camera.scale / 2, 450)
  near(camera.y + 700 * camera.scale / 2, 250)
  assert.ok(1000 * camera.scale <= 900 && 700 * camera.scale <= 500)
  assert.equal(fitCamera(2000, 1400, 500, 400).scale, 1)
})

test('focus frames a translated selection without moving the scene itself', () => {
  const bounds = { x: 1400, y: 620, width: 780, height: 380 }
  const camera = frameCamera(1000, 700, bounds)
  near(camera.x + (bounds.x + bounds.width / 2) * camera.scale, 500)
  near(camera.y + (bounds.y + bounds.height / 2) * camera.scale, 350)
  assert.ok(camera.scale <= 1 && camera.scale > .5)
})
