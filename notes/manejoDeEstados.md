# **Manejo de estados**

Para decidir qué debe ir al estado global (Zustand) y qué debe quedarse en el componente (useState local), te propongo usar una lógica de decisión basada en tres factores: Alcance, Persistencia e Impacto.


Aquí se presenta la lógica detallada para tomar esa decisión:



## **1. El Semáforo del Estado: ¿Dónde guardo este dato?**

Imagina cada dato (un input de kilos, un costo de fertilizante, el nombre del lote) pasando por este filtro:



### 🔴 **Estado Local (React useState o react-hook-form)**

**Criterio: El dato es "efímero" o solo le importa al componente que lo dibuja.**

*Ejemplo: El texto que el usuario está escribiendo en un input mientras escribe.*

**Lógica:** Si tienes una tabla de "Costos de Fertilización" y el usuario está editando una celda, no envíes cada letra que escribe a Zustand. Eso es innecesario y lento.

**Regla de oro:** Si el dato es un "borrador" que aún no se ha guardado o validado, mantenlo local. Solo cuando el usuario hace clic en "Guardar" o "Agregar fila", lo mueves al Store global.

**Estados UI:** ¿El modal de "Editar Lote" está abierto o cerrado? Eso es local.




### 🟡 **Estado Global (Zustand - userDataStore / projectStore)**

**Criterio: El dato debe sobrevivir si cambio de pantalla o es necesario para cálculos en otro lugar.**

*Ejemplo: La lista definitiva de costos de la Campaña 2024.*

**Lógica:** Una vez que el usuario confirma el dato ("Guardar costo"), ese dato debe subir a Zustand.


¿Por qué? Porque si el usuario navega a la pestaña "Resumen Financiero", esa pantalla necesita leer esos costos para mostrar el gráfico de gastos. Si estuviera en un estado local, al cambiar de pantalla, el dato se perdería.


**Regla de oro:** Si dos componentes que están lejos uno del otro (ej: un formulario en la página 1 y un indicador en la barra lateral) necesitan el mismo dato, ese dato va al Store.





### **🟢 Estado Derivado / Calculado (Selectores)**

**Criterio: El dato es el resultado matemático de otros datos. Nunca guardes esto en el estado.**

*Ejemplo: El "Costo Total de la Campaña" o el "Margen Bruto".*

**Lógica:** No crees un campo totalCost en tu base de datos ni en tu Store. Si tienes una lista de gastos, el total es simplemente la suma de ellos.

Tu calculationsStore: En lugar de ser un almacén de datos, debera ser un almacén de "fórmulas" (selectores) que leen los datos de userDataStore y te devuelven el resultado al vuelo.



## **2. Aplicando la lógica a los Formularios y Tablas**

La aplicación tiene "diferentes formularios y tablas". La estrategia recomendada es la "Confirmación Diferida".

## **El ciclo de vida del dato en tu App:**

**Fase de Edición (Estado Local):** El usuario entra a cargar la "Producción del Lote A". Ve un formulario vacío o con datos previos. Mientras escribe "1500 kg", esos "1500" viven en el estado del formulario (usando librerías como React Hook Form o un simple useState). Zustand aún no se entera. Esto hace que la escritura sea súper rápida.

**Fase de Confirmación (Acción del Store):** El usuario presiona "Guardar". Aquí ejecutas una función de Zustand (ej: addProductionRecord). Esta función toma el objeto "sucio" del formulario y lo inserta en tu array principal en userDataStore (o campaignStore).

**Fase de Reacción (Selectores):** Automáticamente, cualquier componente que esté "escuchando" (como tu Dashboard de Resultados) detectará que el array de producción cambió. Recalculará los totales usando tus selectores y actualizará la pantalla.


## **La recomendación lógica (Patrón "Slices"):** 

Zustand permite tener un solo Store gigante dividido lógicamente en archivos pequeños (Slices). Imagina que tu Store es una "Base de Datos en Memoria".

No necesitas un archivo físico separado para ejecutar la lógica.

Tu userDataStore parece ser el lugar central. Probablemente, tus campañas y montes son solo arrays dentro de la estructura de un Proyecto.



### **Lógica sugerida para los datos:**

**Data Store (La fuente de verdad):** Aquí vive la estructura jerárquica cruda.

Projects -> contiene Campaigns -> contiene ProductionRecords y CostRecords.





**UI Store (Opcional):** Aquí vive lo que el usuario está haciendo.

activeProjectId: ¿Qué proyecto estoy mirando?

activeCampaignId: ¿Qué año estoy editando?


**Calculations (Selectores):** No guardan datos. Solo preguntan al Data Store: "Dame los costos del activeCampaignId y súmalos".





## **Resumen: ¿Debo crear un estado para esto?**

Pregúntate esto cada vez que dudes:

¿Se calcula a partir de otra cosa?
Sí: No crees estado. Crea un selector.

¿Solo sirve para que el input no se vea vacío mientras escribo?
Sí: Estado Local (useState).

¿Necesito ver este dato en la página de "Resultados" o guardarlo en la base de datos después?
Sí: Estado Global (Zustand).

Para esta app los inputs de los formularios son locales. Solo cuando el productor confirma la carga del día o del lote, se "despachan" el paquete de datos a Zustand para que actualice los cálculos globales.




## **Cómo se conectan las piezas (El Flujo Definitivo)**
Este es el ciclo de vida de un dato en tu app, integrando tu duda sobre validación y fórmulas:

El Formulario (UI): El usuario escribe "100" en el input de Dosis.

Validación (Zod): Al hacer blur o submit, Zod verifica: "¿Es un número positivo?". Si pasa, lo convierte de texto "100" a número 100.

Cálculo en Vivo:

El componente importa calcularCostoInsumo de tu archivo central (calculations.ts).

Le pasa el 100 (ya validado).

Muestra el resultado previo al usuario: "Costo estimado: $5000".

Guardado (Zustand): El usuario da "Guardar". Mandas el 100 limpio al Store global.

Reacción Global (Selectores):

Otro componente (ej: Tabla de Costos Totales) tiene un selector escuchando los costos.

Detecta el cambio.

Se re-renderiza.

Usa otra fórmula de calculations.ts (sumarCostosTotales) para actualizar el gráfico general.

Resumen de tu Plan de Acción
Archivo calculations.ts: Crea este archivo hoy. Mueve allí todas las multiplicaciones, divisiones y reglas de tres simples que tengas dispersas. Haz funciones puras que reciban números y devuelvan números.

Validación en Componentes: Usa Zod dentro de tus formularios para asegurar que lo que le pasas a esas funciones de calculations.ts sean números reales y no explote la app.

Selectores en Componentes: Usa los selectores para traer los datos del Store y pásalos como argumentos a tus funciones de calculations.ts dentro del render del componente.


