import test from 'node:test';import assert from 'node:assert/strict';
import {createPhysicalProject} from '../.test-build/cabinet/model.js';
import {physicalSvg,physicalCsv} from '../.test-build/cabinet/exports.js';
import {addDevice,duplicateDevice,organizeRail} from '../.test-build/cabinet/operations.js';
test('SVG conserva proporción y escapa texto importado',()=>{
 const p=createPhysicalProject();p.models[0].ref='<script>&';
 const svg=physicalSvg(p,'technical');assert.match(svg,/viewBox="0 0 600 800"/);assert.match(svg,/<desc>.*educativ/i);assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;script&gt;&amp;'));
});
test('CSV agrupa carriles por longitud y evita fórmulas',()=>{
 const p=createPhysicalProject();p.items[0].lengthMm=300;p.models[5].name='=1+1';
 p.items.push({id:'second',modelId:'rail',xMm:75,yMm:400,lengthMm:360});
 const csv=physicalCsv(p);assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/300/);assert.match(csv,/360/);assert.ok(csv.includes("'=1+1"));
});
test('añadir duplicar y ordenar respetan reserva y límite de capacidad',()=>{
 const p=createPhysicalProject();const added=addDevice(p,'terminal');assert.equal(added.ok,true);assert.equal(added.project.items.length,5);
 const copy=duplicateDevice(p,p.items[1].id);assert.equal(copy.ok,true);assert.equal(copy.project.items.at(-1).xMm,177.5);
 const ordered=organizeRail({...p,reserveMm:5},p.items[0].id);assert.equal(ordered.ok,true);assert.equal(ordered.project.items[1].xMm,75);assert.equal(ordered.project.items[2].xMm,97.5);
 const full={...p,items:Array.from({length:150},(_,n)=>({...p.items[0],id:'id'+n}))};assert.equal(addDevice(full,'rail').ok,false);
 const noRail={...p,items:[]};assert.equal(addDevice(noRail,'breaker').ok,false);
});
