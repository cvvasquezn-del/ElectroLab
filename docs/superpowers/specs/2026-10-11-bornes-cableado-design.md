# Bornes y cableado compartidos entre cuadro y esquema

Estado: diseño y plan aprobados el 11 de octubre de 2026; implementación verificada con 41 pruebas, compilación, revisión independiente y flujo en navegador.

## Objetivo y alcance

Continuar ElectroLab con un proyecto que permita conectar bornes concretos de los equipos del cuadro a escala y consultar esas mismas conexiones en un esquema. La prioridad del usuario sigue siendo una organización intuitiva y la identidad ElecWizard, basada en las guías de VinWizard.

La entrega permitirá identificar equipos con referencias estables, seleccionar los dos extremos de un conductor, editar su identificación y eliminarlo. Cambiar de vista conservará equipos, conexiones e historial. La simulación del circuito, los datos de fabricantes y la conversión del editor antiguo quedan para entregas posteriores.

## Base revisada

Main está en 5cbf71b09942015a256a93c379aff03f7e09ce22. El proyecto físico versión 2 contiene modelos, posiciones y relaciones de montaje. Tiene validación geométrica, importación, guardado protegido frente a recuperación fallida y un historial de 50 acciones. Sus referencias visibles dependen actualmente del orden de los elementos.

El editor de topologías guarda otros componentes en electrolab-editor-v03 y une sus centros. No comparte dispositivos con el cuadro. App desmonta cada módulo al cambiar de pestaña: mantener el proyecto compartido exige situar su estado por encima de ambas vistas.

## Enfoque propuesto

Se recomienda ampliar gradualmente el proyecto físico y ofrecer una vista de esquema del mismo proyecto. Crear un editor de cableado independiente sería más rápido, pero duplicaría equipos y conexiones. Reemplazar también el editor antiguo y convertir sus enlaces exigiría deducir bornes que esos archivos no contienen.

Por eso se conservará el editor anterior como «Topología anterior». La pestaña Esquemas ofrecerá «Esquema del cuadro» y «Topología anterior». El primero mostrará exactamente los dispositivos eléctricos y conductores del cuadro a escala. Las prácticas guiadas y el cuadro ilustrativo seguirán siendo módulos independientes.

## Modelo compartido

El nuevo formato será electrolab-cabinet versión 3. Conservará la geometría física de versión 2 y añadirá:

- Una referencia visible única y persistida en cada elemento. Al migrar se conservará la referencia que hoy muestra el cuadro; borrar o reordenar elementos no cambiará las restantes. Añadir o duplicar elegirá una referencia libre. Duplicar no copiará conductores.
- Bornes didácticos definidos en cada modelo eléctrico, con ID y nombre únicos dentro del modelo. Los extremos de los conductores identificarán itemId y terminalId; no usarán posiciones ni referencias visibles como identidad.
- Conductores con ID estable, referencia única, dos extremos, color elegido de una paleta y sección opcional en mm². La sección será un dato introducido por el usuario, sin selección ni dimensionamiento automático. Una sección indicada deberá ser finita y positiva.
- Posiciones del esquema independientes de las posiciones físicas. Cada dispositivo eléctrico tendrá una posición en el esquema. Moverlo en una vista no modificará la geometría de la otra.

Carriles y canaletas no tendrán bornes ni aparecerán como dispositivos eléctricos del esquema. Los cinco tipos eléctricos actuales tendrán bornes genéricos T1 y T2 y una nota visible «Bornes didácticos». Esta primera entrega permitirá registrar enlaces, pero no describirá contactos internos, polos, bobinas ni comportamiento eléctrico. Se evitarán identificaciones que sugieran un producto o una configuración real verificada.

