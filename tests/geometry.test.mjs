import test from 'node:test';
import assert from 'node:assert/strict';
import {createPhysicalProject} from '../.test-build/cabinet/model.js';
import {overlaps,createTransform,mmToSvg,svgToMm,validatePlacement,findRailSlot,resizeRail,resizeCabinet,moveItem,removeItem} from '../.test-build/cabinet/geometry.js';
test('bordes exactos y fracciones permiten contacto sin penetración',()=>{
 const a={xMm:25,yMm:25,widthMm:17.5,heightMm:85};
 assert.equal(overlaps(a,{...a,xMm:42.5}),false);
 assert.equal(overlaps(a,{...a,xMm:42.49}),true);
});
test('escala uniforme e inversa también con zoom',()=>{
 for(const zoom of [.7,1,1.5]){
 const t=createTransform({widthMm:600,heightMm:800},{width:720,height:520},zoom);
 const a=mmToSvg({xMm:0,yMm:0},t),b=mmToSvg({xMm:100,yMm:100},t);
 assert.ok(Math.abs((b.xMm-a.xMm)-(b.yMm-a.yMm))<1e-9);
 const p=svgToMm(mmToSvg({xMm:132.5,yMm:217.5},t),t);
 assert.ok(Math.abs(p.xMm-132.5)<1e-9);assert.ok(Math.abs(p.yMm-217.5)<1e-9);
 }
});
test('ejemplo, recortes y movimiento atómico de carril',()=>{
 const p=createPhysicalProject(),r=p.items[0],before=structuredClone(p);
 assert.deepEqual(validatePlacement(p),[]);
 assert.equal(resizeRail(p,r.id,600).ok,false);
 assert.equal(resizeRail(p,r.id,30).ok,false);
 assert.equal(resizeCabinet(p,{widthMm:200,heightMm:800},{xMm:25,yMm:25,widthMm:150,heightMm:750}).ok,false);
 const moved=moveItem(p,r.id,{xMm:85,yMm:250});
 assert.equal(moved.ok,true);assert.equal(moved.project.items[1].xMm,90);assert.equal(moved.project.items[1].yMm,225);
 assert.equal(removeItem(p,r.id).ok,false);
 assert.deepEqual(p,before);
});
test('huecos discontinuos no se suman y la reserva cambia la colocación',()=>{
 const p=createPhysicalProject(),r=p.items[0];
 r.xMm=25;r.lengthMm=55;
 p.items=[r,{id:'block',modelId:'rcd',xMm:35,yMm:175,railId:r.id}];
 const candidate={id:'new',modelId:'breaker',xMm:25,yMm:175};
 assert.equal(findRailSlot(p,candidate,r,25),null);
 r.lengthMm=100;p.reserveMm=5;
 assert.deepEqual(findRailSlot(p,candidate,r,25),{xMm:75,yMm:175});
});
test('colisiones con canaleta y relaciones de montaje incorrectas se rechazan',()=>{
 const p=createPhysicalProject();
 p.items.push({id:'duct1',modelId:'duct',xMm:80,yMm:170});
 assert.ok(validatePlacement(p).length);
 p.items.pop();p.items[1].railId=p.items[2].id;
 assert.ok(validatePlacement(p).some(x=>/carril/i.test(x)));
});
