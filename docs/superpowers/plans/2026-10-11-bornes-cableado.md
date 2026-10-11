# Bornes y cableado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Ejecución propuesta: en esta conversación, con revisión independiente al terminar.

**Goal:** Conectar bornes concretos y consultar los mismos equipos y conductores en cuadro y esquema, preservando archivos e historial.

**Architecture:** Un proyecto versión 3 vive en un proveedor situado en App. Las operaciones eléctricas son funciones puras; un adaptador usa la geometría versión 2 existente sin perder referencias, enlaces ni posiciones del esquema. Cada vista conserva su estado de presentación y comparte el historial del proyecto.

**Tech Stack:** React 19, TypeScript 5.8, Vite 7, SVG y node:test, sin nuevas dependencias.

**Spec:** ../specs/2026-10-11-bornes-cableado-design.md — aprobado por el usuario el 11 de octubre de 2026.

## Global Constraints

- «El nuevo formato será electrolab-cabinet versión 3.»
- «El límite será 150 elementos, 200 conductores y 100 KB de JSON compacto.»
- «Los cinco tipos eléctricos actuales tendrán bornes genéricos T1 y T2 y una nota visible “Bornes didácticos”.»
- «La nueva clave local será electrolab-project-v03.»
- «La clave versión 2 quedará intacta.»
- «Cambiar de vista conservará equipos, conexiones e historial.»
- «Se conservarán las reglas de 50 acciones y de eliminación de la rama de rehacer tras una edición.»
- «Duplicar no copiará conductores.»
- Identidad existente: Poppins, logo original, #00303c, #165572, #009abf, #2ed9c3, #f1f6f7, #dce6e9.
- El plan cubre registro didáctico de conexiones; no incorpora simulación, polos reales, dimensionamiento ni rutas por canaleta.

## Review Focus

1. Una clave v3 corrupta no debe quedar sustituida por una migración v2 o por un clic sin cambios: tarea 2.
2. Una edición de posición física no debe descartar cables o renumerar equipos: tarea 3.
3. Borrar un dispositivo conectado y deshacer debe recuperar sus enlaces y posición del esquema: tarea 3.
4. Cambiar de pestaña durante una conexión o arrastre debe cancelar lo incompleto y conservar el historial: tareas 4 y 5.
5. Un proyecto próximo a 100 KB debe poder exportarse y reimportarse; referencias maliciosas no deben convertirse en XML o fórmulas: tareas 1 y 6.

## Mapa de archivos

- `src/cabinet/project.ts`: tipos v3, migración, referencias estables, proyección geométrica y colocación inicial del esquema.
- `src/cabinet/projectValidation.ts`: validación v3 y lectura v1/v2/v3.
- `src/cabinet/projectStorage.ts`: recuperación y guardado v3 protegido.
- `src/cabinet/connections.ts`: operaciones de conductores y reconciliación con geometría.
- `src/cabinet/ProjectProvider.tsx`: estado e historial compartidos y aplicación validada.
- `src/cabinet/terminalGeometry.ts`: posiciones de bornes y líneas para ambas vistas.
- `src/cabinet/ConnectionPanel.tsx`: selectores accesibles, lista y edición de conductores.
- `src/cabinet/TerminalLayer.tsx`: puntos y líneas SVG compartidos.
- `src/cabinet/SchematicCanvas.tsx`, `src/ProjectSchematic.tsx`: vista de bloques del proyecto.
- `src/cabinet/connectionExports.ts`: CSV de conexiones y SVG del esquema/cableado.
- Modificar `App.tsx`, `Cabinet.tsx`, `PhysicalCabinet.tsx`, `PhysicalCanvas.tsx`, `model.ts`, `style.css`, `README.md` y el estado de la especificación.
- Crear pruebas `tests/project.test.mjs`, `tests/projectStorage.test.mjs`, `tests/connections.test.mjs`, `tests/terminalGeometry.test.mjs`, `tests/connectionExports.test.mjs`. Los módulos nuevos puros están dentro del include existente de tsconfig.tests.json.

