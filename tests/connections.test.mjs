import test from 'node:test';import assert from 'node:assert/strict';
import {createPhysicalProject} from '../.test-build/cabinet/model.js';
import {migratePhysical,geometrySnapshot} from '../.test-build/cabinet/project.js';
import {addConductor,editConductor,removeConductor,mergeGeometry,moveSchematic} from '../.test-build/cabinet/connections.js';
import {createHistory,historyReducer} from '../.test-build/cabinet/history.js';
import {addDevice,duplicateDevice} from '../.test-build/cabinet/operations.js';
const example=()=>migratePhysical(createPhysicalProject());
const link=p=>addConductor(p,{itemId:p.items[1].id,terminalId:'T1'},{itemId:p.items[2].id,terminalId:'T2'});
test('enlaces son de bornes y rechazan duplicado inverso o mismo extremo',()=>{
 const p=example(),r=link(p);assert.equal(r.ok,true);const c=r.project.conductors[0];
 assert.equal(c.reference,'W1');assert.equal(p.conductors.length,0);
 assert.equal(addConductor(r.project,c.to,c.from).ok,false);
 assert.equal(addConductor(p,c.from,c.from).ok,false);
 assert.equal(addConductor(p,c.from,{itemId:'absent',terminalId:'T1'}).ok,false);
 const internal=addConductor(p,c.from,{...c.from,terminalId:'T2'});assert.equal(internal.ok,true);
 assert.equal(addConductor(r.project,c.from,{itemId:p.items[3].id,terminalId:'T1'}).ok,true);
 for(const sectionMm2 of [0,-1,NaN,Infinity])assert.equal(editConductor(r.project,c.id,{reference:'W1',color:c.color,sectionMm2}).ok,false);
 const edited=editConductor(r.project,c.id,{reference:'Wire',color:'#009abf',sectionMm2:1.5}).project;
 assert.equal(edited.conductors[0].sectionMm2,1.5);
 assert.equal(editConductor(edited,c.id,{reference:'Wire',color:c.color}).project.conductors[0].sectionMm2,undefined);
 assert.equal(removeConductor(edited,c.id).project.conductors.length,0);
});
test('geometría preserva enlaces referencias y esquema; eliminar cascada se deshace',()=>{
 const p=link(example()).project,snapshot=geometrySnapshot(p);snapshot.items[3].xMm=220;
 const moved=mergeGeometry(p,snapshot);assert.equal(moved.ok,true);
 assert.deepEqual(moved.project.conductors,p.conductors);assert.deepEqual(moved.project.schematic,p.schematic);
 const without=geometrySnapshot(p);without.items=without.items.filter(i=>i.id!==p.items[1].id);
 const removed=mergeGeometry(p,without).project;assert.equal(removed.conductors.length,0);
 assert.equal(removed.items.find(i=>i.id===p.items[3].id).reference,'KM4');
 let h=historyReducer(createHistory(p),{type:'apply',value:removed});h=historyReducer(h,{type:'undo'});assert.deepEqual(h.present,p);
 h=historyReducer(h,{type:'redo'});assert.deepEqual(h.present,removed);
});
test('duplicar crea referencia y posición libres y no copia cables',()=>{
 const p=link(example()).project,r=duplicateDevice(geometrySnapshot(p),p.items[3].id);
 const copy=mergeGeometry(p,r.project).project;
 assert.equal(copy.items.at(-1).reference,'KM1');assert.equal(copy.conductors.length,1);
 assert.equal(new Set(copy.schematic.map(s=>s.x+':'+s.y)).size,copy.schematic.length);
 const added=addDevice(geometrySnapshot(copy),'terminal');assert.equal(mergeGeometry(copy,added.project).ok,true);
});
test('mover esquema no modifica cuadro y 100 previews son una acción cancelable',()=>{
 const p=example(),id=p.items[1].id;
 const moved=moveSchematic(p,id,250,180);assert.equal(moved.ok,true);assert.deepEqual(moved.project.items,p.items);
 assert.equal(moveSchematic(p,id,NaN,180).ok,false);assert.equal(moveSchematic(p,id,5,180).ok,false);
 let h=historyReducer(createHistory(p),{type:'beginDrag'});
 for(let x=100;x<200;x++)h=historyReducer(h,{type:'preview',value:moveSchematic(p,id,x,180).project});
 h=historyReducer(h,{type:'finishDrag'});assert.equal(h.past.length,1);
 h=historyReducer(h,{type:'undo'});assert.deepEqual(h.present,p);
 h=historyReducer(h,{type:'beginDrag'});h=historyReducer(h,{type:'preview',value:moved.project});
 h=historyReducer(h,{type:'cancelDrag'});assert.deepEqual(h.present,p);assert.equal(h.future.length,1);
});
test('eliminar varios equipos conserva posiciones de las filas inferiores del esquema',()=>{
 let p=example();
 for(let n=0;n<10;n++)p=mergeGeometry(p,addDevice(geometrySnapshot(p),'terminal').project).project;
 const last=structuredClone(p.schematic.at(-1)),next=geometrySnapshot(p);
 const deleted=new Set(p.schematic.slice(0,8).map(s=>s.itemId));next.items=next.items.filter(i=>!deleted.has(i.id));
 const result=mergeGeometry(p,next);assert.equal(result.ok,true);assert.deepEqual(result.project.schematic.at(-1),last);
});
test('reconciliar geometría rechaza modelos desconocidos sin lanzar',()=>{
 const p=example(),next=geometrySnapshot(p);next.items[1].modelId='absent';
 assert.equal(mergeGeometry(p,next).ok,false);
});
