import {useEffect,useRef,useState} from "react";
type Kind="breaker"|"rcd"|"contactor"|"overload"|"terminal"|"rail"|"duct";
type Item={id:number;kind:Kind;x:number;y:number;lengthMm?:number};
const railLengths=[210,300,360,450,600];
const railWidth=(item:Item)=>item.kind==="rail"?(item.lengthMm??360)*0.72:360;
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
function railSlot(item:Item,all:Item[],rail:Item):Item|null{
 const d=catalog.find(x=>x.kind===item.kind)!;
 const y=rail.y+8-d.height/2;
 const maxX=rail.x+railWidth(rail)-d.width;
 if(maxX<rail.x)return null;
 const preferred=Math.max(rail.x,Math.min(maxX,rail.x+Math.round((item.x-rail.x)/5)*5));
 const positions:number[]=[];
 for(let x=rail.x;x<=maxX;x+=5)positions.push(x);
 if(!positions.includes(maxX))positions.push(maxX);
 positions.sort((a,b)=>Math.abs(a-preferred)-Math.abs(b-preferred));
 for(const x of positions){
  const candidate={...item,x,y};
  if(!collides(candidate,all))return candidate;
 }
 return null;
}
function snapToRail(item:Item,all:Item[]):Item{
 if(!mountedKinds.includes(item.kind))return item;
 const d=catalog.find(x=>x.kind===item.kind)!;
 const rails=all.filter(x=>x.kind==="rail");
 const near=rails.map(rail=>({rail,distance:Math.abs(item.y+d.height/2-(rail.y+8))})).sort((a,b)=>a.distance-b.distance)[0];
 if(!near||near.distance>75)return item;
 return railSlot(item,all,near.rail)??item;
}
const sample:Item[]=[{id:1,kind:"rail",x:115,y:180,lengthMm:360},{id:2,kind:"breaker",x:120,y:138},{id:3,kind:"rcd",x:175,y:138},{id:4,kind:"contactor",x:268,y:133}];
function validLayout(value:unknown):value is Item[]{
 return Array.isArray(value)&&value.length<=150&&value.every((x:unknown)=>{
  if(!x||typeof x!=="object")return false;
  const item=x as Partial<Item>;
  return Number.isSafeInteger(item.id)&&typeof item.kind==="string"&&catalog.some(d=>d.kind===item.kind)&&
   typeof item.x==="number"&&typeof item.y==="number"&&Number.isFinite(item.x)&&Number.isFinite(item.y)&&
   item.x>=0&&item.x<=720&&item.y>=0&&item.y<=520&&
   (item.lengthMm===undefined||(item.kind==="rail"&&railLengths.includes(item.lengthMm)));
 })&&new Set(value.map((x:Item)=>x.id)).size===value.length;
}
function downloadLayout(items:Item[]){
 const blob=new Blob([JSON.stringify({format:"electrolab-cabinet",version:1,items},null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);
 const link=document.createElement("a");link.href=url;link.download="electrolab-cuadro.json";document.body.appendChild(link);link.click();link.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function restore():Item[]{try{const a=JSON.parse(localStorage.getItem("electrolab-cabinet-v01")||"null");if(validLayout(a))return a}catch{}return sample}
export default function Cabinet(){
 const [items,setItems]=useState<Item[]>(restore),[mode,setMode]=useState<"learning"|"engineering">("learning"),[view,setView]=useState<"realistic"|"technical">("realistic"),[selected,setSelected]=useState<number|null>(null),[drag,setDrag]=useState<{id:number;dx:number;dy:number;origin:Item}|null>(null),[zoom,setZoom]=useState(1);
 const history=useRef<{past:Item[][];future:Item[][];last:string}>({past:[],future:[],last:JSON.stringify(items)});
 const [historyStatus,setHistoryStatus]=useState({undo:0,redo:0});
 const skipHistory=useRef(false);
 const dragHistory=useRef<{before:string;finished:boolean}|null>(null);
 useEffect(()=>{
  const current=JSON.stringify(items);
  const h=history.current;
  if(current!==h.last){
   if(skipHistory.current){skipHistory.current=false;}
   else if(dragHistory.current){
    if(dragHistory.current.finished){
     if(current!==dragHistory.current.before){h.past.push(JSON.parse(dragHistory.current.before) as Item[]);if(h.past.length>50)h.past.shift();h.future=[];}
     dragHistory.current=null;
    }
   }
   else{h.past.push(JSON.parse(h.last) as Item[]);if(h.past.length>50)h.past.shift();h.future=[];}
   h.last=current;
   setHistoryStatus({undo:h.past.length,redo:h.future.length});
  }
  localStorage.setItem("electrolab-cabinet-v01",current);
 },[items]);
 const undo=()=>{
  const h=history.current;if(!h.past.length)return;
  const previous=h.past.pop()!;
  h.future.push(JSON.parse(h.last) as Item[]);
  skipHistory.current=true;h.last=JSON.stringify(previous);
  setItems(previous);setSelected(null);
  setHistoryStatus({undo:h.past.length,redo:h.future.length});
 };
 const redo=()=>{
  const h=history.current;if(!h.future.length)return;
  const next=h.future.pop()!;
  h.past.push(JSON.parse(h.last) as Item[]);
  skipHistory.current=true;h.last=JSON.stringify(next);
  setItems(next);setSelected(null);
  setHistoryStatus({undo:h.past.length,redo:h.future.length});
 };
 useEffect(()=>{
  const onKeyDown=(event:KeyboardEvent)=>{
   const target=event.target as HTMLElement|null;
   if(target?.closest("input,textarea,select,[contenteditable=true]"))return;
   if(event.key==="Escape"){setSelected(null);return;}
   if((event.key==="Delete"||event.key==="Backspace")&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
    if(selected===null||target?.closest("button,a,[role=button]"))return;
    event.preventDefault();setItems(current=>current.filter(item=>item.id!==selected));setSelected(null);setNotice("Elemento eliminado. Puedes recuperarlo con Deshacer.");return;
   }
   if(!(event.ctrlKey||event.metaKey)||event.altKey)return;
   const key=event.key.toLowerCase();
   if(key==="z"&&!event.shiftKey){event.preventDefault();undo();}
   else if(key==="y"||(key==="z"&&event.shiftKey)){event.preventDefault();redo();}
  };
  window.addEventListener("keydown",onKeyDown);
  return ()=>window.removeEventListener("keydown",onKeyDown);
 });
 const add=(kind:Kind)=>{
  const id=Math.max(0,...items.map(x=>x.id))+1;
  const item:Item={id,kind,x:115,y:245,...(kind==="rail"?{lengthMm:360}:{})};
  if(kind==="rail"){
   const existing=items.filter(x=>x.kind==="rail");
   for(const y of [180,320,100,400,240]){
    const candidate={...item,y};
    if(existing.every(other=>Math.abs(other.y-y)>=60)){
     setItems(v=>[...v,candidate]);setSelected(id);setNotice("");return;
    }
   }
   setNotice("No hay una fila libre para otro carril. Mueve uno de los existentes.");return;
  }
  if(mountedKinds.includes(kind)){
   const rails=items.filter(x=>x.kind==="rail");
   for(const rail of rails){
    const candidate=railSlot({...item,x:rail.x},items,rail);
    if(candidate){setItems(v=>[...v,candidate]);setSelected(id);setNotice("");return;}
   }
   if(rails.length){setNotice("No queda un hueco continuo para este dispositivo en los carriles. Añade otro carril.");return;}
   setNotice("Añade primero un carril DIN para montar este dispositivo.");return;
  }
  for(let y=70;y<420;y+=20){
   for(let x=90;x<600;x+=20){
    const candidate={...item,x,y};
    if(!collides(candidate,items)){setItems(v=>[...v,candidate]);setSelected(id);setNotice("");return;}
   }
  }
  setNotice("No queda espacio disponible en el cuadro.");
 };
 const duplicateSelected=()=>{
  if(!selectedItem||!mountedKinds.includes(selectedItem.kind))return;
  const id=Math.max(0,...items.map(x=>x.id))+1;
  const copy={...selectedItem,id,x:selectedItem.x+catalog.find(d=>d.kind===selectedItem.kind)!.width};
  const rail=rails.find(r=>mountedOnRail(selectedItem,r));
  const placed=rail?railSlot(copy,items,rail):null;
  if(!placed){setNotice("No hay un hueco libre para duplicar este dispositivo en su carril.");return;}
  setItems(v=>[...v,placed]);setSelected(id);setNotice("Componente duplicado en el mismo carril.");
 };
 const organizeRail=(rail:Item)=>{
  const members=items.filter(x=>mountedKinds.includes(x.kind)&&Math.abs(x.y+catalog.find(d=>d.kind===x.kind)!.height/2-(rail.y+8))<15&&x.x>=rail.x-12&&x.x<rail.x+railWidth(rail)+12).sort((a,b)=>a.x-b.x);
  let cursor=rail.x+5;
  const moves:Item[]=[];
  for(const member of members){
   const d=catalog.find(x=>x.kind===member.kind)!;
   if(cursor+d.width>rail.x+railWidth(rail)-5){setNotice("No se pueden ordenar todos: falta espacio continuo en el carril.");return;}
   const next={...member,x:cursor,y:rail.y+8-d.height/2};
   const others=items.filter(x=>!members.some(m=>m.id===x.id));
   if(collides(next,[...others,...moves])){setNotice("No se puede ordenar: hay dispositivos de otro carril en la zona.");return;}
   moves.push(next);
   cursor+=d.width+5;
  }
  if(!members.length){setNotice("No hay dispositivos próximos a este carril.");return;}
  setItems(v=>v.map(x=>moves.find(m=>m.id===x.id)??x));
  setNotice(`Ordenados ${members.length} dispositivos en el carril DIN${rail.id}, con separación visual de 5 unidades.`);
 };
 const canResizeRail=(rail:Item,lengthMm:number)=>{
  const proposed={...rail,lengthMm,x:Math.max(75,Math.min(rail.x,650-lengthMm*0.72))};
  const members=items.filter(x=>mountedKinds.includes(x.kind)&&Math.abs(x.y+catalog.find(d=>d.kind===x.kind)!.height/2-(rail.y+8))<5&&x.x>=rail.x-1&&x.x<rail.x+railWidth(rail)+1);
  return members.every(x=>x.x>=proposed.x-1&&x.x+catalog.find(d=>d.kind===x.kind)!.width<=proposed.x+railWidth(proposed)+1);
 };
 const cabinetSvg=useRef<SVGSVGElement>(null);
 const exportSvg=()=>{
  if(!cabinetSvg.current)return;
  const clone=cabinetSvg.current.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns","http://www.w3.org/2000/svg");
  clone.setAttribute("width","1440");
  clone.setAttribute("height","1040");
  const description=document.createElementNS("http://www.w3.org/2000/svg","desc");
  description.textContent="ElectroLab: vista educativa ilustrativa, no a escala ni válida para ejecución o certificación de instalaciones eléctricas.";
  clone.insertBefore(description,clone.firstChild);
  const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:"image/svg+xml;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;link.download="electrolab-cuadro.svg";document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  setNotice("Vista exportada como SVG. Es una ilustración educativa, no un plano a escala.");
 };
 const fileInput=useRef<HTMLInputElement>(null);
 const [notice,setNotice]=useState("");
 const exportLayout=()=>{downloadLayout(items);setNotice("Cuadro exportado en formato JSON.");};
 const exportMaterials=()=>{
  const header=["Referencia","Componente","Cantidad","Ancho nominal por unidad (mm)","Ancho total (mm)","Montaje","Observaciones"];
  const rows=catalog.map(entry=>{
   const count=items.filter(item=>item.kind===entry.kind).length;
   if(!count)return null;
   const spec=referenceSpecs[entry.kind];
   return [entry.ref,entry.name,String(count),String(spec.widthMm),String(Math.round(count*spec.widthMm*10)/10),spec.mount,"Medidas didácticas; confirmar modelo y fabricante"];
  }).filter((row):row is string[]=>row!==null);
  const quote=(value:string)=>'"'+value.replace(/"/g,'""')+'"';
  const csv="\uFEFF"+[header,...rows].map(row=>row.map(quote).join(";")).join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const link=document.createElement("a");link.href=url;link.download="electrolab-lista-materiales.csv";document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  setNotice("Lista de materiales exportada en CSV. Cantidades reales del diseño; dimensiones orientativas.");
 };
 const importLayout=async(file:File|undefined)=>{
  if(!file)return;
  try{
   if(file.size>100000){setNotice("Archivo demasiado grande (máximo 100 KB).");return;}
   const data:unknown=JSON.parse(await file.text());
   if(!data||typeof data!=="object"){setNotice("Archivo no válido.");return;}
   const payload=data as {format?:unknown;version?:unknown;items?:unknown};
   if(payload.format!=="electrolab-cabinet"||payload.version!==1||!validLayout(payload.items)){
    setNotice("Formato incompatible o datos incorrectos.");return;
   }
   const loaded=payload.items;
   if(loaded.some((item,i)=>collides(item,loaded.filter((_,j)=>i!==j)))){
    setNotice("El archivo contiene dispositivos superpuestos. No se ha importado.");return;
   }
   setItems(loaded);setSelected(null);setNotice("Cuadro importado correctamente.");
  }catch{setNotice("No se pudo leer el archivo JSON.");}
 };
 const selectedItem=items.find(x=>x.id===selected);
 const selectedSpec=selectedItem?referenceSpecs[selectedItem.kind]:null;
 const rails=items.filter(item=>item.kind==="rail");
 const mountedOnRail=(item:Item,rail:Item)=>{
  if(!mountedKinds.includes(item.kind))return false;
  const dim=catalog.find(d=>d.kind===item.kind)!;
  return item.x>=rail.x-1&&item.x+dim.width<=rail.x+railWidth(rail)+1&&Math.abs(item.y+dim.height/2-(rail.y+8))<5;
 };
 const railStats=rails.map(rail=>{
  const mounted=items.filter(item=>mountedOnRail(item,rail));
  const used=mounted.reduce((total,item)=>total+catalog.find(d=>d.kind===item.kind)!.width,0);
  const nominalMm=mounted.reduce((total,item)=>total+referenceSpecs[item.kind].widthMm,0);
  return {id:rail.id,railLength:rail.lengthMm??360,used,free:Math.max(0,railWidth(rail)-used),nominalMm,nominalFreeMm:(rail.lengthMm??360)-nominalMm,count:mounted.length,contactors:mounted.filter(item=>item.kind==="contactor").length,thermal:mounted.filter(item=>item.kind==="overload").length};
 });
 const railPhysicalProfiles=rails.map(rail=>{
  const members=items.filter(item=>mountedOnRail(item,rail)).sort((a,b)=>a.x-b.x);
  const length=rail.lengthMm??360;
  const occupied=members.reduce((sum,item)=>sum+referenceSpecs[item.kind].widthMm,0);
  // Proyección física de izquierda a derecha: conserva el orden, no las distancias del SVG.
  // La separación de 5 mm es configurable como reserva didáctica, no requisito normativo.
  const gapMm=5;
  const reserved=members.length>1?(members.length-1)*gapMm:0;
  const required=occupied+reserved;
  return {id:rail.id,length,members,occupied,gapMm,reserved,required,remaining:length-required,percentage:Math.round(required/length*100)};
 });
 const physicalOverflows=railPhysicalProfiles.filter(profile=>profile.remaining<0);
 const floating=items.filter(item=>mountedKinds.includes(item.kind)&&!rails.some(rail=>mountedOnRail(item,rail)));
 const issues:{level:"warning"|"info";title:string;detail:string}[]=[];
 if(railStats.some(stat=>stat.nominalFreeMm<0))issues.push({level:"warning",title:"Anchura nominal insuficiente",detail:"La suma de anchuras de referencia supera la longitud nominal elegida. El dibujo aún no está a escala; revisa la selección y el catálogo real."});
 if(physicalOverflows.length)issues.push({level:"warning",title:"Sin espacio para reserva entre equipos",detail:`Carriles ${physicalOverflows.map(p=>`DIN${p.id}`).join(", ")}: la suma de anchuras didácticas más 5 mm de reserva por unión excede la longitud disponible. La reserva es una hipótesis educativa, no una distancia normativa ni de fabricante.`});
 if(rails.some(rail=>(rail.lengthMm??360)>=600))issues.push({level:"warning",title:"Comprobar longitud del carril y envolvente",detail:"El armario indica 600 mm de ancho exterior como referencia. Un carril de 600 mm no puede considerarse instalable sin conocer el ancho interior útil, los soportes y las holguras de montaje. Selecciona una envolvente real antes de fabricar."});
 if(floating.length)issues.push({level:"warning",title:"Dispositivos sin encajar",detail:`${floating.length} componente(s) no están centrados y contenidos en un carril DIN. Arrástralos hasta encajarlos.`});
 if(railStats.some(stat=>stat.contactors>=3))issues.push({level:"info",title:"Agrupación de contactores",detail:"Comprueba en las fichas del fabricante las distancias, la temperatura ambiente y la disipación térmica. No existe una separación universal que podamos imponer."});
 if(items.some(item=>item.kind==="overload"))issues.push({level:"info",title:"Relé térmico",detail:"Su ajuste debe corresponder al motor y a las instrucciones del fabricante. La proximidad física a un contactor no valida la coordinación eléctrica."});
 if(items.some(item=>item.kind==="breaker"||item.kind==="rcd"))issues.push({level:"info",title:"Protecciones eléctricas",detail:"La presencia de magnetotérmicos o diferenciales no garantiza protección adecuada. Faltan corriente de diseño, secciones, cortocircuito, selectividad y datos de instalación."});
 issues.push({level:"info",title:"Alcance de la comprobación",detail:"Se revisa solo la distribución visual. No se certifica conformidad con REBT, UNE-EN IEC 61439 ni instrucciones de fabricante."});
 const toLocal=(svg:SVGSVGElement,e:React.PointerEvent)=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM()!.inverse())};
 return <section className="cabinet"><div className="cabinet-head"><div><h2>Diseñador de cuadros eléctricos</h2><p>Distribución física de componentes · Prototipo de interfaz</p></div><div className="actions"><button className={mode==="learning"?"":"secondary"} onClick={()=>setMode("learning")}>🎓 Aprendizaje</button><button className={mode==="engineering"?"":"secondary"} onClick={()=>setMode("engineering")}>🏭 Revisión técnica</button><button className={view==="realistic"?"":"secondary"} onClick={()=>setView("realistic")}>Vista realista*</button><button className={view==="technical"?"":"secondary"} onClick={()=>setView("technical")}>Vista técnica</button></div></div>
 <div className="cabinet-layout"><aside className="cabinet-sidebar"><h3>Biblioteca</h3><p className="hint">Pulsa para añadir al cuadro. Añade carriles en filas libres; los dispositivos se montan automáticamente en un hueco disponible. Selecciona un dispositivo para duplicarlo en su carril.</p>{catalog.map(x=><button key={x.kind} className="cabinet-add" onClick={()=>add(x.kind)}><span>＋</span>{x.name}</button>)}<hr/><div className="cabinet-file-actions"><button className="secondary" onClick={exportLayout}>↓ Exportar cuadro</button><button className="secondary" onClick={exportMaterials}>↓ Lista de materiales (CSV)</button><button className="secondary" onClick={()=>fileInput.current?.click()}>↑ Importar cuadro</button><input ref={fileInput} type="file" accept=".json,application/json" style={{display:"none"}} onChange={e=>{void importLayout(e.target.files?.[0]);e.target.value="";}}/>{notice&&<p role="status" className="hint">{notice}</p>}</div><hr/><button className="secondary" onClick={()=>{if(window.confirm("¿Restablecer el cuadro de ejemplo?")){setItems(sample);setSelected(null)}}}>Restablecer ejemplo</button></aside>
 <div className="cabinet-workspace"><div className="cabinet-toolbar"><span>Armario de práctica · 600 × 800 mm (referencia visual)</span><div className="actions"><button className="secondary" disabled={!historyStatus.undo} onClick={undo} title="Deshacer (Ctrl+Z)">↶ Deshacer</button><button className="secondary" disabled={!historyStatus.redo} onClick={redo} title="Rehacer (Ctrl+Y o Ctrl+Mayús+Z)">↷ Rehacer</button><button className="secondary" onClick={exportSvg}>Exportar SVG</button><button className="secondary" onClick={()=>setZoom(z=>Math.max(.7,+(z-.1).toFixed(1)))}>−</button><span>{Math.round(zoom*100)}%</span><button className="secondary" onClick={()=>setZoom(z=>Math.min(1.5,+(z+.1).toFixed(1)))}>＋</button></div></div>
 <svg ref={cabinetSvg} className="cabinet-svg" viewBox="0 0 720 520" role="img" aria-label="Armario eléctrico editable con componentes sobre carril DIN" onPointerMove={e=>{if(!drag)return;const p=toLocal(e.currentTarget,e);const px=360+(p.x-360)/zoom,py=260+(p.y-260)/zoom;setItems(v=>v.map(x=>x.id===drag.id?{...x,x:Math.max(30,Math.min(630,Math.round((px-drag.dx)/5)*5)),y:Math.max(35,Math.min(435,Math.round((py-drag.dy)/5)*5))}:x))}} onPointerUp={()=>{if(drag&&dragHistory.current)dragHistory.current.finished=true;if(drag)setItems(v=>v.map(item=>{if(item.id!==drag.id)return item;const snapped=snapToRail(item,v);return collides(snapped,v)?drag.origin:snapped}));setDrag(null)}} onPointerCancel={()=>{if(drag&&dragHistory.current)dragHistory.current.finished=true;if(drag)setItems(v=>v.map(item=>item.id===drag.id?drag.origin:item));setDrag(null)}}>
 <defs><pattern id="cabgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#dae5e9" strokeWidth=".8"/></pattern><linearGradient id="case" x1="0" x2="1"><stop stopColor="#d9e2e5"/><stop offset=".5" stopColor="#f7fafb"/><stop offset="1" stopColor="#bfcdd3"/></linearGradient></defs>
 <g transform={`translate(360 260) scale(${zoom}) translate(-360 -260)`}><rect x="48" y="26" width="624" height="470" rx="9" fill="url(#case)" stroke="#6e858d" strokeWidth="7"/><rect x="66" y="44" width="588" height="434" fill="url(#cabgrid)" stroke="#9baeb5" strokeWidth="2"/>
 {[...items].sort((a,b)=>Number(b.kind==="rail"||b.kind==="duct")-Number(a.kind==="rail"||a.kind==="duct")).map(item=>{const base=catalog.find(x=>x.kind===item.kind)!;const d=item.kind==="rail"?{...base,width:railWidth(item)}:base;const isRail=item.kind==="rail",isDuct=item.kind==="duct";return <g key={item.id} transform={`translate(${item.x} ${item.y})`} onPointerDown={e=>{e.stopPropagation();setSelected(item.id);dragHistory.current={before:JSON.stringify(items),finished:false};const svg=e.currentTarget.ownerSVGElement!;const p=toLocal(svg,e);setDrag({id:item.id,dx:360+(p.x-360)/zoom-item.x,dy:260+(p.y-260)/zoom-item.y,origin:{...item}});svg.setPointerCapture(e.pointerId)}} style={{cursor:"grab",touchAction:"none"}}>
 {selected===item.id&&!isRail&&!isDuct&&<><circle cx={d.width/2} cy="-5" r="4" fill="#009abf" stroke="#fff" strokeWidth="1.5"/><circle cx={d.width/2} cy={d.height+5} r="4" fill="#009abf" stroke="#fff" strokeWidth="1.5"/></>}
 <rect width={d.width} height={d.height} rx={isRail?2:4} fill={isRail?"#8da1ac":isDuct?"#c5d2d7":view==="realistic"?"#f6f7f8":"#e6f2f4"} stroke={selected===item.id?"#009abf":"#6c7f87"} strokeWidth={selected===item.id?3:1.5}/>
 {isRail?Array.from({length:Math.floor(d.width/29)},(_,i)=><rect key={i} x={i*29+9} y="5" width="14" height="6" fill="#536872"/>):isDuct?Array.from({length:10},(_,i)=><path key={i} d={`M3 ${i*29+8}H32`} stroke="#899fa8" strokeWidth="2"/>):view==="technical"?<>
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
 <aside className="cabinet-properties"><h3>Propiedades</h3><section className="cabinet-checks" aria-label="Revisión del diseño"><h4>{mode==="learning"?"🎓 Aprende con tu cuadro":"🏭 Revisión preliminar"}</h4><p className="hint">{mode==="learning"?"ElectroLab explica qué se puede comprobar y qué datos faltan.":"Avisos informativos; esta vista no equivale a una verificación normativa ni a un proyecto técnico."}</p>{issues.map((issue,i)=><div className={issue.level==="warning"?"cabinet-check cabinet-check-warning":"cabinet-check"} key={i}><strong>{issue.level==="warning"?"⚠ ":"ℹ "}{issue.title}</strong><p>{issue.detail}</p></div>)}</section><hr/><div className="cabinet-rail-summary"><h4>Proporciones físicas (mm)</h4><p className="hint">Vista de anchuras nominales a una misma escala. A diferencia del dibujo principal, las proporciones entre carril y dispositivos son comparables. Medidas didácticas, no modelos de fabricante.</p>{railPhysicalProfiles.map(profile=><div key={profile.id} className="cabinet-scale-row"><div className="cabinet-scale-title"><strong>DIN{profile.id} · {profile.length} mm</strong><span>{profile.required.toFixed(1)} mm con reservas · {profile.percentage}%</span></div><div className="cabinet-scale-track" role="img" aria-label={`Carril DIN${profile.id}, ${profile.occupied.toFixed(1)} milímetros ocupados de ${profile.length}`}><div className="cabinet-scale-devices">{profile.members.map((item,index)=><button type="button" key={item.id} className={`cabinet-scale-device cabinet-scale-${item.kind}${selected===item.id?" cabinet-scale-selected":""}`} style={{width:`${referenceSpecs[item.kind].widthMm/profile.length*100}%`,marginLeft:index?`${profile.gapMm/profile.length*100}%`:undefined,flexShrink:0}} onClick={()=>setSelected(item.id)} aria-label={`Seleccionar ${catalog.find(x=>x.kind===item.kind)!.name} ${item.id}, anchura de referencia ${referenceSpecs[item.kind].widthMm} milímetros`} aria-pressed={selected===item.id} title={`${catalog.find(x=>x.kind===item.kind)!.name} ${item.id}: ${referenceSpecs[item.kind].widthMm} mm · pulsa para seleccionar`}/>)}</div></div></div>)}<p className="hint">Pulsa un bloque de color para seleccionar el componente correspondiente en el cuadro. La banda representa las anchuras nominales a una misma escala y añade una reserva ilustrativa de 5 mm entre dispositivos. No corresponde a separaciones exigidas por normativa o fabricante. Los componentes que excedan el carril se desbordarán visualmente.</p><hr/><h4>Ocupación de carriles</h4>{railStats.length?railStats.map(stat=><p key={stat.id} className="hint">DIN{stat.id}: {stat.count} dispositivos · ancho nominal {stat.nominalMm.toFixed(1)} mm / {stat.railLength} mm · {stat.nominalFreeMm>=0?`${stat.nominalFreeMm.toFixed(1)} mm libres (suma nominal)`:`exceso nominal de ${Math.abs(stat.nominalFreeMm).toFixed(1)} mm`}. Ocupación visual: {Math.round(stat.used/(stat.railLength*0.72)*100)}%.</p>):<p className="hint">Añade un carril DIN para ver su ocupación.</p>}<p className="hint">La suma nominal en mm usa medidas didácticas, NO fichas de fabricante. No verifica huecos continuos, separación térmica ni fijaciones. El carril se representa a una escala visual reducida (0,72 unidades por mm) para caber en el armario. Los dispositivos aún tienen anchuras ilustrativas, por lo que su ocupación visual no equivale a la nominal.</p></div><hr/>{selectedItem?(()=>{const d=catalog.find(x=>x.kind===selectedItem.kind)!;return <><strong>{d.name}</strong>{selectedItem.kind==="rail"&&<label>Longitud de este carril DIN (mm)<select value={selectedItem.lengthMm??360} onChange={e=>{const lengthMm=Number(e.target.value);if(!canResizeRail(selectedItem,lengthMm)){setNotice("No se puede acortar el carril: hay dispositivos que quedarían fuera. Recolócalos antes.");return;}setItems(v=>v.map(x=>x.id===selectedItem.id?{...x,lengthMm,x:Math.max(75,Math.min(x.x,650-lengthMm*0.72))}:x));setNotice("Longitud del carril actualizada.");}}>{railLengths.map(length=><option key={length} value={length}>{length} mm</option>)}</select></label>}{selectedItem.kind==="rail"&&<button className="secondary" onClick={()=>organizeRail(selectedItem)}>Ordenar dispositivos del carril</button>}<p>Referencia: {d.ref}{selectedItem.id}</p>{selectedSpec&&<><h4>Ficha de referencia</h4><p><strong>Dimensiones orientativas:</strong><br/>{selectedSpec.widthMm} × {selectedSpec.heightMm} × {selectedSpec.depthMm} mm (ancho × alto × fondo)</p><p><strong>Montaje:</strong> {selectedSpec.mount}</p><p><strong>Bornes típicos:</strong> {selectedSpec.terminals.length?selectedSpec.terminals.join(", "):"No aplica"}</p><p className="hint">Las referencias de bornes son informativas. Los puntos azules de selección NO son bornes conectables.</p></>}<label>Posición X <input type="number" value={selectedItem.x} onChange={e=>{const value=Number(e.target.value);if(Number.isFinite(value))setItems(v=>v.map(x=>x.id===selected&&!collides({...x,x:value},v)?{...x,x:value}:x))}}/></label><label>Posición Y <input type="number" value={selectedItem.y} onChange={e=>{const value=Number(e.target.value);if(Number.isFinite(value))setItems(v=>v.map(x=>x.id===selected&&!collides({...x,y:value},v)?{...x,y:value}:x))}}/></label>{mountedKinds.includes(selectedItem.kind)&&<button className="secondary" onClick={duplicateSelected}>Duplicar en el carril</button>}<button className="secondary" onClick={()=>{setItems(v=>v.filter(x=>x.id!==selected));setSelected(null)}}>Eliminar componente</button></>})():<p className="hint">Selecciona un componente para editar su posición.</p>}<hr/><p className="hint">Guardado automático en este navegador. El encaje en carril es geométrico y aproximado. Las dimensiones mostradas son orientativas y NO están aplicadas a escala en el dibujo. Esta versión NO valida fichas de fabricante, capacidad del carril, seguridad ni conexiones eléctricas.</p></aside></div></section>
}