## Preparación de ejecución

- [ ] Leer especificación y plan, inspeccionar estado de Git y ejecutar `npm test` y `npm run build` como referencia. Aislar el trabajo según using-git-worktrees; conservar el package-lock.json local sin incluirlo por accidente.
- [ ] Registrar avances y resultados por tarea. Cada paso final de tarea será un commit local con los archivos de esa tarea; no publicar borradores de código antes de la comprobación final.
- [ ] Mantener disponible la vista actual de 4185 hasta que la nueva compilación esté verificada.

## Tarea 1 — Formato, referencias y migración comprobables

**Files:** crear project.ts, projectValidation.ts y tests/project.test.mjs; modificar model.ts para `PhysicalItem.reference?:string` y hacer que referenceFor prefiera ese valor. No cambiar los formatos antiguos.

**Interfaces que produce:**

```ts
type Terminal={id:string;name:string};
type Endpoint={itemId:string;terminalId:string};
type Conductor={id:string;reference:string;from:Endpoint;to:Endpoint;color:string;sectionMm2?:number};
type SchematicPosition={itemId:string;x:number;y:number};
type ConnectedProject=Omit<PhysicalProject,'version'|'items'|'models'> & {
 version:3;
 items:(PhysicalItem & {reference:string})[];
 models:(DeviceModel & {terminals:Terminal[]})[];
 conductors:Conductor[];
 schematic:SchematicPosition[];
};
type ProjectResult={ok:true;project:ConnectedProject}|{ok:false;error:string};
// exported by project.ts
function migratePhysical(p:PhysicalProject):ConnectedProject;
function geometrySnapshot(p:ConnectedProject):PhysicalProject;
function isElectrical(kind:Kind):boolean;
function freeReference(prefix:string,used:string[]):string;
// exported by projectValidation.ts
function validateConnectedProject(value:unknown):ProjectResult;
function readProject(text:string):{ok:true;project:LegacyProject|ConnectedProject}|{ok:false;error:string};
```

- [ ] Escribir pruebas antes del código, incluyendo estos casos:

```js
import test from 'node:test';import assert from 'node:assert/strict';
import {createPhysicalProject,referenceFor} from '../.test-build/cabinet/model.js';
import {migratePhysical,geometrySnapshot} from '../.test-build/cabinet/project.js';
import {validateConnectedProject,readProject} from '../.test-build/cabinet/projectValidation.js';
test('migrar conserva identidad, geometría y referencias visibles',()=>{
 const old=createPhysicalProject(),snapshot=structuredClone(old),p=migratePhysical(old);
 assert.deepEqual(old,snapshot);assert.equal(p.version,3);
 assert.deepEqual(p.items.map(i=>i.id),old.items.map(i=>i.id));
 assert.deepEqual(p.items.map(i=>i.reference),old.items.map(i=>referenceFor(old,i)));
 assert.equal(geometrySnapshot(p).items[3].xMm,old.items[3].xMm);
 assert.equal(p.models.find(m=>m.kind==='rail').terminals.length,0);
 assert.deepEqual(p.models.find(m=>m.kind==='contactor').terminals.map(t=>t.id),['T1','T2']);
 assert.equal(validateConnectedProject(p).ok,true);
 assert.deepEqual(readProject(JSON.stringify(p)).project,p);
});
```

- [ ] Ejecutar `npm test`; comprobar que falla por el módulo nuevo ausente. Añadir pruebas con IDs/referencias duplicados, borne desconocido, dispositivo no eléctrico, extremo igual, enlace inverso repetido, sección cero/NaN, 201 cables y posiciones de esquema ausentes, repetidas o no finitas. Rechazar también más de 100 KB medidos con TextEncoder, incluyendo texto multibyte.
- [ ] Implementar la migración con copia, referencias actuales congeladas y bornes genéricos. Ejemplo central:

