# Primera entrega del modelo físico de ElectroLab

Estado: aprobado por la usuaria el 11 de octubre de 2026.

## Objetivo

Dar a ElectroLab una base comprobada para diseñar cuadros con posiciones y dimensiones coherentes en milímetros. La entrega conserva la identidad ElecWizard y los proyectos existentes, e incorpora un modo físico explícito para proyectos nuevos. Este modelo será la base para la biblioteca, los bornes y el cableado posteriores.

La hoja de ruta se ejecutará por entregas: integridad y escala, biblioteca de dispositivos, bornes y cableado, esquemas enlazados, simulación CC, diagnóstico y academia, y documentación y exportaciones. Esta especificación cubre la primera entrega; los demás bloques necesitarán sus propios criterios de aceptación.

## Estado comprobado

La rama main está en el commit 91f0ee513ca91b26f42ff75c8a7b1110550f756c. Su compilación automática terminó correctamente. No hay todavía un comando de pruebas automatizadas en package.json.

El diseñador guarda una lista de elementos con posiciones SVG. Los carriles usan 0,72 unidades por milímetro, mientras que los aparatos tienen anchuras ilustrativas independientes. La vista del armario no conserva la proporción física 600 por 800. La ficha lateral contiene dimensiones didácticas que no corresponden a fabricantes concretos.

El editor de esquemas utiliza otros componentes y enlaces entre sus centros. No existe todavía una relación de dispositivos compartida con el cuadro ni simulación del circuito dibujado.

## Enfoque elegido

Se propone incorporar el modelo físico de forma gradual y explícita. Sustituir directamente las coordenadas antiguas cambiaría posiciones y ocupaciones de los diseños guardados. Mantener solo la banda de proporciones dejaría el área de montaje sin una escala coherente. El nuevo modo permite probar la geometría física y conservar el comportamiento del formato anterior durante esta entrega.

El usuario elegirá entre su cuadro ilustrativo actual y un cuadro físico nuevo. Los dos modos se distinguirán por su nombre, su formato de archivo y su almacenamiento. Cambiar de modo no convierte ni sobrescribe un proyecto.

## Modelo de datos

El formato físico será electrolab-cabinet versión 2. Incluirá un identificador de proyecto, la geometría de la envolvente y placa útil, un catálogo de modelos y los dispositivos colocados. Las posiciones, anchuras y alturas se expresarán en milímetros; el zoom pertenecerá a la presentación.

Cada dispositivo tendrá un ID estable, un ID de modelo y una posición. Los modelos indicarán tipo, dimensiones, referencia visible y carácter didáctico. Los carriles incluirán longitud y los elementos montados conservarán su relación con el ID del carril. No se añadirán parámetros de fabricante inventados.

El origen estará en la esquina superior izquierda de la envolvente de referencia. La placa útil se definirá como un rectángulo situado dentro de ella, con posición, ancho y alto explícitos. El ejemplo inicial utilizará una referencia de 600 por 800 mm y un área útil de 550 por 750 mm, situada a 25 mm de cada borde. Estos márgenes serán una configuración educativa, no una característica de un producto ni un requisito normativo.

La validación exigirá números finitos, dimensiones positivas, IDs únicos, tipos conocidos y referencias de montaje existentes. Se conservará el límite actual de 150 elementos por proyecto. Los elementos físicos deberán quedar completamente dentro de la placa útil.

## Geometría y montaje

Una sola transformación uniforme proyectará milímetros a SVG. Se conservará la proporción entre ancho y alto del armario y de cada aparato. El cálculo de la posición del puntero aplicará la transformación inversa, incluido el zoom.

Colisiones, encaje y límites utilizarán rectángulos en milímetros. Un dispositivo montado debe caber completamente en la longitud del carril; la existencia de hueco se comprobará con intervalos, no solo sumando anchuras. Acortar un carril o reducir la placa se rechazará si deja elementos fuera. El rechazo explicará qué impide el cambio y conservará el estado anterior.

La reserva entre equipos será configurable y empezará en cero. Una reserva elegida por el usuario será una preferencia de distribución, sin atribuirle carácter normativo. Los componentes estrechos conservarán su huella real; sus referencias podrán aparecer fuera de esa huella para seguir siendo legibles. Las etiquetas no ocuparán espacio de montaje.

