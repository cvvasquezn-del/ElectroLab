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

## Verificar

`npm test` compila los módulos puros y ejecuta las pruebas de geometría, montaje, formatos, almacenamiento, historial y exportaciones con el runner de Node. `npm run build` verifica TypeScript y construye la aplicación. CI ejecuta ambas comprobaciones en ese orden. No se añaden dependencias de pruebas.