```ts
const items=p.items.map(i=>({...i,reference:referenceFor(p,i)}));
const models=p.models.map(m=>({...m,terminals:isElectrical(m.kind)?[
 {id:'T1',name:'T1'},{id:'T2',name:'T2'}]:[]}));
const schematic=items.filter(i=>isElectrical(models.find(m=>m.id===i.modelId)!.kind))
 .map((i,n)=>({itemId:i.id,x:100+(n%4)*190,y:100+Math.floor(n/4)*140}));
return {...structuredClone(p),version:3,items,models,schematic,conductors:[]};
```

  geometrySnapshot construirá explícitamente los campos v2 y conservará reference en sus items; no enviará conductors ni schematic al validador antiguo. La validación v3 comprobará shape antes de casts, validará ese snapshot con validateProject existente y luego todas las relaciones eléctricas. Bornes: máximo 16 por modelo, IDs y nombres no vacíos y ≤40 caracteres. Referencias de equipo/conductor no vacías, únicas en su categoría y ≤40. Colores: paleta cerrada `#165572`, `#009abf`, `#e1251b`, `#5b707a`, `#2ed9c3`. Posiciones del esquema dentro de un área 800 px de ancho y altura dinámica `max(450,140*ceil(equipos/4)+100)`; margen de 45 px. Nombre visible del borne ≤40.
- [ ] Ejecutar pruebas, compilación y diff check; commit `feat: add shared cabinet project format and migration`.

## Tarea 2 — Guardado y recuperación sin pérdida de originales

**Files:** crear projectStorage.ts y tests/projectStorage.test.mjs; usar StorageLike/readStored/writeStored existentes.

**Interfaces:** `recoverConnected(storage:StorageLike):{project:ConnectedProject;warning:string;protected:boolean}` y `saveConnected(storage:StorageLike,p:ConnectedProject,protectedRecovery:boolean):{ok:true}|{ok:false;error:string}`. Consume funciones de tarea 1.

- [ ] Escribir pruebas con un Map que actúa como almacenamiento: v3 válido tiene prioridad; solo v2 migra y no cambia su clave; claves ausentes dan ejemplo migrado; v3 corrupto no cae silenciosamente a v2; fallo al leer v2 tampoco anuncia migración correcta.

```js
test('la recuperación corrupta no sobrescribe ni migra por selección',()=>{
 const raw='{"version":99}',map=new Map([['electrolab-project-v03',raw]]);
 const s={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const r=recoverConnected(s);assert.equal(r.protected,true);
 assert.equal(saveConnected(s,r.project,true).ok,false);
 assert.equal(map.get('electrolab-project-v03'),raw);
});
```

- [ ] Ejecutar pruebas para comprobar el fallo. Implementar prioridad de lectura mediante retornos separados: presencia v3 se valida o protege; solo ausencia real permite leer v2. Guardar únicamente v3 validado y compacto; errores de getter/setItem/cuota devuelven aviso sin tocar proyectos en memoria.

```ts
if(protectedRecovery)return {ok:false,error:'Se conserva el original. Importa o edita para iniciar otro proyecto.'};
const checked=validateConnectedProject(p);
if(!checked.ok)return checked;
return writeStored(storage,'electrolab-project-v03',JSON.stringify(checked.project));
```

- [ ] Probar roundtrip de guardado, quota exceeded y acceso denegado; comprobar las claves originales byte por byte. Ejecutar pruebas y build; commit `feat: preserve previous projects during shared project recovery`.

## Tarea 3 — Operaciones e historial compartido

**Files:** crear connections.ts, ProjectProvider.tsx y tests/connections.test.mjs; modificar App.tsx, PhysicalCabinet.tsx y Cabinet.tsx. Consumir tareas 1 y 2; conservar useProjectHistory.

**Interfaces:**

