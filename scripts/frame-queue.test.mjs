import test from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
const compiled = await build({entryPoints:[new URL('../src/mysql-manager/frame-queue.ts',import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'node'})
const {createFrameQueue}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'))
test('camera frame queue coalesces high-frequency input without dropping the final state',()=>{
  let id=0
  const scheduled=new Map(), published=[]
  const queue=createFrameQueue(value=>published.push(value),callback=>{scheduled.set(++id,callback);return id},id=>scheduled.delete(id))
  for(let i=0;i<120;i++) queue.schedule({x:i,y:-i,scale:1+i/100})
  assert.equal(scheduled.size,1)
  assert.deepEqual(published,[])
  const tick=()=>{const callbacks=[...scheduled.values()];scheduled.clear();callbacks.forEach(callback=>callback(0))}
  tick()
  assert.deepEqual(published,[{x:119,y:-119,scale:2.19}])
  queue.schedule({x:120,y:-120,scale:3});tick()
  assert.equal(published.length,2)
  queue.schedule({x:0,y:0,scale:.2});queue.cancel();tick()
  assert.equal(published.length,2)
  queue.schedule({x:24,y:24,scale:1});tick()
  assert.deepEqual(published.at(-1),{x:24,y:24,scale:1})
})
