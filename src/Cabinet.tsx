import {useEffect,useState} from "react";
type Kind="breaker"|"rcd"|"contactor"|"overload"|"terminal"|"rail"|"duct";
type Item={id:number;kind:Kind;x:number;y:number};
const catalog:{kind:Kind;name:string;width:number;height:number;ref:string}[]=[
 {kind:"breaker",name:"Magnetotérmico",width:50,height:100,ref:"QF"},
 {kind:"rcd",name:"Diferencial",width:88,height:100,ref:"ID"},
 {kind:"contactor",name:"Contactor",width:75,height:110,ref:"KM"},
 {kind:"overload",name:"Relé térmico",width:75,height:85,ref:"FR"},
 {kind:"terminal",name:"Bornera",width:26,height:65,ref:"X"},
 {kind:"rail",name:"Carril DIN",width:360,height:16,ref:"DIN"},
 {kind:"duct",name:"Canaleta",width:35,height:300,ref:"CAN"}];
function collides(item:Item,all:Item[]):boolean{
 const a=catalog.find(d=>d.kind===item.kind)!;
 if(item.kind==="rail"||item.kind==="duct")return false;
 return all.some(other=>{
  if(other.id===item.id||other.kind==="rail"||other.kind==="duct")return false;
  const b=catalog.find(d=>d.kind===other.kind)!;
  return item.x<other.x+b.width&&item.x+a.width>other.x&&item.y<other.y+b.height&&item.y+a.height>other.y;
 });
}
// Dimensiones didácticas de referencia, NO fichas técnicas de fabricantes.
// Un módulo DIN estándar equivale a 17,5 mm; el dibujo usa unidades visuales independientes.
const referenceSpecs:Record<Kind,{widthMm:number;heightMm:number;depthMm:number;mount:string;terminals:string[]}>={
 breaker:{widthMm:17.5,heightMm:85,depthMm:70,mount:"DIN 35 mm",terminals:["1","2"]},
 rcd:{widthMm:35,heightMm:85,depthMm:70,mount:"DIN 35 mm",terminals:["1","3","2","4"]},
 contactor:{widthMm:45,heightMm:85,depthMm:90,mount:"DIN 35 mm",terminals:["1L1","3L2","5L3","2T1","4T2","6T3","A1","A2"]},
 overload:{widthMm:45,heightMm:75,depthMm:80,mount:"Según conjunto",terminals:["1L1","3L2","5L3","2T1","4T2","6T3","95","96"]},
 terminal:{widthMm:6,heightMm:50,depthMm:45,mount:"DIN 35 mm",terminals:["1","2"]},
 rail:{widthMm:360,heightMm:35,depthMm:7.5,mount:"Soporte",terminals:[]},
 duct:{widthMm:40,heightMm:300,depthMm:40,mount:"Soporte",terminals:[]}
};
const mountedKinds:Kind[]=["breaker","rcd","contactor","overload","terminal"];
function snapToRail(item:Item,all:Item[]):Item{
 if(!mountedKinds.includes(item.kind))return item;
 const d=catalog.find(x=>x.kind===item.kind)!;
 const rails=all.filter(x=>x.kind==="rail");
 const near=rails.map(rail=>({rail,distance:Math.abs(item.y+d.height/2-(rail.y+8))})).sort((a,b)=>a.distance-b.distance)[0];
 if(!near||near.distance>42)return item;
 const rail=near.rail;
 const x=Math.max(rail.x,Math.min(rail.x+360-d.width,rail.x+Math.round((item.x-rail.x)/5)*5));
 const y=rail.y+8-d.height/2;
 const overlaps=all.some(other=>other.id!==item.id&&mountedKinds.includes(other.kind)&&Math.abs(other.y+catalog.find(d=>d.kind===other.kind)!.height/2-(rail.y+8))<4&&x<other.x+catalog.find(d=>d.kind===other.kind)!.width&&x+d.width>other.x);
 return overlaps?item:{...item,x,y};
}
const sample:Item[]=[{id:1,kind:"rail",x:115,y:180},{id:2,kind:"breaker",x:140,y:128},{id:3,kind:"rcd",x:220,y:128},{id:4,kind:"contactor",x:345,y:124}];
function restore():Item[]{try{const a=JSON.parse(localStorage.getItem("electrolab-cabinet-v01")||"null");if(Array.isArray(a)&&a.every(x=>catalog.some(t=>t.kind===x.kind)&&Number.isFinite(x.x)&&Number.isFinite(x.y)))return a}catch{}return sample}
export default function Cabinet(){
 const [items,setItems]=useState<Item[]>(restore),[view,setView]=useState<"realistic"|"technical">("realistic"),[selected,setSelected]=useState<number|null>(null),[drag,setDrag]=useState<{id:number;dx:number;dy:number;origin:Item}|null>(null),[zoom,setZoom]=useState(1);
 useEffect(()=>{localStorage.setItem("electrolab-cabinet-v01",JSON.stringify(items))},[items]);
 const add=(kind:Kind)=>{const id=Math.max(0,...items.map(x=>x.id))+1;setItems(v=>{const item={id,kind,x:130+(v.length%5)*85,y:245};let candidate=snapToRail(item,v);if(collides(candidate,v)){for(let y=70;y<420;y+=20){for(let x=90;x<600;x+=20){const test={...item,x,y};if(!collides(test,v)){candidate=test;break}}if(!collides(candidate,v))break}}return [...v,candidate]});setSelected(id)};
 const selectedItem=items.find(x=>x.id===selected);
 const selectedSpec=selectedItem?referenceSpecs[selectedItem.kind]:null;
 const toLocal=(svg:SVGSVGElement,e:React.PointerEvent)=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM()!.inverse())};
 return <section className="cabinet"><div className="cabinet-head"><div><h2>Diseñador de cuadros eléctricos</h2><p>Distribución física de componentes · Prototipo de interfaz</p></div><div className="actions"><button className={view==="realistic"?"":"secondary"} onClick={()=>setView("realistic")}>Vista realista*</button><button className={view==="technical"?"":"secondary"} onClick={()=>setView("technical")}>Vista técnica</button></div></div>
 <div className="cabinet-layout"><aside className="cabinet-sidebar"><h3>Biblioteca</h3><p className="hint">Pulsa para añadir al cuadro. Suelta un dispositivo cerca del carril para encajarlo; si una posición se superpone a otro dispositivo, vuelve a su posición anterior.</p>{catalog.map(x=><button key={x.kind} className="cabinet-add" onClick={()=>add(x.kind)}><span>＋</span>{x.name}</button>)}<hr/><button className="secondary" onClick={()=>{if(window.confirm("¿Restablecer el cuadro de ejemplo?")){setItems(sample);setSelected(null)}}}>Restablecer ejemplo</button></aside>
 <div className="cabinet-workspace"><div className="cabinet-toolbar"><span>Armario de práctica · 600 × 800 mm (referencia visual)</span><div className="actions"><button className="secondary" onClick={()=>setZoom(z=>Math.max(.7,+(z-.1).toFixed(1)))}>−</button><span>{Math.round(zoom*100)}%</span><button className="secondary" onClick={()=>setZoom(z=>Math.min(1.5,+(z+.1).toFixed(1)))}>＋</button></div></div>
 <svg className="cabinet-svg" viewBox="0 0 720 520" role="img" aria-label="Armario eléctrico editable con componentes sobre carril DIN" onPointerMove={e=>{if(!drag)return;const p=toLocal(e.currentTarget,e);const px=360+(p.x-360)/zoom,py=260+(p.y-260)/zoom;setItems(v=>v.map(x=>x.id===drag.id?{...x,x:Math.max(30,Math.min(630,Math.round((px-drag.dx)/5)*5)),y:Math.max(35,Math.min(435,Math.round((py-drag.dy)/5)*5))}:x))}} onPointerUp={()=>{if(drag)setItems(v=>v.map(item=>{if(item.id!==drag.id)return item;const snapped=snapToRail(item,v);return collides(snapped,v)?drag.origin:snapped}));setDrag(null)}} onPointerCancel={()=>{if(drag)setItems(v=>v.map(item=>item.id===drag.id?drag.origin:item));setDrag(null)}}>
 <defs><pattern id="cabgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#dae5e9" strokeWidth=".8"/></pattern><linearGradient id="case" x1="0" x2="1"><stop stopColor="#d9e2e5"/><stop offset=".5" stopColor="#f7fafb"/><stop offset="1" stopColor="#bfcdd3"/></linearGradient></defs>
 <g transform={`translate(360 260) scale(${zoom}) translate(-360 -260)`}><rect x="48" y="26" width="624" height="470" rx="9" fill="url(#case)" stroke="#6e858d" strokeWidth="7"/><rect x="66" y="44" width="588" height="434" fill="url(#cabgrid)" stroke="#9baeb5" strokeWidth="2"/>
 {items.map(item=>{const d=catalog.find(x=>x.kind===item.kind)!;const isRail=item.kind==="rail",isDuct=item.kind==="duct";return <g key={item.id} transform={`translate(${item.x} ${item.y})`} onPointerDown={e=>{e.stopPropagation();setSelected(item.id);const svg=e.currentTarget.ownerSVGElement!;const p=toLocal(svg,e);setDrag({id:item.id,dx:360+(p.x-360)/zoom-item.x,dy:260+(p.y-260)/zoom-item.y,origin:{...item}});svg.setPointerCapture(e.pointerId)}} style={{cursor:"grab",touchAction:"none"}}>
 {selected===item.id&&!isRail&&!isDuct&&<><circle cx={d.width/2} cy="-5" r="4" fill="#009abf" stroke="#fff" strokeWidth="1.5"/><circle cx={d.width/2} cy={d.height+5} r="4" fill="#009abf" stroke="#fff" strokeWidth="1.5"/></>}
 <rect width={d.width} height={d.height} rx={isRail?2:4} fill={isRail?"#8da1ac":isDuct?"#c5d2d7":view==="realistic"?"#f6f7f8":"#e6f2f4"} stroke={selected===item.id?"#009abf":"#6c7f87"} strokeWidth={selected===item.id?3:1.5}/>
 {isRail?Array.from({length:12},(_,i)=><rect key={i} x={i*29+9} y="5" width="14" height="6" fill="#536872"/>):isDuct?Array.from({length:10},(_,i)=><path key={i} d={`M3 ${i*29+8}H32`} stroke="#899fa8" strokeWidth="2"/>):view==="technical"?<>
 <rect x="5" y="6" width={d.width-10} height={d.height-12} rx="2" fill="#eaf7fa" stroke="#165572" strokeDasharray="3 2"/>
 <text x={d.width/2} y="19" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#00303c">{d.ref}{item.id}</text>
 <path d={`M10 ${d.height/2}H${d.width-10}`} stroke="#165572" strokeWidth="2"/>
 <circle cx={d.width/2} cy={d.height/2} r="7" fill="white" stroke="#165572" strokeWidth="2"/>
 <text x={d.width/2} y={d.height-13} textAnchor="middle" fontSize="7" fill="#165572">{item.kind==="breaker"?"MCB":item.kind==="rcd"?"RCD":item.kind==="contactor"?"KM":item.kind==="overload"?"OL":"X"}</text>
 </>:<>
 <rect x="3" y="3" width={d.width-6} height={d.height-6} rx="4" fill="#f7f8f6" stroke="#b0b9bc"/>
 <rect x="6" y="5" width={d.width-12} height="14" rx="2" fill="#e0e8e9" stroke="#bdc8cb" strokeWidth=".6"/>
 <text x={d.width/2} y="14" textAnchor="middle" fontSize="8" fill="#00303c" fontWeight="bold">{d.ref}{item.id}</text>
 {Array.from({length:Math.min(4,Math.max(1,Math.floor(d.width/21)))},(_,i)=>{const n=Math.min(4,Math.max(1,Math.floor(d.width/21)));const tx=(i+.5)*d.width/n;return <g key={i}><rect x={tx-5} y="22" width="10" height="7" rx="1" fill="#9eaaad" stroke="#62777e" strokeWidth=".5"/><circle cx={tx} cy="25.5" r="2.3" fill="#4e6067"/><path d={`M${tx-1.5} 25.5h3`} stroke="#c6d1d4" strokeWidth=".6"/><rect x={tx-5} y={d.height-13} width="10" height="7" rx="1" fill="#a6b2b5" stroke="#62777e" strokeWidth=".5"/><circle cx={tx} cy={d.height-9.5} r="2.3" fill="#4e6067"/></g>})}
 <rect x="8" y="32" width={d.width-16} height={d.height-52} rx="2" fill="#eff1ee" stroke="#d0d6d4" strokeWidth=".8"/>
 {item.kind==="breaker"||item.kind==="rcd"?<>
 <text x={d.width/2} y="42" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#3c4d54">{item.kind==="breaker"?"C16":"30mA"}</text>
 <rect x={d.width/2-9} y="48" width="18" height="29" rx="3" fill="#c7d1d3" stroke="#82949b"/>
 <rect x={d.width/2-6} y="51" width="12" height="14" rx="2" fill="#334d5a" stroke="#162e39"/>
 <text x={d.width/2} y="87" textAnchor="middle" fontSize="7" fill="#5b707a">I / O</text>
 {item.kind==="rcd"&&<><rect x={d.width-26} y="44" width="14" height="10" rx="2" fill="#dce5e6" stroke="#6c7f87"/><text x={d.width-19} y="51" textAnchor="middle" fontSize="6" fill="#00303c">T</text></>}
 </>:item.kind==="contactor"?<>
 <text x={d.width/2} y="44" textAnchor="middle" fontSize="7" fill="#40555c">A1 · A2</text>
 <rect x={d.width/2-20} y="49" width="40" height="27" rx="3" fill="#cbd4d5" stroke="#879ba2"/>
 <rect x={d.width/2-13} y="55" width="26" height="15" rx="2" fill="#5b727c"/>
 <text x={d.width/2} y="90" textAnchor="middle" fontSize="7" fill="#40555c">L1 L2 L3</text>
 </>:item.kind==="overload"?<>
 <text x={d.width/2} y="43" textAnchor="middle" fontSize="7" fill="#40555c">RESET</text>
 <circle cx={d.width/2-11} cy="56" r="6" fill="#dfe8e8" stroke="#81959c"/>
 <circle cx={d.width/2+11} cy="56" r="6" fill="#e1251b" stroke="#a21d15"/>
 </>:<><rect x={d.width/2-7} y="42" width="14" height="15" rx="2" fill="#bac8cc" stroke="#6b8088"/><circle cx={d.width/2} cy="49" r="3" fill="#455e68"/></>}
 <rect x="8" y={d.height-19} width={d.width-16} height="3" rx="1" fill="#c7d2d5"/>
 </>}

 </g>})}</g></svg><p className="hint">*Vista realista: actualmente representación ilustrada de alta fidelidad básica. Los acabados son ilustraciones SVG originales, NO fotografías ni modelos específicos de fabricante; no se presentan estas ilustraciones como fotos de productos reales.</p></div>
 <aside className="cabinet-properties"><h3>Propiedades</h3>{selectedItem?(()=>{const d=catalog.find(x=>x.kind===selectedItem.kind)!;return <><strong>{d.name}</strong><p>Referencia: {d.ref}{selectedItem.id}</p>{selectedSpec&&<><h4>Ficha de referencia</h4><p><strong>Dimensiones orientativas:</strong><br/>{selectedSpec.widthMm} × {selectedSpec.heightMm} × {selectedSpec.depthMm} mm (ancho × alto × fondo)</p><p><strong>Montaje:</strong> {selectedSpec.mount}</p><p><strong>Bornes típicos:</strong> {selectedSpec.terminals.length?selectedSpec.terminals.join(", "):"No aplica"}</p><p className="hint">Las referencias de bornes son informativas. Los puntos azules de selección NO son bornes conectables.</p></>}<label>Posición X <input type="number" value={selectedItem.x} onChange={e=>{const value=Number(e.target.value);if(Number.isFinite(value))setItems(v=>v.map(x=>x.id===selected&&!collides({...x,x:value},v)?{...x,x:value}:x))}}/></label><label>Posición Y <input type="number" value={selectedItem.y} onChange={e=>{const value=Number(e.target.value);if(Number.isFinite(value))setItems(v=>v.map(x=>x.id===selected&&!collides({...x,y:value},v)?{...x,y:value}:x))}}/></label><button className="secondary" onClick={()=>{setItems(v=>v.filter(x=>x.id!==selected));setSelected(null)}}>Eliminar componente</button></>})():<p className="hint">Selecciona un componente para editar su posición.</p>}<hr/><p className="hint">Guardado automático en este navegador. El encaje en carril es geométrico y aproximado. Las dimensiones mostradas son orientativas y NO están aplicadas a escala en el dibujo. Esta versión NO valida fichas de fabricante, capacidad del carril, seguridad ni conexiones eléctricas.</p></aside></div></section>
}