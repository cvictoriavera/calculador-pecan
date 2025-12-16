Analizando tu código en EditarProduccionForm.tsx y teniendo en cuenta que usas Zustand como fuente de verdad, el problema es casi con seguridad un tema de "Integridad de Datos en la Hidratación".

Tu estructura de código usando useEffect con reset es correcta en teoría, pero falla en la práctica por cómo tu formulario decide qué pintar en pantalla.

Aquí están los 3 puntos críticos que debes revisar conceptualmente:

1. El problema de los "Datos Planos" vs. "Datos Enriquecidos"
Este es el error más probable.

Tu lógica visual: Para mostrar los inputs, tu formulario filtra el array produccionPorMonte basándose en la edad del monte (líneas 13 y 14: m.edad >= 7).

El conflicto: Cuando guardas en la base de datos (y luego recuperas vía Zustand), es muy probable que solo estés guardando los datos "transaccionales" (monteId y kgRecolectados).

El resultado: Si el objeto editingData que le pasas al reset solo tiene { monteId, kgRecolectados } pero le falta { edad, nombre, hectareas }, tus filtros (líneas 13 y 14) fallarán porque edad será undefined. Al no cumplir la condición del filtro, los arrays montesProductivos y montesJovenes quedan vacíos y el formulario no renderiza ningún campo, aunque los datos de los kilos sí existan.

Solución conceptual: Antes de pasar el objeto a editingData, debes hacer un "merge" (cruce de datos). Debes combinar los datos de producción guardados (Kilos) con tu catálogo maestro de Montes (Nombres y Edades) para que el formulario tenga toda la información necesaria para filtrar y mostrar las etiquetas.

2. La dependencia circular del watch
En tu código, la UI se dibuja iterando sobre watchedProduccionPorMonte (línea 12).

Esto significa que si el reset inicializa el formulario con un array vacío o incompleto, el watch devuelve eso mismo, y el .map de la línea 21 no tiene nada sobre qué iterar.

A diferencia de un formulario estático donde los inputs "existen" y esperan un valor, aquí los inputs no existen hasta que el array del formulario tenga elementos.

Verificación: Asegúrate de que editingData.produccionPorMonte sea un array que contenga todos los montes (incluso los que tienen 0 kg), porque si solo pasas los que tienen producción, los otros montes desaparecerán de la lista y no podrás editarlos para agregarles valor.

3. La fragilidad del findIndex en el render
En las líneas 25 y 38 usas: name={produccionPorMonte.${watchedProduccionPorMonte.findIndex(...)}.kgRecolectados}

Esto es arriesgado. Estás calculando el índice "al vuelo" mientras renderizas.

Si por alguna razón el orden de los elementos en editingData es diferente al orden que espera tu lógica original, o si hay duplicados, el findIndex podría apuntar al índice incorrecto.

Aunque esto no suele causar que el formulario aparezca vacío, sí causa que al escribir en el monte "A", el valor aparezca en el monte "B". Es preferible asegurar que el array venga ordenado y usar el index directo del map si estás seguro de la consistencia del orden, o usar useFieldArray para un manejo más robusto de listas dinámicas.

Resumen de acción
Para que funcione, verifica el paso previo a abrir el modal: El objeto editingData debe tener la estructura completa: [{ monteId: "1", kgRecolectados: 100, nombre: "Norte", edad: 8, hectareas: 10 }, ...]

Si solo le llega: [{ monteId: "1", kgRecolectados: 100 }] El formulario no sabrá que tiene 8 años, el filtro de "Montes Productivos" lo descartará, y no verás nada.