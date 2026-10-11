# ElectroLab ⚡

Aplicación web educativa para aprender electricidad mediante circuitos interactivos. Primer prototipo: interruptor, lámpara, avería de conductor y ley de Ohm.

## Ejecutar

Requiere Node.js 20.19+ o 22.12+.

```bash
npm install
npm run dev
```

Abre la URL local indicada por Vite.

## Alcance

El modelo eléctrico inicial es didáctico e idealizado; no constituye un simulador general de redes ni un plano de instalación. La simbología del profesor y los esquemas UNE/IEC se incorporarán en iteraciones posteriores.

## Cuadros eléctricos

El selector ofrece dos formatos independientes:

- **Cuadro ilustrativo:** conserva diseños anteriores, posiciones SVG y JSON versión 1. Guardado en `electrolab-cabinet-v01`.
- **Cuadro a escala · mm:** JSON versión 2 con envolvente, placa útil, catálogo didáctico y aparatos. Guardado en `electrolab-cabinet-v02`.

Cambiar de modo no convierte ni sobrescribe el otro cuadro. Importar JSON abre el modo correspondiente solo tras validar el archivo (máximo 100 KB y 150 elementos). Cada modo exporta JSON, SVG y CSV. El CSV físico agrupa carriles por su longitud colocada.

Añade primero carriles y después equipos. Selecciona un aparato para editar X/Y o su montaje; selecciona un carril para modificar su longitud u ordenar equipos. Abre «Medidas del cuadro» para editar envolvente, placa y reserva. «Aplicar medidas» acepta la operación completa o conserva el cuadro anterior con un aviso.

Las dos representaciones usan idénticas huellas en milímetros. Las medidas iniciales y del catálogo son educativas, sin atribución a fabricantes ni validación eléctrica. El ejemplo usa envolvente 600 × 800 mm y placa 550 × 750 mm con márgenes de 25 mm. La reserva empieza en cero. Las comparaciones geométricas admiten una tolerancia numérica de 0,000000001 mm para evitar falsos solapamientos por aritmética decimal.

Deshacer/rehacer conserva hasta 50 acciones. Un arrastre cuenta como una acción; cancelarlo recupera el estado inicial. Los atajos no actúan dentro de campos de edición. Si el almacenamiento falla, el proyecto sigue en memoria y se muestra un aviso para exportarlo. Una recuperación fallida conserva los datos originales hasta una edición o importación explícita.

## Bornes, conductores y esquema compartido (V0.5)

El cuadro a escala y «Esquema del cuadro» comparten equipos, referencias y conductores. Cada vista conserva sus propias posiciones; cambiar de módulo mantiene el historial durante la sesión. «Topología anterior» conserva el editor previo y sus datos.

En **Distribuir** puedes mover equipos y editar medidas. En **Cablear** pulsa el borne de origen y luego el destino; también puedes elegir ambos extremos en los selectores agrupados por equipo. Escape o «Cancelar conexión» cancela el origen pendiente. Las conexiones aparecen en una lista desde la que puedes editar referencia, color y sección opcional, o eliminar un conductor. La sección es una anotación del usuario; no se calcula ni se dimensiona.

Los modelos actuales usan bornes genéricos T1 y T2, de carácter didáctico. El esquema muestra bloques y enlaces, sin simulación, contactos internos, datos de fabricante ni simbología normalizada. Los cruces de líneas no conectan conductores y no se calculan recorridos por canaleta ni longitudes.

Las referencias visibles se guardan y permanecen estables al reorganizar o eliminar equipos. Duplicar asigna una referencia libre y no copia conductores. Eliminar un equipo conectado muestra una confirmación con el número de conductores afectados; Deshacer recupera todo en una acción.

El JSON compartido es **versión 3**, con límite de 150 elementos, 200 conductores y 100 KB. Se guarda en **electrolab-project-v03**. La primera apertura adapta una copia válida del cuadro versión 2, conservando sus IDs y posiciones; la clave electrolab-cabinet-v02 queda intacta. Una clave v3 corrupta no se sustituye silenciosamente por la v2 o por un ejemplo. Los proyectos v1 continúan en el modo ilustrativo y los enlaces del editor anterior no se convierten.

El proyecto exporta JSON con ambas distribuciones y sus conexiones, SVG del cuadro y del esquema, CSV de materiales y CSV de conexiones. Este último identifica equipo y borne en ambos extremos, color y sección indicada; no estima longitud de cable.

## Verificar

`npm test` compila los módulos puros y ejecuta las pruebas de geometría, montaje, formatos, almacenamiento, historial y exportaciones con el runner de Node. `npm run build` verifica TypeScript y construye la aplicación. CI ejecuta ambas comprobaciones en ese orden. No se añaden dependencias de pruebas.

Si el formato compartido expandido supera 100 KB, la migración o importación se rechaza conservando el original y explicando el límite. El esquema evita que una línea pase por otros bloques o bornes. Cuando la distribución no deja un recorrido claro, avisa y mantiene la conexión en la lista y el CSV; separa los bloques para dibujarla.
