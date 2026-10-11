import {type PhysicalProject} from './model.js';
import {geometrySnapshot,isElectrical,freeReference,type ConnectedProject,type ProjectResult,type Endpoint,type Conductor} from './project.js';
import {validateConnectedProject} from './projectValidation.js';
import {validateProject} from './serialization.js';
export function addConductor(p:ConnectedProject,from:Endpoint,to:Endpoint):ProjectResult{
 return validateConnectedProject({...p,conductors:[...p.conductors,{id:crypto.randomUUID(),reference:freeReference('W',p.conductors.map(c=>c.reference)),from:{...from},to:{...to},color:'#165572'}]});
}
export function editConductor(p:ConnectedProject,id:string,patch:Pick<Conductor,'reference'|'color'|'sectionMm2'>):ProjectResult{
 if(!p.conductors.some(c=>c.id===id))return {ok:false,error:'Conductor inexistente.'};
 return validateConnectedProject({...p,conductors:p.conductors.map(c=>{if(c.id!==id)return c;const {sectionMm2:_,...rest}=c;return {...rest,...patch};})});
}
export function removeConductor(p:ConnectedProject,id:string):ProjectResult{
 if(!p.conductors.some(c=>c.id===id))return {ok:false,error:'Conductor inexistente.'};
 return validateConnectedProject({...p,conductors:p.conductors.filter(c=>c.id!==id)});
}
export function mergeGeometry(p:ConnectedProject,next:PhysicalProject):ProjectResult{
 const checked=validateProject(next);if(!checked.ok)return {ok:false,error:checked.error};
 const used=p.items.filter(i=>next.items.some(n=>n.id===i.id)).map(i=>i.reference);
 const models=next.models.map(m=>({...m,terminals:p.models.find(old=>old.id===m.id)?.terminals??(isElectrical(m.kind)?[{id:'T1',name:'T1'},{id:'T2',name:'T2'}]:[])}));
 const items=next.items.map(i=>{const old=p.items.find(a=>a.id===i.id);const reference=old?.reference??freeReference(models.find(m=>m.id===i.modelId)!.ref,used);used.push(reference);return {...i,reference};});
 const electrical=items.filter(i=>isElectrical(models.find(m=>m.id===i.modelId)!.kind));
 const schematic=p.schematic.filter(s=>electrical.some(i=>i.id===s.itemId)).map(s=>({...s}));
 for(const i of electrical){if(schematic.some(s=>s.itemId===i.id))continue;let n=0;while(schematic.some(s=>Math.abs(s.x-(100+n%4*190))<90&&Math.abs(s.y-(100+Math.floor(n/4)*140))<85))n++;schematic.push({itemId:i.id,x:100+n%4*190,y:100+Math.floor(n/4)*140});}
 const conductors=p.conductors.filter(c=>electrical.some(i=>i.id===c.from.itemId)&&electrical.some(i=>i.id===c.to.itemId));
 return validateConnectedProject({...geometrySnapshot(p),...next,version:3,models,items,conductors,schematic});
}
export function moveSchematic(p:ConnectedProject,itemId:string,x:number,y:number):ProjectResult{
 if(!p.schematic.some(s=>s.itemId===itemId))return {ok:false,error:'Equipo inexistente en el esquema.'};
 return validateConnectedProject({...p,schematic:p.schematic.map(s=>s.itemId===itemId?{...s,x,y}:s)});
}