El límite será 150 elementos, 200 conductores y 100 KB de JSON compacto. Los campos de nombre y referencia tendrán longitudes limitadas. Los IDs serán únicos, cada extremo deberá existir y solo podrá referirse a un elemento eléctrico. Se rechazarán la conexión de un borne consigo mismo y el mismo par de extremos repetido, incluso en orden inverso. Se permitirá conectar distintos bornes del mismo dispositivo y que un borne participe en varios enlaces; no se deducirá de ello capacidad física de conexión.

## Organización e interacción

Se mantendrán Poppins, el logo suministrado y la paleta aprobada: navy #00303c, blue #165572, cyan #009abf, mint #2ed9c3, fondo #f1f6f7 y borde #dce6e9.

El área central ofrecerá «Distribuir» y «Cablear». En Distribuir se conservarán los gestos y propiedades de montaje. En Cablear se mostrarán puntos de borne y se evitará iniciar arrastres de dispositivos al elegir un borne. Un texto breve indicará el siguiente paso y el origen pendiente. Escape o «Cancelar conexión» eliminará solo la selección pendiente.

El inspector incluirá una sección «Conexiones» del equipo seleccionado: borne de origen, referencia del destino y conductor. Seleccionar un conductor abrirá su edición de referencia, color y sección, con «Aplicar» y «Eliminar conductor». La lista de conexiones del proyecto permitirá acceder a enlaces aunque sus líneas se superpongan. En móvil la lista y las propiedades estarán debajo del área de trabajo, sin desbordamiento horizontal.

La creación también podrá realizarse mediante selectores de equipo y borne de origen y destino. Este flujo de teclado evitará depender del tamaño de los puntos dentro del cuadro. Los puntos tendrán nombres accesibles completos y foco visible. Las líneas se identificarán mediante texto además de color.

En el esquema se mostrarán bloques didácticos con referencia, nombre y bornes, sin atribución de simbología normalizada. Se podrán mover esos bloques y editar los mismos conductores. Su colocación inicial será una cuadrícula determinista que evite superposiciones; las posiciones se guardarán después de cada movimiento válido.

Los recorridos de línea serán visuales y se recalcularán al mover los extremos. Esta entrega no incluye rutas manuales por canaleta, longitudes calculadas, puentes internos ni detección de cruces eléctricos. Una intersección de líneas no creará una conexión.

## Estado, historial y operaciones

Un proveedor de proyecto situado en App conservará el estado al cambiar entre Esquemas y Cuadros eléctricos. Contendrá proyecto, historial y guardado; la selección, el zoom y el borne pendiente serán estado de presentación. El cambio de pestaña cancelará conexiones incompletas y finalizará o cancelará un arrastre antes de abandonar la vista.

Las operaciones eléctricas y geométricas producirán un proyecto completo validado antes de entrar en el historial. Cada conexión, edición, borrado y arrastre terminado contará como una acción; selecciones, cambios de vista, cancelaciones y rechazos no contarán. Se conservarán las reglas de 50 acciones y de eliminación de la rama de rehacer tras una edición.

Eliminar un equipo con conexiones solicitará confirmación indicando cuántos conductores desaparecerán. Tras aceptar, equipo, posición del esquema y conductores asociados se eliminarán en una única acción reversible. Cancelar preservará todo. Se conservará el rechazo actual de borrar un carril con equipos montados.

Añadir un dispositivo desde la biblioteca lo incorporará también al esquema; añadir carril o canaleta afectará solo a la distribución. Los errores de espacio seguirán conservando el proyecto anterior. Las referencias visibles serán coherentes en canvas, inspector, avisos y exportaciones.

## Migración y conservación de datos

La nueva clave local será electrolab-project-v03. Si contiene un proyecto válido se recuperará; si contiene datos inválidos se protegerá el original y se informará del fallo sin sobrescribirlo por seleccionar o navegar.

Si esa clave no existe, se leerá el cuadro versión 2 y se construirá una copia versión 3 conservando IDs, geometría, modelos y referencias visibles actuales. Se añadirán bornes genéricos, posiciones iniciales de esquema y una lista vacía de conductores. La clave versión 2 quedará intacta. Un fallo de lectura o validación impedirá sustituir esos datos por un ejemplo silenciosamente.

