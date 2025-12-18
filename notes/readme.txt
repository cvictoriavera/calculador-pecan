Limpiar la Celda (El estado "Cerrado")
Actualmente la celda cerrada tiene 4 líneas de información. Es demasiado. Vamos a reducirlo a Jerarquía Visual.

1- Diseño Propuesto para la Celda:

Dato Principal (Grande): La Producción Real. Es lo que importa.

Dato Secundario (Semáforo): El % de Desvío.

Dato Terciario (Oculto/Sutil): El Estimado.

Cómo se vería:

Si hay dato Real:

Muestra el número 200.000 grande.

Debajo, la "píldora" (badge con el desvio) 

El estimado NO se muestra en texto. Se infiere por el porcentaje.

Si es Futuro (No hay Real):

Muestra el estimado en color azul/lila (como ya haces): 34.000 (Est).

¿Dónde metemos el detalle? En el Tooltip (Hover). Al pasar el mouse por la celda, muestra una cajita flotante negra con todo el detalle que borraste:

Año 2020 (5ta Hoja)
Real: 200.000 kg
Estimado: 34.000 kg
Diferencia: +166.000 kg




2- Rediseñar el Desplegable (El estado "Abierto")
El desplegable actual repite mucha información en filas (Producción Real, Producción Estimada, Desvío). Eso hace la tabla muy alta.

Propuesta: "Mini Cards" o Filas Condensadas

En lugar de crear una sub-tabla con 5 filas nuevas, usa el espacio expandido para mostrar métricas que no caben en la celda principal, específicamente la Productividad por Hectárea.

Al abrir el acordeón, muestra solo 2 filas limpias:

Fila 1 (Kg/Ha): Aquí comparas la eficiencia.
"Rendimiento Real: 2.000 kg/ha vs Est: 340 kg/ha".

Fila 2 (Financiera - Opcional):
"Facturación: $5.250 vs $3.000".

Elimina la fila "Edad" del desplegable si implementas el numerito en la esquina de la celda (Punto 1). Es redundante.


Resumen de la Propuesta Visual
Imagina la celda del año 2020 para Montecito Norte así:
+-----------------------+
| ⁵             (Badge) |  <-- Edad (5ta hoja) discreta en la esquina
|                       |
|   200.000 kg          |  <-- Dato Real (Negro, Bold)
|                       |
|   [ +488% ]         |  <-- Pill de Desvío (Verde/Rojo)
+-----------------------+

Tooltip al pasar el mouse: "Estimado: 34.000 kg | Prod: 2.000 kg/ha".
Al expandir: Muestras los gráficos o detalles financieros, pero no repites los kilos que ya se ven arriba.




Estrategia: Dividir para la fila de totales 
En lugar de una fila "Totales" gigante, divide el footer de la tabla en dos filas temáticas. Esto separa visualmente las unidades y facilita el análisis mental.

Fila 1: Total Producción (Kg)

Sigue la misma estética que ya definimos para las celdas de arriba (Número grande + Píldora de %).

Responde: "¿Llegamos al volumen objetivo?"

Fila 2: Impacto Económico ($)

Se centra exclusivamente en el dinero.

Responde: "¿Cuánto dinero entró y cuánto dejamos sobre la mesa?"

Visualmente se vería así:
Concepto,2020,...
∑ Producción,"1.500.000 kg<span style=""background:#f8d7da; color:#721c24; border-radius:10px; padding:2px 6px; font-size:0.8em;"">-0.7%</span>",...
∑ Económico,**$ 5.250.000**-$ 38.500 (Pérdida)</span>,...

Nota: Fíjate cómo al separar las filas, eliminamos todas las etiquetas "Real", "Est", "Fact". El contexto lo da el título de la fila.

Detalles de UX para los Totales
Aplica estas reglas:

1. Elimina las Etiquetas Repetitivas

~~Real: 1.500.000 kg~~ -> 1.500.000 (El estilo negrita ya indica que es el Real).

~~Est: 1.511.000 kg~~ -> Ponlo en un Tooltip (al pasar el mouse). El usuario experto compara mentalmente el "Real" contra el "Desvío %" (Pill). No necesita ver el número estimado exacto todo el tiempo.

2. Formato de Moneda Inteligente En tu imagen tienes $ 7.646.400. Es difícil de leer rápido.

Usa formato compacto para millones: $ 7.64 M.

O quita los decimales si no son relevantes en montos grandes.

3. Semántica del Color en el Dinero Para la línea de "Pérdida/Ganancia":

Si es Pérdida (Negativo): Usa Rojo y el signo menos (-$ 38.500).
Si es Ganancia Extra (Positivo): Usa Verde y el signo más (+$ 12.000).
La palabra "Pérdida" ocupa mucho espacio. El color rojo y el signo negativo son universales.



Aquí definimos cómo integrar este Selector de Rango y los estilos visuales para diferenciar el pasado del futuro.

1. El Componente: "Dual Thumb Slider" (Selector de doble tirador)
No es un selector de fecha común. Necesitas un slider con dos manejadores: uno para el "Desde" y otro para el "Hasta".

Comportamiento UX sugerido:

Ubicación: Justo encima de la tabla, alineado a la derecha o al centro.

Etiquetas Dinámicas: Mientras el usuario arrastra los tiradores, muestra el año en una burbuja encima del dedo/mouse.

Límites (Min/Max):

Mínimo: El año del registro más antiguo (ej: 2010).

Máximo: El año actual + 30 años (ej: 2055).

Snap (Atracción): El slider debe moverse de "año en año" (pasos enteros), no permitir seleccionar "mitad de 2024".

Estado Inicial (Default): Al entrar, el rango debería ser algo manejable, por ejemplo: [Año Actual - 5] a [Año Actual + 5]. Así el usuario ve contexto inmediato sin ver los 40 años de historia de golpe.

2. Tratamiento Visual: La Frontera del "Hoy"
Ya que el slider permite mezclar pasado y futuro en la misma vista, la tabla debe "gritar" visualmente qué columnas son simulaciones.

Propongo un sistema de "Zonas Visuales" basado en el año calendario:

A. Zona Histórica (Hasta 2025)

Datos: Muestra Real y Desvío.
Sensación: "Dato Duro".

B. La Frontera (El Divisor)
Entre la columna 2025 (año/campaña actual) y 2026(proxima campaña), el borde vertical debe ser doble o de un color acentuado (ej: dorado border-r-2 border-yellow-500). Esto marca el "Ahora".

C. Zona Futura (2026 en adelante)

Fondo de Columna: Un patrón sutil (rayado diagonal muy suave) o un color de fondo sólido muy tenue (ej: bg-blue-50/30).
Encabezados: Agrega un pequeño ícono junto al año, como una varita mágica 🪄 o un gráfico 📈, para indicar "Proyección".
Opacidad: Los textos pueden tener una opacidad leve (ej: text-gray-600) para que no compitan en peso visual con los datos reales.
Datos: Muestra solo el valor Estimado (tu valor azul/lila).