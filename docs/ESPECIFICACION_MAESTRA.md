# ElectroLab — Especificación maestra (borrador 1)

Fecha: 2026-10-10 · Estado: propuesta para revisión, no especificación aprobada.

## Propósito
Herramienta educativa **interna de VinWizard** para aprender electricidad, diseñar y documentar cuadros y esquemas, simular circuitos compatibles y diagnosticar averías de forma segura. Idioma inicial: español de España. Funciona en PC y tablet Android, con ratón y pantalla táctil.

## Referencia competitiva: Tablero Studio
Fuente pública consultada: https://conseguitulibro.shop/pages/contact (2026-10-10). El producto principal se presenta como una **plantilla de Canva**, no un programa CAD autónomo. La web publicita: paneles realistas, biblioteca de más de 200 componentes, cables de colores, arrastrar y organizar, zoom y exportación a PDF. Como extras **afirma** ofrecer simulador eléctrico en tiempo real, biblioteca IEC/NEMA, protocolo de 7 pasos de diagnóstico, guía de 23 errores y plan de 90 días. No se ha verificado la existencia ni la calidad de esos extras tras la compra. No copiar sus plantillas, imágenes ni textos.

## Identidad VinWizard
Usar logotipo corporativo **oficial** autorizado, sin redibujarlo ni deformarlo. Reutilizar archivo del repositorio corporativo solo tras identificar la ruta y comprobar licencia/acceso. Paleta contrastada en VinWizard-English/styles.css: navy #00303C, blue #165572, cyan #009ABF, mint #2ED9C3, red #E1251B, ink #173642, pale #F1F6F7. Tipografía Poppins. Cabecera «VinWizard | ElectroLab» y leyenda «Herramienta interna de formación».

## Módulos
1. **Academia**: Ohm, potencia, serie/paralelo, AC/DC, monofásica/trifásica, seguridad, ejercicios guiados, visualizaciones.
2. **Editor de esquemas**: símbolos IEC/UNE, representación unifilar/multifilar/funcional sin confundirlas; terminales definidos; cableado ortogonal, etiquetas, referencias, zoom, deshacer/rehacer, guardado y exportación.
3. **Diseñador de cuadros**: vista física distinta del esquema; carril DIN, envolventes, aparatos a escala y cableado visual. Evitar presentar dibujos como documentación certificada.
4. **Simulador**: motor eléctrico separado de la interfaz; netlist basada en terminales; CC resistiva en primera fase; después lógica de mando y dispositivos industriales. Mostrar claramente el alcance y rechazar circuitos no soportados; no inventar mediciones.
5. **Diagnóstico**: multímetro virtual conectado a puntos de prueba, fallos configurables, hipótesis y explicaciones, ejercicios con puntuación y pistas.
6. **Biblioteca**: fichas de símbolos, bornes, principios de funcionamiento, ejemplos; priorizar elementos del curso y validación con simbología aportada por la usuaria.

## Requisitos esenciales
- Interfaz accesible, responsive y usable con lápiz/tablet.
- Guardar localmente en primera fase; exportar/importar proyecto JSON versionado.
- Exportar esquemas y cuadros a PDF/SVG con leyenda, fecha y advertencia educativa.
- Separación explícita entre **esquema eléctrico**, **vista física del cuadro** y **simulación**.
- No afirmar que los resultados son válidos para trabajo sobre equipos energizados ni para cumplimiento normativo.
- Pruebas unitarias de topología y cálculos, pruebas de compilación y navegación antes de publicar cada versión.

## Prioridades de implementación
**P0:** corregir navegación, identificar y añadir logo oficial, aplicar paleta, pruebas automáticas básicas.
**P1:** editor con bornes por componente, cables por terminal y persistencia robusta.
**P2:** simulación CC validada (fuente, interruptor, resistencias, lámpara resistiva ideal) y mediciones coherentes.
**P3:** esquemas IEC/UNE con biblioteca revisada, exportación PDF/SVG.
**P4:** vista física de cuadro y componentes industriales; diagnósticos progresivos.

## Criterios de aceptación P1
- Un componente tiene terminales con IDs estables y referencias visibles.
- Conectar terminales, no centros gráficos; un cable se mantiene unido al mover el componente.
- Impedir o avisar conexiones incompatibles; no confundir camino gráfico con circuito cerrado.
- Undo/redo, borrar conexiones, reiniciar, guardar y recuperar proyecto.
- La pestaña editor muestra realmente el editor y las demás pestañas conservan su contenido.
- Navegación y diseño verificados en pantalla pequeña y escritorio.

## Estado real al redactar
V0.1/V0.2: práctica CC idealizada, ley de Ohm y multímetro ideal. V0.3: editor **beta de topologías** sin bornes ni simulación, con guardado local. Se detectó y corrigió una regresión de navegación el 2026-10-10. No consta una compilación automatizada completa de la V0.3.

## Pendiente de decisión
- Confirmar prioridad entre editor/diseñador de cuadros y diagnóstico/academia.
- Validar uso del logotipo corporativo original y localizar archivo exacto.
- Validar simbología del profesor frente a IEC/UNE antes de implementar biblioteca.
