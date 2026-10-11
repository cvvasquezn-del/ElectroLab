import {validateProject,parseProject} from './serialization.js';
import {geometrySnapshot,isElectrical,migratePhysical,schematicHeight,wireColors,type ConnectedProject,type ProjectResult} from './project.js';
import type {LegacyProject} from './legacy.js';
const obj=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const label=(v:unknown,max=40):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const unique=(a:string[])=>new Set(a).size===a.length;
const bad=(error:string):ProjectResult=>({ok:false,error});
export function validateConnectedProject(v:unknown):ProjectResult{
 if(!obj(v)||v.format!=='electrolab-cabinet'||v.version!==3)return bad('Formato compartido no reconocido.');
 if(!Array.isArray(v.models)||!Array.isArray(v.items)||!Array.isArray(v.conductors)||!Array.isArray(v.schematic))return bad('Faltan modelos, equipos, esquema o conductores.');
 if(!v.models.every(m=>obj(m)&&Array.isArray(m.terminals)&&m.terminals.length<=16&&m.terminals.every(t=>obj(t)&&label(t.id)&&label(t.name))&&unique(m.terminals.map(t=>t.id as string))&&unique(m.terminals.map(t=>t.name as string))&&((m.kind==='rail'||m.kind==='duct')?m.terminals.length===0:m.terminals.length>0)))return bad('Bornes didácticos inválidos.');
 if(!v.items.every(i=>obj(i)&&label(i.reference))||!unique(v.items.map(i=>i.reference as string)))return bad('Las referencias de equipos deben ser únicas y no estar vacías.');
 const p=structuredClone(v) as unknown as ConnectedProject;
 const physical=validateProject(geometrySnapshot(p));if(!physical.ok)return bad(physical.error);
 const electrical=p.items.filter(i=>isElectrical(p.models.find(m=>m.id===i.modelId)!.kind));
 const height=schematicHeight(electrical.length);
 if(p.schematic.length!==electrical.length||!p.schematic.every(s=>obj(s)&&electrical.some(i=>i.id===s.itemId)&&typeof s.x==='number'&&Number.isFinite(s.x)&&s.x>=45&&s.x<=755&&typeof s.y==='number'&&Number.isFinite(s.y)&&s.y>=45&&s.y<=Math.max(height-45,20000))||!unique(p.schematic.map(s=>s.itemId)))return bad('Posiciones del esquema inválidas o incompletas.');
 const ends=new Set<string>(),ids:string[]=[],refs:string[]=[];
 for(const c of p.conductors){
 if(!obj(c)||!label(c.id,100)||!label(c.reference)||!wireColors.includes(c.color)||c.sectionMm2!==undefined&&(typeof c.sectionMm2!=='number'||!Number.isFinite(c.sectionMm2)||c.sectionMm2<=0))return bad('Identificación, color o sección de conductor inválidos.');
 for(const e of [c.from,c.to]){
 if(!obj(e)||!label(e.itemId,100)||!label(e.terminalId))return bad('Extremo de conductor inválido.');
 const i=electrical.find(i=>i.id===e.itemId),m=i&&p.models.find(m=>m.id===i.modelId);
 if(!m?.terminals.some(t=>t.id===e.terminalId))return bad('Un conductor hace referencia a un equipo o borne inexistente.');
 }
 const a=JSON.stringify([c.from.itemId,c.from.terminalId]),b=JSON.stringify([c.to.itemId,c.to.terminalId]),pair=JSON.stringify([a,b].sort());
 if(a===b||ends.has(pair))return bad('No se permite el mismo extremo ni una conexión duplicada.');
 ends.add(pair);ids.push(c.id);refs.push(c.reference);
 }
 if(p.conductors.length>200||!unique(ids)||!unique(refs))return bad('Máximo 200 conductores, con IDs y referencias únicos.');
 if(new TextEncoder().encode(JSON.stringify(p)).length>100000)return bad('El proyecto supera el máximo de 100 KB.');
 return {ok:true,project:p};
}
export function readProject(text:string):{ok:true;project:LegacyProject|ConnectedProject}|{ok:false;error:string}{
 if(new TextEncoder().encode(text).length>100000)return {ok:false,error:'Archivo demasiado grande (máximo 100 KB).'};
 try{
 const v:unknown=JSON.parse(text);
 if(obj(v)&&v.version===3)return validateConnectedProject(v);
 const parsed=parseProject(text);if(!parsed.ok)return parsed;
 if(parsed.project.version===1)return {ok:true,project:parsed.project};
 return validateConnectedProject(migratePhysical(parsed.project));
 }catch{return {ok:false,error:'No se pudo leer el proyecto: JSON corrupto o incompleto.'};}
}
