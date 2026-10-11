import {useEffect,useMemo,useRef,useState} from 'react';
import {conductorRoute} from './cabinet/terminalGeometry.js';
import {useConnectedProject} from './cabinet/ProjectProvider';
import {useWiring} from './cabinet/useWiring';
import type {ConnectedProject} from './cabinet/project.js';
import {moveSchematic} from './cabinet/connections.js';
import ConnectionPanel from './cabinet/ConnectionPanel';
import SchematicCanvas from './cabinet/SchematicCanvas';
import {schematicSvg,connectionsCsv} from './cabinet/connectionExports.js';
function download(content:string,name:string,type:string){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export default function ProjectSchematic(){
 const shared=useConnectedProject(),p=shared.project,[selected,setSelected]=useState<string|null>(null),[tool,setTool]=useState<'move'|'wire'>('move'),wiring=useWiring(tool==='wire'),base=useRef<ConnectedProject|null>(null);
 const blocked=useMemo(()=>p.conductors.filter(c=>!conductorRoute(p,c,'schematic').clear).length,[p]);
 useEffect(()=>()=>{shared.cancelDrag();},[]);
 useEffect(()=>{function key(e:KeyboardEvent){if((e.target as HTMLElement)?.closest('input,textarea,select,[contenteditable=true]'))return;if((e.ctrlKey||e.metaKey)&&!e.altKey){if(e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?shared.redo():shared.undo();}if(e.key.toLowerCase()==='y'){e.preventDefault();shared.redo();}}}window.addEventListener('keydown',key);return ()=>window.removeEventListener('keydown',key);});
 return <section className="shared-schematic"><div className="cabinet-project-actions"><span className="project-actions-label">Proyecto compartido</span><div className="cabinet-file-actions"><button className="secondary" onClick={()=>download(JSON.stringify(p),'elecwizard-proyecto.json','application/json')}>Exportar proyecto</button><button className="secondary" onClick={()=>download(schematicSvg(p),'elecwizard-esquema.svg','image/svg+xml')}>Exportar esquema (SVG)</button><button className="secondary" onClick={()=>download(connectionsCsv(p),'elecwizard-conexiones.csv','text/csv;charset=utf-8')}>Lista de conexiones (CSV)</button></div></div>
 <div className="schematic-layout"><div className="cabinet-workspace"><div className="workspace-heading"><h3>Esquema del cuadro</h3><span className="autosave-label">{shared.saved?'Guardado local automático':'Guardado no disponible'}</span></div>
 <div className="wiring-toolbar"><div className="control-group"><button disabled={shared.isDragging} className={tool==='move'?'':'secondary'} aria-pressed={tool==='move'} onClick={()=>{setTool('move');wiring.cancel();}}>Distribuir</button><button disabled={shared.isDragging} className={tool==='wire'?'':'secondary'} aria-pressed={tool==='wire'} onClick={()=>setTool('wire')}>Cablear</button></div><div className="actions"><button className="secondary" disabled={!shared.canUndo} onClick={shared.undo}>↶ Deshacer</button><button className="secondary" disabled={!shared.canRedo} onClick={shared.redo}>↷ Rehacer</button></div></div>
 <p className="hint">{wiring.pending?'Origen: '+p.items.find(i=>i.id===wiring.pending?.itemId)?.reference+' / '+wiring.pending.terminalId+'. Elige el destino.':tool==='wire'?'Elige el borne de origen.':'Arrastra los bloques para ordenar el esquema.'}</p>{wiring.pending&&<button className="secondary" onClick={wiring.cancel}>Cancelar conexión</button>}
 <SchematicCanvas project={p} selectedItemId={selected} onSelect={setSelected} tool={tool} wiring={wiring} onBeginDrag={()=>{base.current=p;shared.beginDrag();}} onPreviewMove={(id,x,y)=>{if(!base.current)return;const next=moveSchematic(base.current,id,x,y);if(next.ok)shared.preview(next.project);}} onFinishDrag={()=>{shared.finishDrag();base.current=null;}} onCancelDrag={()=>{shared.cancelDrag();base.current=null;}}/>
 {blocked>0&&<p role="status" className="hint">{blocked} conductores sin recorrido visible. Separa los bloques o consulta sus extremos en la lista de conexiones.</p>}
 <p className="hint">{p.schematic.length} equipos · {p.conductors.length} conductores. Los equipos y enlaces son los mismos que en el cuadro a escala; cada vista conserva sus posiciones.</p><p className="hint">Bloques y bornes didácticos. Esta vista registra conexiones, sin simular ni comprobar su funcionamiento eléctrico.</p>
 {shared.notice&&<p role="status" className="hint">{shared.notice}</p>}{shared.storageError&&<p role="status" className="hint">{shared.storageError}</p>}</div>
 <aside className="schematic-inspector" inert={shared.isDragging}><ConnectionPanel project={p} selectedItemId={selected} selectedConductorId={wiring.selectedConductorId} onSelectConductor={wiring.onConductor} onApply={shared.apply}/></aside></div></section>;
}