Las dos representaciones del proyecto físico compartirán posiciones y huellas. La representación ilustrada será simplificada y seguirá identificada como ilustración. La representación técnica mostrará contornos y referencias. La escala física no se presentará como validación eléctrica o normativa.

## Compatibilidad y persistencia

La clave electrolab-cabinet-v01 y el formato versión 1 seguirán disponibles. La nueva versión utilizará otra clave de almacenamiento. En esta entrega, importar un archivo v1 abrirá el modo ilustrativo; importar un v2 abrirá el modo físico. No se realizará conversión automática entre ellos.

Un archivo inválido no reemplazará el proyecto abierto. El mensaje de error distinguirá formato no reconocido, versión no soportada, geometría incorrecta y referencias inválidas. Un fallo de almacenamiento local se mostrará como aviso con la posibilidad de exportar el trabajo, en lugar de anunciar un guardado correcto.

El guardado físico incluirá la geometría del proyecto y sus dispositivos, pero no el historial. La recuperación conservará los IDs y las posiciones exactamente. La conversión asistida de proyectos antiguos se diseñará en una entrega posterior con vista previa y copia del original.

## Historial e interacción

Cada acción terminada será un paso: añadir, duplicar, eliminar, editar dimensiones, ordenar o arrastrar. Un arrastre completo, con cualquier cantidad de movimientos intermedios, será una sola acción. Un arrastre cancelado o rechazado recuperará el estado inicial y no creará una acción ficticia.

Se conservará el límite de 50 pasos. Tras deshacer, una edición nueva invalidará la rama de rehacer y deberá poder deshacerse. Se verificará expresamente esa secuencia, además de deshacer y rehacer consecutivos. Los atajos seguirán respetando los campos de edición.

La interfaz mantendrá biblioteca, área de montaje e inspección. El modo físico mostrará las medidas de envolvente, placa y elemento seleccionado, y las unidades de cada entrada. Los controles estarán disponibles con ratón y entrada táctil.

## Separación del código

La geometría, validación, serialización e historial se ubicarán en módulos independientes de React. El catálogo físico tendrá una única fuente de dimensiones. El componente de interfaz consumirá estos módulos para que los cálculos puedan probarse sin el navegador.

La vista ilustrativa existente se conservará como adaptador del formato v1. El nuevo render consumirá el formato v2. Esta entrega no unificará todavía el proyecto de esquemas ni añadirá un motor eléctrico.

## Criterios de aceptación

- Los JSON v1 existentes se importan sin cambiar sus IDs ni posiciones y se pueden volver a exportar.
- Un proyecto v2 exportado e importado conserva exactamente su geometría y sus dispositivos.
- Una distancia de 100 mm en horizontal y vertical utiliza el mismo factor de escala.
- Las operaciones milímetros a SVG y SVG a milímetros se recuperan dentro de una tolerancia numérica definida por las pruebas, también con zoom.
- Un carril que exceda el ancho útil no se instala y un recorte incompatible no modifica el proyecto.
- Colisiones, huecos y montaje se comprueban con la geometría física completa, incluidos los límites exactos y dimensiones fraccionarias.
- Arrastre, cancelación, deshacer, rehacer y edición posterior a deshacer pasan pruebas automatizadas.
- Archivos corruptos, IDs duplicados, valores no finitos y referencias inexistentes se rechazan sin perder el trabajo abierto.
- Las pruebas se ejecutan en GitHub antes de la compilación. Ambas deben pasar antes de publicar la entrega.
- Se verifica la navegación, selección y edición en escritorio y tablet; las exportaciones JSON, SVG y CSV reflejan el modo físico.

## Límites de esta entrega

No incluye fotografías de fabricantes, comprobaciones térmicas, cortocircuito, certificación, bornes conectables, esquemas normalizados ni simulación. Las dimensiones del catálogo inicial siguen siendo didácticas y deben estar identificadas como tales. La documentación de fabricantes y el material del curso serán necesarios para ampliar después una biblioteca con modelos y simbología contrastados.

## Siguiente paso

Revisar esta especificación. Una vez aprobada, preparar un plan de implementación con cambios de archivos, pruebas y entregas verificables antes de desarrollar el nuevo modelo físico.
