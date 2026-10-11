import {useEffect,useMemo,useRef,useState} from 'react';
import {createPhysicalProject,modelFor,type PhysicalProject,type PointMm} from './cabinet/model.js';
import {checked,footprint,findRailSlot,removeItem,type Result} from './cabinet/geometry.js';
import {addDevice,duplicateDevice,organizeRail,placementCommit} from './cabinet/operations.js';
import {validateProject} from './cabinet/serialization.js';

import {useConnectedProject} from './cabinet/ProjectProvider';
import {geometrySnapshot,type ConnectedProject} from './cabinet/project.js';
import {mergeGeometry} from './cabinet/connections.js';
import {physicalCsv,type PhysicalView} from './cabinet/exports.js';
import PhysicalCanvas from './cabinet/PhysicalCanvas';
import PhysicalInspector from './cabinet/PhysicalInspector';
import ConnectionPanel from './cabinet/ConnectionPanel';
import TerminalLayer from './cabinet/TerminalLayer';
import {useWiring} from './cabinet/useWiring';
import {connectedPhysicalSvg,connectionsCsv} from './cabinet/connectionExports.js';
function download(content:string,name:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export default function PhysicalCabinet({onRequestImport,active}:{onRequestImport:()=>void;active:boolean}){
 const shared=useConnectedProject(),p=useMemo(()=>geometrySnapshot(shared.project),[shared.project]);
 const history={...shared,present:p,setPresent:(next:PhysicalProject)=>shared.apply(mergeGeometry(shared.project,next)),preview:(next:PhysicalProject)=>shared.preview({...shared.project,...next,version:3,models:shared.project.models,items:next.items.map(i=>({...i,reference:shared.project.items.find(a=>a.id===i.id)!.reference}))} as ConnectedProject)};
 const [selected,setSelected]=useState<string|null>(null),[view,setView]=useState<PhysicalView>('illustrated'),[zoom,setZoom]=useState(1);
 const [pendingRemoval,setPendingRemoval]=useState<string|null>(null);
 const [tool,setTool]=useState<'move'|'wire'>('move');const wiring=useWiring(active&&tool==='wire');
 const {notice,saved,storageError,setNotice}=shared;
 const dragBase=useRef<PhysicalProject|null>(null),preview=useRef(p);
 useEffect(()=>()=>{shared.cancelDrag();},[]);
 useEffect(()=>{if(!active){shared.cancelDrag();dragBase.current=null;}},[active]); function apply(result:Result){if(history.isDragging)return;if(!result.ok){setNotice(result.error);return;}const validated=validateProject(result.project);if(!validated.ok){setNotice(validated.error);return;}if(history.setPresent(result.project))preview.current=result.project;}
 function applyProject(project:PhysicalProject){const result=validateProject(project);if(!result.ok){setNotice(result.error);return;}if(result.project.version===2)apply({ok:true,project:result.project});}
 function removeId(id:string){const result=removeItem(p,id);if(!result.ok){setNotice(result.error);return;}if(shared.apply(mergeGeometry(shared.project,result.project))){setSelected(null);setPendingRemoval(null);}}
 function remove(){if(!selected)return;const wires=shared.project.conductors.filter(c=>c.from.itemId===selected||c.to.itemId===selected).length;if(wires){setPendingRemoval(selected);return;}removeId(selected);}
 useEffect(()=>{
 if(!active||history.isDragging)return;
 function key(e:KeyboardEvent){if((e.target as HTMLElement)?.closest('input,textarea,select,[contenteditable=true]'))return;
 if(e.key==='Escape'){setSelected(null);return;}
 if((e.ctrlKey||e.metaKey)&&!e.altKey){if(e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?history.redo():history.undo();}if(e.key.toLowerCase()==='y'){e.preventDefault();history.redo();}}
 else if((e.key==='Delete'||e.key==='Backspace')&&!(e.target as HTMLElement)?.closest('button,a,[role=button]')){if(selected){e.preventDefault();remove();}}
 }window.addEventListener('keydown',key);return ()=>window.removeEventListener('keydown',key);
 });
 function begin(){dragBase.current=p;preview.current=p;history.beginDrag();}
 function cancel(){dragBase.current=null;history.cancelDrag();setNotice('Movimiento cancelado.');}
 function move(id:string,point:PointMm){
 const base=dragBase.current;if(!base)return;
 const item=base.items.find(i=>i.id===id)!;const dx=point.xMm-item.xMm,dy=point.yMm-item.yMm;
 const value={...base,items:base.items.map(i=>i.id===id?{...i,...point,railId:undefined}:i.railId===id?{...i,xMm:i.xMm+dx,yMm:i.yMm+dy}:i)};
 preview.current=value;history.preview(value);
 }
 function finish(){
 if(!dragBase.current)return;let next=preview.current;
 const moved=next.items.find(i=>{const old=dragBase.current!.items.find(a=>a.id===i.id)!;return old.xMm!==i.xMm||old.yMm!==i.yMm});
 if(moved&&modelFor(next,moved).kind!=='rail'&&modelFor(next,moved).kind!=='duct'){
 const r=footprint(next,moved);const near=next.items.filter(i=>modelFor(next,i).kind==='rail').map(i=>({i,d:Math.abs(i.yMm+footprint(next,i).heightMm/2-r.yMm-r.heightMm/2)})).filter(a=>a.d<=20).sort((a,b)=>a.d-b.d)[0];
 if(near){const slot=findRailSlot(next,moved,near.i,moved.xMm);if(!slot){history.cancelDrag();dragBase.current=null;setNotice('No hay un hueco continuo disponible en ese carril.');return;}next={...next,items:next.items.map(i=>i.id===moved.id?{...i,...slot,railId:near.i.id}:i)};}
 }
 const result=placementCommit(dragBase.current,next);
 if(!result.ok){history.cancelDrag();setNotice(result.error);}
 else if(!result.changed){history.cancelDrag();}
 else{history.preview(result.project);history.finishDrag();setNotice('Posición actualizada.');}
 dragBase.current=null;
 }
 const groups=[{label:'Estructura',kinds:['rail','duct']},{label:'Protección',kinds:['breaker','rcd']},{label:'Maniobra',kinds:['contactor','overload']},{label:'Conexión',kinds:['terminal']}];
 return <section className="cabinet"><div className="cabinet-head"><div><span className="eyebrow">Diseña y organiza</span><h2>Tu cuadro a escala</h2><p>Organiza equipos con posiciones y dimensiones coherentes en milímetros.</p></div><div className="control-group" role="group" aria-label="Representación a escala"><button className={view==='illustrated'?'':'secondary'} aria-pressed={view==='illustrated'} onClick={()=>setView('illustrated')}>Ilustrada</button><button className={view==='technical'?'':'secondary'} aria-pressed={view==='technical'} onClick={()=>setView('technical')}>Técnica</button></div></div>
 <div className="cabinet-project-actions" aria-label="Archivos y materiales"><span className="project-actions-label">Archivos y materiales</span><div className="cabinet-file-actions"><button className="secondary" onClick={()=>download(JSON.stringify(shared.project),'elecwizard-cuadro-mm.json','application/json')}>↓ Exportar cuadro</button><button className="secondary" onClick={()=>download(physicalCsv(p),'elecwizard-materiales-mm.csv','text/csv;charset=utf-8')}>↓ Lista de materiales (CSV)</button><button className="secondary" onClick={()=>download(connectionsCsv(shared.project),"elecwizard-conexiones.csv","text/csv;charset=utf-8")}>↓ Lista de conexiones (CSV)</button><button className="secondary" onClick={onRequestImport}>↑ Importar cuadro</button></div><div className="project-reset"><button className="secondary" disabled={history.isDragging} onClick={()=>{if(window.confirm('¿Restablecer el ejemplo a escala?')){apply({ok:true,project:createPhysicalProject()});setSelected(null);}}}>Restablecer ejemplo</button></div>{notice&&<p className="hint" role="status">{notice}</p>}{storageError&&<p className="hint" role="status">{storageError}</p>}</div>
 <div className="cabinet-layout physical-layout"><aside className="cabinet-sidebar" inert={history.isDragging}><span className="panel-kicker">01 / Componentes</span><h3>Biblioteca</h3><p className="hint">Instala un carril DIN y añade los equipos. Medidas didácticas, sin fabricante.</p>{groups.map(g=><div className="library-group" key={g.label}><h4>{g.label}</h4>{p.models.filter(m=>g.kinds.includes(m.kind)).map(m=><button key={m.id} className="cabinet-add" onClick={()=>{const result=addDevice(p,m.id);apply(result);if(result.ok)setSelected(result.project.items.at(-1)!.id);}}><span className="component-ref">{m.ref}</span><span>{m.name}<small className="physical-dimension">{m.widthMm} × {m.heightMm} mm</small></span><span className="add-sign">＋</span></button>)}</div>)}</aside>
 <div className="cabinet-workspace"><div className="workspace-heading"><div><span className="panel-kicker">02 / Distribución</span><h3>Área de montaje</h3></div><span className="autosave-label">{saved?'Guardado local automático':'Guardado no disponible'}</span></div><div className="cabinet-toolbar"><span>{p.envelope.widthMm} × {p.envelope.heightMm} mm · placa {p.plate.widthMm} × {p.plate.heightMm} mm</span><div className="actions"><button className="secondary" disabled={!history.canUndo} onClick={history.undo}>↶ Deshacer</button><button className="secondary" disabled={!history.canRedo} onClick={history.redo}>↷ Rehacer</button><button className="secondary" onClick={()=>download(connectedPhysicalSvg(shared.project,view),'elecwizard-cuadro-mm.svg','image/svg+xml;charset=utf-8')}>Exportar SVG</button><button className="secondary" aria-label="Reducir zoom" disabled={history.isDragging} onClick={()=>setZoom(v=>Math.max(.7,+(v-.1).toFixed(1)))}>−</button><span>{Math.round(zoom*100)}%</span><button className="secondary" aria-label="Ampliar zoom" disabled={history.isDragging} onClick={()=>setZoom(v=>Math.min(1.5,+(v+.1).toFixed(1)))}>＋</button></div></div>
 <div className="wiring-toolbar"><div className="control-group"><button className={tool==='move'?'':'secondary'} aria-pressed={tool==='move'} disabled={history.isDragging} onClick={()=>{setTool('move');wiring.cancel();}}>Distribuir</button><button className={tool==='wire'?'':'secondary'} aria-pressed={tool==='wire'} disabled={history.isDragging} onClick={()=>setTool('wire')}>Cablear</button></div><p className="hint">{tool==='wire'?(wiring.pending?'Origen: '+shared.project.items.find(i=>i.id===wiring.pending?.itemId)?.reference+' / '+wiring.pending.terminalId+'. Elige el destino.':'Elige el borne de origen.'):shared.project.conductors.length+' conductores en el proyecto.'}</p>{wiring.pending&&<button className="secondary" onClick={wiring.cancel}>Cancelar conexión</button>}</div>
 <PhysicalCanvas allowDrag={tool==='move'} project={p} selectedId={selected} view={view} zoom={zoom} onSelect={setSelected} onBeginDrag={begin} onPreviewMove={move} onFinishDrag={finish} onCancelDrag={cancel}><TerminalLayer project={shared.project} view="physical" interactive={tool==="wire"} pending={wiring.pending} selectedConductorId={wiring.selectedConductorId} onTerminal={wiring.onTerminal} onConductor={wiring.onConductor}/></PhysicalCanvas>
 <p className="hint">Escala uniforme en ambos ejes. Arrastra para colocar o usa las propiedades para introducir medidas exactas. Las vistas comparten la misma geometría.</p></div>
 <div className="physical-properties-wrap" inert={history.isDragging}>{pendingRemoval&&shared.project.items.some(i=>i.id===pendingRemoval)&&<section className="removal-confirm" role="alert"><h3>Eliminar equipo conectado</h3><p>Se eliminarán {shared.project.items.find(i=>i.id===pendingRemoval)!.reference} y sus {shared.project.conductors.filter(c=>c.from.itemId===pendingRemoval||c.to.itemId===pendingRemoval).length} conductores. Puedes recuperarlos con Deshacer.</p><div className="actions"><button onClick={()=>removeId(pendingRemoval)}>Eliminar equipo y conductores</button><button className="secondary" onClick={()=>setPendingRemoval(null)}>Cancelar eliminación</button></div></section>}{tool==='move'?<PhysicalInspector project={p} selectedId={selected} onApplyProject={applyProject} onDuplicate={()=>selected&&apply(duplicateDevice(p,selected))} onRemove={remove} onOrganize={()=>selected&&apply(organizeRail(p,selected))}/>:<aside className="cabinet-properties"><h3>Cableado del cuadro</h3><p className="hint">Elige dos bornes o usa los selectores. Para cambiar posiciones y medidas, vuelve a Distribuir.</p></aside>}<ConnectionPanel project={shared.project} selectedItemId={selected} selectedConductorId={wiring.selectedConductorId} onSelectConductor={wiring.onConductor} onApply={shared.apply}/></div></div></section>;
}
