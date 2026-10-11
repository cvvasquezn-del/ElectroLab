import test from 'node:test';import assert from 'node:assert/strict';
import {createPhysicalProject} from '../.test-build/cabinet/model.js';
import {recoverConnected,saveConnected} from '../.test-build/cabinet/projectStorage.js';
import {readProject} from '../.test-build/cabinet/projectValidation.js';
import {parseProject} from '../.test-build/cabinet/serialization.js';
test('migración guarda v3 conservando v2 y editor originales',()=>{
 const raw=JSON.stringify(createPhysicalProject()),map=new Map([['electrolab-cabinet-v02',raw],['electrolab-editor-v03','original']]);
 const s={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const r=recoverConnected(s);assert.equal(r.protected,false);
 assert.equal(saveConnected(s,r.project,false).ok,true);
 assert.equal(map.get('electrolab-cabinet-v02'),raw);assert.equal(map.get('electrolab-editor-v03'),'original');
 assert.deepEqual(recoverConnected(s).project,r.project);
});
test('v3 corrupto no cae a v2 ni se sobrescribe por selección',()=>{
 const map=new Map([['electrolab-project-v03','corrupto'],['electrolab-cabinet-v02',JSON.stringify(createPhysicalProject())]]);
 const s={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)},r=recoverConnected(s);
 assert.equal(r.protected,true);assert.equal(saveConnected(s,r.project,true).ok,false);
 assert.equal(map.get('electrolab-project-v03'),'corrupto');
 assert.equal(saveConnected(s,r.project,false).ok,true);
});
test('fallos de lectura y cuota conservan el trabajo en memoria',()=>{
 const r=recoverConnected({getItem:()=>{throw Error('denied')},setItem:()=>{}});
 assert.equal(r.protected,true);const copy=structuredClone(r.project);
 assert.equal(saveConnected({getItem:()=>null,setItem:()=>{throw Error('quota')}},r.project,false).ok,false);
 assert.deepEqual(r.project,copy);
});
test('una migración que supera 100 KB se rechaza y conserva el cuadro anterior protegido',()=>{
 const p=createPhysicalProject(),m=p.models.find(m=>m.kind==='terminal');
 p.envelope={widthMm:1200,heightMm:1200};p.plate={xMm:0,yMm:0,widthMm:1200,heightMm:1200};
 p.models=Array.from({length:150},(_,n)=>({...m,id:('m'+n).padEnd(100,'a'),name:'n'.repeat(120)}));
 p.items=p.models.map((m,n)=>({id:('i'+n).padEnd(100,'a'),modelId:m.id,xMm:n%15*20+20,yMm:Math.floor(n/15)*70+20}));
 const raw=JSON.stringify(p);assert.equal(parseProject(raw).ok,true);assert.equal(readProject(raw).ok,false);
 const map=new Map([['electrolab-cabinet-v02',raw]]),s={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const r=recoverConnected(s);assert.equal(r.protected,true);assert.match(r.warning,/100 KB/);
 assert.equal(saveConnected(s,r.project,true).ok,false);assert.equal(map.get('electrolab-cabinet-v02'),raw);assert.equal(map.has('electrolab-project-v03'),false);
});
