import { routeRelationEdges } from './relation-routing'
import type { layoutRelations, LogicalRelation } from './relations'

/** Same ports and routing for the live view and offline snapshots. */
export function buildRelationScene(graph: ReturnType<typeof layoutRelations>, relations: LogicalRelation[]) {
  const nodeMap = new Map(graph.nodes.map(node => [node.table, node]))
  const point = (table: string, field: string | undefined, side: 'source' | 'target') => {
    const node = nodeMap.get(table)
    if (!node) return null
    const row = node.fieldRows.find(row => row.field.name === field)
    return { x: node.x + (side === 'source' ? node.width : 0), y: node.y + (field === undefined ? node.headerHeight / 2 : row?.anchor ?? node.headerHeight + 15) }
  }
  const visualEdges = relations.flatMap(relation => {
    const sources = relation.kind === 'mapping' ? [point(relation.source.table, undefined, 'source')] : relation.pairs.map(pair => point(relation.source.table, pair.source.name, 'source'))
    const targets = relation.kind === 'mapping' ? [point(relation.target.table, undefined, 'target')] : relation.pairs.map(pair => point(relation.target.table, pair.target.name, 'target'))
    if (sources.some(p => !p) || targets.some(p => !p) || !sources.length || relation.target.schema !== relation.source.schema) return []
    const source = { x: sources[0]!.x, y: sources.reduce((sum, p) => sum + p!.y, 0) / sources.length }
    const target = { x: targets[0]!.x, y: targets.reduce((sum, p) => sum + p!.y, 0) / targets.length }
    const group = graph.groups.find(group => group.tables.includes(relation.source.table))
    return [{ id: relation.id, relation, source, target, sources, targets, group: group?.id, laneTop: (group?.y ?? 0) + 76 }]
  })
  const routes = routeRelationEdges(visualEdges, graph.nodes.map(node => ({ ...node, group: graph.groups.find(group => group.tables.includes(node.table))?.id })))
  return { visualEdges, routes }
}
