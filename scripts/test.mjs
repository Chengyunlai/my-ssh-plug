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

test('面板布局字段只能使用宿主契约', () => {
  const plugins = readdirSync(srcDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(srcDir, d.name, 'manifest.json')))
  for (const d of plugins) {
    const m = JSON.parse(readFileSync(path.join(srcDir, d.name, 'manifest.json'), 'utf8'))
    if (!m.panel) continue
    assert.ok(['standard', 'workspace'].includes(m.panel.layout ?? 'standard'), `${d.name}:panel.layout 不在宿主契约内`)
  }
})

test('mysql-manager 样式不逃逸插件根节点', async () => {
  const { getMysqlManagerStyles } = await import('../src/mysql-manager/inject-styles.ts')
  const css = getMysqlManagerStyles()
  assert.match(css, /^@scope \(\.mysql-manager\) \{/, '最终样式必须由浏览器限制在插件根节点')
  assert.match(css, /:scope\{[^}]*display:flex/, '插件根节点必须显式保持横向工作区布局')
  assert.doesNotMatch(css, /transition:\s*all\b/, '禁止 transition: all')
  assert.doesNotMatch(css, /(?:^|[,{])\s*(?:body|:root|#root)\b/m, '禁止覆盖宿主全局节点')
  assert.doesNotMatch(css, /position:\s*fixed\b/, '插件不得使用 fixed 逃逸宿主内容区')
})

test('mysql-manager 持久化数据使用插件命名空间', async () => {
  const { CONNECTIONS_STORAGE_KEY, QUERY_HISTORY_STORAGE_KEY } = await import('../src/mysql-manager/storage.ts')
  assert.equal(CONNECTIONS_STORAGE_KEY, 'myssh:mysql-manager:connections')
  assert.equal(QUERY_HISTORY_STORAGE_KEY, 'myssh:mysql-manager:query-history')
})

test('长表名的工作区 tab 仍保留关闭按钮命中区域', async () => {
  const { getMysqlManagerStyles } = await import('../src/mysql-manager/inject-styles.ts')
  const css = getMysqlManagerStyles()
  assert.match(css, /\.workspace-tab-label\{[^}]*min-width:0[^}]*overflow:hidden/, 'tab 标题必须允许省略')
  assert.match(css, /\.workspace-tab-close\{[^}]*flex-shrink:0/, '关闭按钮不得被长标题压缩')
})

test('工作区多标签采用统一的分段基准样式', async () => {
  const { getMysqlManagerStyles } = await import('../src/mysql-manager/inject-styles.ts')
  const css = getMysqlManagerStyles()
  assert.match(css, /\.workspace-tabs\{[^}]*min-height:46px/, '标签栏需要稳定的基准高度')
  assert.match(css, /\.workspace-tab\{[^}]*border-top:2px solid transparent[^}]*border-radius:0/, '每个 tab 需要预留顶部选中线且不使用圆角')
  assert.match(css, /\.workspace-tab\.active\{[^}]*border-top-color:var\(--mysql-accent\)/, '选中 tab 使用宿主主题顶部高亮线')
  assert.match(css, /\.workspace-new-tab\{[^}]*width:46px[^}]*height:46px/, '新建入口与 tab 保持同一节奏')
  assert.match(css, /\.tab-bar\{display:flex;align-items:stretch;min-height:40px/, '下方主 tab 使用更紧凑的栏位高度')
  assert.match(css, /\.tab\{[^}]*min-width:88px[^}]*height:40px[^}]*border:0[^}]*border-top:2px solid transparent[^}]*border-radius:0/, '下方主 tab 使用紧凑高度且只保留顶部选中线')
  assert.match(css, /\.tab\.active\{[^}]*border-top-color:var\(--mysql-accent\)[^}]*border-bottom:0[^}]*box-shadow:none/, '下方主 tab 不显示底部边线或额外阴影')
  assert.match(css, /\.tab\.active::after\{content:none;display:none\}/, '下方主 tab 移除宿主圆角 tab 的底部伪元素')
})

