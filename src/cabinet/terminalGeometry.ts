import {footprint} from './geometry.js';
import {geometrySnapshot,type ConnectedProject,type Endpoint,type Conductor} from './project.js';
export function terminalPoint(p:ConnectedProject,end:Endpoint,view:'physical'|'schematic'){
 const i=p.items.find(i=>i.id===end.itemId),m=i&&p.models.find(m=>m.id===i.modelId),n=m?.terminals.findIndex(t=>t.id===end.terminalId)??-1;
 if(!i||!m||n<0)throw Error('Equipo o borne inexistente.');
 if(view==='physical'){const r=footprint(geometrySnapshot(p),i);return {x:r.xMm+r.widthMm*(Math.floor(n/2)+1)/(Math.ceil(m.terminals.length/2)+1),y:n%2?r.yMm+r.heightMm:r.yMm};}
 const s=p.schematic.find(s=>s.itemId===i.id);if(!s)throw Error('Equipo sin posición en el esquema.');
 return {x:s.x+(n%2?45:-45),y:s.y-16+Math.floor(n/2)*14};
}
export function conductorPath(a:{x:number;y:number},b:{x:number;y:number}){
 if(a.x===b.x){const side=a.x+30;return `M${a.x} ${a.y}H${side}V${b.y}H${b.x}`;}
 const mid=(a.y+b.y)/2;return `M${a.x} ${a.y}V${mid}H${b.x}V${b.y}`;
}
type Point={x:number;y:number};
type Box={itemId:string;left:number;right:number;top:number;bottom:number};
function intersects(a:Point,b:Point,r:Box){
 if(a.x===b.x)return a.x>=r.left&&a.x<=r.right&&Math.max(a.y,b.y)>=r.top&&Math.min(a.y,b.y)<=r.bottom;
 return a.y>=r.top&&a.y<=r.bottom&&Math.max(a.x,b.x)>=r.left&&Math.min(a.x,b.x)<=r.right;
}
export function conductorRoute(p:ConnectedProject,c:Conductor,view:'physical'|'schematic'):{path:string;label:Point;clear:boolean}{
 const a=terminalPoint(p,c.from,view),b=terminalPoint(p,c.to,view);
 if(view==='physical')return {path:conductorPath(a,b),label:{x:(a.x+b.x)/2+3,y:(a.y+b.y)/2-5},clear:true};
 const boxes:Box[]=p.schematic.map(s=>({itemId:s.itemId,left:s.x-51,right:s.x+51,top:s.y-42,bottom:s.y+44}));
 function outward(e:Endpoint,q:Point){const i=p.items.find(i=>i.id===e.itemId)!,m=p.models.find(m=>m.id===i.modelId)!,n=m.terminals.findIndex(t=>t.id===e.terminalId);return {x:q.x+(n%2?12:-12),y:q.y};}
 const start=outward(c.from,a),end=outward(c.to,b);
 // A terminal exits its own block. If another block covers that exit,
 // drawing a path would communicate false connectivity; the list remains authoritative.
 if(boxes.some(r=>r.itemId!==c.from.itemId&&intersects(a,start,r)||r.itemId!==c.to.itemId&&intersects(b,end,r)))return {path:'',label:a,clear:false};
 const lane=Math.max(0,p.conductors.findIndex(w=>w.id===c.id))%3*10;
 const channels=[...new Set(boxes.flatMap(r=>[r.top-4-lane,r.bottom+4+lane]))].sort((y,z)=>(Math.abs(a.y-y)+Math.abs(b.y-y))-(Math.abs(a.y-z)+Math.abs(b.y-z)));
 for(const y of channels){
 const points=[start,{x:start.x,y},{x:end.x,y},end];
 if(boxes.some(r=>points.slice(1).some((q,n)=>intersects(points[n],q,r))))continue;
 return {path:`M${a.x} ${a.y}H${start.x}V${y}H${end.x}V${b.y}H${b.x}`,label:{x:(start.x+end.x)/2,y:y-5},clear:true};
 }
 return {path:'',label:a,clear:false};
}
