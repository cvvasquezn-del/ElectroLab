import test from 'node:test';import assert from 'node:assert/strict';
import {createPhysicalProject} from '../.test-build/cabinet/model.js';
import {migratePhysical} from '../.test-build/cabinet/project.js';
import {terminalPoint,conductorPath,conductorRoute} from '../.test-build/cabinet/terminalGeometry.js';
test('bornes siguen la geometría de cada vista sin confundir coordenadas',()=>{
 const p=migratePhysical(createPhysicalProject()),id=p.items[1].id,e={itemId:id,terminalId:'T1'};
 assert.deepEqual(terminalPoint(p,e,'physical'),{x:88.75,y:175});
 assert.deepEqual(terminalPoint(p,{...e,terminalId:'T2'},'physical'),{x:88.75,y:260});
 const old=terminalPoint(p,e,'schematic');p.items[1].xMm=120;
 assert.deepEqual(terminalPoint(p,e,'schematic'),old);
 p.schematic[0].x=350;assert.equal(terminalPoint(p,e,'physical').x,128.75);
 assert.throws(()=>terminalPoint(p,{...e,terminalId:'bad'},'physical'));
 assert.throws(()=>terminalPoint(p,{itemId:p.items[0].id,terminalId:'T1'},'physical'));
 assert.ok(conductorPath({x:10,y:20},{x:40,y:60}).startsWith('M10 20'));
});
test('el esquema sale de cada borne hacia afuera y rodea todos los bloques',()=>{
 const p=migratePhysical(createPhysicalProject());
 const c={id:'w',reference:'W1',color:'#165572',from:{itemId:p.items[1].id,terminalId:'T1'},to:{itemId:p.items[3].id,terminalId:'T2'}};
 const route=conductorRoute(p,c,'schematic');
 const numbers=route.path.match(/-?\d+(?:\.\d+)?/g).map(Number);
 // Explicit outward ports and a channel above y64: no line through QF/ID/KM terminal circles.
 assert.equal(numbers[0],55);assert.equal(numbers[1],84);assert.ok(numbers[2]<55);
 assert.ok(route.label.y<64);assert.ok(!route.path.includes('H525V84H525'));
 for(const view of ['physical','schematic'])assert.ok(conductorRoute(p,c,view).path.startsWith('M'));
 // Parse the exported orthogonal path independently and ensure inner segments
 // avoid all three device rectangles, including unrelated terminal edges.
 const commands=[...route.path.matchAll(/([MHV])(-?\d+(?:\.\d+)?)(?: (-?\d+(?:\.\d+)?))?/g)];
 const points=[];let q={x:0,y:0};
 for(const [,cmd,a,b] of commands){q=cmd==='M'?{x:+a,y:+b}:cmd==='H'?{...q,x:+a}:{...q,y:+a};points.push(q);}
 for(let n=2;n<points.length-1;n++)for(const s of p.schematic){
 const a=points[n-1],b=points[n],left=s.x-45,right=s.x+45,top=s.y-36,bottom=s.y+38;
 const hit=a.x===b.x?a.x>=left&&a.x<=right&&Math.max(a.y,b.y)>=top&&Math.min(a.y,b.y)<=bottom:a.y>=top&&a.y<=bottom&&Math.max(a.x,b.x)>=left&&Math.min(a.x,b.x)<=right;
 assert.equal(hit,false);
 }
 p.schematic[1]={...p.schematic[1],x:100,y:100};
 assert.equal(conductorRoute(p,c,'schematic').clear,false);
 assert.equal(conductorRoute(p,c,'schematic').path,'');
});
