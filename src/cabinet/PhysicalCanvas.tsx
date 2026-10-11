import {useRef,type ReactNode} from 'react';
import {modelFor,referenceFor,type PhysicalProject,type PointMm} from './model.js';
import {footprint} from './geometry.js';
import type {PhysicalView} from './exports.js';
type Props={children?:ReactNode;allowDrag?:boolean;project:PhysicalProject;selectedId:string|null;view:PhysicalView;zoom:number;onSelect:(id:string|null)=>void;onBeginDrag:(id:string)=>void;onPreviewMove:(id:string,p:PointMm)=>void;onFinishDrag:()=>void;onCancelDrag:()=>void};
export default function PhysicalCanvas({children,allowDrag=true,project:p,selectedId,view,zoom,onSelect,onBeginDrag,onPreviewMove,onFinishDrag,onCancelDrag}:Props){
 const drag=useRef<{id:string;dx:number;dy:number;pointer:number}|null>(null);
 const w=p.envelope.widthMm,h=p.envelope.heightMm;
 function local(svg:SVGSVGElement,e:React.PointerEvent):PointMm{
 const point=svg.createSVGPoint();point.x=e.clientX;point.y=e.clientY;
 const ctm=svg.getScreenCTM();if(!ctm)throw Error('No hay transformación SVG.');
 const q=point.matrixTransform(ctm.inverse());return {xMm:w/2+(q.x-w/2)/zoom,yMm:h/2+(q.y-h/2)/zoom};
 }
 function cancel(){if(drag.current){drag.current=null;onCancelDrag();}}
 return <svg className="physical-canvas" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Cuadro a escala en milímetros. Selecciona un aparato para editarlo." style={{aspectRatio:w+'/'+h,touchAction:'none'}}
 onPointerDown={e=>{if(e.target===e.currentTarget)onSelect(null)}}
 onPointerMove={e=>{if(!drag.current||e.pointerId!==drag.current.pointer)return;const q=local(e.currentTarget,e);onPreviewMove(drag.current.id,{xMm:q.xMm-drag.current.dx,yMm:q.yMm-drag.current.dy})}}
 onPointerUp={e=>{if(!drag.current||e.pointerId!==drag.current.pointer)return;drag.current=null;onFinishDrag();if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}}
 onPointerCancel={cancel} onLostPointerCapture={cancel}>
 <desc>Geometría educativa en milímetros. Medidas didácticas, sin validación eléctrica ni datos de fabricante.</desc>
 <defs><pattern id="physical-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="#dce6e9" strokeWidth=".5"/></pattern></defs>
 <g transform={`translate(${w/2} ${h/2}) scale(${zoom}) translate(${-w/2} ${-h/2})`}>
 <rect x="2" y="2" width={w-4} height={h-4} rx="6" fill="#dce6e9" stroke="#165572" strokeWidth="2"/>
 <rect x={p.plate.xMm} y={p.plate.yMm} width={p.plate.widthMm} height={p.plate.heightMm} fill="url(#physical-grid)" stroke="#9aafb7"/>
 {[...p.items].sort((a,b)=>Number(modelFor(p,b).kind==='rail')-Number(modelFor(p,a).kind==='rail')).map(i=>{
 const m=modelFor(p,i),r=footprint(p,i),rail=m.kind==='rail',duct=m.kind==='duct',selected=i.id===selectedId;
 return <g key={i.id} role="button" tabIndex={0} aria-label={m.name+' '+referenceFor(p,i)} aria-pressed={selected} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(i.id)}}}
 onPointerDown={e=>{if(e.button!==0||drag.current)return;if(!allowDrag){e.stopPropagation();onSelect(i.id);return;}e.stopPropagation();onSelect(i.id);const svg=e.currentTarget.ownerSVGElement!;const q=local(svg,e);drag.current={id:i.id,dx:q.xMm-i.xMm,dy:q.yMm-i.yMm,pointer:e.pointerId};onBeginDrag(i.id);svg.setPointerCapture(e.pointerId)}} style={{cursor:'grab'}}>
 <title>{m.name} · {r.widthMm} × {r.heightMm} mm · medidas didácticas</title>
 <rect x={r.xMm} y={r.yMm} width={r.widthMm} height={r.heightMm} rx={view==='technical'?0:2} fill={view==='technical'?'#fff':rail?'#a9bdc6':duct?'#ccd8de':'#f7fafb'} stroke={selected?'#009abf':'#165572'} strokeWidth={selected?2:1} vectorEffect="non-scaling-stroke"/>
 {view==='illustrated'&&(rail?<path d={`M${r.xMm} ${r.yMm+10}h${r.widthMm}m-${r.widthMm} 15h${r.widthMm}`} stroke="#5b707a"/>:duct?<path d={`M${r.xMm+5} ${r.yMm+5}v${r.heightMm-10}`} stroke="#9aafb7" strokeWidth="4" strokeDasharray="8 6"/>:<><rect x={r.xMm+r.widthMm*.2} y={r.yMm+30} width={r.widthMm*.6} height="20" rx="1" fill="#165572"/><path d={`M${r.xMm+r.widthMm/2} ${r.yMm+5}v10m0 ${r.heightMm-25}v10`} stroke="#5b707a" strokeWidth="3"/></>)}
 {view==='technical'&&!rail&&!duct&&<path d={`M${r.xMm+2} ${r.yMm+r.heightMm/2}h${r.widthMm-4}`} stroke="#165572"/>}
 </g>;
 })}
 {p.items.map((i,n)=>{const r=footprint(p,i),m=modelFor(p,i),dy=n%2?9:22;return <g key={i.id} pointerEvents="none"><path d={`M${r.xMm+r.widthMm/2} ${r.yMm}v-${dy-3}`} stroke="#5b707a" strokeWidth=".6"/><text x={r.xMm+r.widthMm/2} y={r.yMm-dy} textAnchor="middle" fontSize="10" fontWeight="600" fill="#00303c">{referenceFor(p,i)}</text></g>})}
 {children}</g></svg>;
}
