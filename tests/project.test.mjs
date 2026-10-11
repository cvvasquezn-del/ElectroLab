import test from 'node:test';import assert from 'node:assert/strict';
import {createPhysicalProject} from '../.test-build/cabinet/model.js';
import {migratePhysical,geometrySnapshot} from '../.test-build/cabinet/project.js';
import {validateConnectedProject,readProject} from '../.test-build/cabinet/projectValidation.js';
test('v3 migra sin cambiar identidad geometría ni referencias',()=>{
 const old=createPhysicalProject(),copy=structuredClone(old),p=migratePhysical(old);
 assert.deepEqual(old,copy);assert.equal(p.version,3);
 assert.deepEqual(p.items.map(i=>i.reference),['DIN1','QF2','ID3','KM4']);
 assert.deepEqual(p.items.map(i=>i.id),old.items.map(i=>i.id));
 assert.equal(geometrySnapshot(p).items[3].xMm,132.5);
 assert.deepEqual(p.models.find(m=>m.kind==='rail').terminals,[]);
 assert.deepEqual(p.models.find(m=>m.kind==='contactor').terminals.map(t=>t.id),['T1','T2']);
 assert.deepEqual(readProject(JSON.stringify(p)).project,p);
 assert.equal(readProject(JSON.stringify(old)).project.version,3);
});
test('v3 rechaza relaciones inválidas y medidas no finitas sin mutar',()=>{
 const p=migratePhysical(createPhysicalProject()),before=structuredClone(p);
 const invalid=[
 q=>q.items[2].reference=q.items[1].reference,
 q=>q.models[0].terminals[1].id='T1',
 q=>q.models[0].terminals[1].name='T1',
 q=>q.schematic.pop(),
 q=>q.schematic[0].x=NaN,
 q=>q.schematic[0].x=10,
 q=>q.schematic.push({...q.schematic[0]}),
 q=>q.conductors.push({id:'w',reference:'W1',from:{itemId:q.items[1].id,terminalId:'bad'},to:{itemId:q.items[2].id,terminalId:'T2'},color:'#165572'}),
 q=>q.conductors.push({id:'w',reference:'W1',from:{itemId:q.items[0].id,terminalId:'T1'},to:{itemId:q.items[2].id,terminalId:'T2'},color:'#165572'}),
 ];
 for(const change of invalid){const q=structuredClone(p);change(q);assert.equal(validateConnectedProject(q).ok,false);}
 assert.deepEqual(p,before);
});
test('200 enlaces únicos se aceptan, 201 e identificaciones repetidas se rechazan',()=>{
 const p=migratePhysical(createPhysicalProject());
 for(const m of p.models)if(m.terminals.length)m.terminals=Array.from({length:16},(_,n)=>({id:'T'+(n+1),name:'T'+(n+1)}));
 for(let n=0;n<200;n++)p.conductors.push({id:'w'+n,reference:'W'+n,color:'#165572',from:{itemId:p.items[1].id,terminalId:'T'+(Math.floor(n/16)+1)},to:{itemId:p.items[2].id,terminalId:'T'+(n%16+1)}});
 assert.equal(validateConnectedProject(p).ok,true);
 const repeated=structuredClone(p);repeated.conductors[1].reference='W0';assert.equal(validateConnectedProject(repeated).ok,false);
 repeated.conductors[1].reference='W1';repeated.conductors[1].id='w0';assert.equal(validateConnectedProject(repeated).ok,false);
 p.conductors.push({id:'w200',reference:'W200',color:'#165572',from:{itemId:p.items[1].id,terminalId:'T13'},to:{itemId:p.items[2].id,terminalId:'T9'}});
 assert.equal(validateConnectedProject(p).ok,false);
});
test('v3 limita conductores y JSON multibyte y conserva v1',()=>{
 const p=migratePhysical(createPhysicalProject());
 p.extra='ñ'.repeat(51000);assert.equal(validateConnectedProject(p).ok,false);
 assert.equal(readProject('{"format":"electrolab-cabinet","version":1,"items":[]}').project.version,1);
 assert.equal(readProject('{').ok,false);
 assert.equal(readProject('{"format":"electrolab-cabinet","version":9}').ok,false);
});
