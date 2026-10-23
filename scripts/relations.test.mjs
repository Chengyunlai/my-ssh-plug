import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const compiled = await build({ entryPoints: [new URL('../src/mysql-manager/relations.ts', import.meta.url).pathname], bundle: true, write: false, format: 'esm', platform: 'node' })
const { buildRelations, readSchemaColumns, metadataSql, relationJoinSql, layoutRelations, relationGroups, commentDescription, relationSearchText } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'))
const column = (table, name, comment = '', type = 'bigint') => ({ schema: 'app', table, name, type, key: '', comment })
test('logical refs: duplicates, malformed and unavailable targets are explicit', () => {
  const columns = [column('orders', 'user_id', '用户 @ref(users.id) @ref(users.id)'), column('users', 'id'), column('orders', 'gone', '@ref(users.missing)'), column('orders', 'absent', '@ref(absent.id)'), column('orders', 'external', '@ref(other.users.id)'), column('orders', 'bad', '@ref(users.id; DROP TABLE users)'), column('orders', 'incomplete', '@ref(users.id')]
  const model = buildRelations(columns)
  assert.equal(model.relations.length, 4)
  assert.equal(model.relations.filter(r => r.status === 'valid').length, 1)
  assert.equal(model.diagnostics.length, 2)
  assert.match(model.relations[2].message, /目标表/)
  assert.match(model.relations[3].message, /跨库/)
  assert.throws(() => relationJoinSql(model.relations[1]), /尚未校验/)
})
test('metadata accepts array/object rows; SQL quotes schema and identifiers safely', () => {
  const objectRow = { TABLE_SCHEMA: 'app', TABLE_NAME: 'users', COLUMN_NAME: 'id', COLUMN_TYPE: 'bigint', COLUMN_KEY: 'PRI', COLUMN_COMMENT: '', TABLE_COMMENT: '用户目录' }
  assert.deepEqual(readSchemaColumns([objectRow]), readSchemaColumns([Object.values(objectRow)]))
  const sql = metadataSql("a'\\;DROP TABLE users")
  assert.ok(!sql.includes('DROP'))
  assert.match(sql, /FROM information_schema.COLUMNS AS c LEFT JOIN information_schema.TABLES AS t .*WHERE c.TABLE_SCHEMA = CONVERT\(0x[0-9a-f]+ USING utf8mb4\)/)
  assert.throws(() => metadataSql(''))
  const model = buildRelations([column('orders`odd', 'user`id', '@ref(users.id)'), column('users', 'id')])
  const join = relationJoinSql(model.relations[0])
  assert.match(join, /`orders``odd`/)
  assert.match(join, /src\.`user``id` = ref\.`id`/)
  assert.match(join, /LEFT JOIN `app`\.`users`/)
  assert.match(join, /LIMIT 100;/)
})
test('layout handles self refs, cycles, empty metadata and parallel relations', () => {
  const model = buildRelations([column('a', 'id', '@ref(b.id) @ref(a.id)'), column('b', 'id', '@ref(a.id)'), column('a', 'other', '@ref(b.id)')])
  const graph = layoutRelations(model)
  assert.equal(graph.nodes.length, 2)
  assert.ok(graph.nodes.every(node => Number.isFinite(node.x) && Number.isFinite(node.y) && node.width > 0))
  assert.deepEqual(layoutRelations(buildRelations([])).nodes, [])
  for (const node of graph.nodes) assert.equal(new Set(node.fields.map(field => field.name)).size, node.fields.length)
})
test('type mismatches warn without inventing relationship cardinality', () => {
  const relation = buildRelations([column('a', 'id', '@ref(b.id)'), column('b', 'id', '', 'varchar(20)')]).relations[0]
  assert.equal(relation.status, 'valid')
  assert.match(relation.warning, /字段类型不同/)
  assert.equal('cardinality' in relation, false)
})