test('连接区域使用连续的选中态与已连接状态', async () => {
  const { getMysqlManagerStyles } = await import('../src/mysql-manager/inject-styles.ts')
  const css = getMysqlManagerStyles()
  assert.match(css, /\.conn-card\.active\{[^}]*border-top:2px solid var\(--mysql-accent\)/, '选中连接卡片只使用顶部强调线')
  assert.match(css, /\.conn-status\{[^}]*margin:0 var\(--mysql-gutter\) 10px[^}]*border:1px solid[^}]*border-radius:var\(--mysql-radius-sm\)/, '已连接状态需要与列表保持内聚')
  assert.match(css, /\.conn-status\{[^}]*color-mix\(in srgb,var\(--mysql-success\) 8%,var\(--mysql-surface\)\)/, '已连接状态使用低饱和成功色背景')
})

test('侧栏与主区使用统一内容栅格对齐', async () => {
  const { getMysqlManagerStyles } = await import('../src/mysql-manager/inject-styles.ts')
  const css = getMysqlManagerStyles()
  assert.match(css, /--mysql-gutter:14px/, '插件需要声明统一的内容边距')
  assert.match(css, /\.connection-list\{[^}]*padding:10px var\(--mysql-gutter\) 8px/, '连接列表使用统一左右边距')
  assert.match(css, /\.conn-status\{[^}]*margin:0 var\(--mysql-gutter\) 10px/, '连接状态条与卡片左边线对齐')
  assert.match(css, /\.sidebar-section-header\{padding:10px var\(--mysql-gutter\)/, '侧栏分区标题与内容线对齐')
  assert.match(css, /\.workspace-toolbar\{[^}]*padding:0 var\(--mysql-gutter\)/, '主区工具栏与编辑内容线对齐')
  assert.match(css, /\.table-list\{padding:0 var\(--mysql-gutter\)/, '表列表选中背景与筛选框边线对齐')
})

test('WebSocket 已关闭时不会把新连接池留在注册表', async () => {
  const { registerSocketPool } = await import('../src/mysql-manager/proxy/socket-pools.js')
  const pools = new Map()
  const socketConnections = new Set()
  let ended = false
  const pool = { end: async () => { ended = true } }

  const registered = await registerSocketPool({
    connectionId: 'conn-1',
    pool,
    pools,
    socketConnections,
    socketIsOpen: false
  })

  assert.equal(registered, false)
  assert.equal(ended, true)
  assert.equal(pools.size, 0)
  assert.equal(socketConnections.size, 0)
})

test('代理安全配置使用精确来源匹配', async () => {
  const { normalizeOrigin, isRequestAllowed, validateProxyConfig } = await import('../src/mysql-manager/proxy/security.js')
  assert.equal(normalizeOrigin('https://app.example.com/path'), 'https://app.example.com')
  assert.equal(normalizeOrigin('https://app.example.com.evil.test'), 'https://app.example.com.evil.test')
  assert.equal(normalizeOrigin('myssh-plugin://mysql-manager/1.0.0/entry.js'), 'myssh-plugin://mysql-manager')
  assert.equal(isRequestAllowed({ origin: 'https://app.example.com.evil.test', allowedOrigins: ['https://app.example.com'], accessToken: '', requestToken: '' }), false)
  assert.equal(isRequestAllowed({ origin: 'https://app.example.com', allowedOrigins: ['https://app.example.com'], accessToken: '', requestToken: '' }), true)
  assert.equal(isRequestAllowed({ origin: 'https://app.example.com', allowedOrigins: ['https://app.example.com'], accessToken: 'secret', requestToken: 'wrong' }), false)
  assert.throws(() => validateProxyConfig({ host: '0.0.0.0', allowedOrigins: ['null'], accessToken: '' }), /ACCESS_TOKEN/)
  assert.throws(() => validateProxyConfig({ host: '0.0.0.0', allowedOrigins: ['*'], accessToken: 'secret' }), /ALLOWED_ORIGINS/)
  assert.doesNotThrow(() => validateProxyConfig({ host: '0.0.0.0', allowedOrigins: ['https://app.example.com'], accessToken: 'secret' }))
})

test('命令库数据:不少于 100 条且 cmd 唯一', () => {
  const data = readFileSync(path.join(srcDir, 'command-book', 'data.ts'), 'utf8')
  const cmds = [...data.matchAll(/cmd:\s*'([^']+)'/g)].map((m) => m[1])
  assert.ok(cmds.length >= 100, `命令条数不足:${cmds.length}`)
  assert.equal(new Set(cmds).size, cmds.length, '存在重复命令')
})
