import {useEffect,useRef,useState} from 'react';
import {createPhysicalProject,modelFor,type PhysicalProject,type PointMm} from './cabinet/model.js';
import {checked,footprint,findRailSlot,removeItem,type Result} from './cabinet/geometry.js';
import {addDevice,duplicateDevice,organizeRail,placementCommit} from './cabinet/operations.js';
import {parseProject,serializeProject,validateProject} from './cabinet/serialization.js';
import {browserStorage,recoverPhysical,savePhysical} from './cabinet/storage.js';
import {useProjectHistory} from './cabinet/useProjectHistory';
import {physicalSvg,physicalCsv,type PhysicalView} from './cabinet/exports.js';
import PhysicalCanvas from './cabinet/PhysicalCanvas';
import PhysicalInspector from './cabinet/PhysicalInspector';
function restore(){
 const access=browserStorage();return access.ok?recoverPhysical(access.storage):{project:createPhysicalProject(),warning:access.error,protected:true};
}
function download(content:string,name:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export default function PhysicalCabinet({importedProject,onRequestImport,active}:{importedProject?:{project:PhysicalProject;revision:number};onRequestImport:()=>void;active:boolean}){
 const [initial]=useState(restore),history=useProjectHistory(()=>initial.project),p=history.present;
 const [selected,setSelected]=useState<string|null>(null),[view,setView]=useState<PhysicalView>('illustrated'),[zoom,setZoom]=useState(1),[notice,setNotice]=useState(initial.warning),[saved,setSaved]=useState(false),[storageError,setStorageError]=useState(''),[protectedRecovery,setProtectedRecovery]=useState(initial.protected);
 const dragBase=useRef<PhysicalProject|null>(null),preview=useRef(p);
 useEffect(()=>{if(importedProject){history.reset(importedProject.project);preview.current=importedProject.project;setSelected(null);setProtectedRecovery(false);setNotice('Cuadro a escala importado.');}},[importedProject]);
 useEffect(()=>{
 if(history.isDragging)return;
 const access=browserStorage(),result=access.ok?savePhysical(access.storage,p,protectedRecovery):access;
 setSaved(result.ok);setStorageError(result.ok?'':result.error);
 },[p,history.isDragging,protectedRecovery]);
 function apply(result:Result){if(history.isDragging)return;if(!result.ok){setNotice(result.error);return;}const validated=validateProject(result.project);if(!validated.ok){setNotice(validated.error);return;}history.setPresent(result.project);preview.current=result.project;setProtectedRecovery(false);setNotice('Cambios aplicados.');}
 function applyProject(project:PhysicalProject){const result=validateProject(project);if(!result.ok){setNotice(result.error);return;}if(result.project.version===2)apply({ok:true,project:result.project});}
 function remove(){if(!selected)return;const result=removeItem(p,selected);apply(result);if(result.ok)setSelected(null);}
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
 else{history.preview(result.project);history.finishDrag();setProtectedRecovery(false);setNotice('Posición actualizada.');}
 dragBase.current=null;
 }
 const groups=[{label:'Estructura',kinds:['rail','duct']},{label:'Protección',kinds:['breaker','rcd']},{label:'Maniobra',kinds:['contactor','overload']},{label:'Conexión',kinds:['terminal']}];
 return <section className="cabinet"><div className="cabinet-head"><div><span className="eyebrow">Diseña y organiza</span><h2>Tu cuadro a escala</h2><p>Organiza equipos con posiciones y dimensiones coherentes en milímetros.</p></div><div className="control-group" role="group" aria-label="Representación a escala"><button className={view==='illustrated'?'':'secondary'} aria-pressed={view==='illustrated'} onClick={()=>setView('illustrated')}>Ilustrada</button><button className={view==='technical'?'':'secondary'} aria-pressed={view==='technical'} onClick={()=>setView('technical')}>Técnica</button></div></div>
 <div className="cabinet-project-actions" aria-label="Archivos y materiales"><span className="project-actions-label">Archivos y materiales</span><div className="cabinet-file-actions"><button className="secondary" onClick={()=>download(serializeProject(p),'elecwizard-cuadro-mm.json','application/json')}>↓ Exportar cuadro</button><button className="secondary" onClick={()=>download(physicalCsv(p),'elecwizard-materiales-mm.csv','text/csv;charset=utf-8')}>↓ Lista de materiales (CSV)</button><button className="secondary" onClick={onRequestImport}>↑ Importar cuadro</button></div><div className="project-reset"><button className="secondary" disabled={history.isDragging} onClick={()=>{if(window.confirm('¿Restablecer el ejemplo a escala?')){apply({ok:true,project:createPhysicalProject()});setSelected(null);}}}>Restablecer ejemplo</button></div>{notice&&<p className="hint" role="status">{notice}</p>}{storageError&&<p className="hint" role="status">{storageError}</p>}</div>
 <div className="cabinet-layout physical-layout"><aside className="cabinet-sidebar" inert={history.isDragging}><span className="panel-kicker">01 / Componentes</span><h3>Biblioteca</h3><p className="hint">Instala un carril DIN y añade los equipos. Medidas didácticas, sin fabricante.</p>{groups.map(g=><div className="library-group" key={g.label}><h4>{g.label}</h4>{p.models.filter(m=>g.kinds.includes(m.kind)).map(m=><button key={m.id} className="cabinet-add" onClick={()=>{const result=addDevice(p,m.id);apply(result);if(result.ok)setSelected(result.project.items.at(-1)!.id);}}><span className="component-ref">{m.ref}</span><span>{m.name}<small className="physical-dimension">{m.widthMm} × {m.heightMm} mm</small></span><span className="add-sign">＋</span></button>)}</div>)}</aside>
 <div className="cabinet-workspace"><div className="workspace-heading"><div><span className="panel-kicker">02 / Distribución</span><h3>Área de montaje</h3></div><span className="autosave-label">{saved?'Guardado local automático':'Guardado no disponible'}</span></div><div className="cabinet-toolbar"><span>{p.envelope.widthMm} × {p.envelope.heightMm} mm · placa {p.plate.widthMm} × {p.plate.heightMm} mm</span><div className="actions"><button className="secondary" disabled={!history.canUndo} onClick={history.undo}>↶ Deshacer</button><button className="secondary" disabled={!history.canRedo} onClick={history.redo}>↷ Rehacer</button><button className="secondary" onClick={()=>download(physicalSvg(p,view),'elecwizard-cuadro-mm.svg','image/svg+xml;charset=utf-8')}>Exportar SVG</button><button className="secondary" aria-label="Reducir zoom" disabled={history.isDragging} onClick={()=>setZoom(v=>Math.max(.7,+(v-.1).toFixed(1)))}>−</button><span>{Math.round(zoom*100)}%</span><button className="secondary" aria-label="Ampliar zoom" disabled={history.isDragging} onClick={()=>setZoom(v=>Math.min(1.5,+(v+.1).toFixed(1)))}>＋</button></div></div>
 <PhysicalCanvas project={p} selectedId={selected} view={view} zoom={zoom} onSelect={setSelected} onBeginDrag={begin} onPreviewMove={move} onFinishDrag={finish} onCancelDrag={cancel}/>
 <p className="hint">Escala uniforme en ambos ejes. Arrastra para colocar o usa las propiedades para introducir medidas exactas. Las vistas comparten la misma geometría.</p></div>
 <div className="physical-properties-wrap" inert={history.isDragging}><PhysicalInspector project={p} selectedId={selected} onApplyProject={applyProject} onDuplicate={()=>selected&&apply(duplicateDevice(p,selected))} onRemove={remove} onOrganize={()=>selected&&apply(organizeRail(p,selected))}/></div></div></section>;
}
