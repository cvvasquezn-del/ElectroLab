import {modelFor,referenceFor,type PhysicalProject,type PhysicalItem,type RectMm,type PointMm} from './model.js';
// Floating-point arithmetic tolerance in mm; far below any displayed measure.
const EPS=1e-9;
export type Result={ok:true;project:PhysicalProject}|{ok:false;error:string};
export function footprint(p:PhysicalProject,i:PhysicalItem):RectMm{
 const m=modelFor(p,i);return {...i,widthMm:m.kind==='rail'?(i.lengthMm??m.widthMm):m.widthMm,heightMm:m.heightMm};
}
export function contains(a:RectMm,b:RectMm){return b.xMm>=a.xMm-EPS && b.yMm>=a.yMm-EPS && b.xMm+b.widthMm<=a.xMm+a.widthMm+EPS && b.yMm+b.heightMm<=a.yMm+a.heightMm+EPS;}
export function overlaps(a:RectMm,b:RectMm){return a.xMm<b.xMm+b.widthMm-EPS && a.xMm+a.widthMm>b.xMm+EPS && a.yMm<b.yMm+b.heightMm-EPS && a.yMm+a.heightMm>b.yMm+EPS;}
export function validatePlacement(p:PhysicalProject):string[]{
 const errors:string[]=[];
 if(!contains({xMm:0,yMm:0,...p.envelope},p.plate))errors.push('La placa útil debe quedar dentro de la envolvente.');
 for(const i of p.items){
 const a=footprint(p,i),m=modelFor(p,i),name=m.name+' '+referenceFor(p,i);
 if(!contains(p.plate,a))errors.push(name+': excede los límites de la placa útil.');
 if(i.railId!==undefined){
 const rail=p.items.find(r=>r.id===i.railId);
 if(!rail || modelFor(p,rail).kind!=='rail'||m.kind==='rail'||m.kind==='duct')errors.push(name+': referencia de carril inválida.');
 else {const r=footprint(p,rail);
 if(a.xMm<r.xMm-EPS||a.xMm+a.widthMm>r.xMm+r.widthMm+EPS||Math.abs(a.yMm+a.heightMm/2-r.yMm-r.heightMm/2)>1e-7)errors.push(name+': debe caber y estar centrado sobre su carril.');}
 }
 }
 for(let x=0;x<p.items.length;x++)for(let y=x+1;y<p.items.length;y++){
 const a=p.items[x],b=p.items[y];
 if(a.railId===b.id||b.railId===a.id)continue;
 const fa=footprint(p,a),fb=footprint(p,b);
 if(overlaps(fa,fb))errors.push(modelFor(p,a).name+' y '+modelFor(p,b).name+': se superponen.');
 else if(a.railId && a.railId===b.railId && Math.max(fa.xMm,fb.xMm)-Math.min(fa.xMm+fa.widthMm,fb.xMm+fb.widthMm)<p.reserveMm-1e-7)errors.push('No se respeta la reserva entre equipos del carril.');
 }
 return [...new Set(errors)];
}
export function checked(p:PhysicalProject):Result{const e=validatePlacement(p);return e.length?{ok:false,error:e[0]}:{ok:true,project:p};}
export function findRailSlot(p:PhysicalProject,item:PhysicalItem,rail:PhysicalItem,preferredX:number):PointMm|null{
 if(modelFor(p,rail).kind!=='rail')return null;
 const r=footprint(p,rail),m=modelFor(p,item);
 const occupied=p.items.filter(i=>i.id!==item.id&&i.id!==rail.id).map(i=>footprint(p,i)).filter(a=>a.yMm<r.yMm+r.heightMm/2+m.heightMm/2&&a.yMm+a.heightMm>r.yMm+r.heightMm/2-m.heightMm/2);
 const min=r.xMm,max=r.xMm+r.widthMm-m.widthMm;
 const candidates=[min,max,Math.max(min,Math.min(max,preferredX)),...occupied.flatMap(a=>[a.xMm+a.widthMm+p.reserveMm,a.xMm-m.widthMm-p.reserveMm])].filter(x=>x>=min&&x<=max).sort((a,b)=>Math.abs(a-preferredX)-Math.abs(b-preferredX)||a-b);
 for(const xMm of candidates){
 const candidate={...item,xMm,yMm:r.yMm+r.heightMm/2-m.heightMm/2,railId:rail.id};
 const test={...p,items:[...p.items.filter(i=>i.id!==item.id),candidate]};
 if(!validatePlacement(test).length)return {xMm,yMm:candidate.yMm};
 }
 return null;
}
export function resizeRail(p:PhysicalProject,id:string,lengthMm:number):Result{
 const rail=p.items.find(i=>i.id===id);
 if(!rail||modelFor(p,rail).kind!=='rail'||!Number.isFinite(lengthMm)||lengthMm<=0)return {ok:false,error:'Longitud de carril inválida.'};
 return checked({...p,items:p.items.map(i=>i.id===id?{...i,lengthMm}:i)});
}
export function resizeCabinet(p:PhysicalProject,envelope:PhysicalProject['envelope'],plate:RectMm):Result{
 if(![envelope.widthMm,envelope.heightMm,plate.widthMm,plate.heightMm].every(n=>Number.isFinite(n)&&n>0)||![plate.xMm,plate.yMm].every(Number.isFinite))return {ok:false,error:'Las medidas deben ser finitas y positivas.'};
 return checked({...p,envelope,plate});
}
export function moveItem(p:PhysicalProject,id:string,point:PointMm,railId?:string):Result{
 const target=p.items.find(i=>i.id===id);if(!target)return {ok:false,error:'Elemento inexistente.'};
 const dx=point.xMm-target.xMm,dy=point.yMm-target.yMm;
 return checked({...p,items:p.items.map(i=>i.id===id?{...i,...point,railId}:i.railId===id?{...i,xMm:i.xMm+dx,yMm:i.yMm+dy}:i)});
}
export function removeItem(p:PhysicalProject,id:string):Result{
 if(p.items.some(i=>i.railId===id))return {ok:false,error:'Retira primero los aparatos montados en este carril.'};
 return checked({...p,items:p.items.filter(i=>i.id!==id)});
}
export type Transform={scale:number;offsetX:number;offsetY:number};
export function createTransform(envelope:PhysicalProject['envelope'],viewport:{width:number;height:number},zoom:number):Transform{
 if(![envelope.widthMm,envelope.heightMm,viewport.width,viewport.height,zoom].every(n=>Number.isFinite(n)&&n>0))throw Error('Transformación inválida.');
 const scale=Math.min(viewport.width/envelope.widthMm,viewport.height/envelope.heightMm)*zoom;
 return {scale,offsetX:(viewport.width-envelope.widthMm*scale)/2,offsetY:(viewport.height-envelope.heightMm*scale)/2};
}
export function mmToSvg(p:PointMm,t:Transform):PointMm{return {xMm:p.xMm*t.scale+t.offsetX,yMm:p.yMm*t.scale+t.offsetY};}
export function svgToMm(p:PointMm,t:Transform):PointMm{return {xMm:(p.xMm-t.offsetX)/t.scale,yMm:(p.yMm-t.offsetY)/t.scale};}