```ts
function addConductor(p:ConnectedProject,from:Endpoint,to:Endpoint):ProjectResult;
function editConductor(p:ConnectedProject,id:string,patch:Pick<Conductor,'reference'|'color'|'sectionMm2'>):ProjectResult;
function removeConductor(p:ConnectedProject,id:string):ProjectResult;
function mergeGeometry(p:ConnectedProject,next:PhysicalProject):ProjectResult;
function moveSchematic(p:ConnectedProject,itemId:string,x:number,y:number):ProjectResult;
// ProjectProvider exports Provider and useConnectedProject()
// API: project, apply(result), importProject(p), preview(p), beginDrag(),
// finishDrag(), cancelDrag(), undo(), redo(), canUndo, canRedo, isDragging,
// notice, storageError, saved; apply/import return boolean.
```

- [ ] Escribir pruebas que creen un enlace entre los equipos 1 y 2; aplicar una nueva geometría y comprobar que el conductor, referencias y posiciones de esquema no cambian. Probar duplicado con nueva referencia/posición y cero cables copiados. Probar borrado con cascada y reducer:

```js
const p=migratePhysical(createPhysicalProject());
const linked=addConductor(p,{itemId:p.items[1].id,terminalId:'T1'},
 {itemId:p.items[2].id,terminalId:'T2'}).project;
const next=geometrySnapshot(linked);next.items=next.items.filter(i=>i.id!==p.items[1].id);
const removed=mergeGeometry(linked,next).project;
assert.equal(removed.conductors.length,0);
let h=createHistory(linked);h=historyReducer(h,{type:'apply',value:removed});
h=historyReducer(h,{type:'undo'});assert.deepEqual(h.present,linked);
```

- [ ] Confirmar fallos y construir operaciones inmutables que terminen en validateConnectedProject. mergeGeometry preservará referencias por ID; solo añadidos reciben freeReference, borrados eliminan enlaces/posiciones, y las posiciones de equipos existentes se conservan. Para la posición de un añadido buscar una celda libre de la cuadrícula, ampliando su altura cuando sea necesario. Conductor nuevo: UUID, referencia W libre y primer color de paleta; edición sin sección debe quitar el campo opcional.
- [ ] Elevar useProjectHistory al proveedor. Aplicar solo cambios efectivos, liberando protección después de validación; importación válida puede resetear historial y liberar protección. El guardado se suspende durante drag. Protección permanece si hay selección/no-op. El proveedor debe montar sobre module-content para sobrevivir a navegación.

```tsx
const initial=useState(()=>recoverConnected(storage))[0];
const history=useProjectHistory(()=>initial.project);
function apply(result:ProjectResult){
 if(!result.ok){setNotice(result.error);return false;}
 if(JSON.stringify(result.project)===JSON.stringify(history.present))return true;
 const valid=validateConnectedProject(result.project);
 if(!valid.ok){setNotice(valid.error);return false;}
 history.setPresent(valid.project);setProtectedRecovery(false);return true;
}
```

- [ ] Adaptar todos los caminos físicos (añadir/duplicar/eliminar/inspector/drag/reset) pasando por geometrySnapshot y mergeGeometry. Dar a PhysicalInspector el snapshot con referencias estables. Antes de borrar equipo conectado usar confirmación con recuento. Mantener importación v1 en Cabinet; readProject dirige v2 migrado y v3 al proveedor. Retirar el autosave v2 solo del nuevo flujo físico; no borrar su clave ni el código de lectura antiguo probado.
- [ ] Verificar atajos de historial activos solo en la vista correspondiente; cancelar drag al desmontar. Ejecutar pruebas y build; commit `feat: share project operations and history across workspaces`.

## Tarea 4 — Cablear desde el cuadro con teclado y puntero

**Files:** crear terminalGeometry.ts, TerminalLayer.tsx, ConnectionPanel.tsx y tests/terminalGeometry.test.mjs; modificar PhysicalCanvas.tsx, PhysicalCabinet.tsx, style.css.

**Interfaces:** `terminalPoint(p:ConnectedProject,end:Endpoint,view:'physical'|'schematic'):{x:number;y:number}`; TerminalLayer recibe project, view, pending:Endpoint|null, selectedConductorId:string|null, onTerminal(endpoint), onConductor(id). ConnectionPanel recibe project, selectedItemId, selectedConductorId, onSelectConductor y onApply(result). Usa operaciones de tarea 3.

