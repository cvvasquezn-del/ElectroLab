import test from 'node:test';
import assert from 'node:assert/strict';
import {createHistory,historyReducer as reduce} from '../.test-build/cabinet/history.js';
import {createPhysicalProject} from '../.test-build/cabinet/model.js';
test('editar después de undo crea una rama deshacible en ambos formatos',()=>{
 for(const initial of [[{id:1,kind:'rail',x:115,y:180}],createPhysicalProject()]){
 let h=createHistory(initial);const edit=structuredClone(initial),next=structuredClone(initial);
 if(Array.isArray(edit)){edit[0].x=120;next[0].x=130;}else{edit.reserveMm=1;next.reserveMm=2;}
 h=reduce(h,{type:'apply',value:edit});h=reduce(h,{type:'undo'});h=reduce(h,{type:'apply',value:next});
 assert.equal(h.future.length,0);assert.deepEqual(reduce(h,{type:'undo'}).present,initial);
 }
});
test('100 previews equivalen a una acción; cancelar conserva redo y estado',()=>{
 let h=createHistory({x:0});h=reduce(h,{type:'apply',value:{x:1}});h=reduce(h,{type:'undo'});
 h=reduce(h,{type:'beginDrag'});for(let x=1;x<=100;x++)h=reduce(h,{type:'preview',value:{x}});
 assert.equal(reduce(h,{type:'undo'}),h);
 const canceled=reduce(h,{type:'cancelDrag'});assert.deepEqual(canceled.present,{x:0});assert.equal(canceled.past.length,0);assert.equal(canceled.future.length,1);
 h=reduce(h,{type:'finishDrag'});assert.equal(h.past.length,1);assert.equal(h.future.length,0);assert.deepEqual(reduce(h,{type:'undo'}).present,{x:0});
});
test('sin cambios no crea acción; redo consecutivo reset y límite 50',()=>{
 let h=reduce(createHistory({x:0}),{type:'beginDrag'});h=reduce(h,{type:'finishDrag'});assert.equal(h.past.length,0);
 for(let x=1;x<=55;x++)h=reduce(h,{type:'apply',value:{x}});
 assert.equal(h.past.length,50);
 h=reduce(reduce(h,{type:'undo'}),{type:'undo'});assert.equal(h.present.x,53);
 h=reduce(reduce(h,{type:'redo'}),{type:'redo'});assert.equal(h.present.x,55);
 h=reduce(h,{type:'reset',value:{x:2}});assert.equal(h.past.length,0);assert.equal(h.future.length,0);
});
