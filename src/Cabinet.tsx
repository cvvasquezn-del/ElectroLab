import {useRef,useState} from 'react';
import LegacyCabinet from './LegacyCabinet';
import PhysicalCabinet from './PhysicalCabinet';
import CabinetModeSwitch,{type CabinetMode} from './cabinet/CabinetModeSwitch';
import {readProject} from './cabinet/projectValidation.js';
import {useConnectedProject} from './cabinet/ProjectProvider';
import type {LegacyProject} from './cabinet/legacy.js';

export default function Cabinet(){
 const shared=useConnectedProject();
 const input=useRef<HTMLInputElement>(null),[notice,setNotice]=useState(''),[mode,setMode]=useState<CabinetMode>('illustrative');
 const [legacy,setLegacy]=useState<{project:LegacyProject;revision:number}>();
 const revision=useRef(0);
 async function load(file?:File){if(!file)return;try{
 if(file.size>100000){setNotice('Archivo demasiado grande (máximo 100 KB).');return;}
 const result=readProject(await file.text());if(!result.ok){setNotice(result.error);return;}
 const imported={project:result.project,revision:++revision.current};
 if(imported.project.version===1)setLegacy({project:imported.project,revision:imported.revision});else if(!shared.importProject(imported.project))return;
 setMode(result.project.version===1?'illustrative':'physical');setNotice('');
 }catch{setNotice('No se pudo leer el archivo.');}}
 return <><div className="cabinet-format-bar"><CabinetModeSwitch mode={mode} onChange={setMode}/><p className="hint">{mode==='physical'?'Nuevo formato en milímetros · medidas didácticas':'Tus cuadros actuales · coordenadas ilustrativas'}</p></div><input ref={input} type="file" accept=".json,application/json" style={{display:"none"}} onChange={e=>{void load(e.target.files?.[0]);e.target.value='';}}/>{notice&&<p className="import-notice" role="status">{notice}</p>}
 <div hidden={mode!=='illustrative'}><LegacyCabinet importedProject={legacy} active={mode==='illustrative'} onRequestImport={()=>input.current?.click()}/></div>
 <div hidden={mode!=='physical'}><PhysicalCabinet active={mode==='physical'} onRequestImport={()=>input.current?.click()}/></div></>;
}