- [ ] Escribir pruebas de posición: T1 arriba/T2 abajo del centro de la huella, centro X calculado con footprint; cambiar X/Y mueve los extremos, mover esquema no afecta los físicos; carril y borne desconocido producen error explícito, no coordenadas NaN. Ejecutar y confirmar fallos.
- [ ] Implementar terminalPoint y un recorrido de línea determinista con tramo vertical/horizontal entre extremos, sin puntos de unión en cruces:

```ts
const a=terminalPoint(p,c.from,view),b=terminalPoint(p,c.to,view);
const mid=(a.y+b.y)/2;
const path=`M${a.x} ${a.y}V${mid}H${b.x}V${b.y}`;
```

- [ ] Incorporar modo Distribuir/Cablear. En Cablear deshabilitar el inicio de drag; un clic/Enter en borne fija origen, el segundo llama addConductor. Éxito limpia pending; rechazo muestra error y conserva origen. Escape y botón cancelar limpian pending sin historial. Puntos con role button, tabIndex, etiqueta «referencia · borne», foco visible y área de interacción ampliada. Las etiquetas del conductor y la lista complementarán el color.
- [ ] Construir formulario de selectores con origen/destino y submit, sin depender del SVG. Al cambiar equipo ajustar su selector de borne; validar otra vez al enviar. Lista global seleccionable y lista del equipo. Formulario de edición con referencia, paleta y sección opcional; número vacío elimina sectionMm2, no se convierte a cero.

```tsx
<form onSubmit={e=>{e.preventDefault();onApply(addConductor(project,from,to));}}>
 <label>Equipo de origen<select aria-label="Equipo de origen" /></label>
 <label>Borne de origen<select aria-label="Borne de origen" /></label>
 <label>Equipo de destino<select aria-label="Equipo de destino" /></label>
 <label>Borne de destino<select aria-label="Borne de destino" /></label>
 <button type="submit">Crear conductor</button>
</form>
```

- [ ] Organizar ConnectionPanel en el inspector existente; lista larga con desplazamiento propio y texto ajustable. Conservar reglas tablet/mobile de la entrega anterior. Verificar creación, duplicado rechazado, edición vacía y cancelación con teclado/puntero; ejecutar pruebas/build y commit `feat: connect didactic terminals in the cabinet workspace`.

## Tarea 5 — Esquema del mismo proyecto

**Files:** crear SchematicCanvas.tsx y ProjectSchematic.tsx; modificar App.tsx y style.css; mantener Editor.tsx como Topología anterior.

**Interfaces:** ProjectSchematic consume useConnectedProject; SchematicCanvas recibe project, selectedItemId, onSelect, onBeginDrag, onPreviewMove(itemId,x,y), onFinishDrag, onCancelDrag y props de TerminalLayer. Usa moveSchematic de tarea 3 y terminalPoint de tarea 4.

- [ ] Añadir pruebas a connections.test.mjs: mover esquema modifica solo schematic; posiciones fuera de margen/no finitas rechazadas; 100 previews seguidos cuentan como una acción; cancelación restaura estado y redo. Ejecutar y confirmar el fallo que corresponda antes de ampliar operaciones.
- [ ] Dibujar bloques con referencia, nombre, bornes y nota didáctica. viewBox 800 y altura dinámica definida en tarea 1. Reutilizar TerminalLayer y ConnectionPanel: no copiar modelos/conductores a un estado independiente. Aplicar coordenadas con getScreenCTM().inverse(), capturar puntero y cancelar en pointercancel/lostcapture. Durante drag actualizar solo posiciones de esquema del proyecto base.

```tsx
const next=moveSchematic(base,itemId,x,y);
if(next.ok)shared.preview(next.project);
// pointerup -> shared.finishDrag(); pointercancel/unmount -> shared.cancelDrag()
```

