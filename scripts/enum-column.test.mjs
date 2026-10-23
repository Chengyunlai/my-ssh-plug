import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const result = await build({ entryPoints: ['src/mysql-manager/enum-column.ts'], bundle: true, write: false, format: 'esm', platform: 'node' })
const { enumOptions, enumSqlValue, enumTone, enumUpdateSql } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))
test('ENUM reads metadata including commas, Unicode, empty and escaped strings; refuses ordinary fields', () => {
  assert.deepEqual(enumOptions("ENUM('user','guest','disabled','admin')"), ['user','guest','disabled','admin'])
  assert.deepEqual(enumOptions("enum('','中文','a,b','it''s','a\\\\b','c\\'d')"), ['', '中文','a,b',"it's",'a\\b',"c'd"])
  for (const type of ['varchar(255)', "set('a','b')", "enum('a',)", "enum('a)", 'enum()', "enum('a') garbage"]) assert.equal(enumOptions(type), null)
  assert.equal(enumTone('guest', ['user','guest']), 1)
})
test('ENUM updates distinguish SQL NULL, empty string and literal NULL and reject undeclared values', () => {
  const options = ['', 'NULL', "a'\\b"]
  assert.equal(enumSqlValue(null, options, true), 'NULL')
  assert.equal(enumSqlValue('', options, false), "''")
  assert.equal(enumSqlValue('NULL', options, false), 'CONVERT(0x4e554c4c USING utf8mb4)')
  assert.equal(enumSqlValue("a'\\b", options, false), 'CONVERT(0x61275c62 USING utf8mb4)')
  assert.throws(() => enumSqlValue(null, options, false), /NULL/)
  assert.throws(() => enumSqlValue('injected', options, true), /枚举/)
})

test('ENUM saves scope schema and all primary keys, preserve binary keys, and refuse unsafe identities', () => {
  const structure = [{field:'owner',type:'varbinary(128)',null:'NO',key:'PRI'}, {field:'id',type:'varchar(30)',null:'NO',key:'PRI'}, {field:'role',type:"enum('user','admin')",null:'NO',key:''}]
  const row = {role:'user',id:'abc',owner:{type:'Buffer',data:[0,255,39]}}
  const sql = enumUpdateSql('db`name','users','role','admin',structure,['role','id','owner'],row)
  assert.equal(sql, "UPDATE `db``name`.`users` SET `role` = CONVERT(0x61646d696e USING utf8mb4) WHERE `owner` = 0x00ff27 AND `id` = CONVERT(0x616263 USING utf8mb4) LIMIT 1")
  assert.equal(enumUpdateSql('db`name','users','role','admin',structure,['role','id','owner'],['user','abc',row.owner]),sql)
  assert.throws(()=>enumUpdateSql('db','users','role','admin',structure,['role'],['user']), /主键/)
  assert.throws(()=>enumUpdateSql('db','users','role','admin',structure.map(c=>({...c,key:''})),[],row), /主键/)
})
