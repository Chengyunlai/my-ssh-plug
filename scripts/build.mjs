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
  const entryBuf = readFileSync(outFile)
  registry.plugins.push({
    ...manifest,
    entry: `${id}/entry.js`,
    sha256: createHash('sha256').update(entryBuf).digest('hex')
  })
  console.log(`built ${id}@${manifest.version} -> dist/${id}/entry.js (${entryBuf.length} bytes)`)
}

writeFileSync(path.join(distDir, 'registry.json'), JSON.stringify(registry, null, 2))
console.log('registry -> dist/registry.json')
