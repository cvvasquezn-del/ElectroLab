import {createPhysicalProject} from './model.js';
import {migratePhysical,type ConnectedProject} from './project.js';
import {readProject,validateConnectedProject} from './projectValidation.js';
import {readStored,writeStored,type StorageLike} from './storage.js';
const key='electrolab-project-v03';
const fallback=(reason='')=>({project:migratePhysical(createPhysicalProject()),warning:reason+' No se pudo recuperar el proyecto. Se conserva el original hasta una edición o importación explícita.',protected:true});
export function recoverConnected(s:StorageLike){
 const saved=readStored(s,key);if(!saved.ok)return fallback();
 if(saved.value!==null){try{const result=validateConnectedProject(JSON.parse(saved.value));return result.ok?{project:result.project,warning:'',protected:false}:fallback(result.error);}catch{return fallback();}}
 const old=readStored(s,'electrolab-cabinet-v02');if(!old.ok)return fallback();
 if(old.value!==null){try{const v=JSON.parse(old.value);if(v.version!==2)return fallback();const result=readProject(old.value);return result.ok&&result.project.version===3?{project:result.project,warning:'Cuadro anterior recuperado en una copia compartida. El original se conserva.',protected:false}:fallback(result.ok?'':result.error);}catch{return fallback();}}
 return {project:migratePhysical(createPhysicalProject()),warning:'',protected:false};
}
export function saveConnected(s:StorageLike,p:ConnectedProject,protectedRecovery:boolean):{ok:true}|{ok:false;error:string}{
 if(protectedRecovery)return {ok:false,error:'Se conserva el original. Importa o edita para iniciar otro proyecto.'};
 const result=validateConnectedProject(p);if(!result.ok)return result;
 return writeStored(s,key,JSON.stringify(result.project));
}
