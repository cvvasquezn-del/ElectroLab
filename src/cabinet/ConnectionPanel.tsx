import {addConductor,editConductor,removeConductor} from './connections.js';
import {isElectrical,wireColors,type ConnectedProject,type Endpoint,type ProjectResult} from './project.js';
type Props={project:ConnectedProject;selectedItemId:string|null;selectedConductorId:string|null;onSelectConductor:(id:string)=>void;onApply:(r:ProjectResult)=>boolean};
export default function ConnectionPanel({project:p,selectedItemId,selectedConductorId,onSelectConductor,onApply}:Props){
 const electrical=p.items.filter(i=>isElectrical(p.models.find(m=>m.id===i.modelId)!.kind)),selected=p.conductors.find(c=>c.id===selectedConductorId);
 const related=selectedItemId?p.conductors.filter(c=>c.from.itemId===selectedItemId||c.to.itemId===selectedItemId):p.conductors;
 const endLabel=(e:Endpoint)=>p.items.find(i=>i.id===e.itemId)!.reference+' / '+e.terminalId;
 function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const d=new FormData(e.currentTarget);const from=JSON.parse(String(d.get('from'))) as Endpoint,to=JSON.parse(String(d.get('to'))) as Endpoint;const r=addConductor(p,from,to);if(onApply(r)&&r.ok)onSelectConductor(r.project.conductors.at(-1)!.id);}
 return <section className="connection-panel" aria-label="Conexiones"><h3>Conexiones <span className="connection-count">{p.conductors.length}</span></h3><p className="hint">Bornes didácticos. Crea un enlace con los selectores o elige dos bornes en Cablear.</p>
 {electrical.length?<form className="connection-form" onSubmit={submit}>
 {(['from','to'] as const).map((name,n)=><label key={name}>{n?'Borne de destino':'Borne de origen'}<select name={name} aria-label={n?'Borne de destino':'Borne de origen'} defaultValue={JSON.stringify({itemId:electrical[Math.min(n,electrical.length-1)].id,terminalId:n?'T2':'T1'})}>
 {electrical.map(i=><optgroup key={i.id} label={i.reference+' · '+p.models.find(m=>m.id===i.modelId)!.name}>{p.models.find(m=>m.id===i.modelId)!.terminals.map(t=><option key={t.id} value={JSON.stringify({itemId:i.id,terminalId:t.id})}>{i.reference} / {t.name}</option>)}</optgroup>)}</select></label>)}
 <button type="submit">Crear conductor</button></form>:<p className="hint">Añade equipos al cuadro a escala para conectar sus bornes.</p>}
 {selectedItemId&&<p className="hint">Conexiones del equipo seleccionado</p>}
 <div className="connection-list">{related.length?related.map(c=><button type="button" className={'connection-row '+(selected?.id===c.id?'is-selected':'')} key={c.id} onClick={()=>onSelectConductor(c.id)}><span className="wire-swatch" style={{background:c.color}}/><strong>{c.reference}</strong><span>{endLabel(c.from)} → {endLabel(c.to)}</span></button>):<p className="hint">Sin conexiones {selectedItemId?'en este equipo':'todavía'}.</p>}</div>
 {selectedItemId&&related.length!==p.conductors.length&&<details><summary>Todos los conductores ({p.conductors.length})</summary>{p.conductors.map(c=><button type="button" key={c.id} className="connection-row" onClick={()=>onSelectConductor(c.id)}>{c.reference} · {endLabel(c.from)} → {endLabel(c.to)}</button>)}</details>}
 {selected&&<form key={JSON.stringify(selected)} className="connection-form conductor-edit" onSubmit={e=>{e.preventDefault();const d=new FormData(e.currentTarget),raw=String(d.get('section')).trim();onApply(editConductor(p,selected.id,{reference:String(d.get('reference')).trim(),color:String(d.get('color')),...(raw?{sectionMm2:Number(raw)}:{})}));}}>
 <h4>Conductor {selected.reference}</h4><p className="hint">{endLabel(selected.from)} → {endLabel(selected.to)}</p><label>Referencia<input name="reference" required maxLength={40} defaultValue={selected.reference}/></label>
 <label>Color<select name="color" defaultValue={selected.color}>{wireColors.map((c,n)=><option key={c} value={c}>{['Azul','Cian','Rojo','Gris','Menta'][n]}</option>)}</select></label>
 <label>Sección indicada (mm²)<input name="section" type="number" step="any" defaultValue={selected.sectionMm2??''} placeholder="Opcional"/></label>
 <button type="submit">Aplicar conductor</button><button type="button" className="secondary" onClick={()=>onApply(removeConductor(p,selected.id))}>Eliminar conductor</button></form>}
 </section>;
}
