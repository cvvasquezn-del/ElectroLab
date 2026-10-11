import {modelFor,referenceFor,type PhysicalProject,type PhysicalItem,type DeviceModel,type Kind} from './model.js';
export type Terminal={id:string;name:string};
export type Endpoint={itemId:string;terminalId:string};
export type Conductor={id:string;reference:string;from:Endpoint;to:Endpoint;color:string;sectionMm2?:number};
export type SchematicPosition={itemId:string;x:number;y:number};
export type ConnectedProject=Omit<PhysicalProject,'version'|'items'|'models'> & {version:3;items:(PhysicalItem & {reference:string})[];models:(DeviceModel & {terminals:Terminal[]})[];conductors:Conductor[];schematic:SchematicPosition[]};
export type ProjectResult={ok:true;project:ConnectedProject}|{ok:false;error:string};
export const wireColors=['#165572','#009abf','#e1251b','#5b707a','#2ed9c3'];
export const isElectrical=(kind:Kind)=>kind!=='rail'&&kind!=='duct';
export function freeReference(prefix:string,used:string[]){let n=1;while(used.includes(prefix+n))n++;return prefix+n;}
export function schematicHeight(count:number,positions:{y:number}[]=[]){return Math.max(240,140*Math.ceil(count/4)+100,...positions.map(s=>s.y+80));}
export function migratePhysical(p:PhysicalProject):ConnectedProject{
 const copy=structuredClone(p);
 const items=copy.items.map((i,n)=>({...i,reference:referenceFor(p,p.items[n])}));
 const models=copy.models.map(m=>({...m,terminals:isElectrical(m.kind)?[{id:'T1',name:'T1'},{id:'T2',name:'T2'}]:[]}));
 return {...copy,version:3,items,models,conductors:[],schematic:items.filter(i=>isElectrical(modelFor(p,i).kind)).map((i,n)=>({itemId:i.id,x:100+n%4*190,y:100+Math.floor(n/4)*140}))};
}
export function geometrySnapshot(p:ConnectedProject):PhysicalProject{
 return {format:p.format,version:2,id:p.id,envelope:structuredClone(p.envelope),plate:structuredClone(p.plate),reserveMm:p.reserveMm,models:structuredClone(p.models),items:structuredClone(p.items)};
}
