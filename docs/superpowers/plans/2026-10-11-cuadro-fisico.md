# Plan de implementación del cuadro físico de ElectroLab

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir un diseñador de cuadros con geometría coherente en milímetros y pruebas, conservando los proyectos ilustrativos existentes.

**Architecture:** Un modelo v2 independiente de React contiene envolvente, placa, catálogo y dispositivos. Geometría, serialización e historial son funciones puras. Cabinet actúa como selector entre el adaptador v1 y el diseñador físico; las dos variantes tienen almacenamiento independiente y conservan la marca ElecWizard.

**Tech Stack:** React 19, TypeScript 5.8, Vite 7, Node.js 22 en CI, pruebas con node:test y node:assert/strict. No se añade una biblioteca de pruebas ni dependencias de producción.

**Spec:** `docs/superpowers/specs/2026-10-11-cuadro-fisico-design.md`, aprobada el 11 de octubre de 2026.

## Global Constraints

- «Las posiciones, anchuras y alturas se expresarán en milímetros; el zoom pertenecerá a la presentación».
- «La clave electrolab-cabinet-v01 y el formato versión 1 seguirán disponibles».
- «No se realizará conversión automática entre ellos».
- «Se conservará el límite actual de 150 elementos por proyecto».
- «Se conservará el límite de 50 pasos».
- «La reserva entre equipos será configurable y empezará en cero».
- «Un archivo inválido no reemplazará el proyecto abierto».
- «Las pruebas se ejecutan en GitHub antes de la compilación. Ambas deben pasar antes de publicar la entrega».
- Ejemplo físico: envolvente 600 × 800 mm; placa 550 × 750 mm en x=25, y=25 mm. Márgenes y medidas de catálogo identificados como didácticos.
- No añadir fotografías, marcas de fabricante, bornes conectables, simulación ni afirmaciones normativas en esta entrega.

## Review Focus

1. Geometría fraccionaria y contacto exacto entre bordes: conservar decimales y permitir contacto sin penetración; pruebas en tarea 2.
2. Huecos discontinuos: una suma de espacio libre no garantiza que quepa un aparato; pruebas de intervalos en tarea 2.
3. Cancelación o rechazo de arrastre tras muchos movimientos: recuperar el estado inicial sin agotar historial; pruebas en tarea 4.
4. Deshacer y editar: limpiar rehacer y conservar la nueva acción en deshacer, incluida la variante v1; pruebas en tarea 4.
5. localStorage bloqueado o importación inválida: informar del fallo y conservar el proyecto en memoria; pruebas en tarea 3 y comprobación de integración en tarea 5.

## Estructura de archivos

