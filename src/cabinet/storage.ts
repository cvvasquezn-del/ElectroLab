import {createPhysicalProject,type PhysicalProject} from './model.js';
import {parseProject,serializeProject} from './serialization.js';
export type StorageLike={getItem(key:string):string|null;setItem(key:string,value:string):void};
export const STORAGE_WARNING='No se pudo guardar en este navegador. Exporta el JSON para conservar tu trabajo.';
export function browserStorage(get:()=>StorageLike=()=>window.localStorage):{ok:true;storage:StorageLike}|{ok:false;error:string}{
 try{return {ok:true,storage:get()};}catch{return {ok:false,error:STORAGE_WARNING};}
}
export function readStored(s:StorageLike,key:string):{ok:true;value:string|null}|{ok:false;error:string}{
 try{return {ok:true,value:s.getItem(key)};}catch{return {ok:false,error:'No se pudo leer el cuadro guardado en este navegador.'};}
}
export function writeStored(s:StorageLike,key:string,value:string):{ok:true}|{ok:false;error:string}{
 try{s.setItem(key,value);return {ok:true};}catch{return {ok:false,error:STORAGE_WARNING};}
}


export function recoverPhysical(storage:StorageLike):{project:PhysicalProject;warning:string;protected:boolean}{
 const saved=readStored(storage,'electrolab-cabinet-v02');
 if(saved.ok&&saved.value===null)return {project:createPhysicalProject(),warning:'',protected:false};
 if(saved.ok&&saved.value){const parsed=parseProject(saved.value);if(parsed.ok&&parsed.project.version===2)return {project:parsed.project,warning:'',protected:false};}
 return {project:createPhysicalProject(),warning:'No se pudo recuperar el cuadro guardado. Se conserva el original hasta que importes o edites otro cuadro.',protected:true};
}
export function savePhysical(storage:StorageLike,p:PhysicalProject,protectedRecovery:boolean):{ok:true}|{ok:false;error:string}{
 if(protectedRecovery)return {ok:false,error:'El cuadro guardado original se conserva. Importa una copia o edita el ejemplo para iniciar otro cuadro.'};
 return writeStored(storage,'electrolab-cabinet-v02',serializeProject(p));
}
