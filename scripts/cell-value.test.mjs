import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result = await build({ entryPoints: [new URL('../src/mysql-manager/cell-value.ts', import.meta.url).pathname], bundle: true, write: false, format: 'esm', platform: 'node' })
const { formatCellValue, csvCell } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))
test('MySQL JSON and serialized Buffers remain readable and preserve bytes', () => {
  assert.equal(formatCellValue({ hello: '你好', nested: [1, null] }), JSON.stringify({ hello: '你好', nested: [1, null] }, null, 2))
  assert.equal(formatCellValue(JSON.parse(JSON.stringify(Buffer.from('{"hello":"你好"}')))), '{"hello":"你好"}')
  assert.equal(formatCellValue({ type: 'Buffer', data: [0, 255, 128] }), '0x00ff80')
  assert.equal(formatCellValue({ type: 'Buffer', data: [] }), '')
  assert.equal(formatCellValue(null), 'NULL')
  assert.equal(formatCellValue(0), '0')
  assert.equal(formatCellValue(false), 'false')
})
test('CSV preserves JSON, quotes and multiline text', () => {
  assert.equal(csvCell('a"b'), '"a""b"')
  assert.equal(csvCell('a\nb'), '"a\nb"')
  assert.equal(csvCell({ x: 1 }), '"{\n  ""x"": 1\n}"')
  assert.equal(csvCell(null), '')
})
