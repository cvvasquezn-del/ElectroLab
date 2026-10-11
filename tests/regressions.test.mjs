import test from 'node:test';import assert from 'node:assert/strict';
import {createPhysicalProject} from '../.test-build/cabinet/model.js';
import {validatePlacement,contains,overlaps} from '../.test-build/cabinet/geometry.js';
import {addDevice,placementCommit} from '../.test-build/cabinet/operations.js';
import {parseProject,serializeProject} from '../.test-build/cabinet/serialization.js';
import {physicalSvg} from '../.test-build/cabinet/exports.js';
import {recoverPhysical,savePhysical} from '../.test-build/cabinet/storage.js';
test('recuperación fallida protege el original hasta una edición explícita',()=>{
 const raw='{"format":"future","version":3}',map=new Map([['electrolab-cabinet-v02',raw]]);
 const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const recovered=recoverPhysical(storage);
 assert.equal(recovered.protected,true);
 assert.equal(savePhysical(storage,recovered.project,recovered.protected).ok,false);
 assert.equal(map.get('electrolab-cabinet-v02'),raw);
 assert.equal(savePhysical(storage,recovered.project,false).ok,true);
});
test('seleccionar sin mover no autoriza reemplazar una recuperación fallida',()=>{
 const p=createPhysicalProject(),result=placementCommit(p,structuredClone(p));
 assert.equal(result.ok,true);assert.equal(result.changed,false);
 const moved=structuredClone(p);moved.items[0].xMm=900;
 assert.equal(placementCommit(p,moved).ok,false);
});
test('contacto decimal y límite de carril no son penetración',()=>{
 const p=createPhysicalProject(),r=p.items[0];p.models[0].widthMm=17.1;
 p.items=[r,{id:'a',modelId:'breaker',xMm:75.2,yMm:175,railId:r.id},{id:'b',modelId:'breaker',xMm:92.3,yMm:175,railId:r.id}];
 assert.deepEqual(validatePlacement(p),[]);
 assert.equal(overlaps({xMm:75.2,yMm:0,widthMm:17.1,heightMm:10},{xMm:92.3,yMm:0,widthMm:17.1,heightMm:10}),false);
 assert.equal(overlaps({xMm:75.2,yMm:0,widthMm:17.1,heightMm:10},{xMm:92.2999,yMm:0,widthMm:17.1,heightMm:10}),true);
 assert.equal(contains({xMm:0,yMm:0,widthMm:92.3,heightMm:10},{xMm:75.2,yMm:0,widthMm:17.1,heightMm:10}),true);
});
test('biblioteca usa el origen y huecos ajenos a una cuadrícula fija',()=>{
 const p=createPhysicalProject();p.plate.heightMm=80;p.items=[];
 const result=addDevice(p,'rail');assert.equal(result.ok,true);assert.equal(result.project.items[0].yMm,25);
 p.plate.heightMm=400;
 p.items=[{id:'d1',modelId:'duct',xMm:25,yMm:25},{id:'d2',modelId:'duct',xMm:425,yMm:25}];
 assert.equal(addDevice(p,'rail').ok,true);
});
test('todo proyecto importable conserva un JSON reimportable dentro del límite',()=>{
 const p=createPhysicalProject();p.models=[];p.items=[];
 for(let n=0;n<150;n++){
 const id=String(n).padStart(80,'m'),itemId=String(n).padStart(80,'i');
 p.models.push({id,kind:'terminal',name:'n'.repeat(150),ref:'r'.repeat(40),widthMm:1,heightMm:1,depthMm:1,didactic:true});
 p.items.push({id:itemId,modelId:id,xMm:25+2*n,yMm:25});
 }
 assert.equal(parseProject(JSON.stringify(p)).ok,true);
 const stored=serializeProject(p);assert.ok(new TextEncoder().encode(stored).length<=100000);
 assert.equal(parseProject(stored).ok,true);assert.deepEqual(parseProject(stored).project,p);
});
test('referencias SVG coinciden con las visibles en el ejemplo',()=>{
 const svg=physicalSvg(createPhysicalProject(),'technical');
 assert.ok(svg.includes('>DIN1</text>'));assert.ok(svg.includes('>QF2</text>'));
});