test('table comments and human field descriptions survive normalization and search', () => {
  const raw = '用户标识；@ref(users.id)；由身份映射产生'
  assert.equal(commentDescription(raw), '用户标识；由身份映射产生')
  assert.equal(commentDescription('@ref(users.id)'), '')
  assert.equal(commentDescription('普通说明，不含声明'), '普通说明，不含声明')
  const model = buildRelations([{ ...column('orders', 'user_id', raw), tableComment: '订单目录' }, { ...column('users', 'id', '可信用户标识'), tableComment: '用户表' }])
  assert.equal(model.relations[0].source.comment, raw)
  assert.equal(model.relations[0].targetColumn.tableComment, '用户表')
  assert.ok(relationSearchText(model.relations[0]).includes('订单目录'))
  assert.ok(relationSearchText(model.relations[0]).includes('可信用户标识'))
})
test('comment rows change layout anchors together with card height', () => {
  const model = buildRelations([{ ...column('orders', 'user_id', '用户标识；@ref(users.id)'), tableComment: '订单表' }, column('users', 'id', '用户主键')])
  const expanded = layoutRelations(model).nodes.find(node => node.table === 'orders')
  const compact = layoutRelations(model, false).nodes.find(node => node.table === 'orders')
  assert.equal(expanded.comment, '订单表')
  assert.ok(expanded.height > compact.height)
  assert.equal(expanded.fieldRows[0].description, '用户标识')
  assert.equal(compact.fieldRows[0].description, '')
  for (const node of layoutRelations(model).nodes) {
    for (const row of node.fieldRows) assert.ok(row.anchor >= row.top && row.anchor < row.top + row.height)
    const last = node.fieldRows.at(-1)
    assert.equal(node.height, last.top + last.height)
  }
})

const compositeColumns = (declaration = '@relation((thread_id,owner_id)->conversations(id,user_id))') => [
  { ...column('turns', 'thread_id', '会话标识'), tableComment: `轮次快照；${declaration}；仅中文跨模块说明 其他模块 scope_hash` },
  { ...column('turns', 'owner_id', '可信用户'), tableComment: `轮次快照；${declaration}；仅中文跨模块说明 其他模块 scope_hash` },
  column('conversations', 'id', '会话主键'), column('conversations', 'user_id', '用户标识')
]
test('composite declarations stay ordered and atomic across parsing, graph and JOIN', () => {
  const columns = compositeColumns()
  const model = buildRelations(columns)
  assert.equal(model.relations.length, 1)
  assert.deepEqual(model.diagnostics, [])
  const relation = model.relations[0]
  assert.equal(relation.kind, 'composite')
  assert.equal(relation.status, 'valid')
  assert.deepEqual(relation.pairs.map(pair => [pair.source.name, pair.target.name]), [['thread_id', 'id'], ['owner_id', 'user_id']])
  const sql = relationJoinSql(relation)
  assert.match(sql, /ON src\.`thread_id` = ref\.`id`\n AND src\.`owner_id` = ref\.`user_id`/)
  assert.equal((sql.match(/LEFT JOIN/g) ?? []).length, 1)
  const graph = layoutRelations(model)
  assert.deepEqual(graph.nodes.find(node => node.table === 'turns').fields.map(field => field.name), ['thread_id', 'owner_id'])
  assert.ok(!graph.nodes.find(node => node.table === 'turns').comment.includes('@relation'))
  assert.ok(graph.nodes.find(node => node.table === 'turns').comment.includes('其他模块 scope_hash'))
  assert.ok(relation.source.tableComment.includes('@relation'))
  assert.ok(relationSearchText(relation).includes('可信用户'))
})
test('composite whitespace, multiple declarations and ordered deduplication', () => {
  const first = '@relation ( ( thread_id , owner_id ) -> conversations ( id , user_id ) )'
  const second = '@relation((owner_id,thread_id)->conversations(user_id,id))'
  const model = buildRelations(compositeColumns(`${first}；${first}；${second}`))
  assert.equal(model.relations.length, 2)
  assert.equal(model.diagnostics.length, 0)
  assert.deepEqual(model.relations[1].pairs.map(pair => pair.source.name), ['owner_id', 'thread_id'])
})
test('malformed composite syntax never creates a partial JOIN', () => {
  for (const directive of [
    '@relation((thread_id,owner_id)->conversations(id))',
    '@relation((thread_id,owner_id)->conversations(id,user_id,other))',
    '@relation((thread_id,thread_id)->conversations(id,user_id))',
    '@relation((thread_id,owner_id)->conversations(id,id))',
    '@relation((thread_id,owner_id)->app.conversations(id,user_id))',
    '@relation((thread_id,owner_id)->`conversations`(id,user_id))',
    '@relation((thread_id,owner_id)->conversations(id,user_id)',
    '@relation((thread_id,owner_id)->conversations(id,LOWER(user_id)))',
    '@relation((thread_id)->conversations(id))',
    '@relation((thread_id,owner_id)->conversations(id,user_id)))'
  ]) {
    const model = buildRelations(compositeColumns(directive))
    assert.equal(model.relations.length, 0, directive)
    assert.equal(model.diagnostics.length, 1, directive)
  }
})
test('any missing composite field disables the complete relation; pair types warn', () => {
  for (const field of ['thread_id', 'owner_id', 'id', 'user_id']) {
    const relation = buildRelations(compositeColumns().filter(column => column.name !== field)).relations[0]
    assert.equal(relation.status, 'invalid', field)
    assert.match(relation.message, new RegExp(field))
    assert.throws(() => relationJoinSql(relation), /尚未校验/)
  }
  const columns = compositeColumns()
  columns[3].type = 'varchar(128)'
  const relation = buildRelations(columns).relations[0]
  assert.match(relation.warning, /owner_id.*user_id/)
  assert.equal('cardinality' in relation, false)
})
test('plain cross-module descriptions never infer joins or same-named scope hashes', () => {
  const model = buildRelations([
    { ...column('app', 'scope_hash'), tableComment: '对应 其他模块 owner 作用域；不能连接 recovery scope_hash' },
    column('audit', 'scope_hash')
  ])
  assert.deepEqual(model.relations, [])
})

