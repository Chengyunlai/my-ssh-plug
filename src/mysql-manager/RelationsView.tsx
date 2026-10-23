import { routeLabelPoint } from './relation-routing'
import { buildRelationScene } from './relation-scene'
import { exportRelationsHtml } from './relation-export'
import { useRelationCamera } from './useRelationCamera'
import { useEffect, useMemo, useRef, useState } from 'react'
import { mysqlClient } from './mysql-client'
import { TableIcon, RelationIcon, QueryIcon } from './Icons'
import { buildRelations, relationFieldNames, commentDescription, relationSearchText, relationGroups, layoutRelations, metadataSql, readSchemaColumns, relationJoinSql, type LogicalRelation, type RelationModel } from './relations'

interface Props { db: string; onOpenTable: (table: string) => void; onQuery: (sql: string) => void }
export default function RelationsView({ db, onOpenTable, onQuery }: Props): React.JSX.Element {
  const [model, setModel] = useState<RelationModel | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [relationType, setRelationType] = useState<'all' | 'field' | 'mapping'>('all')
  const [showComments, setShowComments] = useState(true)
  const [copyStatus, setCopyStatus] = useState('')
  const [exportStatus, setExportStatus] = useState('')
  const [groupId, setGroupId] = useState('all')
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const inspectorToggle = useRef<HTMLButtonElement>(null)
  const closeInspector = () => { setInspectorOpen(false); setSelectedId(null); inspectorToggle.current?.focus() }
  useEffect(() => {
    let active = true
    setLoading(true); setError(''); setModel(null); setCopyStatus('')
    void mysqlClient.query(metadataSql(db)).then(result => {
      if (!active) return
      if (result.error) throw new Error(result.error)
      const next = buildRelations(readSchemaColumns(result.rows))
      setModel(next); setSelectedId(null)
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : '无法读取表结构') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [db, revision])
  const typedModel = useMemo(() => model ? { ...model, relations: model.relations.filter(relation => relationType === 'all' || (relationType === 'mapping' ? relation.kind === 'mapping' : relation.kind !== 'mapping')) } : null, [model, relationType])
  const groups = useMemo(() => typedModel ? relationGroups(typedModel) : [], [typedModel])
  const activeGroup = groups.find(group => group.id === groupId)
  const relations = useMemo(() => (activeGroup?.relations ?? typedModel?.relations ?? []).filter(relation => relationSearchText(relation).includes(filter.toLowerCase())), [typedModel, activeGroup, filter])
  const graph = useMemo(() => layoutRelations({ columns: model?.columns ?? [], relations: relations.slice(0, 100), diagnostics: [] }, showComments), [model, relations, showComments])
  const navigation = useRelationCamera(graph.width, graph.height, !loading && relations.length > 0, `${groupId}:${relationType}:${filter}:${revision}:${showComments}`)
  const selected = relations.find(relation => relation.id === selectedId) ?? null
  const select = (relation: LogicalRelation) => { setSelectedId(relation.id); setCopyStatus(''); setInspectorOpen(true) }
  const focusSelected = () => {
    if (!selected) return
    const nodes = graph.nodes.filter(node => node.table === selected.source.table || node.table === selected.target.table)
    if (!nodes.length) return
    const x = Math.min(...nodes.map(node => node.x)) - 32, y = Math.min(...nodes.map(node => node.y)) - 32
    navigation.frame({ x, y, width: Math.max(...nodes.map(node => node.x + node.width)) - x + 32, height: Math.max(...nodes.map(node => node.y + node.height)) - y + 32 })
  }

  const { visualEdges, routes } = useMemo(() => buildRelationScene(graph, relations.slice(0, 100)), [relations, graph])
  const endpoint = (relation: LogicalRelation, side: 'source' | 'target') => relation[side].table + (relation.kind === 'mapping' ? '' : `.${relationFieldNames(relation, side)}`)
  const copy = async () => {
    if (!selected) return
    try { await navigator.clipboard.writeText(relationJoinSql(selected)); setCopyStatus('已复制 JOIN') }
    catch { setCopyStatus('复制失败，可使用“打开 JOIN 查询”') }
  }
  const exportHtml = () => {
    if (!model) return
    try {
      const html = exportRelationsHtml(db, { columns: model.columns, relations, diagnostics: model.diagnostics })
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url; link.download = `${db.replace(/[^\p{L}\p{N}_-]/gu, '_')}-relations.html`
      document.body.append(link); link.click(); link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setExportStatus(`已生成 ${relations.length} 条声明的离线 HTML，包含表结构与注释`)
    } catch (reason) { setExportStatus(reason instanceof Error ? reason.message : '导出失败') }
  }
  return <section className="relations-view" aria-label="数据库逻辑关系" onKeyDown={event => { if (event.key === 'Escape' && inspectorOpen) { event.stopPropagation(); closeInspector() } }}>
    <header className="relations-header">
      <div><h2><RelationIcon size={19} />逻辑关系 <span>{db}</span></h2><p>只读 COMMENT 声明 · 字段关联与业务映射分开展示</p></div>
      <div className="relations-export-actions"><button type="button" className="ssh-btn ssh-btn-sm" title="导出当前筛选范围：表结构、注释与关联声明，离线交互查看" disabled={loading || !relations.length || relations.length > 100} onClick={exportHtml}>导出 HTML</button><button type="button" className="ssh-btn ssh-btn-sm" disabled={loading} onClick={() => setRevision(value => value + 1)}>刷新结构</button></div>
    </header>
    {exportStatus && <p className="relations-export-status" role="status">{exportStatus}</p>}
    {loading ? <div className="relations-state" role="status"><RelationIcon size={28} /><h3>正在读取关联声明</h3><p>只查询当前库的表与字段元数据。</p></div>
      : error ? <div className="relations-state" role="alert"><h3>无法读取表结构</h3><p>{error}</p><button type="button" className="ssh-btn" onClick={() => setRevision(value => value + 1)}>重试</button></div>
      : model && !model.relations.length ? <div className="relations-state"><RelationIcon size={32} /><h3>还没有可展示的逻辑关系</h3><p>在字段或表注释中声明目标，然后刷新结构。</p><code>@ref(users.id)</code><p>组合关系使用表注释 @relation((a,b)-&gt;target(x,y))。本插件不会修改注释。</p>{model.diagnostics.map(item => <p className="relations-warning" key={item}>{item}</p>)}</div>
      : <>
        <div className="relations-toolbar">
          <span className="relations-stat"><strong>{model?.relations.length ?? 0}</strong> 条声明</span><span className="relations-stat"><strong>{new Set(model?.relations.flatMap(relation => [relation.source.table, relation.target.table])).size}</strong> 张表</span>
          <span className={`relations-validation ${model?.relations.some(relation => relation.status === 'invalid' || relation.warning) ? 'warning' : ''}`}>{model?.relations.filter(relation => relation.status === 'valid').length} 条结构可见</span>
          <select aria-label="关系类型" value={relationType} onChange={event => { setRelationType(event.target.value as 'all' | 'field' | 'mapping'); setGroupId('all'); setSelectedId(null) }}><option value="all">全部类型</option><option value="field">字段关联</option><option value="mapping">业务映射</option></select>
          <input aria-label="筛选关系" placeholder="搜索表、字段或注释…" value={filter} onChange={event => setFilter(event.target.value)} />
          <button ref={inspectorToggle} type="button" className="relations-comments-toggle" aria-expanded={inspectorOpen} onClick={() => { if (inspectorOpen) closeInspector(); else { setInspectorOpen(true); if (!selected) setSelectedId(relations[0]?.id ?? null) } }}>关系详情</button>
          <button type="button" className="relations-comments-toggle" aria-pressed={showComments} onClick={() => setShowComments(value => !value)}>{showComments ? '隐藏注释' : '显示注释'}</button>
          <div className="relations-zoom"><button type="button" aria-label="缩小关系图" onClick={() => navigation.zoom(1 / 1.2)}><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8" stroke="currentColor" /></svg></button><span>{Math.round(navigation.camera.scale * 100)}%</span><button type="button" aria-label="放大关系图" onClick={() => navigation.zoom(1.2)}><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6h8M6 2v8" stroke="currentColor" /></svg></button><button type="button" onClick={() => navigation.zoom(1 / navigation.camera.scale)}>100%</button><button type="button" onClick={navigation.fit}>适应画布</button></div>
        </div>
        <nav className="relations-groups" aria-label="关联组导航">
          <button type="button" aria-pressed={!activeGroup} onClick={() => { setGroupId('all'); setSelectedId(null); setFilter('') }}>全部关联 <small>{groups.length} 组{typedModel?.relations.some(relation => relation.kind === 'mapping') ? ' · 含业务映射' : ''}</small></button>
          {groups.map((group, index) => <button type="button" key={group.id} title={`查看以 ${group.label} 为中心的 ${group.tables.length} 张表`} aria-pressed={activeGroup?.id === group.id} onClick={() => { setGroupId(group.id); setSelectedId(null); setFilter('') }}><span className="relation-group-number">{String(index + 1).padStart(2, '0')}</span>{group.label}<small>{group.tables.length} 表</small></button>)}
        </nav>
        {!!model?.diagnostics.length && <details className="relations-diagnostics"><summary>{model.diagnostics.length} 条注释无法解析</summary>{model.diagnostics.map(item => <p key={item}>{item}</p>)}</details>}
        <div className={`relations-workspace${inspectorOpen ? ' inspector-open' : ''}`}>
        <div className={`relations-canvas${selected ? ' has-selection' : ''}${navigation.panning ? ' is-panning' : ''}`} ref={navigation.viewport} {...navigation.bindings}>
          {!relations.length ? <div className="relations-state"><h3>没有匹配的关系</h3><button type="button" className="ssh-btn" onClick={() => setFilter('')}>清除筛选</button></div> : <div className="relations-canvas-size">
            <div className="relations-canvas-content" style={{ width: graph.width, height: graph.height, transform: `translate(${navigation.camera.x}px, ${navigation.camera.y}px) scale(${navigation.camera.scale})` }}>
              {graph.groups.map(group => <div className="relation-group-region" key={group.id} style={{ left: group.x, top: group.y, width: group.width, height: group.height }}><div><strong>{group.label}</strong><span>{group.tables.length} 张表 · {group.relations.length} 条声明{group.relations.some(relation => relation.kind === 'mapping') ? ' · 含业务映射' : ''}</span></div></div>)}
              <svg className="relations-edges" width={graph.width} height={graph.height} aria-label="引用方向连线">
                <defs><marker id="mysql-ref-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="context-stroke" strokeWidth="1.5" /></marker></defs>
                {[...visualEdges].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId)).map(edge => {
                  const { relation, source: a, target: b } = edge
                  const path = routes.get(edge.id)!
                  const mapping = relation.kind === 'mapping'
                  const name = `${endpoint(relation, 'source')} ${mapping ? '业务映射' : '引用'} ${endpoint(relation, 'target')}`
                  const label = routeLabelPoint(path, a, b)
                  const composite = relation.pairs.length > 1
                  return <g key={edge.id} className={`relation-edge ${mapping ? 'mapping' : ''} ${selected?.id === relation.id ? 'selected' : ''} ${relation.status}`} role="button" tabIndex={0} aria-label={name} onClick={() => select(relation)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(relation) } }}><title>{name}</title><path className="relation-edge-hit" d={path} /><path className="relation-edge-halo" d={path} /><path className="relation-edge-line" d={path} markerEnd="url(#mysql-ref-arrow)" />{selected?.id === relation.id && composite && <g className="relation-pair-branches">{edge.sources.map((p, i) => <path key={`s${i}`} d={`M${p!.x},${p!.y} h10 V${a.y} H${a.x}`} />)}{edge.targets.map((p, i) => <path key={`t${i}`} d={`M${p!.x},${p!.y} h-10 V${b.y} H${b.x}`} />)}</g>}{(mapping || composite) && <g className="relation-mapping-label" transform={`translate(${label.x},${label.y})`}><rect x="-34" y="-11" width="68" height="20" rx="5" /><text textAnchor="middle" dominantBaseline="middle">{mapping ? '业务映射' : `${relation.pairs.length} 字段`}</text></g>}</g>
                })}

              </svg>
              {graph.nodes.map(node => <article key={node.table} className={`relation-table ${selected && [selected.source.table, selected.target.table].includes(node.table) ? 'highlighted' : ''}`} style={{ left: node.x, top: node.y, width: node.width }}>
                <header style={{ height: node.headerHeight }}><div className="relation-table-title"><TableIcon size={17} /><button type="button" title={`打开 ${node.table} 的内容`} onClick={() => onOpenTable(node.table)}>{node.table}</button></div>{showComments && node.comment && <p className="relation-table-comment" title={node.comment}>{node.comment}</p>}</header>
                {node.fieldRows.length ? node.fieldRows.map(({ field, description, height }) => <div className={`relation-field ${selected && (selected.pairs.some(pair => pair.source.table === node.table && pair.source.name === field.name || pair.target.table === node.table && pair.target.schema === db && pair.target.name === field.name)) ? 'selected' : ''}`} key={field.name} style={{ height }}><div className="relation-field-title"><span title={field.name}>{field.name}</span><code title={field.type}>{field.type}</code>{field.key === 'PRI' && <small>PK</small>}</div>{description && <p className="relation-field-comment" title={description}>{description}</p>}</div>) : <div className="relation-field missing">{node.available ? '表级声明，无字段配对' : '目标不可见'}</div>}
              </article>)}
            </div>
          </div>}
          <div className="relations-canvas-caption"><span>{activeGroup ? activeGroup.label : `${graph.groups.length} 个关联组${relations.some(relation => relation.kind === 'mapping') ? '（含业务映射，不代表可 JOIN）' : ''}`} · 当前 {relations.length} 条声明</span><span>拖动平移 · 双指捏合缩放 · 点选连线查看详情</span></div>
        </div>
        {relations.length > 100 && <p className="relations-warning">图中只展示前 100 条关系，请筛选缩小范围。</p>}
        {inspectorOpen && <aside className="relations-lower" aria-label="关系检查器">
          <header className="relation-inspector-header"><strong>关系详情</strong><div><button type="button" disabled={!selected} onClick={focusSelected}>定位所选</button><button type="button" onClick={closeInspector}>收起详情</button></div></header>
          <nav className="relations-list" aria-label="关联声明列表">{relations.map(relation => <button type="button" key={relation.id} className={selected?.id === relation.id ? 'selected' : ''} aria-pressed={selected?.id === relation.id} onClick={() => select(relation)}><span className={`relation-status-dot ${relation.kind} ${relation.status}`} /><span><strong>{relation.source.table}<span className="relation-field-label">{relation.kind === 'mapping' ? ' · 业务映射' : `.${relationFieldNames(relation, 'source')}`}</span></strong><small>{relation.kind === 'mapping' ? '业务映射' : '引用'} {relation.target.schema !== db ? `${relation.target.schema}.` : ''}{endpoint(relation, 'target')}</small></span></button>)}</nav>
          <section className="relation-detail" aria-label="选中的关系详情">{selected && <>
            <div className="relation-detail-heading"><span className="relation-source-badge">{selected.kind === 'mapping' ? '业务映射 · 禁止 JOIN' : selected.kind === 'composite' ? '组合声明 · 全部条件 AND' : '字段声明'}</span><span className={selected.status === 'valid' ? 'relations-validation' : 'relations-warning'}>{selected.status === 'valid' ? selected.kind === 'mapping' ? '目标表结构可见' : '两端字段结构可见' : '目标待修复'}</span></div>
            <div className="relation-endpoints"><code>{endpoint(selected, 'source')}</code><QueryIcon size={18} /><code>{endpoint(selected, 'target')}</code></div>
            <div className="relation-comment-grid">
              <div><h3>引用端说明</h3><p className="relation-table-description">{commentDescription(selected.source.tableComment ?? '') || '未填写表说明'}</p>{selected.pairs.map(pair => <p key={pair.source.name}><code>{pair.source.name}</code> · {commentDescription(pair.source.comment) || '未填写字段说明'}</p>)}</div>
              <div><h3>目标端说明</h3><p className="relation-table-description">{commentDescription((selected.kind === 'mapping' ? selected.targetTable?.tableComment : selected.pairs.find(pair => pair.targetColumn)?.targetColumn?.tableComment) ?? '') || '无可用表说明'}</p>{selected.pairs.map(pair => <p key={pair.target.name}><code>{pair.target.name}</code> · {pair.targetColumn ? commentDescription(pair.targetColumn.comment) || '未填写字段说明' : '字段不存在或不可见'}</p>)}</div>
            </div>
            {selected.kind === 'mapping' && <p className="relation-mapping-notice">仅表示应用/SDK 定位的业务联系。没有字段配对，不推断基数或目标行存在；请按上述中文规则定位，禁止生成或复制 JOIN。</p>}
            <details className="relation-raw-comment"><summary>原始 COMMENT（含机器声明）</summary><p>{selected.source.tableComment}</p><p>{selected.kind === 'mapping' ? selected.targetTable?.tableComment : selected.targetColumn?.tableComment}</p>{selected.pairs.map(pair => <div key={pair.source.name}><p>{pair.source.table}.{pair.source.name}：{pair.source.comment || '无注释'}</p><p>{pair.target.table}.{pair.target.name}：{pair.targetColumn?.comment || '无可用注释'}</p></div>)}</details>
            <p className="relation-verification">{selected.message}{selected.warning && <span className="relations-warning"> · {selected.warning}</span>}。仅验证结构，不校验数据一致性或关系基数。</p>
            <div className="relation-detail-actions"><button type="button" className="ssh-btn ssh-btn-sm ssh-btn-primary" disabled={selected.kind === 'mapping' || selected.status !== 'valid'} onClick={() => onQuery(relationJoinSql(selected))}>打开 JOIN 查询</button><button type="button" className="ssh-btn ssh-btn-sm" disabled={selected.kind === 'mapping' || selected.status !== 'valid'} onClick={() => void copy()}>复制 SQL</button><span role="status">{copyStatus}</span></div>
          </>}{!selected && <p className="relation-inspector-empty">从列表或画布选择一条关系，查看字段配对与注释。</p>}</section>
        </aside>}
        </div>
      </>}
  </section>
}