| Archivo | Responsabilidad |
| --- | --- |
| src/cabinet/model.ts | Tipos, catálogo didáctico y proyecto de ejemplo v2 |
| src/cabinet/geometry.ts | Huellas, límites, colisiones, carriles y transformaciones |
| src/cabinet/legacy.ts | Tipos y validación v1, sin conversión |
| src/cabinet/serialization.ts | Validación completa, importación y JSON |
| src/cabinet/storage.ts | Lectura y escritura con resultados explícitos |
| src/cabinet/history.ts | Historial genérico y transacciones de arrastre |
| src/cabinet/exports.ts | Contenido SVG y CSV del modo físico |
| src/cabinet/useProjectHistory.tsx | Adaptador React del historial puro |
| src/LegacyCabinet.tsx | Interfaz ilustrativa actual conservada |
| src/PhysicalCabinet.tsx | Estado e interacción del proyecto físico |
| src/cabinet/PhysicalCanvas.tsx | Render SVG y representación visual |
| src/cabinet/PhysicalInspector.tsx | Formularios de geometría y selección |
| src/Cabinet.tsx | Selector de formato e importación común |
| src/cabinet/CabinetModeSwitch.tsx | Selector reutilizable de los dos modos |
| tests/*.test.mjs | Pruebas de los módulos puros compilados |
| tests/fixtures.mjs | Proyectos pequeños reutilizables |
| tsconfig.tests.json | Compilación aislada de módulos puros para Node |

Cada tarea termina con una revisión del cambio y un commit local. Antes de publicarlos se revisará el conjunto y se comprobará que main no ha cambiado. No incluir archivos temporales, cachés ni node_modules.

## Tarea 1 Modelo v2 y primera prueba

**Files:** Crear `src/cabinet/model.ts`, `tests/model.test.mjs`, `tsconfig.tests.json`. Modificar `package.json` y `.gitignore`.

**Interfaces:** Exportar los tipos siguientes y las funciones `createPhysicalProject(): PhysicalProject`, `modelFor(project: PhysicalProject, item: PhysicalItem): DeviceModel`.

```ts
export type Kind = 'breaker'|'rcd'|'contactor'|'overload'|'terminal'|'rail'|'duct';
export type PointMm = {xMm:number; yMm:number};
export type RectMm = PointMm & {widthMm:number; heightMm:number};
export type DeviceModel = {
  id:string; kind:Kind; name:string; ref:string;
  widthMm:number; heightMm:number; depthMm:number; didactic:true;
};
export type PhysicalItem = PointMm & {
  id:string; modelId:string; railId?:string; lengthMm?:number;
};
export type PhysicalProject = {
  format:'electrolab-cabinet'; version:2; id:string;
  envelope:{widthMm:number; heightMm:number}; plate:RectMm;
  reserveMm:number; models:DeviceModel[]; items:PhysicalItem[];
};
```

- [ ] Crear el comando `test` con `tsc -p tsconfig.tests.json && node --test` y excluir `.test-build/` y `*.tsbuildinfo` en `.gitignore`.
- [ ] Crear la configuración de compilación: target ES2022, module y moduleResolution NodeNext, rootDir src, outDir .test-build, strict y skipLibCheck true, noEmit false; incluir únicamente `src/cabinet/**/*.ts`. Los módulos puros importarán sus dependencias con extensión `.js`, resuelta por TypeScript.
- [ ] Escribir la prueba antes del modelo y ejecutarla con `node --test tests/model.test.mjs`; debe fallar por módulo compilado ausente. Después de implementar el modelo, utilizar `npm test` para compilarlo y ejecutar la suite.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {createPhysicalProject} from '../.test-build/cabinet/model.js';
test('el ejemplo usa placa y envolvente explícitas',()=>{
  const p=createPhysicalProject();
  assert.deepEqual(p.envelope,{widthMm:600,heightMm:800});
  assert.deepEqual(p.plate,{xMm:25,yMm:25,widthMm:550,heightMm:750});
  assert.equal(p.reserveMm,0);
  assert.equal(new Set(p.items.map(i=>i.id)).size,p.items.length);
});
```

- [ ] Implementar los siete modelos con las dimensiones didácticas ya presentes en Cabinet: breaker 17.5×85×70, rcd 35×85×70, contactor 45×85×90, overload 45×75×80, terminal 6×50×45, rail 360×35×7.5 y duct 40×300×40 mm. Usar IDs de modelo constantes y `crypto.randomUUID()` para nuevos proyectos y elementos. `modelFor` rechaza un modelo inexistente.
- [ ] Crear el ejemplo con un carril de 360 mm en (75,200), magnetotérmico en (80,175), diferencial en (97.5,175) y contactor en (132.5,175); relacionar los tres aparatos con el carril. Estos centros verticales coinciden con el centro del carril en y=217.5.
- [ ] Ejecutar `npm test` y `npm run build`; revisar y hacer commit `feat: define physical cabinet model`.

## Tarea 2 Geometría física y operaciones de montaje

**Files:** Crear `src/cabinet/geometry.ts`, `tests/geometry.test.mjs`, `tests/fixtures.mjs`.

**Interfaces:** `footprint(project,item): RectMm`; `contains(outer,inner): boolean`; `overlaps(a,b): boolean`; `validatePlacement(project): string[]`; `findRailSlot(project,item,rail,preferredX): PointMm|null`; `resizeRail(project,railId,lengthMm): {ok:true;project:PhysicalProject}|{ok:false;error:string}`; `resizeCabinet(project,envelope,plate)` con el mismo resultado. La UI recibe mensajes en español.

También exportar `createTransform(envelope,viewport,zoom): Transform`, `mmToSvg(point,transform)` y `svgToMm(point,transform)`. `viewport` contiene width y height positivos; Transform contiene scale, offsetX y offsetY. Ajustar la envolvente completa uniformemente al viewport y aplicar zoom desde el centro.

- [ ] Escribir pruebas de bordes, decimales, zoom, inversión y huecos; ejecutar `npm test` y observar fallos.