test('layered layout follows full dependency depth and keeps direct leaves nearby', () => {
  const model = buildRelations([
    column('links', 'job', '@ref(jobs.id)'), column('links', 'resource', '@ref(resources.id)'),
    column('jobs', 'id'), column('jobs', 'conversation', '@ref(conversations.id)'),
    column('conversations', 'id'), column('conversations', 'user', '@ref(users.id)'),
    column('users', 'id'), column('resources', 'id')
  ])
  const graph = layoutRelations(model)
  const node = name => graph.nodes.find(node => node.table === name)
  assert.ok(node('links').x < node('jobs').x)
  assert.ok(node('jobs').x < node('conversations').x)
  assert.ok(node('conversations').x < node('users').x)
  assert.equal(node('resources').x, node('jobs').x)
  for (const a of graph.nodes) for (const b of graph.nodes) if (a.table !== b.table && a.x === b.x) {
    assert.ok(a.y + a.height + 55 <= b.y || b.y + b.height + 55 <= a.y)
  }
  for (const box of graph.nodes) assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= graph.width && box.y + box.height <= graph.height)
})
test('layered layout groups cycles and gives deterministic non-overlapping positions', () => {
  const model = buildRelations([column('a', 'id', '@ref(b.id)'), column('b', 'id', '@ref(a.id)'), column('c', 'id', '@ref(a.id)')])
  const graph = layoutRelations(model)
  const a = graph.nodes.find(node => node.table === 'a'), b = graph.nodes.find(node => node.table === 'b')
  assert.equal(a.x, b.x)
  assert.ok(Math.abs(a.y - b.y) >= Math.min(a.height, b.height) + 56)
  assert.deepEqual(layoutRelations({ ...model, relations: [...model.relations].reverse() }), graph)
})


test('canvas components use only declared connections and keep local routes compact', () => {
  const columns = [
    column('app_turns', 'id', '@ref(app_conversations.id)'), column('app_conversations', 'id', '@ref(app_users.id)'), column('app_users', 'id'),
    column('audit_turns', 'scope_hash', '@ref(audit_conversations.scope_hash)'), column('audit_conversations', 'scope_hash'),
    column('audit_waits', 'scope_hash', '@ref(audit_runs.scope_hash)'), column('audit_runs', 'scope_hash'),
    column('schema_version', 'version')
  ]
  const model = buildRelations(columns), groups = relationGroups(model), graph = layoutRelations(model)
  assert.equal(groups.length, 3)
  assert.equal(graph.nodes.length, 7)
  assert.deepEqual(groups.map(group => group.tables.length).sort(), [2, 2, 3])
  assert.ok(!groups.some(group => group.tables.includes('schema_version')))
  for (const group of graph.groups) {
    for (const node of graph.nodes.filter(node => group.tables.includes(node.table))) {
      assert.ok(node.x >= group.x && node.y >= group.y + 56)
      assert.ok(node.x + node.width <= group.x + group.width && node.y + node.height <= group.y + group.height)
    }
    for (const other of graph.groups) if (other !== group) assert.ok(group.x + group.width <= other.x || other.x + other.width <= group.x || group.y + group.height <= other.y || other.y + other.height <= group.y)
  }
  // Focusing one group removes unrelated geometry rather than merely hiding its labels.
  const focused = layoutRelations({ ...model, relations: groups.find(group => group.tables.includes('app_turns')).relations })
  assert.equal(focused.groups.length, 1)
  assert.equal(focused.nodes.length, 3)
  assert.ok(focused.width < graph.width)
  const single = layoutRelations(buildRelations([column('a', 'id', '@ref(b.id)'), column('b', 'id')]))
  assert.ok(single.nodes.every(node => node.y < 130), 'one-hop relations must not reserve a global long-line corridor')
})


