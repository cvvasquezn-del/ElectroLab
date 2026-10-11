import {useRef} from 'react';
import {schematicHeight,type ConnectedProject} from './project.js';
import TerminalLayer from './TerminalLayer';
import type {useWiring} from './useWiring';
type Props={project:ConnectedProject;selectedItemId:string|null;onSelect:(id:string)=>void;tool:'move'|'wire';wiring:ReturnType<typeof useWiring>;onBeginDrag:()=>void;onPreviewMove:(id:string,x:number,y:number)=>void;onFinishDrag:()=>void;onCancelDrag:()=>void};
export default function SchematicCanvas({project:p,selectedItemId,onSelect,tool,wiring,onBeginDrag,onPreviewMove,onFinishDrag,onCancelDrag}:Props){
 const drag=useRef<{id:string;dx:number;dy:number;pointer:number}|null>(null),h=schematicHeight(p.schematic.length,p.schematic);
 function local(svg:SVGSVGElement,e:React.PointerEvent){const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;return pt.matrixTransform(svg.getScreenCTM()!.inverse());}
 function cancel(){if(drag.current){drag.current=null;onCancelDrag();}}
 return <svg className="shared-schematic-canvas" viewBox={'-30 -40 860 '+(h+80)} role="img" aria-label="Esquema del cuadro. Bloques y bornes didácticos." style={{touchAction:'none'}}
 onPointerMove={e=>{if(!drag.current||e.pointerId!==drag.current.pointer)return;const q=local(e.currentTarget,e);onPreviewMove(drag.current.id,Math.max(45,Math.min(755,q.x-drag.current.dx)),Math.max(45,Math.min(h-45,q.y-drag.current.dy)));}}
 onPointerUp={e=>{if(!drag.current||e.pointerId!==drag.current.pointer)return;drag.current=null;onFinishDrag();if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={cancel} onLostPointerCapture={cancel}>
 <desc>Representación didáctica de las conexiones del cuadro, sin cálculo eléctrico ni simbología normalizada.</desc>
 <defs><pattern id="shared-schematic-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#dce6e9"/></pattern></defs><rect width="800" height={h} fill="white"/><rect width="800" height={h} fill="url(#shared-schematic-grid)"/>
 {p.schematic.map(s=>{const i=p.items.find(i=>i.id===s.itemId)!,m=p.models.find(m=>m.id===i.modelId)!;return <g key={i.id} role="button" tabIndex={0} aria-label={m.name+' '+i.reference} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(i.id);}}} onPointerDown={e=>{if(e.button!==0||drag.current)return;e.stopPropagation();onSelect(i.id);if(tool==='wire')return;const svg=e.currentTarget.ownerSVGElement!,q=local(svg,e);drag.current={id:i.id,dx:q.x-s.x,dy:q.y-s.y,pointer:e.pointerId};onBeginDrag();svg.setPointerCapture(e.pointerId);}} style={{cursor:tool==='move'?'grab':'default'}}>
 <rect x={s.x-45} y={s.y-36} width="90" height="74" rx="3" fill="#f1f6f7" stroke={selectedItemId===i.id?'#009abf':'#165572'} strokeWidth={selectedItemId===i.id?2:1}/>
 <text x={s.x} y={s.y+5} textAnchor="middle" fontSize="14" fontWeight="600" fill="#00303c">{i.reference}</text><text x={s.x} y={s.y+55} textAnchor="middle" fontSize="11" fill="#165572">{m.name}</text></g>;})}
 <TerminalLayer project={p} view="schematic" pending={wiring.pending} selectedConductorId={wiring.selectedConductorId} onTerminal={wiring.onTerminal} onConductor={wiring.onConductor} interactive={tool==='wire'}/>
 </svg>;
}