```js
test('dos aparatos contiguos no colisionan',()=>{
  const a={xMm:25,yMm:25,widthMm:17.5,heightMm:85};
  assert.equal(overlaps(a,{...a,xMm:42.5}),false);
  assert.equal(overlaps(a,{...a,xMm:42.49}),true);
});
test('la transformación conserva las coordenadas con zoom',()=>{
  for(const zoom of [0.7,1,1.5]){
    const t=createTransform({widthMm:600,heightMm:800},{width:720,height:520},zoom);
    const p={xMm:132.5,yMm:217.5};
    const recovered=svgToMm(mmToSvg(p,t),t);
    assert.ok(Math.abs(recovered.xMm-p.xMm)<1e-9);
    assert.ok(Math.abs(recovered.yMm-p.yMm)<1e-9);
  }
});
```

- [ ] Implementar huellas con dimensions del modelo; para carriles usar lengthMm como anchura. La placa debe quedar dentro de la envolvente, y todos los elementos dentro de la placa. Rechazar referencias railId que no sean carriles. Los aparatos montados deben estar contenidos horizontalmente y centrados verticalmente sobre su carril.
- [ ] Para solapamientos usar desigualdades estrictas. Permitir aparato sobre su propio carril; comprobar interferencias con canaletas, otros aparatos y elementos de otros carriles. Rechazar carriles o canaletas superpuestos entre sí.

```ts
export function overlaps(a:RectMm,b:RectMm){
  return a.xMm<b.xMm+b.widthMm && a.xMm+a.widthMm>b.xMm &&
    a.yMm<b.yMm+b.heightMm && a.yMm+a.heightMm>b.yMm;
}
```

- [ ] Buscar huecos por intervalos ordenados de los aparatos ya montados, aplicando reserveMm. Evaluar cada hueco en orden de cercanía a preferredX, y comprobar la huella contra todos los obstáculos. Añadir una prueba con dos huecos de 10 mm y un aparato de 17.5 mm: no debe caber aunque la suma libre sea 20 mm.
- [ ] Mover un carril desplaza sus aparatos por el mismo vector y valida el conjunto atómicamente. Eliminar un carril con aparatos se rechaza con explicación; el usuario retira primero los aparatos. Acortar o reducir placa se rechaza sin modificar el original. Probar un carril de 600 mm en placa de 550 mm y una reducción que expulse un aparato.
- [ ] Ejecutar tests y build; revisar y hacer commit `feat: add millimetre geometry and rail constraints`.

## Tarea 3 Compatibilidad, validación y almacenamiento

**Files:** Crear `src/cabinet/legacy.ts`, `serialization.ts`, `storage.ts`, `tests/serialization.test.mjs`, `tests/storage.test.mjs`.

**Interfaces:** `LegacyItem` conserva exactamente id numérico, kind, x, y y lengthMm opcional. `LegacyProject` contiene format, version:1 e items. `parseProject(text): {ok:true;project:LegacyProject|PhysicalProject}|{ok:false;code:'json'|'format'|'version'|'geometry'|'references';error:string}`. `serializeProject(project): string`. `StorageLike` contiene getItem y setItem. `readStored(storage,key)` y `writeStored(storage,key,value)` devuelven resultados explícitos y capturan excepciones.

- [ ] Escribir pruebas de ida y vuelta v1/v2 y rechazo de entradas corruptas. Ejecutar y confirmar fallos.

```js
test('v1 conserva coordenadas e identificadores sin conversión',()=>{
  const original={format:'electrolab-cabinet',version:1,
    items:[{id:7,kind:'rail',x:115,y:180,lengthMm:360}]};
  const loaded=parseProject(JSON.stringify(original));
  assert.equal(loaded.ok,true);
  assert.deepEqual(JSON.parse(serializeProject(loaded.project)),original);
});
test('el almacenamiento bloqueado informa del fallo',()=>{
  const storage={getItem(){throw Error('blocked')},setItem(){throw Error('quota')}};
  assert.equal(writeStored(storage,'electrolab-cabinet-v02','{}').ok,false);
  assert.equal(readStored(storage,'electrolab-cabinet-v02').ok,false);
});
```

