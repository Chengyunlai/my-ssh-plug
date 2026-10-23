import { arrangeRelationBoxes } from './relation-layout'
/** Logical references are declarations, not database constraints or cardinality evidence. */
export interface SchemaColumn { schema: string; table: string; name: string; type: string; key: string; comment: string; tableComment?: string }
export interface RelationPair { source: SchemaColumn; target: { schema: string; table: string; name: string }; targetColumn?: SchemaColumn }
export interface SchemaTable { schema: string; table: string; tableComment?: string }
interface RelationBase { id: string; status: 'valid' | 'invalid'; message: string; warning?: string }
export interface FieldRelation extends RelationBase {
  kind: 'field' | 'composite'
  pairs: RelationPair[]
  source: SchemaColumn
  target: { schema: string; table: string; name: string }
  targetColumn?: SchemaColumn
}
export interface MappingRelation extends RelationBase {
  kind: 'mapping'
  pairs: []
  source: SchemaTable
  target: SchemaTable
  targetTable?: SchemaTable
  targetColumn?: never
}
export type LogicalRelation = FieldRelation | MappingRelation
export interface RelationModel { columns: SchemaColumn[]; relations: LogicalRelation[]; diagnostics: string[] }
export const quoteIdentifier = (value: string) => '`' + value.replace(/`/g, '``') + '`'
// Hex literal avoids SQL mode dependent escaping; input is only the selected schema.
export function metadataSql(schema: string): string {
  const hex = Array.from(new TextEncoder().encode(schema), byte => byte.toString(16).padStart(2, '0')).join('')
  if (!hex) throw new Error('请选择数据库')
  return `SELECT c.TABLE_SCHEMA, c.TABLE_NAME, c.COLUMN_NAME, c.COLUMN_TYPE, c.COLUMN_KEY, c.COLUMN_COMMENT, t.TABLE_COMMENT FROM information_schema.COLUMNS AS c LEFT JOIN information_schema.TABLES AS t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME WHERE c.TABLE_SCHEMA = CONVERT(0x${hex} USING utf8mb4) ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION`
}
export function readSchemaColumns(rows: (unknown[] | Record<string, unknown>)[]): SchemaColumn[] {
  const keys = ['TABLE_SCHEMA', 'TABLE_NAME', 'COLUMN_NAME', 'COLUMN_TYPE', 'COLUMN_KEY', 'COLUMN_COMMENT', 'TABLE_COMMENT']
  return rows.map(row => {
    const values = keys.map((key, i) => String((Array.isArray(row) ? row[i] : row[key]) ?? ''))
    return { schema: values[0], table: values[1], name: values[2], type: values[3], key: values[4], comment: values[5], tableComment: values[6] }
  })
}
/** Keep machine-readable directives out of the human description; retain raw comments separately. */
export function commentDescription(comment: string): string {
  return stripMappingDirectives(stripCompositeDirectives(comment)).replace(/(?:[;；]\s*)?@ref\s*\([^)]*\)/g, '').replace(/^[\s;；]+|[\s;；]+$/g, '').trim()
}
/** Balanced extraction prevents nested field lists from being truncated or partially accepted. */
function compositeDirectives(comment: string, keyword: 'relation' | 'mapping' = 'relation'): { raw: string; body: string | null }[] {
  const tokens: { raw: string; body: string | null }[] = []
  const mentions = [...comment.matchAll(new RegExp(`@${keyword}\\b`, 'g'))]
  for (let i = 0; i < mentions.length; i++) {
    const start = mentions[i].index!
    const end = mentions[i + 1]?.index ?? comment.length
    const segment = comment.slice(start, end)
    const opening = new RegExp(`^@${keyword}\\s*\\(`).exec(segment)
    let depth = 1, close = -1
    if (opening) for (let cursor = opening[0].length; cursor < segment.length; cursor++) {
      if (segment[cursor] === '(') depth++
      if (segment[cursor] === ')' && --depth === 0) { close = cursor; break }
    }
    const malformedTail = close >= 0 && /^(?:[(),.`"'<>]|-\s*>)/.test(segment.slice(close + 1).trimStart())
    tokens.push(close < 0 || malformedTail ? { raw: segment, body: null } : { raw: segment.slice(0, close + 1), body: segment.slice(opening![0].length, close) })
  }
  return tokens
}
function stripCompositeDirectives(comment: string): string {
  // Only complete, syntactically valid declarations are hidden from the human summary.
  for (const token of compositeDirectives(comment)) if (token.body !== null && parseComposite(token.body)) comment = comment.replace(token.raw, '')
  return comment
}
const mappingTarget = (body: string | null): string | null => body !== null && /^[A-Za-z_][A-Za-z0-9_]*$/.test(body.trim()) ? body.trim() : null
function stripMappingDirectives(comment: string): string {
  for (const token of compositeDirectives(comment, 'mapping')) if (mappingTarget(token.body)) comment = comment.replace(token.raw, '')
  return comment
}
function parseComposite(body: string): { sources: string[]; table: string; targets: string[] } | null {
  const identifier = '[A-Za-z_][A-Za-z0-9_]*'
  const list = `${identifier}(?:\\s*,\\s*${identifier})+`
  const match = new RegExp(`^\\s*\\(\\s*(${list})\\s*\\)\\s*->\\s*(${identifier})\\s*\\(\\s*(${list})\\s*\\)\\s*$`).exec(body)
  if (!match) return null
  const sources = match[1].split(',').map(value => value.trim()), targets = match[3].split(',').map(value => value.trim())
  if (sources.length !== targets.length || new Set(sources).size !== sources.length || new Set(targets).size !== targets.length) return null
  return { sources, table: match[2], targets }
}
export function relationFieldNames(relation: LogicalRelation, side: 'source' | 'target'): string {
  if (relation.kind === 'mapping') return ''
  const names = relation.pairs.map(pair => pair[side].name)
  return names.length === 1 ? names[0] : `(${names.join(', ')})`
}
export function relationSearchText(relation: LogicalRelation): string {
  return [relation.kind === 'mapping' ? '业务映射 mapping' : '字段关联', relation.source.table, relation.source.tableComment, relation.target.table, relation.kind === 'mapping' ? relation.targetTable?.tableComment : relation.targetColumn?.tableComment,
    ...relation.pairs.flatMap(pair => [pair.source.name, commentDescription(pair.source.comment), pair.target.name, pair.targetColumn ? commentDescription(pair.targetColumn.comment) : ''])].filter(Boolean).join(' ').toLowerCase()
}
export function buildRelations(columns: SchemaColumn[]): RelationModel {
  const relations: LogicalRelation[] = []
  const diagnostics: string[] = []
  const seen = new Set<string>()
  for (const source of columns) {
    const matches = [...source.comment.matchAll(/@ref\s*\(([^)]*)\)/g)]
    const mentions = source.comment.match(/@ref\b/g)?.length ?? 0
    if (mentions > matches.length) diagnostics.push(`${source.table}.${source.name}：@ref 缺少完整括号`)
    for (const match of matches) {
      const path = match[1].trim().split('.').map(part => part.trim())
      if (![2, 3].includes(path.length) || path.some(part => !/^[\p{L}\p{N}_$]+$/u.test(part))) {
        diagnostics.push(`${source.table}.${source.name}：无法解析 ${match[0]}，请使用 @ref(table.column) 或 @ref(schema.table.column)`)
        continue
      }
      const [schema, table, name] = path.length === 2 ? [source.schema, ...path] : path
      const target = { schema, table, name }
      const id = JSON.stringify([source.schema, source.table, source.name, schema, table, name])
      if (seen.has(id)) continue
      seen.add(id)
      const targetColumn = columns.find(column => column.schema === schema && column.table === table && column.name === name)
      let message = '源字段与目标字段均存在'
      if (!targetColumn) message = schema !== source.schema ? '跨库目标未校验；第一版只读取当前库元数据' : columns.some(column => column.schema === schema && column.table === table) ? '目标字段不存在或当前账号不可见' : '目标表不存在或当前账号不可见'
      const warning = targetColumn && targetColumn.type.toLowerCase() !== source.type.toLowerCase() ? `字段类型不同：${source.type} / ${targetColumn.type}` : undefined
      relations.push({ id, kind: 'field', pairs: [{ source, target, targetColumn }], source, target, targetColumn, status: targetColumn ? 'valid' : 'invalid', message, warning })
    }
  }
  const tables = new Map<string, SchemaColumn>()
  for (const column of columns) {
    const key = JSON.stringify([column.schema, column.table])
    if (!tables.has(key) || !tables.get(key)!.tableComment && column.tableComment) tables.set(key, column)
  }
  for (const table of tables.values()) for (const token of compositeDirectives(table.tableComment ?? '')) {
    const declaration = token.body === null ? null : parseComposite(token.body)
    if (!declaration) {
      diagnostics.push(`${table.table}：无法解析组合声明 ${token.raw}；需至少两列、两端数量相同且无重复字段，使用 @relation((a,b)->target(x,y))`)
      continue
    }
    const id = JSON.stringify([table.schema, table.table, declaration.sources, declaration.table, declaration.targets])
    if (seen.has(id)) continue
    seen.add(id)
    const missing: string[] = [], warnings: string[] = []
    const pairs = declaration.sources.map((name, index): RelationPair => {
      const found = columns.find(column => column.schema === table.schema && column.table === table.table && column.name === name)
      const source = found ?? { ...table, name, type: '', key: '', comment: '' }
      const target = { schema: table.schema, table: declaration.table, name: declaration.targets[index] }
      const targetColumn = columns.find(column => column.schema === target.schema && column.table === target.table && column.name === target.name)
      if (!found) missing.push(`${table.table}.${name}`)
      if (!targetColumn) missing.push(`${target.table}.${target.name}`)
      if (found && targetColumn && found.type.toLowerCase() !== targetColumn.type.toLowerCase()) warnings.push(`字段类型不同：${name} ${found.type} / ${target.name} ${targetColumn.type}`)
      return { source, target, targetColumn }
    })
    relations.push({ id, kind: 'composite', pairs, ...pairs[0], status: missing.length ? 'invalid' : 'valid',
      message: missing.length ? `字段不存在或当前账号不可见：${missing.join('、')}` : '全部来源与目标字段均存在；JOIN 将同时使用全部配对条件', warning: warnings.join('；') || undefined })
  }
  for (const table of tables.values()) for (const token of compositeDirectives(table.tableComment ?? '', 'mapping')) {
    const targetName = mappingTarget(token.body)
    if (!targetName) { diagnostics.push(`${table.table}：无法解析业务映射 ${token.raw}；仅支持 @mapping(target_table)，不允许字段、库名或表达式`); continue }
    const id = JSON.stringify(['mapping', table.schema, table.table, targetName])
    if (seen.has(id)) continue
    seen.add(id)
    const found = tables.get(JSON.stringify([table.schema, targetName]))
    const targetTable = found ? { schema: found.schema, table: found.table, tableComment: found.tableComment } : undefined
    relations.push({ id, kind: 'mapping', pairs: [], source: { schema: table.schema, table: table.table, tableComment: table.tableComment },
      target: { schema: table.schema, table: targetName }, targetTable, status: found ? 'valid' : 'invalid',
      message: found ? '目标表结构可见；仅表示应用/SDK 定位联系，没有字段等值、基数或目标行存在保证，禁止生成 JOIN' : '映射目标表不存在或当前账号不可见；保留声明，不生成 JOIN' })
  }
  return { columns, relations, diagnostics }
}
export function relationJoinSql(relation: LogicalRelation): string {
  if (relation.kind === 'mapping') throw new Error('业务映射没有字段等值语义，禁止生成 JOIN')
  if (relation.status !== 'valid') throw new Error('目标尚未校验，不能生成 JOIN')
  const table = (schema: string, name: string) => `${quoteIdentifier(schema)}.${quoteIdentifier(name)}`
  return `SELECT src.*, ref.*\nFROM ${table(relation.source.schema, relation.source.table)} AS src\nLEFT JOIN ${table(relation.target.schema, relation.target.table)} AS ref\n  ON ${relation.pairs.map(pair => `src.${quoteIdentifier(pair.source.name)} = ref.${quoteIdentifier(pair.target.name)}`).join('\n AND ')}\nLIMIT 100;`
}
export interface RelationFieldRow { field: SchemaColumn; description: string; top: number; height: number; anchor: number }
export interface RelationNode { available: boolean; table: string; comment: string; headerHeight: number; fieldRows: RelationFieldRow[]; x: number; y: number; width: number; height: number; fields: SchemaColumn[] }
function layoutGroup(model: RelationModel, showComments = true): { nodes: RelationNode[]; width: number; height: number } {
  const involved = new Set(model.relations.flatMap(relation => [relation.source.table, ...(relation.target.schema === relation.source.schema ? [relation.target.table] : [])]))
  const tables = [...involved].sort()
  const nodes = tables.map(table => {
    const names = new Set(model.relations.flatMap(relation => [ ...(relation.source.table === table ? relation.pairs.map(pair => pair.source.name) : []), ...(relation.target.table === table && relation.target.schema === relation.source.schema ? relation.pairs.map(pair => pair.target.name) : []) ]))
    const fields = model.columns.filter(field => field.table === table && (names.has(field.name) || field.key === 'PRI'))
    // Missing targets still have a visible placeholder, without invented columns.
    const comment = model.columns.find(field => field.table === table)?.tableComment ?? ''
    const description = commentDescription(comment)
    const headerHeight = showComments && description ? 78 : 58
    let height = headerHeight
    const fieldRows = fields.map(field => {
      const description = showComments ? commentDescription(field.comment) : ''
      const rowHeight = description ? 46 : 30
      const row = { field, description, top: height, height: rowHeight, anchor: height + 15 }
      height += rowHeight
      return row
    })
    if (!fields.length) height += 30
    return { available: model.columns.some(field => field.table === table), table, x: 0, y: 0, width: 276, height, fields, comment: description, headerHeight, fieldRows }
  })
  const positions = arrangeRelationBoxes(nodes, model.relations.filter(relation => relation.target.schema === relation.source.schema).map(relation => ({ source: relation.source.table, target: relation.target.table })))
  // Local free-space routing needs one emergency corridor, not one top lane per field pair.
  const needsCorridor = model.relations.some(relation => {
    const a = positions.get(relation.source.table), b = positions.get(relation.target.table)
    return a && b && (b.x - a.x > 676 || b.x <= a.x)
  })
  const laneSpace = (needsCorridor ? 56 : 24) - 152
  for (const node of nodes) { Object.assign(node, positions.get(node.table)); node.y += laneSpace }
  return { nodes, width: Math.max(280, ...nodes.map(node => node.x + node.width + 36)), height: Math.max(280, ...nodes.map(node => node.y + node.height + 40)) }
}

export interface RelationGroup { id: string; label: string; tables: string[]; relations: LogicalRelation[] }
export interface RelationGroupBox extends RelationGroup { x: number; y: number; width: number; height: number }
/** Components come only from explicit declarations, never table names or common field names. */
export function relationGroups(model: RelationModel): RelationGroup[] {
  const adjacency = new Map<string, Set<string>>()
  for (const relation of model.relations) {
    const source = relation.source.table
    if (!adjacency.has(source)) adjacency.set(source, new Set())
    if (relation.target.schema !== relation.source.schema) continue
    const target = relation.target.table
    if (!adjacency.has(target)) adjacency.set(target, new Set())
    adjacency.get(source)!.add(target); adjacency.get(target)!.add(source)
  }
  const visited = new Set<string>(), groups: RelationGroup[] = []
  for (const start of [...adjacency.keys()].sort()) {
    if (visited.has(start)) continue
    const pending = [start], tables: string[] = []
    while (pending.length) {
      const table = pending.pop()!
      if (visited.has(table)) continue
      visited.add(table); tables.push(table)
      pending.push(...adjacency.get(table)!)
    }
    tables.sort()
    const label = [...tables].sort((a, b) => adjacency.get(b)!.size - adjacency.get(a)!.size || a.localeCompare(b))[0]
    groups.push({ id: JSON.stringify(tables), label, tables, relations: model.relations.filter(relation => tables.includes(relation.source.table)).sort((a, b) => a.id.localeCompare(b.id)) })
  }
  return groups.sort((a, b) => b.relations.length - a.relations.length || a.label.localeCompare(b.label))
}
export function layoutRelations(model: RelationModel, showComments = true): { nodes: RelationNode[]; groups: RelationGroupBox[]; width: number; height: number } {
  const layouts = relationGroups(model).map(group => ({ group, graph: layoutGroup({ ...model, relations: group.relations }, showComments) }))
    .sort((a, b) => b.graph.height - a.graph.height || a.group.id.localeCompare(b.group.id))
  const columns = layouts.length > 1 ? 2 : 1
  const shelves = Array.from({ length: columns }, () => ({ y: 24, width: 0, items: [] as typeof layouts }))
  for (const layout of layouts) {
    const shelf = [...shelves].sort((a, b) => a.y - b.y)[0]
    shelf.items.push(layout); shelf.width = Math.max(shelf.width, layout.graph.width); shelf.y += layout.graph.height + 100
  }
  const nodes: RelationNode[] = [], groups: RelationGroupBox[] = []
  let x = 24
  for (const shelf of shelves) {
    let y = 24
    for (const { group, graph } of shelf.items) {
      groups.push({ ...group, x, y, width: shelf.width, height: graph.height + 56 })
      nodes.push(...graph.nodes.map(node => ({ ...node, x: node.x + x, y: node.y + y + 56 })))
      y += graph.height + 100
    }
    x += shelf.width + 48
  }
  return { nodes: nodes.sort((a, b) => a.table.localeCompare(b.table)), groups, width: Math.max(280, x - 24), height: Math.max(280, ...groups.map(group => group.y + group.height + 24)) }
}
