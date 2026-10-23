import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const compiled = await build({entryPoints:[new URL('../src/mysql-manager/table-structure.ts',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'node'})
const {tableStructureSql,readTableStructure}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'))
test('structure metadata preserves comments, defaults and named/array result semantics',()=>{
  const row={field:'user_id',type:'varbinary(128)',nullable:'NO',column_key:'PRI',default_value:null,extra:'',comment:'可信用户标识 @ref(users.id)',table_comment:'用户目录'}
  assert.deepEqual(readTableStructure([row]),readTableStructure([Object.values(row)]))
  assert.deepEqual(readTableStructure([{...row,default_value:0}]).columns[0],{field:'user_id',type:'varbinary(128)',null:'NO',key:'PRI',default:'0',extra:'',comment:row.comment})
  assert.equal(readTableStructure([row]).tableComment,'用户目录')
  assert.equal(readTableStructure([{...row,comment:null,table_comment:null}]).columns[0].comment,'')
  assert.deepEqual(readTableStructure([]),{columns:[],tableComment:''})
  assert.equal(readTableStructure([{table_comment:'说明',comment:'<script>文本</script>',field:'id'}]).columns[0].comment,'<script>文本</script>')
})
test('structure query requests both comments in ordinal order and safely scopes schema/table',()=>{
  const sql=tableStructureSql("中文库'\\",'users`;DROP TABLE x')
  assert.match(sql,/c.COLUMN_COMMENT AS comment, t.TABLE_COMMENT AS table_comment/)
  assert.match(sql,/c.TABLE_SCHEMA = CONVERT\(0x[\da-f]+ USING utf8mb4\) AND c.TABLE_NAME = CONVERT\(0x[\da-f]+ USING utf8mb4\) ORDER BY c.ORDINAL_POSITION$/)
  assert.ok(!sql.includes('DROP TABLE'))
  assert.throws(()=>tableStructureSql('','users'))
})
