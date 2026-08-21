// 构建插件市场:
// 1. 用 esbuild 把每个插件打成单个 ESM bundle(react 保持外部,由宿主 import map 提供)
// 2. 生成 dist/registry.json(含版本与 entry 的 sha256,供 MySSH 核心校验后安装)
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const srcDir = path.join(root, 'src')
const distDir = path.join(root, 'dist')
const esbuild = path.join(root, 'node_modules', '.bin', 'esbuild')

const registry = { name: 'my-ssh-plug', version: '0.1.0', plugins: [] }

// 官方白名单:official.json 中的插件由构建脚本盖章 official: true,插件自身声明无效
const officialList = existsSync(path.join(root, 'official.json'))
  ? (JSON.parse(readFileSync(path.join(root, 'official.json'), 'utf8')).plugins ?? [])
  : []

// 官方分类表(与核心仓库 docs/PLUGIN.md §5 保持一致)
const CATEGORIES = new Set(['terminal', 'files', 'tool', 'monitor', 'integration', 'other'])
const SEMVER = /^\d+\.\d+\.\d+$/

function isOfficial(id, author) {
  return officialList.some(
    (o) =>
      o.id === id && (!o.author || o.author === author)
  )
}

function validateManifest(id, m) {
  if (m.category && !CATEGORIES.has(m.category)) {
    throw new Error(`插件 ${id}:category 不在官方分类表内:${String(m.category)}`)
  }
  for (const k of ['minAppVersion', 'maxAppVersion']) {
    if (m[k] && !SEMVER.test(m[k])) {
      throw new Error(`插件 ${id}:${k} 不是合法 semver:${String(m[k])}`)
    }
  }
  if (m.panel?.layout && !['standard', 'workspace'].includes(m.panel.layout)) {
    throw new Error(`插件 ${id}:panel.layout 不在宿主契约内:${String(m.panel.layout)}`)
  }
}

for (const dir of readdirSync(srcDir, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue
  const id = dir.name
  const entry = path.join(srcDir, id, 'index.ts')
  const manifestPath = path.join(srcDir, id, 'manifest.json')
  if (!existsSync(entry) || !existsSync(manifestPath)) continue

  const outFile = path.join(distDir, id, 'entry.js')
  mkdirSync(path.dirname(outFile), { recursive: true })

  execFileSync(
    esbuild,
    [
      entry,
      '--bundle',
      '--format=esm',
      '--platform=browser',
      '--jsx=automatic',
      '--target=chrome138',
      '--external:react',
      '--external:react/jsx-runtime',
      '--outfile=' + outFile,
      '--sourcemap'
    ],
    { stdio: 'inherit' }
  )

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  validateManifest(id, manifest)
  const entryBuf = readFileSync(outFile)
  registry.plugins.push({
    ...manifest,
    official: isOfficial(id, manifest.author),
    entry: `${id}/entry.js`,
    sha256: createHash('sha256').update(entryBuf).digest('hex')
  })
  console.log(`built ${id}@${manifest.version} -> dist/${id}/entry.js (${entryBuf.length} bytes)`)
}

writeFileSync(path.join(distDir, 'registry.json'), JSON.stringify(registry, null, 2))
console.log('registry -> dist/registry.json')