- [ ] Cambiar la pestaña Esquemas para ofrecer ambos submodos y ajustar su descripción. La topología antigua sigue usando su almacenamiento. Al cambiar de vista limpiar borne pendiente y selección de cable obsoleta. Ofrecer orden inicial por cuadrícula únicamente al migrar/añadir; no recolocar automáticamente equipos existentes.
- [ ] En navegador: crear W1 en cuadro, ir a esquema, editar W1, volver al cuadro y deshacer/rehacer. Iniciar conexión y cambiar de módulo: no aparece conductor fantasma. Comprobar también abandono de drag y referencia estable tras borrar otro equipo. Ejecutar pruebas/build y commit `feat: show shared devices and conductors in schematic view`.

## Tarea 6 — Exportaciones, comprobación y entrega

**Files:** crear connectionExports.ts y tests/connectionExports.test.mjs; modificar acciones en PhysicalCabinet.tsx/ProjectSchematic.tsx y README.md. Guardar capturas y registro de validación en outputs.

**Interfaces:** `connectionsCsv(p:ConnectedProject):string`, `connectedPhysicalSvg(p:ConnectedProject,view:PhysicalView):string`, `schematicSvg(p:ConnectedProject):string`. Consumir xml y physicalSvg existentes, geometría compartida y referencias persistidas. La lista de materiales seguirá usando physicalCsv(geometrySnapshot(p)).

- [ ] Escribir pruebas antes de implementación: una fila por cable y mismos extremos que JSON; BOM/separador/escapado; secciones vacías; referencias con &<>" y prefijos de fórmula; SVG contiene las mismas referencias y ninguna selección/zoom; roundtrip JSON con texto multibyte próximo al límite.

```js
const csv=connectionsCsv(p);
assert.equal(csv.charCodeAt(0),0xfeff);
assert.ok(csv.includes('"Borne de origen"'));
const svg=schematicSvg(p);
assert.ok(svg.includes('&amp;'));assert.ok(!svg.includes('aria-pressed'));
assert.deepEqual(readProject(JSON.stringify(p)).project,p);
```

- [ ] Implementar CSV con referencia del conductor, equipo/borne de origen y destino, color y sección; escapar todas las celdas, anteponer apóstrofo a cadenas que comienzan con fórmula. SVG usará terminalPoint y el mismo recorrido de TerminalLayer, xml para textos, dimensiones dinámicas y descripción didáctica. JSON usa formato v3 compacto validado antes de descarga.
- [ ] Añadir botones «Lista de conexiones (CSV)» y «Exportar esquema (SVG)», conservando materiales y exportación del cuadro. Actualizar README con migración, clave nueva, límites, flujo de teclado, protección y alcance didáctico.
- [ ] Ejecutar `npm test`, `npm run build` y `git diff --check`. No marcar aprobado un resultado que no se haya observado.
- [ ] Comprobar navegador a 1440, 1024 y 390 px: logo, inspector próximo al canvas, textos legibles, foco visible, selectores funcionales y scrollWidth no superior al viewport. Revisar SVG/CSV descargados y reimportación de JSON. Verificar recuperación corrupta y error de almacenamiento sin perder datos.
- [ ] Solicitar una revisión independiente de la rama según requesting-code-review; resolver hallazgos pertinentes y volver a ejecutar las comprobaciones afectadas. Guardar resultados reales, capturas y limitaciones del ensayo.
- [ ] Commit `feat: export shared connections and document workflow`. Integrar siguiendo la autorización vigente y finishing-a-development-branch, verificando el estado remoto antes de actualizarlo y la CI posterior. Actualizar preview 4185 solo con la compilación verificada. Informar lo implementado, evidencia y límites.

## Revisión del plan

El formato y la compatibilidad corresponden a tareas 1–2; operaciones, persistencia e historial a tarea 3; organización y accesibilidad a tarea 4; relación cuadro/esquema a tarea 5; exportaciones y validación visual a tarea 6. Los cinco riesgos de Review Focus tienen comprobaciones asignadas. No se añaden dependencias ni se convierten los enlaces del editor antiguo. El usuario debe revisar este plan antes de comenzar su ejecución.