Importar versión 2 realizará la misma adaptación en memoria. Importar versión 3 validará geometría, referencias, bornes, posiciones del esquema y conductores antes de sustituir el proyecto. El cuadro ilustrativo versión 1 seguirá abriéndose en su modo actual. El editor anterior conservará sus datos; sus enlaces no se convertirán automáticamente.

Un fallo de cuota o acceso al almacenamiento se mostrará con la opción de exportar JSON. La aplicación seguirá operativa en memoria. Una edición efectiva o importación explícita liberará la protección del nuevo guardado; un clic sin cambios no lo hará.

## Exportaciones

JSON versión 3 incluirá ambas distribuciones y las conexiones. El SVG físico añadirá bornes y líneas identificadas; el esquema tendrá su propio SVG. Ambos describirán los enlaces como didácticos y excluirán zoom, selecciones y estados pendientes.

La lista de materiales conservará su agrupación actual. Se añadirá «Lista de conexiones (CSV)», una fila por conductor, con referencia del conductor, equipo y borne de origen, equipo y borne de destino, color y sección indicada. No incluirá longitud estimada ni cantidades derivadas de las líneas. Se mantendrán escapado XML, CSV con BOM y separador punto y coma, y protección frente a fórmulas.

## Criterios de aceptación y comprobación

1. Abrir un cuadro versión 2 conserva exactamente IDs y geometría; sus referencias no cambian al eliminar otro elemento. Los datos locales originales quedan intactos.
2. Conectar T1 de un equipo a T2 de otro crea un conductor que aparece en cuadro, esquema, lista y JSON. Cambiar de pestaña conserva el historial.
3. Editar o eliminar ese conductor actualiza ambas vistas. Deshacer recupera la acción completa y rehacer la reproduce.
4. Cancelar una conexión o un arrastre no crea historial. Duplicar un equipo no duplica enlaces. Borrar un equipo conectado requiere confirmar y se revierte con una sola acción.
5. Extremos ausentes, bornes desconocidos, IDs o referencias repetidos, conexiones duplicadas, posiciones no finitas, sección inválida y límites excedidos se rechazan sin reemplazar el proyecto.
6. Recuperación corrupta, cuota agotada y almacenamiento inaccesible conservan los originales y permiten exportar el trabajo en memoria. Seleccionar sin editar no libera la protección.
7. Importar y exportar JSON preserva referencias, bornes, enlaces y ambas distribuciones. CSV y SVG incluyen las mismas referencias y escapan correctamente el contenido.
8. El flujo por selectores funciona con teclado. La distribución se verifica en 1440, 1024 y 390 px; no hay desbordamiento horizontal ni un inspector separado por un hueco causado por la biblioteca.
9. Las pruebas actuales de geometría, historial, formatos y exportaciones siguen pasando. Las nuevas pruebas cubrirán migración, validación, operaciones compartidas y conservación de datos. Se comprobará además el flujo real en navegador y la compilación.

## Orden de implementación posterior a la revisión

Primero se implementarán formato y migración; después las operaciones e historial compartido; luego los bornes y la edición de conexiones en el cuadro; a continuación el esquema del mismo proyecto; finalmente exportaciones, comprobaciones visuales y revisión. El plan de implementación detallará archivos, interfaces y pruebas antes de ejecutar estas etapas.


## Resultado de revisión

La adaptación versión 2 se acepta solo si el proyecto expandido versión 3 supera todas las comprobaciones, incluido el límite de 100 KB. Si no cabe, la importación conserva proyecto y vista actuales; la recuperación protege el original y muestra la causa.

El esquema lleva cada conductor fuera de los lados de sus bornes y busca un canal libre de bloques. Si no encuentra un recorrido claro, conserva la conexión, avisa y permite consultar sus extremos en la lista/CSV. Las vistas y SVG utilizan el mismo cálculo.
