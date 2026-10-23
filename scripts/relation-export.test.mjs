import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { Script } from 'node:vm'
import { writeFileSync } from 'node:fs'
const compiled = await build({entryPoints:[new URL('../src/mysql-manager/relation-export.ts',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'})
const {exportRelationsHtml,buildRelationSnapshot,MAX_RELATION_EXPORT_BYTES}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'))
const parser=await build({entryPoints:[new URL('../src/mysql-manager/relations.ts',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'node'})
const {buildRelations}=await import('data:text/javascript;base64,'+Buffer.from(parser.outputFiles[0].text).toString('base64'))
const column=(table,name,comment='',tableComment='')=>({schema:'demo',table,name,type:'bigint',key:'PRI',comment,tableComment,password:'NOT_FOR_EXPORT',proxyUrl:'NOT_FOR_EXPORT'})
const model=buildRelations([
 column('users','id','可信用户'), column('users','tenant_id','租户标识'),
 column('orders','id','订单主键','订单目录 @mapping(events) @relation((tenant_id,user_id)->users(tenant_id,id))'),
 column('orders','tenant_id','租户'),column('orders','user_id','所属用户 @ref(users.id)'),
 column('events','event_id','业务事件编号'),
 column('standalone','secret_name','UNRELATED_METADATA')
])
const readData=html=>JSON.parse(html.match(/<script type="application\/json" id="snapshot-data">([\s\S]*?)<\/script>/)[1])
test('HTML export is deterministic, bounded, contains metadata only and preserves mapping/AND semantics',()=>{
 const html=exportRelationsHtml('demo',model)
 assert.equal(exportRelationsHtml('demo',model),html)
 assert.ok(Buffer.byteLength(html)<100*1024)
 assert.ok(Buffer.byteLength(html)<MAX_RELATION_EXPORT_BYTES)
 const data=readData(html)
 assert.equal(data.edges.length,3);assert.equal(data.nodes.length,3)
 const mapping=data.edges.find(edge=>edge.kind==='mapping')
 assert.equal(mapping.sql,null);assert.deepEqual(mapping.pairs,[])
 const composite=data.edges.find(edge=>edge.kind==='composite')
 assert.match(composite.sql,/ON src\.`tenant_id` = ref\.`tenant_id`\n AND src\.`user_id` = ref\.`id`/)
 assert.equal(data.nodes.find(node=>node.table==='orders').columns.length,3)
 assert.ok(!html.includes('NOT_FOR_EXPORT'));assert.ok(!html.includes('UNRELATED_METADATA'))
 assert.ok(!/<(?:link|img)\b|<script[^>]+src\s*=|@import|https?:\/\//i.test(html))
 assert.match(html,/connect-src 'none'/)
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
 assert.equal(scripts.length,1);assert.doesNotThrow(()=>new Script(scripts[0][1]))
 if(process.env.MYSSH_EXPORT_QA)writeFileSync(process.env.MYSSH_EXPORT_QA,html)
})
test('untrusted names/comments cannot close scripts, execute markup or become external assets',()=>{
 const attack='</script><script>alert(1)</script><!-- <img src=https://example.invalid/a> & 引号 " \' \u2028\u2029'
 const changed={...model,columns:model.columns.map(c=>({...c,comment:attack,tableComment:attack}))}
 const html=exportRelationsHtml('demo',changed),data=readData(html)
 assert.equal(readData(exportRelationsHtml(attack,changed)).db,attack)
 assert.equal(data.nodes[0].columns[0].comment,attack)
 assert.equal((html.match(/<\/script>/g)||[]).length,2)
 assert.ok(!html.includes('<img'));assert.ok(!html.includes('<!--'));assert.ok(!html.includes('https://'))
 assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
 if(process.env.MYSSH_EXPORT_XSS_QA)writeFileSync(process.env.MYSSH_EXPORT_XSS_QA,html)
})
test('export scope is explicit and truncation/oversized files are rejected',()=>{
 const filtered={...model,relations:model.relations.filter(r=>r.kind==='mapping')}
 assert.equal(buildRelationSnapshot('demo',filtered).edges.length,1)
 assert.equal(buildRelationSnapshot('demo',filtered).nodes.length,2)
 assert.throws(()=>exportRelationsHtml('demo',{...model,relations:[]}),/没有/)
 assert.throws(()=>exportRelationsHtml('demo',{...model,relations:Array(101).fill(model.relations[0])}),/100/)
 const huge={...model,columns:model.columns.map(c=>({...c,comment:'大'.repeat(400000)}))}
 assert.throws(()=>exportRelationsHtml('demo',huge),/2 MiB/)
 const broken=buildRelations([column('orders','user_id','@ref(missing.id)')])
 assert.equal(buildRelationSnapshot('demo',broken).edges[0].sql,null)
})