- [ ] Extraer la validación v1 existente conservando los mismos tipos y límites, incluida la comprobación de superposición visual al importar. No reinterpretar dimensiones ni convertir posiciones.
- [ ] Validar v2 por completo antes de producir un proyecto: máximo 150 items, dimensiones finitas positivas, posiciones finitas, reserva finita no negativa, IDs no vacíos y únicos, siete kinds conocidos, modelos didácticos, relaciones válidas y validatePlacement sin errores. No aceptar `null`, strings numéricos, modelos desconocidos ni versiones distintas de 1 y 2.
- [ ] Usar claves v01 y v02 independientes. Capturar también el acceso a window.localStorage en la UI, pues su getter puede lanzar una excepción. Si el guardado falla, conservar el proyecto en memoria y mostrar «No se pudo guardar en este navegador. Exporta el JSON para conservar tu trabajo».
- [ ] Añadir casos de IDs duplicados, posiciones infinitas en objetos de validación, JSON truncado, versión 3 y railId ausente. Los tests deben comprobar que el proyecto anterior sigue intacto al rechazar una importación.
- [ ] Ejecutar tests y build; revisar y hacer commit `feat: validate versioned cabinet projects and storage`.

## Tarea 4 Historial transaccional probado

**Files:** Crear `src/cabinet/history.ts`, `useProjectHistory.tsx`, `tests/history.test.mjs`. Integración en las interfaces en tareas 5 y 6.

**Interfaces:** `createHistory<T>(initial:T): History<T>` con present, past, future y beforeDrag:T|null. `historyReducer<T>(state,action): History<T>`. Acciones: apply con value:T, beginDrag, preview con value:T, finishDrag, cancelDrag, undo, redo y reset con value:T. El adaptador React expone present, setPresent(value o updater), beginDrag, finishDrag, cancelDrag, undo, redo, reset, canUndo y canRedo.

- [ ] Escribir y ejecutar la prueba de ramificación y las pruebas de arrastre.

```js
test('deshacer seguido de edición crea una rama que se puede deshacer',()=>{
  let h=createHistory({x:0});
  h=historyReducer(h,{type:'apply',value:{x:1}});
  h=historyReducer(h,{type:'undo'});
  h=historyReducer(h,{type:'apply',value:{x:2}});
  assert.equal(h.future.length,0);
  h=historyReducer(h,{type:'undo'});
  assert.deepEqual(h.present,{x:0});
});
test('cien previews de un arrastre son un único paso',()=>{
  let h=historyReducer(createHistory({x:0}),{type:'beginDrag'});
  for(let x=1;x<=100;x++)h=historyReducer(h,{type:'preview',value:{x}});
  h=historyReducer(h,{type:'finishDrag'});
  assert.equal(h.past.length,1);
  assert.deepEqual(historyReducer(h,{type:'undo'}).present,{x:0});
});
```

- [ ] Implementar acciones inmutables. apply durante arrastre actúa como preview; finishDrag añade beforeDrag al historial solo si cambió el contenido. cancelDrag devuelve beforeDrag y conserva past/future. Un gesto rechazado llama cancelDrag. En ambos casos limpiar beforeDrag. Recortar past a sus 50 entradas más recientes.
- [ ] Durante un arrastre, los botones y atajos de undo/redo estarán desactivados; cancelación se resuelve antes de otra acción. Capturar y soltar el puntero; pointercancel y lostpointercapture cancelan una transacción activa. El cierre correcto limpia la transacción antes de lostpointercapture.
- [ ] Probar cancelación, arrastre sin cambios, redo consecutivo, edición tras redo, reset y límite de 50. Ejecutar la prueba de ramificación con un array LegacyItem y un proyecto v2 para cubrir ambas variantes.
- [ ] Ejecutar tests y build; revisar y hacer commit `feat: add transactional cabinet history`.

## Tarea 5 Selector de modos y adaptador ilustrativo

**Files:** Mover la interfaz actual a `src/LegacyCabinet.tsx`. Modificar `src/Cabinet.tsx`, crear `src/cabinet/CabinetModeSwitch.tsx`, `tests/routing.test.mjs` y una función pura `projectMode(project)` en serialization.ts que retorna illustrative o physical.

**Interfaces:** `LegacyCabinet({importedProject?,onRequestImport,active})` recibe una importación ya validada y usa el almacenamiento v01. `CabinetModeSwitch({mode,onChange})` es un componente independiente con modos illustrative y physical. En esta tarea Cabinet solo monta LegacyCabinet y el importador v1: no importa PhysicalCabinet antes de que exista. La selección e importación v2 se conectan en tarea 6, cuando ambos componentes funcionan.

- [ ] Escribir la prueba de enrutamiento antes de cambiar la interfaz.

