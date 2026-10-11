import {kinds,type Kind} from './model.js';
export type LegacyItem={id:number;kind:Kind;x:number;y:number;lengthMm?:number};
export type LegacyProject={format:'electrolab-cabinet';version:1;items:LegacyItem[]};
export function validLegacyItems(v:unknown):v is LegacyItem[]{
 return Array.isArray(v)&&v.length<=150&&v.every(i=>i&&typeof i==='object'&&Number.isSafeInteger(i.id)&&kinds.includes(i.kind)&&typeof i.x==='number'&&typeof i.y==='number'&&Number.isFinite(i.x)&&Number.isFinite(i.y)&&i.x>=0&&i.x<=720&&i.y>=0&&i.y<=520&&(i.lengthMm===undefined||(i.kind==='rail'&&[210,300,360,450,600].includes(i.lengthMm))))&&new Set(v.map(i=>i.id)).size===v.length;
}
const sizes:Record<Kind,[number,number]>={breaker:[50,100],rcd:[88,100],contactor:[75,110],overload:[75,85],terminal:[26,65],rail:[360,16],duct:[35,300]};
export function legacyOverlap(items:LegacyItem[]):boolean{
 return items.some((a,n)=>a.kind!=='rail'&&a.kind!=='duct'&&items.slice(n+1).some(b=>b.kind!=='rail'&&b.kind!=='duct'&&a.x<b.x+sizes[b.kind][0]&&a.x+sizes[a.kind][0]>b.x&&a.y<b.y+sizes[b.kind][1]&&a.y+sizes[a.kind][1]>b.y));
}
