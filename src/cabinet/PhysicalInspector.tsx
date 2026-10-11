import {modelFor,referenceFor,type PhysicalProject,type PhysicalItem} from './model.js';
import {footprint,validatePlacement} from './geometry.js';
type Props={project:PhysicalProject;selectedId:string|null;onApplyProject:(p:PhysicalProject)=>void;onDuplicate:()=>void;onRemove:()=>void;onOrganize:()=>void};
function number(data:FormData,key:string){const v=data.get(key);return typeof v==='string'&&v.trim()!==''?Number(v):NaN;}
export default function PhysicalInspector({project:p,selectedId,onApplyProject,onDuplicate,onRemove,onOrganize}:Props){
 const item=p.items.find(i=>i.id===selectedId),m=item?modelFor(p,item):null,errors=validatePlacement(p);
 const label=(name:string,key:string,value:number,readOnly=false)=><label>{name} (mm)<input name={key} type="number" step="any" required defaultValue={value} readOnly={readOnly}/></label>;
 function applyItem(e:React.FormEvent<HTMLFormElement>){
 e.preventDefault();if(!item)return;const data=new FormData(e.currentTarget),x=number(data,'x'),y=number(data,'y'),railId=String(data.get('rail')??'')||undefined;
 const dx=x-item.xMm,dy=y-item.yMm;
 let next:PhysicalItem={...item,xMm:x,yMm:y,railId,...(m?.kind==='rail'?{lengthMm:number(data,'length')}:{})};
 if(railId){const rail=p.items.find(i=>i.id===railId)!;next.yMm=rail.yMm+footprint(p,rail).heightMm/2-footprint(p,item).heightMm/2;}
 onApplyProject({...p,items:p.items.map(i=>i.id===item.id?next:i.railId===item.id?{...i,xMm:i.xMm+dx,yMm:i.yMm+dy}:i)});
 }
 return <aside className="cabinet-properties physical-inspector"><span className="panel-kicker">03 / Inspección</span><h3>{m?m.name:'Propiedades del cuadro'}</h3>
 {item&&m?<form key={JSON.stringify(item)} className="physical-form" onSubmit={applyItem}>
 <p className="hint">Referencia: {referenceFor(p,item)} · {footprint(p,item).widthMm} × {m.heightMm} mm</p>
 <div className="physical-fields">{label('X','x',item.xMm)}{label('Y','y',item.yMm)}{m.kind==='rail'&&label('Longitud','length',item.lengthMm??m.widthMm)}</div>
 {m.kind!=='rail'&&m.kind!=='duct'&&<label>Montaje<select name="rail" defaultValue={item.railId??''}><option value="">Sin montar</option>{p.items.filter(i=>modelFor(p,i).kind==='rail').map((i,n)=><option key={i.id} value={i.id}>Carril {n+1}</option>)}</select></label>}
 <button type="submit">Aplicar posición</button><div className="actions"><button type="button" className="secondary" onClick={onDuplicate} disabled={!item.railId}>Duplicar</button>{m.kind==='rail'&&<button type="button" className="secondary" onClick={onOrganize}>Ordenar equipos</button>}<button type="button" className="secondary" onClick={onRemove}>Eliminar</button></div>
 </form>:<p className="hint">Selecciona un equipo para editar su posición o elige un componente en la biblioteca.</p>}
 <details className="panel-disclosure" open={!item}><summary>Medidas del cuadro</summary><form key={JSON.stringify([p.envelope,p.plate,p.reserveMm])} className="physical-form" onSubmit={e=>{
 e.preventDefault();const d=new FormData(e.currentTarget);
 onApplyProject({...p,envelope:{widthMm:number(d,'ew'),heightMm:number(d,'eh')},plate:{xMm:number(d,'px'),yMm:number(d,'py'),widthMm:number(d,'pw'),heightMm:number(d,'ph')},reserveMm:number(d,'reserve')});
 }}>
 <h4>Envolvente</h4><div className="physical-fields">{label('Ancho','ew',p.envelope.widthMm)}{label('Alto','eh',p.envelope.heightMm)}</div>
 <h4>Placa útil</h4><div className="physical-fields">{label('X','px',p.plate.xMm)}{label('Y','py',p.plate.yMm)}{label('Ancho','pw',p.plate.widthMm)}{label('Alto','ph',p.plate.heightMm)}</div>
 {label('Reserva entre equipos','reserve',p.reserveMm)}
 <p className="hint">La reserva es una preferencia de distribución. Todas las medidas son didácticas.</p><button type="submit">Aplicar medidas</button></form></details>
 <details className="panel-disclosure"><summary>Revisión del diseño · {errors.length} avisos</summary><p className="hint">{errors.length?errors.join(' '):'Elementos dentro de la placa, sin interferencias geométricas.'}</p><p className="hint">{p.items.filter(i=>{const k=modelFor(p,i).kind;return k!=='rail'&&k!=='duct'&&!i.railId}).length} aparatos sin montar. La geometría no valida conexiones ni seguridad eléctrica.</p></details>
 <details className="panel-disclosure"><summary>Ocupación de carriles</summary>{p.items.filter(i=>modelFor(p,i).kind==='rail').map((r,n)=>{const members=p.items.filter(i=>i.railId===r.id),used=members.reduce((s,i)=>s+footprint(p,i).widthMm,0);return <p className="hint" key={r.id}>Carril {n+1}: {used.toFixed(1)} / {footprint(p,r).widthMm} mm · {members.length} equipos. Reserva adicional: {Math.max(0,members.length-1)*p.reserveMm} mm.</p>})}</details>
 </aside>;
}