```js
test('la versión determina el modo sin convertir el proyecto',()=>{
  assert.equal(projectMode({format:'electrolab-cabinet',version:1,items:[]}),
    'illustrative');
  assert.equal(projectMode(createPhysicalProject()),'physical');
});
```

- [ ] Extraer la interfaz v1 preservando catálogo, render, fórmulas y exportaciones. Sustituir solamente su historial por useProjectHistory, su acceso de almacenamiento por los helpers seguros y su importación por la solicitud común. Los controles existentes siguen llamando las mismas operaciones de colocación y duplicación.
- [ ] Preparar importador común: máximo 100 KB, leer file.text y parseProject, informar error sin cambiar estado. En esta tarea aceptar v1; si llega v2, indicar que el modo físico aún no está disponible y conservar el proyecto. El despacho de v2 se activa en tarea 6. Extraer los listeners de teclado para que solo funcionen con active=true.
- [ ] Crear el selector con el siguiente JSX; montarlo en Cabinet solo durante tarea 6, evitando controles hacia una interfaz incompleta.

```tsx
<div role="group" aria-label="Tipo de cuadro">
  <button aria-pressed={mode==='illustrative'} onClick={()=>setMode('illustrative')}>
    Cuadro ilustrativo
  </button>
  <button aria-pressed={mode==='physical'} onClick={()=>setMode('physical')}>
    Cuadro a escala · mm
  </button>
</div>
```

- [ ] Verificar con el navegador un diseño v1 guardado antes del cambio: cargar, seleccionar, añadir, arrastrar, deshacer, rehacer, editar tras deshacer, exportar e importar. Confirmar que las posiciones del ejemplo son exactamente 115/180, 120/138, 175/138 y 268/133 en los elementos originales.
- [ ] Ejecutar tests y build; revisar y hacer commit `refactor: preserve legacy cabinet behind mode selector`.

## Tarea 6 Interfaz física, formularios y exportaciones

**Files:** Crear `src/PhysicalCabinet.tsx`, `src/cabinet/PhysicalCanvas.tsx`, `PhysicalInspector.tsx`, `exports.ts`, `tests/exports.test.mjs`. Modificar `src/style.css`.

**Interfaces:** `PhysicalCanvas({project,selectedId,view,zoom,onSelect,onBeginDrag,onPreviewMove,onFinishDrag,onCancelDrag})`; view es illustrated o technical. `PhysicalInspector({project,selectedId,onApplyProject})`; onApplyProject recibe un proyecto validado completo. Exports ofrece `physicalSvg(project,view): string` y `physicalCsv(project): string` sin APIs DOM.

`PhysicalCabinet({importedProject?,onRequestImport,active})` aplica el contrato de importación y actividad preparado en tarea 5. Cabinet monta ahora CabinetModeSwitch, mantiene ambas variantes montadas, oculta la inactiva con hidden y entrega active=false a sus listeners. El importador común pasa a despachar v1 o v2 según projectMode y cambia de modo solo después de validar. Al importar, una revisión de importación identifica el evento para cargar el proyecto una sola vez y reiniciar su historial; seleccionar el modo por sí solo no reinicia nada.

- [ ] Escribir primero pruebas de contenido y dimensiones exportadas, ejecutar y confirmar fallos.

```js
test('SVG físico conserva la relación de la envolvente y el alcance educativo',()=>{
  const svg=physicalSvg(createPhysicalProject(),'technical');
  assert.match(svg,/viewBox="0 0 600 800"/);
  assert.match(svg,/<desc>.*educativ/i);
});
test('CSV usa la longitud del carril colocado',()=>{
  const p=createPhysicalProject();
  p.items.find(i=>i.lengthMm!==undefined).lengthMm=300;
  const csv=physicalCsv(p);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv,/300/);
});
```

