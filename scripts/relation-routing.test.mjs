import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const compiled = await build({ entryPoints: [new URL('../src/mysql-manager/relation-routing.ts', import.meta.url).pathname], bundle: true, write: false, format: 'esm', platform: 'node' })
const { routeRelationEdges, routeLabelPoint } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'))
test('parallel long references have distinct ports, vertical tracks and upper lanes', () => {
  const edges = Array.from({ length: 12 }, (_, index) => ({ id: String(index).padStart(2, '0'), source: { x: 276, y: 200 }, target: { x: 1140, y: 220 } }))
  const routes = routeRelationEdges(edges)
  const parts = [...routes.values()].map(path => path.match(/^M([\d.]+),([\d.]+) H([\d.]+) V([\d.]+) H([\d.]+) V([\d.]+) H([\d.]+)$/).slice(1).map(Number))
  for (const index of [1, 2, 3, 4, 5]) assert.equal(new Set(parts.map(part => part[index])).size, 12)
  assert.ok(parts.every(part => part[2] > 276 && part[2] < 356 && part[4] < 1140 && part[4] > 1060))
  assert.deepEqual(routeRelationEdges([...edges].reverse()), routes)
})
test('adjacent references sharing a field fan out within the field row', () => {
  const routes = routeRelationEdges([{ id: 'a', source: { x: 276, y: 200 }, target: { x: 380, y: 210 } }, { id: 'b', source: { x: 276, y: 200 }, target: { x: 380, y: 210 } }])
  assert.notEqual(routes.get('a'), routes.get('b'))
  assert.match(routes.get('a'), /^M276,194 C/)
  assert.match(routes.get('b'), /^M276,206 C/)
})

test('independent component corridors stay local and do not consume each others lanes', () => {
  const edges = [
    { id: 'a1', group: 'a', laneTop: 76, source: { x: 300, y: 200 }, target: { x: 1200, y: 260 } },
    { id: 'a2', group: 'a', laneTop: 76, source: { x: 300, y: 200 }, target: { x: 1200, y: 260 } },
    { id: 'b1', group: 'b', laneTop: 776, source: { x: 300, y: 900 }, target: { x: 1200, y: 960 } }
  ]
  const paths = routeRelationEdges(edges)
  assert.match(paths.get('a1'), / V76 /)
  assert.match(paths.get('a2'), / V90 /)
  assert.match(paths.get('b1'), / V776 /)
  assert.match(paths.get('b1'), /^M300,900 /)
})

const segments = path => {
  let p
  const result = []
  for (const [, command, a, b] of path.matchAll(/([MHV])(-?[\d.]+)(?:,(-?[\d.]+))?/g)) {
    const q = command === 'M' ? { x: +a, y: +b } : command === 'H' ? { x: +a, y: p.y } : { x: p.x, y: +a }
    if (p) result.push([p, q])
    p = q
  }
  return result
}
test('long references use a local clear corridor rather than climbing over all cards', () => {
  const boxes = [{ x: 0, y: 100, width: 276, height: 150 }, { x: 380, y: 100, width: 276, height: 150 }, { x: 760, y: 100, width: 276, height: 150 }]
  const edge = { id: 'long', source: { x: 276, y: 230 }, target: { x: 760, y: 230 }, laneTop: 20 }
  const path = routeRelationEdges([edge], boxes).get('long')
  assert.match(path, / V270 /)
  assert.ok(!path.includes('V20 '))
  for (const [a, b] of segments(path)) for (const box of boxes) {
    const collision = a.y === b.y
      ? a.y > box.y && a.y < box.y + box.height && Math.min(a.x,b.x) < box.x + box.width && Math.max(a.x,b.x) > box.x
      : a.x > box.x && a.x < box.x + box.width && Math.min(a.y,b.y) < box.y + box.height && Math.max(a.y,b.y) > box.y
    assert.equal(collision, false, path)
  }
  const label = routeLabelPoint(path, edge.source, edge.target)
  assert.equal(label.y, 270)
  assert.ok(label.x > 300 && label.x < 740)
})
test('self references and backward edges route around the source card', () => {
  const boxes = [{ x: 380, y: 100, width: 276, height: 150 }]
  const edge = { id: 'self', source: { x: 656, y: 180 }, target: { x: 380, y: 210 }, laneTop: 50 }
  const path = routeRelationEdges([edge], boxes).get('self')
  assert.match(path, / V270 /)
  assert.ok(!path.includes('C'))
  assert.deepEqual(routeRelationEdges([edge], boxes), routeRelationEdges([edge], [...boxes].reverse()))
})
