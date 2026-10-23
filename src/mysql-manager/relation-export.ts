import { buildRelationScene } from './relation-scene'
import { commentDescription, layoutRelations, relationFieldNames, relationJoinSql, relationSearchText, type RelationModel } from './relations'
import { routeLabelPoint } from './relation-routing'
import { mountRelationExport } from './relation-export-runtime'
import { RELATION_EXPORT_CSS } from './relation-export-styles'

export const MAX_RELATION_EXPORT_BYTES = 2 * 1024 * 1024
const htmlText = (value: string) => value.replace(/[&<>"':]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', ':': '&#58;' })[char]!)
export function buildRelationSnapshot(db: string, model: RelationModel) {
  if (!model.relations.length) throw new Error('当前范围没有可导出的关联声明')
  if (model.relations.length > 100) throw new Error('单次最多导出 100 条声明，请先筛选关联组或关系')
  const graph = layoutRelations(model, true)
  const scene = buildRelationScene(graph, model.relations)
  const column = (c: RelationModel['columns'][number]) => ({ name: c.name, type: c.type, key: c.key, comment: c.comment, description: commentDescription(c.comment) })
  const nodes = graph.nodes.map(node => ({ table: node.table, x: node.x, y: node.y, width: node.width, height: node.height, headerHeight: node.headerHeight, comment: node.comment,
    rawComment: model.columns.find(c => c.schema === db && c.table === node.table)?.tableComment ?? '',
    fields: node.fieldRows.map(row => ({ ...column(row.field), height: row.height })),
    columns: model.columns.filter(c => c.schema === db && c.table === node.table).map(column) }))
  const edges = model.relations.map(relation => {
    const edge = scene.visualEdges.find(edge => edge.id === relation.id)
    const path = scene.routes.get(relation.id) ?? ''
    const endpoint = (side: 'source' | 'target') => `${relation[side].schema}.${relation[side].table}${relation.kind === 'mapping' ? '' : '.' + relationFieldNames(relation, side)}`
    return { id: relation.id, kind: relation.kind, status: relation.status, sourceTable: relation.source.table, targetTable: relation.target.table,
      title: `${endpoint('source')} ${relation.kind === 'mapping' ? '业务映射' : '引用'} ${endpoint('target')}`, search: relationSearchText(relation),
      source: endpoint('source'), target: endpoint('target'), message: relation.message, warning: relation.warning ?? '',
      sourceComment: relation.source.tableComment ?? '', targetComment: (relation.kind === 'mapping' ? relation.targetTable?.tableComment : relation.targetColumn?.tableComment) ?? '',
      pairs: relation.pairs.map(pair => ({ source: pair.source.name, target: pair.target.name, sourceComment: pair.source.comment, targetComment: pair.targetColumn?.comment ?? '' })),
      sql: relation.kind !== 'mapping' && relation.status === 'valid' ? relationJoinSql(relation) : null,
      path, label: edge ? routeLabelPoint(path, edge.source, edge.target) : null,
      sourcePoint: edge?.source ?? null, targetPoint: edge?.target ?? null,
      sources: edge?.sources.filter(p => p !== null) ?? [], targets: edge?.targets.filter(p => p !== null) ?? [] }
  }).sort((a, b) => a.id.localeCompare(b.id))
  return { format: 'myssh-logical-relations-v1', db, width: graph.width, height: graph.height, nodes, edges,
    groups: graph.groups.map(group => ({ id: group.id, label: group.label, tables: group.tables })), diagnostics: [...model.diagnostics] }
}
export type RelationSnapshot = ReturnType<typeof buildRelationSnapshot>

/** A deterministic, self-contained metadata snapshot. No host APIs or connection state are serialized. */
export function exportRelationsHtml(db: string, model: RelationModel): string {
  const snapshot = buildRelationSnapshot(db, model)
  const payload = JSON.stringify(snapshot).replace(/"(?:\\.|[^"\\])*"/g, token => token.replace(/:/g, '\\u003a')).replace(/[<>&\u2028\u2029]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'))
  const script = `(${mountRelationExport.toString()})(JSON.parse(document.getElementById('snapshot-data').textContent));`
  for (const inline of [payload, script, RELATION_EXPORT_CSS]) if (/<\/script|<!--/i.test(inline)) throw new Error('导出内容无法安全内联')
  const fallback = snapshot.nodes.map(node => `<section><h2>${htmlText(node.table)}</h2><p>${htmlText(node.comment)}</p><ul>${node.columns.map(c => `<li>${htmlText(c.name)} · ${htmlText(c.type)} · ${htmlText(c.comment)}</li>`).join('')}</ul></section>`).join('')
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><title>${htmlText(db)} · 逻辑关系快照</title><style>${RELATION_EXPORT_CSS}</style></head><body><div id="viewer"></div><main id="fallback"><h1>${htmlText(db)} · 逻辑关系快照</h1><p>${snapshot.edges.length} 条声明 · ${snapshot.nodes.length} 张表。启用 JavaScript 可使用交互画布；以下为表结构说明。</p>${fallback}<h2>关联声明</h2><ul>${snapshot.edges.map(edge => `<li>${htmlText(edge.title)}；${htmlText(edge.message)}</li>`).join('')}</ul></main><script type="application/json" id="snapshot-data">${payload}</script><script>${script}</script></body></html>`
  if (new TextEncoder().encode(html).byteLength > MAX_RELATION_EXPORT_BYTES) throw new Error('导出文件超过 2 MiB，请缩小关联范围')
  return html
}
