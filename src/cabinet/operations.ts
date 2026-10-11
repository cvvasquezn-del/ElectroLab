import {modelFor,type PhysicalProject,type PhysicalItem} from './model.js';
import {checked,findRailSlot,footprint,type Result} from './geometry.js';
import {validateProject} from './serialization.js';
export function placementCommit(before:PhysicalProject,next:PhysicalProject):({ok:true;project:PhysicalProject;changed:boolean}|{ok:false;error:string}){
 if(JSON.stringify(before)===JSON.stringify(next))return {ok:true,project:before,changed:false};
 const result=validateProject(next);
 return result.ok&&result.project.version===2?{ok:true,project:result.project,changed:true}:{ok:false,error:result.ok?'Formato físico requerido.':result.error};
}
export function addDevice(p:PhysicalProject,modelId:string):Result{
 if(p.items.length>=150)return {ok:false,error:'Máximo 150 elementos por cuadro.'};
 const m=p.models.find(m=>m.id===modelId);if(!m)return {ok:false,error:'Modelo inexistente.'};
 const item:PhysicalItem={id:crypto.randomUUID(),modelId,xMm:p.plate.xMm,yMm:p.plate.yMm,...(m.kind==='rail'?{lengthMm:m.widthMm}:{})};
 if(m.kind!=='rail'&&m.kind!=='duct'){
 for(const rail of p.items.filter(i=>modelFor(p,i).kind==='rail')){
 const point=findRailSlot(p,item,rail,rail.xMm);if(point)return checked({...p,items:[...p.items,{...item,...point,railId:rail.id}]});}
 return {ok:false,error:'Añade un carril DIN con un hueco continuo disponible.'};
 }
 const width=item.lengthMm??m.widthMm,height=m.heightMm;
 const obstacles=p.items.map(i=>footprint(p,i));
 const xs=[p.plate.xMm,p.plate.xMm+p.plate.widthMm-width,...obstacles.flatMap(r=>[r.xMm+r.widthMm,r.xMm-width])];
 const ys=[p.plate.yMm+75,p.plate.yMm,p.plate.yMm+p.plate.heightMm-height,...obstacles.flatMap(r=>[r.yMm+r.heightMm,r.yMm-height])];
 for(const y of [...new Set(ys)])for(const x of [...new Set(xs)]){
 const result=checked({...p,items:[...p.items,{...item,xMm:x,yMm:y}]});if(result.ok)return result;
 }
 return {ok:false,error:'No hay espacio libre en la placa para este elemento.'};
}
export function duplicateDevice(p:PhysicalProject,id:string):Result{
 if(p.items.length>=150)return {ok:false,error:'Máximo 150 elementos por cuadro.'};
 const item=p.items.find(i=>i.id===id),rail=item&&p.items.find(r=>r.id===item.railId);
 if(!item||!rail)return {ok:false,error:'Selecciona un aparato montado en carril para duplicarlo.'};
 const copy={...item,id:crypto.randomUUID()},point=findRailSlot(p,copy,rail,item.xMm+footprint(p,item).widthMm+p.reserveMm);
 return point?checked({...p,items:[...p.items,{...copy,...point}]}):{ok:false,error:'No cabe otra unidad en este carril.'};
}
export function organizeRail(p:PhysicalProject,id:string):Result{
 const rail=p.items.find(i=>i.id===id);if(!rail||modelFor(p,rail).kind!=='rail')return {ok:false,error:'Selecciona un carril.'};
 const members=p.items.filter(i=>i.railId===id).sort((a,b)=>a.xMm-b.xMm);
 let x=rail.xMm;const moved=new Map<string,PhysicalItem>();
 for(const i of members){moved.set(i.id,{...i,xMm:x});x+=footprint(p,i).widthMm+p.reserveMm;}
 return checked({...p,items:p.items.map(i=>moved.get(i.id)??i)});
}
