import type {ConnectedProject,Endpoint} from './project.js';
import {terminalPoint,conductorRoute} from './terminalGeometry.js';
type Props={project:ConnectedProject;view:'physical'|'schematic';pending:Endpoint|null;selectedConductorId:string|null;onTerminal:(e:Endpoint)=>void;onConductor:(id:string)=>void;interactive:boolean};
export default function TerminalLayer({project:p,view,pending,selectedConductorId,onTerminal,onConductor,interactive}:Props){
 return <g className="terminal-layer">
 {p.conductors.map(c=>{const route=conductorRoute(p,c,view),d=route.path,selected=c.id===selectedConductorId;return <g key={c.id} role={interactive?'button':undefined} tabIndex={interactive?0:undefined} aria-label={'Conductor '+c.reference} onPointerDown={e=>{e.stopPropagation();if(interactive)onConductor(c.id);}} onKeyDown={e=>{if(interactive&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onConductor(c.id);}}} style={{pointerEvents:interactive?'auto':'none'}}>
 <title>{c.reference} · {p.items.find(i=>i.id===c.from.itemId)!.reference}/{c.from.terminalId} a {p.items.find(i=>i.id===c.to.itemId)!.reference}/{c.to.terminalId}</title>
 <path d={d} fill="none" stroke={selected?'#009abf':c.color} strokeWidth={selected?3:1.5} vectorEffect="non-scaling-stroke"/>
 {interactive&&<path d={d} fill="none" stroke="transparent" strokeWidth="12" vectorEffect="non-scaling-stroke"/>}
 {route.clear&&(view==='schematic'||selected)&&<text x={route.label.x} y={route.label.y} fill="#00303c" fontSize="10" paintOrder="stroke" stroke="white" strokeWidth="3">{c.reference}</text>}</g>})}
 {p.items.flatMap(i=>p.models.find(m=>m.id===i.modelId)!.terminals.map(t=>{const end={itemId:i.id,terminalId:t.id},q=terminalPoint(p,end,view),chosen=pending?.itemId===i.id&&pending.terminalId===t.id;return <g key={i.id+':'+t.id} role={interactive?'button':undefined} tabIndex={interactive?0:undefined} aria-label={i.reference+' · Borne '+t.name} aria-pressed={chosen} onPointerDown={e=>{e.stopPropagation();if(interactive)onTerminal(end);}} onKeyDown={e=>{if(interactive&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onTerminal(end);}}} className="terminal-point" style={{cursor:interactive?'crosshair':'default',pointerEvents:interactive?'auto':'none'}}>
 <title>{i.reference} · {t.name} · Borne didáctico</title><circle cx={q.x} cy={q.y} r={view==='physical'?7:12} fill="transparent"/><circle cx={q.x} cy={q.y} r={chosen?4:3} fill={chosen?'#2ed9c3':'white'} stroke="#165572" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
 {interactive&&<text x={q.x+(view==='schematic'?(t.id==='T1'?-7:7):0)} y={q.y+(view==='physical'?(t.id==='T1'?-9:13):-7)} fontSize="9" textAnchor={view==='physical'?'middle':t.id==='T1'?'end':'start'} fill="#165572">{t.name}</text>}</g>;}))}
 </g>;
}
