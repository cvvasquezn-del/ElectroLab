export type Kind='breaker'|'rcd'|'contactor'|'overload'|'terminal'|'rail'|'duct';
export type PointMm={xMm:number;yMm:number};
export type RectMm=PointMm & {widthMm:number;heightMm:number};
export type DeviceModel={id:string;kind:Kind;name:string;ref:string;widthMm:number;heightMm:number;depthMm:number;didactic:true};
export type PhysicalItem=PointMm & {id:string;modelId:string;railId?:string;lengthMm?:number};
export type PhysicalProject={format:'electrolab-cabinet';version:2;id:string;envelope:{widthMm:number;heightMm:number};plate:RectMm;reserveMm:number;models:DeviceModel[];items:PhysicalItem[]};
export const kinds:Kind[]=['breaker','rcd','contactor','overload','terminal','rail','duct'];
export const models:DeviceModel[]=[
 {id:'breaker',kind:'breaker',name:'Magnetotérmico',ref:'QF',widthMm:17.5,heightMm:85,depthMm:70,didactic:true},
 {id:'rcd',kind:'rcd',name:'Diferencial',ref:'ID',widthMm:35,heightMm:85,depthMm:70,didactic:true},
 {id:'contactor',kind:'contactor',name:'Contactor',ref:'KM',widthMm:45,heightMm:85,depthMm:90,didactic:true},
 {id:'overload',kind:'overload',name:'Relé térmico',ref:'FR',widthMm:45,heightMm:75,depthMm:80,didactic:true},
 {id:'terminal',kind:'terminal',name:'Bornera',ref:'X',widthMm:6,heightMm:50,depthMm:45,didactic:true},
 {id:'rail',kind:'rail',name:'Carril DIN',ref:'DIN',widthMm:360,heightMm:35,depthMm:7.5,didactic:true},
 {id:'duct',kind:'duct',name:'Canaleta',ref:'CAN',widthMm:40,heightMm:300,depthMm:40,didactic:true}
];
export function modelFor(p:PhysicalProject,i:PhysicalItem):DeviceModel {
 const m=p.models.find(m=>m.id===i.modelId);if(!m)throw new Error('Modelo desconocido: '+i.modelId);return m;
}
export function createPhysicalProject():PhysicalProject{
 const railId=crypto.randomUUID();
 return {format:'electrolab-cabinet',version:2,id:crypto.randomUUID(),envelope:{widthMm:600,heightMm:800},plate:{xMm:25,yMm:25,widthMm:550,heightMm:750},reserveMm:0,models:models.map(m=>({...m})),items:[
 {id:railId,modelId:'rail',xMm:75,yMm:200,lengthMm:360},
 ...[{modelId:'breaker',xMm:80},{modelId:'rcd',xMm:97.5},{modelId:'contactor',xMm:132.5}].map(i=>({...i,id:crypto.randomUUID(),yMm:175,railId}))]};
}


export function referenceFor(p:PhysicalProject,i:PhysicalItem){return modelFor(p,i).ref+(p.items.indexOf(i)+1);}
