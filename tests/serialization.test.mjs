import test from 'node:test';
import assert from 'node:assert/strict';
import {createPhysicalProject} from '../.test-build/cabinet/model.js';
import {parseProject,serializeProject,projectMode,validateProject} from '../.test-build/cabinet/serialization.js';
test('v1 y v2 conservan IDs posiciones y medidas sin convertir',()=>{
 const v1={format:'electrolab-cabinet',version:1,items:[{id:7,kind:'rail',x:115,y:180,lengthMm:360}]};
 for(const p of [v1,createPhysicalProject()]){
 const r=parseProject(JSON.stringify(p));assert.equal(r.ok,true);assert.deepEqual(JSON.parse(serializeProject(r.project)),p);
 assert.equal(projectMode(r.project),p.version===1?'illustrative':'physical');}
});
test('entrada corrupta rechazada sin mutar el proyecto abierto',()=>{
 const current=createPhysicalProject(),before=structuredClone(current);
 for(const text of ['{','null',JSON.stringify({...current,version:3}),JSON.stringify({...current,items:[current.items[0],current.items[0]]}),JSON.stringify({...current,items:[{...current.items[1],railId:'missing'}]}),JSON.stringify({...current,envelope:{widthMm:'600',heightMm:800}})]){
 assert.equal(parseProject(text).ok,false);assert.deepEqual(current,before);}
 assert.equal(validateProject({...current,reserveMm:Infinity}).ok,false);
 assert.equal(validateProject({...current,items:[{...current.items[0],xMm:NaN}]}).ok,false);
});
test('v1 sigue rechazando superposición y longitudes no admitidas',()=>{
 const p={format:'electrolab-cabinet',version:1,items:[{id:1,kind:'breaker',x:120,y:138},{id:2,kind:'breaker',x:120,y:138}]};
 assert.equal(parseProject(JSON.stringify(p)).ok,false);
 assert.equal(parseProject(JSON.stringify({...p,items:[{id:1,kind:'rail',x:115,y:180,lengthMm:999}]})).ok,false);
});