- [ ] Implementar SVG con viewBox de la envolvente, rectángulos en mm y etiquetas de referencia. Técnica: contornos y referencias; ilustrada: rellenos y detalles simples dentro de las mismas huellas. Escape de textos XML en exportaciones. Describir medidas didácticas y alcance educativo. Exportar todo el cuadro, sin incorporar zoom ni selección.
- [ ] Construir la biblioteca por las cuatro categorías actuales; añadir carril en una fila sin interferencias, aparatos mediante findRailSlot y canaletas dentro de la placa. No añadir nada si no existe espacio. Añadir un selector de reserva en mm y validar antes de aplicar.
- [ ] Implementar edición de X/Y, longitud de carril, envolvente y placa con valores provisionales de formulario y botón «Aplicar medidas». No modificar el proyecto por cada carácter. Los formularios indican mm y los errores explican elemento y límite. Aplicar una única acción de historial por envío correcto.
- [ ] Implementar duplicación sobre el mismo carril, ordenación por X con reserva, eliminación y zoom 0.7–1.5. Validar todos los movimientos; una operación de grupo se acepta o rechaza completa. Guardar por efecto con almacenamiento seguro. El inspector muestra primero las propiedades, después revisión y ocupación.
- [ ] Conectar el puntero mediante svg.getScreenCTM().inverse() y la transformación inversa del zoom. Conservar el desplazamiento entre puntero y esquina del elemento; convertir a mm sin redondear al píxel. Para un aparato cerca de un carril, proponer encaje a su centro dentro de 20 mm; si no cabe, cancelar con aviso. Un aparato movido libremente pierde railId; el usuario ve que está sin montar.
- [ ] Implementar CSV con BOM, separador punto y coma, filas agrupadas por modelo y dimensiones colocadas. Carriles con distinta longitud usan filas distintas. Incluir cantidades, ancho o longitud por unidad, total y nota didáctica. Escapar comillas y tratar prefijos =, +, - y @ en textos importados para que Excel no los ejecute como fórmulas.
- [ ] Usar aria-label en zoom, aria-pressed en representación y referencias legibles fuera de huellas estrechas. Mantener foco visible, organización responsive existente y reduced-motion. Mensajes de error con role=status; guardado correcto solo tras escritura exitosa.
- [ ] Verificar navegador: nuevo v2, cambios de tamaño válidos e inválidos, carril 600 mm rechazado, selección, ambos estilos, duplicar, ordenar, arrastre, cancelación, historial, alternar modos, recargar y exportar/importar JSON. Comprobar que v1 sigue guardado separado.
- [ ] Ejecutar tests y build; revisar y hacer commit `feat: add physical cabinet workspace and exports`.

## Tarea 7 Validación conjunta y publicación

**Files:** Modificar `.github/workflows/ci.yml`, `README.md` y `docs/MARCA_VINWIZARD.md`. Añadir fixtures de regresión a tests si una comprobación manual encuentra un fallo.

- [ ] Añadir antes de TypeScript and Vite build un paso `run: npm test` conservando Node 22 y los triggers actuales.
- [ ] Ejecutar `npm test`, `npm run build` y `git diff --check`. Revisar los resultados completos y el alcance de cada prueba.
- [ ] Revisar manualmente las cuatro pestañas en 1440×1000, 1024×900 y 390×844. Comprobar que la anchura de documento no supera el viewport, que las referencias estrechas son legibles y que los campos de edición no activan atajos de historial.
- [ ] Exportar y reimportar v1 y v2; comparar IDs, coordenadas y dimensiones. Comprobar SVG y CSV con dos carriles de distintas longitudes y reserva distinta de cero. Comprobar pointercancel antes de terminar un gesto y edición tras undo.
- [ ] Revisar el diff completo con un revisor independiente, corregir problemas relevantes y repetir solo los checks afectados. Confirmar que el logo ElecWizard sigue siendo el PNG original.
- [ ] Documentar en README modos, claves, formatos, comandos de pruebas y alcance didáctico; actualizar el texto de marca para describir la organización física.
- [ ] Hacer commit `test: verify physical cabinet compatibility in CI`. Publicar solo después de los checks locales; confirmar SHA de main y CI del mismo commit. Si CI falla, corregir y verificar antes de declarar entrega terminada.

## Cobertura de la especificación y estado de ejecución

Modelo, catálogo y límites: tareas 1–3. Compatibilidad, importación y almacenamiento: tareas 3 y 5. Historial: tarea 4. Interfaz, montaje, dos representaciones y exportaciones: tareas 2 y 6. Navegación y tablet: tareas 5–7. Pruebas antes de compilación: tarea 7. No se implementa conversión v1→v2 ni se añaden subsistemas eléctricos fuera de esta entrega.

Implementado mediante ejecución directa y una revisión independiente del conjunto. Las 23 pruebas de regresión y la compilación pasan. Se conservaron los proyectos v1; se comprobaron importación y exportaciones de ambos formatos, arrastre y deshacer/rehacer, geometría fraccionaria y distribución en 1440, 1024 y 390 px. La cancelación de transacciones se cubre con pruebas del historial; no se sintetizó pointercancel táctil en el navegador.
