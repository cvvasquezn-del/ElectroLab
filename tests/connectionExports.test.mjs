import test from 'node:test';import assert from 'node:assert/strict';
import {createPhysicalProject} from '../.test-build/cabinet/model.js';
import {migratePhysical} from '../.test-build/cabinet/project.js';
import {addConductor} from '../.test-build/cabinet/connections.js';
import {connectionsCsv,connectedPhysicalSvg,schematicSvg} from '../.test-build/cabinet/connectionExports.js';
test('exportación comparte referencias escapa XML y neutraliza fórmulas CSV',()=>{
 const p=migratePhysical(createPhysicalProject());p.items[1].reference='=QF&<';
 const linked=addConductor(p,{itemId:p.items[1].id,terminalId:'T1'},{itemId:p.items[2].id,terminalId:'T2'}).project;
 linked.conductors[0].reference='W<&';linked.conductors[0].sectionMm2=1.5;
 const csv=connectionsCsv(linked);assert.equal(csv.charCodeAt(0),0xfeff);
 assert.ok(csv.includes('"\'=QF&<"'));assert.ok(csv.includes('"T1"'));assert.ok(csv.includes('"1.5"'));
 assert.equal(csv.split('\r\n').length,2);
 for(const svg of [connectedPhysicalSvg(linked,'technical'),schematicSvg(linked)]){
 assert.ok(svg.includes('W&lt;&amp;'));assert.ok(svg.includes('=QF&amp;&lt;'));
 assert.ok(!svg.includes('aria-pressed'));assert.ok(svg.includes('<path'));
 }
});
test('un recorrido bloqueado se avisa y no dibuja una conexión engañosa',()=>{
 const p=migratePhysical(createPhysicalProject());
 const linked=addConductor(p,{itemId:p.items[1].id,terminalId:'T1'},{itemId:p.items[3].id,terminalId:'T2'}).project;
 linked.schematic[1]={...linked.schematic[1],x:100,y:100};
 const svg=schematicSvg(linked);assert.match(svg,/sin recorrido visible/);assert.ok(!svg.includes('<path d=""'));
 assert.ok(svg.includes('QF2 / T1'));assert.ok(svg.includes('KM4 / T2'));
});
