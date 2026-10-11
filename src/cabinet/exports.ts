import {modelFor,referenceFor,type PhysicalProject} from './model.js';
import {footprint} from './geometry.js';
export type PhysicalView='illustrated'|'technical';
export const xml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export function physicalSvg(p:PhysicalProject,view:PhysicalView):string{
 const {widthMm:w,heightMm:h}=p.envelope;
 const shapes=[...p.items].sort((a,b)=>Number(modelFor(p,b).kind==='rail')-Number(modelFor(p,a).kind==='rail')).map(i=>{
 const m=modelFor(p,i),r=footprint(p,i);
 return '<g><title>'+xml(m.name)+'</title><rect x="'+r.xMm+'" y="'+r.yMm+'" width="'+r.widthMm+'" height="'+r.heightMm+'" fill="'+(view==='technical'?'white':m.kind==='rail'?'#b9c8ce':'#e6f2f4')+'" stroke="#165572" stroke-width="1"/><text x="'+(r.xMm+r.widthMm/2)+'" y="'+(r.yMm-4)+'" font-size="9" text-anchor="middle" fill="#00303c">'+xml(referenceFor(p,i))+'</text></g>';
 }).join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'"><desc>Cuadro educativo ElecWizard. Geometría en milímetros; dimensiones didácticas, sin validación eléctrica.</desc><rect width="'+w+'" height="'+h+'" fill="#f1f6f7" stroke="#00303c"/><rect x="'+p.plate.xMm+'" y="'+p.plate.yMm+'" width="'+p.plate.widthMm+'" height="'+p.plate.heightMm+'" fill="white" stroke="#9aafb7"/>'+shapes+'</svg>';
}
export function physicalCsv(p:PhysicalProject):string{
 const rows=new Map<string,{name:string;ref:string;width:number;height:number;depth:number;count:number}>();
 for(const i of p.items){const m=modelFor(p,i),r=footprint(p,i),key=m.id+':'+r.widthMm+':'+r.heightMm;
 const prev=rows.get(key);if(prev)prev.count++;else rows.set(key,{name:m.name,ref:m.ref,width:r.widthMm,height:r.heightMm,depth:m.depthMm,count:1});}
 const quote=(value:string|number)=>{let s=String(value);if(typeof value==='string'&&/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const table:(string|number)[][]=[['Elemento','Referencia','Cantidad','Ancho / longitud por unidad (mm)','Alto (mm)','Fondo (mm)','Total ancho / longitud (mm)','Alcance'],...[...rows.values()].map(r=>[r.name,r.ref,r.count,r.width,r.height,r.depth,r.width*r.count,'Medidas didácticas; sin validación eléctrica'])];
 return '\uFEFF'+table.map(r=>r.map(quote).join(';')).join('\r\n');
}
