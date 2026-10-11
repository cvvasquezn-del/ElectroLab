import {kinds,type PhysicalProject} from './model.js';
import {validatePlacement} from './geometry.js';
import {validLegacyItems,legacyOverlap,type LegacyProject} from './legacy.js';
export type Project=PhysicalProject|LegacyProject;
type Failure={ok:false;code:'json'|'format'|'version'|'geometry'|'references';error:string};
export type Parsed={ok:true;project:Project}|Failure;
const bad=(code:Failure['code'],error:string):Failure=>({ok:false,code,error});
const object=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const positive=(v:unknown)=>finite(v)&&v>0;
const id=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=100;
export function validateProject(v:unknown):Parsed{
 if(!object(v)||v.format!=='electrolab-cabinet')return bad('format','Formato de cuadro no reconocido.');
 if(v.version!==1&&v.version!==2)return bad('version','Versión de archivo no soportada.');
 if(v.version===1){
 if(!validLegacyItems(v.items)||legacyOverlap(v.items))return bad('geometry','Datos ilustrativos incorrectos o dispositivos superpuestos.');
 return {ok:true,project:{format:'electrolab-cabinet',version:1,items:v.items.map(i=>({...i}))}};
 }
 if(!id(v.id)||!object(v.envelope)||!object(v.plate)||!positive(v.envelope.widthMm)||!positive(v.envelope.heightMm)||!positive(v.plate.widthMm)||!positive(v.plate.heightMm)||!finite(v.plate.xMm)||!finite(v.plate.yMm)||!finite(v.reserveMm)||v.reserveMm<0)return bad('geometry','Envolvente, placa o reserva inválidas: usa medidas finitas y positivas.');
 if(!Array.isArray(v.models)||v.models.length===0||v.models.length>150||!v.models.every(m=>object(m)&&id(m.id)&&kinds.includes(m.kind as never)&&typeof m.name==='string'&&m.name.length<=150&&typeof m.ref==='string'&&m.ref.length<=40&&positive(m.widthMm)&&positive(m.heightMm)&&positive(m.depthMm)&&m.didactic===true)||new Set(v.models.map(m=>m.id)).size!==v.models.length)return bad('references','Catálogo didáctico o IDs de modelo inválidos.');
 if(!Array.isArray(v.items)||v.items.length>150||!v.items.every(i=>object(i)&&id(i.id)&&id(i.modelId)&&finite(i.xMm)&&finite(i.yMm)&&(i.railId===undefined||id(i.railId))&&(i.lengthMm===undefined||positive(i.lengthMm)))||new Set(v.items.map(i=>i.id)).size!==v.items.length)return bad('geometry','Posiciones, dimensiones o IDs de elementos inválidos (máximo 150).');
 const p=structuredClone(v) as unknown as PhysicalProject;
 for(const i of p.items){
 const m=p.models.find(m=>m.id===i.modelId);
 if(!m||i.lengthMm!==undefined&&m.kind!=='rail'||i.railId!==undefined&&!p.items.some(r=>r.id===i.railId&&p.models.some(m=>m.id===r.modelId&&m.kind==='rail')))return bad('references','Referencia de modelo o carril inexistente o incompatible.');
 }
 const errors=validatePlacement(p);
 if(errors.length)return bad('geometry',errors[0]);
 if(new TextEncoder().encode(JSON.stringify(p)).length>100000)return bad('format','El proyecto supera el tamaño máximo de 100 KB.');
 return {ok:true,project:p};
}
export function parseProject(text:string):Parsed{
 if(new TextEncoder().encode(text).length>100000)return bad('format','Archivo demasiado grande (máximo 100 KB).');
 try{return validateProject(JSON.parse(text));}catch{return bad('json','No se pudo leer el JSON: archivo corrupto o incompleto.');}
}
export function serializeProject(p:Project){return JSON.stringify(p);}
export function projectMode(p:Project){return p.version===1?'illustrative' as const:'physical' as const;}
