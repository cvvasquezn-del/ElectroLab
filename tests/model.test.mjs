import test from 'node:test';
import assert from 'node:assert/strict';
import {createPhysicalProject,modelFor} from '../.test-build/cabinet/model.js';
test('el ejemplo conserva medidas y relaciones de montaje explícitas',()=>{
 const p=createPhysicalProject();
 assert.deepEqual(p.envelope,{widthMm:600,heightMm:800});
 assert.deepEqual(p.plate,{xMm:25,yMm:25,widthMm:550,heightMm:750});
 assert.equal(p.reserveMm,0);
 assert.equal(new Set(p.items.map(i=>i.id)).size,p.items.length);
 const rail=p.items[0];
 for(const i of p.items.slice(1)){
  assert.equal(i.railId,rail.id);
  assert.equal(i.yMm+modelFor(p,i).heightMm/2,217.5);
 }
 assert.throws(()=>modelFor(p,{modelId:'unknown'}));
 assert.notEqual(createPhysicalProject().id,p.id);
});
