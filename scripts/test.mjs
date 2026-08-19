// 发布前自动检查(CI 运行):清单字段、官方白名单、命令库数据
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const srcDir = path.join(root, 'src')

const CATEGORIES = new Set(['terminal', 'files', 'tool', 'monitor', 'integration', 'other'])
const SEMVER = /^\d+\.\d+\.\d+$/

test('插件清单字段完整且分类 / 版本合规', () => {
  const plugins = readdirSync(srcDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(srcDir, d.name, 'manifest.json')))
  assert.ok(plugins.length > 0, '仓库里至少有一个插件')
  for (const d of plugins) {
    const m = JSON.parse(readFileSync(path.join(srcDir, d.name, 'manifest.json'), 'utf8'))
    for (const k of ['id', 'name', 'version', 'description', 'author', 'category']) {
      assert.ok(m[k], `${d.name}:缺少 ${k}`)
    }
    assert.equal(m.id, d.name, `${d.name}:manifest id 与目录名不一致`)
    assert.ok(CATEGORIES.has(m.category), `${d.name}:category 不在官方分类表内`)
    if (m.minAppVersion) assert.match(m.minAppVersion, SEMVER, `${d.name}:minAppVersion 不是 semver`)
    if (m.maxAppVersion) assert.match(m.maxAppVersion, SEMVER, `${d.name}:maxAppVersion 不是 semver`)
  }
})

test('官方白名单与插件清单一致', () => {
  const officialPath = path.join(root, 'official.json')
  if (!existsSync(officialPath)) return
  const list = JSON.parse(readFileSync(officialPath, 'utf8')).plugins ?? []
  for (const o of list) {
    const manifestPath = path.join(srcDir, o.id, 'manifest.json')
    assert.ok(existsSync(manifestPath), `official.json 指向不存在的插件 ${o.id}`)
    const m = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if (o.author) assert.equal(m.author, o.author, `${o.id}:白名单 author 与清单不一致`)
  }
})

test('命令库数据:不少于 100 条且 cmd 唯一', () => {
  const data = readFileSync(path.join(srcDir, 'command-book', 'data.ts'), 'utf8')
  const cmds = [...data.matchAll(/cmd:\s*'([^']+)'/g)].map((m) => m[1])
  assert.ok(cmds.length >= 100, `命令条数不足:${cmds.length}`)
  assert.equal(new Set(cmds).size, cmds.length, '存在重复命令')
})
