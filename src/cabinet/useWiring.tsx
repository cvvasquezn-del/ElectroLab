import {useEffect,useState} from 'react';
import {addConductor} from './connections.js';
import type {Endpoint} from './project.js';
import {useConnectedProject} from './ProjectProvider';
export function useWiring(active=true){
 const shared=useConnectedProject(),[pending,setPending]=useState<Endpoint|null>(null),[selectedConductorId,onConductor]=useState<string|null>(null);
 function cancel(){setPending(null);}
 function onTerminal(end:Endpoint){if(shared.isDragging)return;if(!pending){setPending(end);onConductor(null);return;}const result=addConductor(shared.project,pending,end);if(shared.apply(result)){setPending(null);if(result.ok)onConductor(result.project.conductors.at(-1)!.id);}}
 useEffect(()=>{if(!active)setPending(null);},[active]);
 useEffect(()=>{if(pending&&!shared.project.items.some(i=>i.id===pending.itemId))setPending(null);},[shared.project,pending]);
 useEffect(()=>{if(!active)return;function key(e:KeyboardEvent){if(e.key==='Escape')cancel();}window.addEventListener('keydown',key);return ()=>window.removeEventListener('keydown',key);},[active]);
 return {pending,selectedConductorId,onTerminal,onConductor,cancel};
}