test('business mappings are table-level declarations, deduplicated and separate from field JOINs', () => {
  const raw = '宿主可信用户与会话定位；@mapping( audit_conversations )；@mapping(audit_conversations)；@mapping(audit_turns)'
  const model = buildRelations([
    { ...column('app', 'user_id', '@ref(users.id)'), tableComment: raw }, column('app', 'id'),
    { ...column('audit_conversations', 'scope_hash'), tableComment: 'owner 域说明' }, column('audit_turns', 'scope_hash'), column('users', 'id')
  ])
  const mappings = model.relations.filter(relation => relation.kind === 'mapping')
  assert.equal(mappings.length, 2)
  assert.equal(model.relations.length, 3)
  assert.equal(model.diagnostics.length, 0)
  assert.deepEqual(mappings[0].pairs, [])
  assert.equal('name' in mappings[0].source, false)
  assert.equal('name' in mappings[0].target, false)
  assert.equal(mappings[0].targetTable.tableComment, 'owner 域说明')
  assert.equal(mappings[0].source.tableComment, raw)
  assert.equal(commentDescription(raw), '宿主可信用户与会话定位')
  assert.ok(relationSearchText(mappings[0]).includes('业务映射'))
  assert.ok(!relationJoinSql(model.relations.find(relation => relation.kind === 'field')).includes('audit'))
  for (const mapping of mappings) assert.throws(() => relationJoinSql(mapping), /业务映射.*禁止生成 JOIN/)
})
test('invalid business mapping grammar is diagnosed without partial interpretation', () => {
  for (const declaration of ['@mapping(app.table)', '@mapping(table.id)', '@mapping(`table`)', '@mapping(table WHERE 1)', '@mapping(table())', '@mapping(table', '@mapping(table))', '@mapping()', '@mapping(123table)', '@mapping(表名)', '@mapping(a,b)']) {
    const model = buildRelations([{ ...column('source', 'id'), tableComment: declaration }, column('table', 'id')])
    assert.equal(model.relations.length, 0, declaration)
    assert.equal(model.diagnostics.length, 1, declaration)
  }
  const ordinary = buildRelations([{ ...column('source', 'id'), tableComment: '@Mapping(table) 中文描述 scope_hash' }, column('table', 'scope_hash')])
  assert.equal(ordinary.relations.length, 0)
})
test('missing mapping target remains visible and cannot become a JOIN even if status is forged', () => {
  const model = buildRelations([{ ...column('source', 'id'), tableComment: '定位规则；@mapping(missing)' }])
  const relation = model.relations[0]
  assert.equal(relation.kind, 'mapping')
  assert.equal(relation.status, 'invalid')
  assert.match(relation.message, /不存在或当前账号不可见/)
  assert.throws(() => relationJoinSql({ ...relation, status: 'valid' }), /业务映射.*禁止生成 JOIN/)
  assert.equal(layoutRelations(model).nodes.find(node => node.table === 'missing').available, false)
})
test('mapping and composite directives coexist, preserve complete AND and connect only explicit groups', () => {
  const columns = compositeColumns('@relation((thread_id,owner_id)->conversations(id,user_id))；@mapping(audit_turns)')
  columns.push({ ...column('audit_turns', 'scope_hash', '@ref(audit_conversations.scope_hash)'), tableComment: '' }, column('audit_conversations', 'scope_hash'), column('runs', 'scope_hash'), column('waits', 'scope_hash', '@ref(runs.scope_hash)'))
  const model = buildRelations(columns)
  assert.equal(model.diagnostics.length, 0)
  assert.equal(relationGroups(model).length, 2)
  const composite = model.relations.find(relation => relation.kind === 'composite')
  assert.match(relationJoinSql(composite), /ON src\.`thread_id` = ref\.`id`\n AND src\.`owner_id` = ref\.`user_id`/)
  assert.ok(!layoutRelations(model).nodes.find(node => node.table === 'turns').comment.includes('@'))
  columns.find(column => column.table === 'audit_turns').tableComment = '@mapping(runs)'
  assert.equal(relationGroups(buildRelations(columns)).length, 1)
  assert.equal(relationGroups({ ...model, relations: model.relations.filter(relation => relation.kind !== 'mapping') }).length, 3)
})
