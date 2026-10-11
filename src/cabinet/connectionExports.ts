import {physicalSvg,xml,type PhysicalView} from './exports.js';
import {geometrySnapshot,schematicHeight,type ConnectedProject} from './project.js';
import {terminalPoint,conductorRoute} from './terminalGeometry.js';
const quote=(v:string|number)=>{let s=String(v);if(typeof v==='string'&&/^\s*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
export function connectionsCsv(p:ConnectedProject){
 const rows:(string|number)[][]=[['Conductor','Equipo de origen','Borne de origen','Equipo de destino','Borne de destino','Color','Sección indicada (mm²)']];
 for(const c of p.conductors)rows.push([c.reference,p.items.find(i=>i.id===c.from.itemId)!.reference,c.from.terminalId,p.items.find(i=>i.id===c.to.itemId)!.reference,c.to.terminalId,c.color,c.sectionMm2??'']);
 return '\uFEFF'+rows.map(r=>r.map(quote).join(';')).join('\r\n');
}
function layer(p:ConnectedProject,view:'physical'|'schematic'){
 const wires=p.conductors.map(c=>{const route=conductorRoute(p,c,view),description=c.reference+' · '+p.items.find(i=>i.id===c.from.itemId)!.reference+' / '+c.from.terminalId+' → '+p.items.find(i=>i.id===c.to.itemId)!.reference+' / '+c.to.terminalId;
 if(!route.clear)return '<g><title>'+xml(description+' · sin recorrido visible; consulta la lista de conexiones')+'</title></g>';
 return '<g><title>'+xml(description)+'</title><path d="'+route.path+'" fill="none" stroke="'+c.color+'" stroke-width="1.5"/><text x="'+route.label.x+'" y="'+route.label.y+'" font-size="9" fill="#00303c">'+xml(c.reference)+'</text></g>';}).join('');
 const terminals=p.items.flatMap(i=>p.models.find(m=>m.id===i.modelId)!.terminals.map(t=>{const a=terminalPoint(p,{itemId:i.id,terminalId:t.id},view);return '<g><title>'+xml(i.reference+' / '+t.name)+'</title><circle cx="'+a.x+'" cy="'+a.y+'" r="2.5" fill="white" stroke="#165572"/></g>';})).join('');
 return wires+terminals;
}
export function connectedPhysicalSvg(p:ConnectedProject,view:PhysicalView){return physicalSvg(geometrySnapshot(p),view).replace('</svg>',layer(p,'physical')+'</svg>');}
export function schematicSvg(p:ConnectedProject){
 const h=schematicHeight(p.schematic.length,p.schematic);
 const blocks=p.schematic.map(s=>{const i=p.items.find(i=>i.id===s.itemId)!,m=p.models.find(m=>m.id===i.modelId)!;return '<g><rect x="'+(s.x-45)+'" y="'+(s.y-36)+'" width="90" height="74" rx="3" fill="#f1f6f7" stroke="#165572"/><text x="'+s.x+'" y="'+(s.y-5)+'" font-size="12" text-anchor="middle">'+xml(i.reference)+'</text><text x="'+s.x+'" y="'+(s.y+54)+'" font-size="11" text-anchor="middle">'+xml(m.name)+'</text></g>';}).join('');
 const blocked=p.conductors.filter(c=>!conductorRoute(p,c,'schematic').clear).length;
 const warning=blocked?'<text x="0" y="'+(h+15)+'" font-size="12" fill="#165572">'+blocked+' conductores sin recorrido visible; separa los bloques o consulta el CSV.</text>':'';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -40 860 '+(h+80)+'" width="860" height="'+(h+80)+'"><desc>Esquema de bloques didácticos ElecWizard. Enlaces de bornes genéricos, sin simulación ni simbología normalizada.</desc><rect x="-30" y="-40" width="860" height="'+(h+80)+'" fill="white"/>'+blocks+layer(p,'schematic')+warning+'</svg>';
}
