import type { RelationSnapshot } from './relation-export'

/** Serialized as one self-contained function: no imports, eval, host APIs or network access. */
export function mountRelationExport(data: RelationSnapshot): void {
  const root = document.getElementById('viewer')!
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = '') => {
    const node = document.createElement(tag); node.textContent = text; node.className = className; return node
  }
  const svg = (tag: string) => document.createElementNS(['http:', '', 'www.w3.org', '2000', 'svg'].join('/'), tag) as SVGElement
  const button = (text: string, action: () => void, label = text) => {
    const node = el('button', text); node.type = 'button'; node.setAttribute('aria-label', label); node.onclick = action; return node
  }
  const header = el('header'); header.append(el('h1', `${data.db} · 逻辑关系`), el('p', '离线结构快照 · COMMENT 声明 · 仅验证结构，不保证数据一致性或关系基数'))
  const toolbar = el('div', '', 'toolbar'), count = el('span', '', 'count')
  const search = el('input'); search.type = 'search'; search.placeholder = '搜索表、字段或注释…'; search.setAttribute('aria-label', '搜索关系')
  const type = el('select'); type.setAttribute('aria-label', '关系类型')
  for (const [value, text] of [['all', '全部类型'], ['field', '字段关联'], ['mapping', '业务映射']]) { const option = el('option', text); option.value = value; type.append(option) }
  const group = el('select'); group.setAttribute('aria-label', '关联组')
  const all = el('option', '全部关联组'); all.value = 'all'; group.append(all)
  for (const item of data.groups) { const option = el('option', `${item.label} · ${item.tables.length} 表`); option.value = item.id; group.append(option) }
  const zoomText = el('span', '100%', 'zoom')
  const workspace = el('div', '', 'workspace'), canvas = el('div', '', 'canvas'), scene = el('div', '', 'scene')
  canvas.tabIndex = 0; canvas.setAttribute('aria-label', '关系画布：拖动平移，双指滚动平移，捏合缩放，方向键平移，Home适应画布')
  Object.assign(scene.style, { width: `${data.width}px`, height: `${data.height}px` })
  const edgesSvg = svg('svg'); edgesSvg.setAttribute('width', String(data.width)); edgesSvg.setAttribute('height', String(data.height))
  const defs = svg('defs'), marker = svg('marker'), arrow = svg('path')
  for (const [key, value] of Object.entries({ id: 'ref-arrow', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto' })) marker.setAttribute(key, value)
  for (const [key, value] of Object.entries({ d: 'M1 1L9 5L1 9', fill: 'none', stroke: 'context-stroke', 'stroke-width': '1.5' })) arrow.setAttribute(key, value)
  marker.append(arrow); defs.append(marker); edgesSvg.append(defs); scene.append(edgesSvg)
  const empty = el('div', '没有匹配的关系，请调整筛选条件。', 'empty'), caption = el('div', '', 'caption')
  canvas.append(scene, empty, caption)
  const aside = el('aside'); aside.setAttribute('aria-label', '关系与表说明')
  const asideHead = el('div', '', 'aside-head'), list = el('nav', '', 'relation-list'), detail = el('section', '', 'detail')
  list.setAttribute('aria-label', '关联声明列表')
  const toggle = button('关系列表', () => { document.body.classList.add('detail-open'); fit() })
  asideHead.append(el('strong', '关系与表说明'), button('关闭', () => { document.body.classList.remove('detail-open'); select(null); toggle.focus(); fit() }))
  aside.append(asideHead, list, detail); workspace.append(canvas, aside)
  let camera = { x: 24, y: 24, scale: 1 }, frame: number | null = null
  let visible = [...data.edges], selected: string | null = null
  const cards = new Map<string, HTMLElement>(), paths = new Map<string, SVGElement>(), listButtons = new Map<string, HTMLButtonElement>()
  const paint = () => {
    if (frame !== null) return
    frame = requestAnimationFrame(() => { frame = null; scene.style.transform = `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`; zoomText.textContent = `${Math.round(camera.scale * 100)}%` })
  }
  const visibleNodes = () => {
    const tables = new Set(visible.flatMap(edge => [edge.sourceTable, edge.targetTable])); return data.nodes.filter(node => tables.has(node.table))
  }
  const fitNodes = (nodes: RelationSnapshot['nodes']) => {
    if (!nodes.length) return
    const x = Math.min(...nodes.map(n => n.x)), y = Math.min(...nodes.map(n => n.y))
    const width = Math.max(...nodes.map(n => n.x + n.width)) - x, height = Math.max(...nodes.map(n => n.y + n.height)) - y
    const scale = Math.max(.2, Math.min(1, (canvas.clientWidth - 64) / width, (canvas.clientHeight - 64) / height))
    camera = { x: (canvas.clientWidth - width * scale) / 2 - x * scale, y: (canvas.clientHeight - height * scale) / 2 - y * scale, scale }; paint()
  }
  function fit() { fitNodes(visibleNodes()) }
  const zoom = (factor: number, x = canvas.clientWidth / 2, y = canvas.clientHeight / 2) => {
    const scale = Math.max(.2, Math.min(3, camera.scale * factor)), ratio = scale / camera.scale
    camera = { x: x - (x - camera.x) * ratio, y: y - (y - camera.y) * ratio, scale }; paint()
  }
  const paragraph = (text: string) => detail.append(el('p', text))
  const raw = (title: string, text: string) => { if (!text) return; const box = el('details'); box.append(el('summary', title), el('p', text)); detail.append(box) }
  function select(id: string | null) {
    selected = id
    const edge = visible.find(edge => edge.id === id)
    scene.classList.toggle('has-selection', !!edge)
    for (const [id, path] of paths) path.classList.toggle('selected', id === selected)
    for (const [id, item] of listButtons) { item.classList.toggle('selected', id === selected); item.setAttribute('aria-pressed', String(id === selected)) }
    for (const [name, card] of cards) {
      card.classList.toggle('selected', !!edge && [edge.sourceTable, edge.targetTable].includes(name))
      for (const row of card.querySelectorAll<HTMLElement>('[data-field]')) row.classList.toggle('selected', !!edge?.pairs.some(pair => edge.sourceTable === name && pair.source === row.dataset.field || edge.targetTable === name && pair.target === row.dataset.field))
    }
    detail.replaceChildren()
    if (!edge) { paragraph('选择连线查看完整配对和 COMMENT，或点击表名查看全部字段。'); return }
    document.body.classList.add('detail-open'); edgesSvg.append(paths.get(edge.id)!)
    detail.append(el('span', edge.kind === 'mapping' ? '业务映射 · 禁止 JOIN' : edge.kind === 'composite' ? '组合关联 · 全部条件 AND' : '字段关联', `badge ${edge.kind}`))
    paragraph(edge.source); paragraph(edge.target)
    detail.append(button('定位两端', () => fitNodes(data.nodes.filter(node => [edge.sourceTable, edge.targetTable].includes(node.table)))))
    paragraph(edge.message); if (edge.warning) paragraph(edge.warning)
    if (edge.kind === 'mapping') paragraph('仅表示应用或 SDK 的业务定位联系，没有字段等值、基数或目标行存在保证。')
    for (const pair of edge.pairs) { detail.append(el('h3', `${pair.source} = ${pair.target}`)); paragraph(`${pair.sourceComment || '来源未填写注释'}\n${pair.targetComment || '目标无可用注释'}`) }
    raw('来源表原始 COMMENT', edge.sourceComment); raw('目标表原始 COMMENT', edge.targetComment)
    const showSql = button('查看 JOIN 草稿', () => {
      if (!edge.sql || edge.kind === 'mapping') return
      const sql = el('textarea'); sql.readOnly = true; sql.value = edge.sql; sql.setAttribute('aria-label', 'JOIN 草稿'); detail.append(sql); sql.focus(); sql.select()
    })
    showSql.disabled = !edge.sql || edge.kind === 'mapping'; detail.append(showSql)
  }
  for (const node of data.nodes) {
    const card = el('article', '', 'card'); Object.assign(card.style, { left: `${node.x}px`, top: `${node.y}px`, width: `${node.width}px`, height: `${node.height}px` })
    const heading = el('div'); heading.style.height = `${node.headerHeight}px`
    const title = el('h2'), open = button(node.table, () => {
      select(null); document.body.classList.add('detail-open'); card.classList.add('selected'); detail.replaceChildren(el('h2', node.table)); paragraph(node.comment || '未填写表说明'); raw('原始表 COMMENT', node.rawComment)
      for (const column of node.columns) { const box = el('div', '', 'column'); box.append(el('code', `${column.name} · ${column.type}${column.key ? ' · ' + column.key : ''}`), el('p', column.comment || '未填写字段注释')); detail.append(box) }
    }, `查看 ${node.table} 的字段说明`)
    title.append(open); const description = el('p', node.comment, 'description'); description.title = node.comment; heading.append(title, description); card.append(heading)
    for (const field of node.fields) { const row = el('div', '', 'field'); row.dataset.field = field.name; row.style.height = `${field.height}px`; const line = el('div', '', 'field-title'); line.append(el('span', field.name, 'field-name'), el('code', field.type)); if (field.key === 'PRI') line.append(el('small', 'PK')); row.append(line); if (field.description) { const text = el('p', field.description); text.title = field.description; row.append(text) }; card.append(row) }
    scene.append(card); cards.set(node.table, card)
  }
  for (const edge of data.edges) {
    const pathGroup = svg('g'); pathGroup.classList.add('edge', edge.kind, edge.status); pathGroup.setAttribute('role', 'button'); pathGroup.setAttribute('tabindex', '0'); pathGroup.setAttribute('aria-label', edge.title)
    const title = svg('title'); title.textContent = edge.title; pathGroup.append(title)
    for (const name of ['hit', 'halo', 'line']) { const path = svg('path'); path.setAttribute('d', edge.path); path.classList.add(name); if (name === 'line') path.setAttribute('marker-end', ['url', '(#ref-arrow)'].join('')); pathGroup.append(path) }
    if (edge.pairs.length > 1 && edge.sourcePoint && edge.targetPoint) {
      for (const [points, anchor, direction] of [[edge.sources, edge.sourcePoint, 1], [edge.targets, edge.targetPoint, -1]] as const) for (const point of points) { const path = svg('path'); path.classList.add('branch'); path.setAttribute('d', `M${point.x},${point.y} h${direction * 10} V${anchor.y} H${anchor.x}`); pathGroup.append(path) }
    }
    if (edge.label && (edge.kind === 'mapping' || edge.pairs.length > 1)) {
      const label = svg('g'); label.setAttribute('transform', `translate(${edge.label.x},${edge.label.y})`)
      const rect = svg('rect'); for (const [key, value] of Object.entries({ x: '-34', y: '-11', width: '68', height: '20', rx: '5' })) rect.setAttribute(key, value)
      const text = svg('text'); text.setAttribute('text-anchor', 'middle'); text.setAttribute('dominant-baseline', 'middle'); text.textContent = edge.kind === 'mapping' ? '业务映射' : `${edge.pairs.length} 字段`; label.append(rect, text); pathGroup.append(label)
    }
    pathGroup.addEventListener('click', () => select(edge.id)); pathGroup.addEventListener('keydown', event => { if ((event as KeyboardEvent).key === 'Enter' || (event as KeyboardEvent).key === ' ') { event.preventDefault(); select(edge.id) } })
    edgesSvg.append(pathGroup); paths.set(edge.id, pathGroup)
    const item = button(edge.title, () => select(edge.id)); list.append(item); listButtons.set(edge.id, item)
  }
  const filter = () => {
    const active = data.groups.find(item => item.id === group.value), query = search.value.trim().toLowerCase()
    visible = data.edges.filter(edge => (type.value === 'all' || (type.value === 'mapping' ? edge.kind === 'mapping' : edge.kind !== 'mapping')) && (!active || active.tables.includes(edge.sourceTable)) && edge.search.includes(query))
    const ids = new Set(visible.map(edge => edge.id)), tables = new Set(visibleNodes().map(node => node.table))
    for (const [table, card] of cards) card.hidden = !tables.has(table)
    for (const [id, path] of paths) path.style.display = ids.has(id) ? '' : 'none'
    for (const [id, item] of listButtons) item.hidden = !ids.has(id)
    count.textContent = `${visible.length} / ${data.edges.length} 条声明 · ${tables.size} 张表`
    caption.textContent = '拖动平移 · 双指滚动平移 · 捏合缩放 · 点选连线查看详情'
    empty.hidden = visible.length > 0; scene.hidden = visible.length === 0; select(null); fit()
  }
  search.oninput = filter; type.onchange = filter; group.onchange = filter
  const minus = button('', () => zoom(1 / 1.2), '缩小关系图'), plus = button('', () => zoom(1.2), '放大关系图')
  for (const [control, path] of [[minus, 'M2 6h8'], [plus, 'M2 6h8M6 2v8']] as const) { const icon = svg('svg'); icon.setAttribute('width', '12'); icon.setAttribute('height', '12'); icon.setAttribute('viewBox', '0 0 12 12'); const shape = svg('path'); shape.setAttribute('d', path); shape.setAttribute('stroke', 'currentColor'); icon.append(shape); control.append(icon) }
  toolbar.append(count, type, group, search, toggle, minus, zoomText, plus, button('100%', () => zoom(1 / camera.scale)), button('适应画布', fit))
  root.append(header, toolbar, workspace); document.getElementById('fallback')!.hidden = true
  let drag: { id: number; x: number; y: number; startX: number; startY: number; moved: boolean } | null = null, suppress = false
  canvas.onpointerdown = event => {
    if (![0, 1].includes(event.button) || (event.target as Element).closest('button,input,select,[role="button"]')) return
    event.preventDefault(); canvas.focus(); canvas.setPointerCapture(event.pointerId); drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: camera.x, startY: camera.y, moved: false }; canvas.classList.add('dragging')
  }
  canvas.onpointermove = event => { if (drag?.id !== event.pointerId) return; const dx = event.clientX - drag.x, dy = event.clientY - drag.y; if (Math.hypot(dx, dy) > 3) drag.moved = true; camera = { ...camera, x: drag.startX + dx, y: drag.startY + dy }; paint() }
  const stop = () => { suppress = drag?.moved ?? false; drag = null; canvas.classList.remove('dragging') }
  canvas.onpointerup = stop; canvas.onpointercancel = stop; canvas.onlostpointercapture = stop
  canvas.addEventListener('click', event => { if (suppress) { event.stopPropagation(); suppress = false } }, true)
  canvas.addEventListener('wheel', event => { event.preventDefault(); if (event.ctrlKey || event.metaKey) { const bounds = canvas.getBoundingClientRect(); zoom(Math.exp(-event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1) * .002), event.clientX - bounds.left, event.clientY - bounds.top) } else { const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1; camera = { ...camera, x: camera.x - event.deltaX * unit, y: camera.y - event.deltaY * unit }; paint() } }, { passive: false })
  canvas.onkeydown = event => {
    if ((event.target as Element).closest('button,input,select,[role="button"]')) return
    const steps: Record<string, [number, number]> = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }
    if (steps[event.key]) { event.preventDefault(); const [x, y] = steps[event.key]; camera = { ...camera, x: camera.x + x, y: camera.y + y }; paint() }
    if (event.key === 'Home') { event.preventDefault(); fit() }
  }
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { document.body.classList.remove('detail-open'); select(null); toggle.focus() } })
  new ResizeObserver(() => paint()).observe(canvas)
  if (data.diagnostics.length) { const notice = el('details'); notice.append(el('summary', `${data.diagnostics.length} 条注释诊断`), el('p', data.diagnostics.join('\n'))); header.append(notice) }
  filter()
}
