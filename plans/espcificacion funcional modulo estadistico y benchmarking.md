# Calculador Pecan

## Especificación Funcional: Módulo de Análisis Estadístico y Business Intelligence

> Documento de especificación funcional para desarrollo e implementación del módulo de análisis estadístico, benchmarking y Business Intelligence de la aplicación Calculador Pecan.

---

# Índice

- [1. Objetivo](#1-objetivo)
- [2. Alcance](#2-alcance)
- [3. Principios de Diseño](#3-principios-de-diseño)
- [4. Roles de Usuario](#4-roles-de-usuario)
- [5. Modelo Conceptual](#5-modelo-conceptual)
- [6. Indicadores del Productor](#6-indicadores-del-productor)
- [7. Sistema de Alertas](#7-sistema-de-alertas)
- [8. Benchmarking Inteligente](#8-benchmarking-inteligente)
- [9. Segmentación del Productor](#9-segmentación-del-productor)
- [10. Brecha de Costos](#10-brecha-de-costos)
- [11. Cierre Asistido de Campaña](#11-cierre-asistido-de-campaña)
- [12. Matriz de Validación](#12-matriz-de-validación)
- [13. Estados de Campaña](#13-estados-de-campaña)
- [14. Monitor de Salud de Datos](#14-monitor-de-salud-de-datos)
- [15. Detección de Valores Atípicos](#15-detección-de-valores-atípicos)
- [16. Tablero Administrativo](#16-tablero-administrativo)
- [17. Benchmarking Internacional](#17-benchmarking-internacional)
- [18. Reglas de Privacidad](#18-reglas-de-privacidad)
- [19. Reglas de Negocio](#19-reglas-de-negocio)
- [20. Requisitos Funcionales](#20-requisitos-funcionales)
- [21. Modelo de Datos Sugerido](#21-modelo-de-datos-sugerido)
- [22. Estados y Flujos](#22-estados-y-flujos)
- [23. Futuras Extensiones](#23-futuras-extensiones)

---

# 1. Objetivo

Transformar el actual módulo de Costos Operativos de Calculador Pecan en una plataforma de análisis estadístico y Business Intelligence.

El sistema deberá permitir:

1. Analizar los costos individuales de cada productor.
2. Comparar campañas interanualmente.
3. Detectar desviaciones en rubros de costos.
4. Comparar productores con perfiles productivos similares.
5. Generar benchmarks sectoriales.
6. Proteger el anonimato de los participantes.
7. Generar información estratégica para cámaras sectoriales.
8. Construir una base de datos regional sobre costos de producción de pecan.

---

# 2. Alcance

El módulo incluirá tres grandes niveles de análisis.

## Nivel 1: Productor

El productor podrá visualizar:

- Sus costos.
- Evolución interanual.
- Costos por hectárea.
- Costos por kilogramo.
- Distribución de gastos.
- Alertas.
- Benchmarking contra productores similares.
- Brecha de costos.

## Nivel 2: Cámara Sectorial

Los administradores podrán visualizar:

- Cobertura estadística.
- Participación de productores.
- Calidad de los datos.
- Distribución de segmentos.
- Costos promedio.
- Brechas sectoriales.
- Valores atípicos.
- Estado de las campañas.

## Nivel 3: Integración Regional

El sistema podrá consolidar datos entre países para generar indicadores regionales.

Inicialmente:

- Argentina.
- Brasil.
- Uruguay.

---

# 3. Principios de Diseño

El diseño del módulo deberá respetar los siguientes principios.

## 3.1. Comparar Manzanas con Manzanas

Nunca comparar indiscriminadamente productores con características estructuralmente diferentes.

Las comparaciones deberán considerar:

- Zona geográfica.
- Escala productiva.
- Arquetipo del proyecto.

---

## 3.2. Datos Cerrados para Benchmarking

Los indicadores estadísticos deberán utilizar campañas completas.

Las campañas abiertas podrán visualizarse individualmente, pero no deberán formar parte del benchmark anual definitivo.

---

## 3.3. Flexibilidad según Perfil

El sistema no deberá exigir los mismos datos a todos los productores.

Los requisitos deberán adaptarse según:

- Estado productivo del monte.
- Escala de producción.

---

## 3.4. Protección de Privacidad

Nunca deberán mostrarse estadísticas de grupos demasiado pequeños.

El sistema deberá aplicar una cantidad mínima de productores antes de publicar:

- Promedios.
- Percentiles.
- Cuartiles.
- Rankings.

---

## 3.5. Transparencia Estadística

Los indicadores deberán poder explicar:

- Qué datos se utilizaron.
- Qué segmento se comparó.
- Cuántos productores participaron.
- Qué campaña corresponde.
- Qué criterios se aplicaron.

---

# 4. Roles de Usuario

## 4.1. Productor

Puede:

- Registrar campañas.
- Registrar costos.
- Registrar producción.
- Registrar precio de venta.
- Consultar indicadores.
- Realizar cierre asistido.
- Consultar benchmarking.
- Consultar alertas.

---

## 4.2. Administrador de Cámara

Puede:

- Definir zonas geográficas.
- Definir parámetros estadísticos.
- Consultar indicadores agregados.
- Revisar valores atípicos.
- Consultar participación.
- Exportar informes.
- Gestionar campañas estadísticas.

No debe poder visualizar información económica individual identificable dentro de los módulos estadísticos públicos.

---

## 4.3. Super Administrador

Puede:

- Gestionar países.
- Gestionar cámaras.
- Gestionar zonas.
- Configurar reglas globales.
- Configurar parámetros estadísticos.
- Gestionar integración internacional.

---

# 5. Modelo Conceptual

La estructura central del sistema puede representarse de la siguiente manera:

```text
PRODUCTOR
    │
    ├── EMPRESA / FINCA
    │
    ├── PROYECTO PRODUCTIVO
    │       │
    │       ├── ARQUETIPO
    │       ├── ESCALA
    │       └── ZONA
    │
    └── CAMPAÑA
            │
            ├── COSTOS
            │       ├── Insumos
            │       ├── Combustible
            │       ├── Mano de Obra
            │       ├── Energía
            │       ├── Cosecha
            │       ├── Administración
            │       ├── Mantenimiento
            │       ├── Arrendamiento
            │       └── Otros
            │
            ├── PRODUCCIÓN
            │
            ├── PRECIO DE VENTA
            │
            └── ESTADO DE CIERRE
```

---

# 6. Indicadores del Productor

## KPI-01: Costo Operativo por Hectárea

### Descripción

Mide cuánto costó mantener y operar una hectárea durante la campaña.

### Fórmula

```text
Costo Operativo por Ha =
Costos Operativos Totales / Hectáreas Totales
```

### Unidad

```text
USD/Ha
```

---

## KPI-02: Variación Interanual del Costo por Hectárea

### Fórmula

```text
Variación (%) =
((Costo Actual / Costo Año Anterior) - 1) × 100
```

### Ejemplo

```text
Año anterior: USD 1.000/Ha
Año actual:   USD 1.200/Ha

Variación: +20 %
```

---

## KPI-03: Costo Operativo por Kilogramo

### Descripción

Mide cuánto costó producir cada kilogramo de nuez pecan.

### Fórmula

```text
Costo Operativo por Kg =
Costos Operativos Totales / Producción Total Kg
```

### Unidad

```text
USD/Kg
```

### Restricción

No debe calcularse si:

```text
Producción Total Kg <= 0
```

---

## KPI-04: Variación Interanual del Costo por Kilogramo

### Fórmula

```text
Variación (%) =
((Costo USD/Kg Actual / Costo USD/Kg Año Anterior) - 1) × 100
```

---

## KPI-05: Costo por Categoría por Hectárea

### Fórmula

```text
Costo Categoría USD/Ha =
Costo Total Categoría / Hectáreas Totales
```

### Aplicación

Debe calcularse para las nueve categorías:

1. Insumos.
2. Combustible.
3. Mano de Obra.
4. Energía Eléctrica.
5. Cosecha y Poscosecha.
6. Gastos Administrativos.
7. Mantenimiento.
8. Arrendamiento.
9. Otros.

---

## KPI-06: Incidencia de Rubro

### Fórmula

```text
Incidencia (%) =
(Costo del Rubro / Costo Operativo Total) × 100
```

### Ejemplo

```text
Costo Mano de Obra: USD 20.000
Costo Total:        USD 100.000

Incidencia: 20 %
```

---

## KPI-07: Punto de Equilibrio Operativo

### Descripción

Cantidad mínima de kilogramos que deben venderse para cubrir los costos operativos.

### Fórmula

```text
Punto de Equilibrio (Kg) =
Costos Operativos Totales / Precio de Venta Final
```

### Restricción

No calcular si:

```text
Precio de Venta <= 0
```

---

# 7. Sistema de Alertas

El sistema deberá generar alertas automáticas.

## ALERT-01: Variación Interanual Alta

Se activa cuando un rubro presenta una variación superior al umbral configurado.

Ejemplo:

```text
Variación > 30 %
```

El valor del umbral deberá ser configurable por administración.

---

## ALERT-02: Rubro con Alta Incidencia

Se activa cuando una categoría representa un porcentaje elevado del costo total.

Ejemplo:

```text
Mano de Obra > 40 % del costo total
```

---

## ALERT-03: Desviación frente al Benchmark

Se activa cuando el productor presenta un costo significativamente superior al promedio de su grupo comparable.

---

## ALERT-04: Valor Atípico

Se activa cuando un valor registrado se encuentra fuera de la banda estadística esperada.

---

# 8. Benchmarking Inteligente

## Objetivo

Comparar al productor únicamente con unidades productivas estructuralmente similares.

## Variables obligatorias de segmentación

```text
Zona Geográfica
+
Escala Productiva
+
Arquetipo del Proyecto
```

---

## Ejemplo de Segmento

```text
Zona: NOA
Escala: Mediano
Arquetipo: Maduro
```

Todos los cálculos comparativos deberán realizarse dentro de este segmento.

---

# 9. Segmentación del Productor

## 9.1. Arquetipo

### Joven

Proyecto sin producción comercial significativa.

Características:

- Costos de formación.
- Mantenimiento.
- Riego.
- Fertilización.
- Poda.

No requiere:

- Cosecha.
- Poscosecha.
- Precio de venta.

---

### En Transición

Proyecto que comenzó a producir comercialmente, pero todavía no alcanzó su potencial productivo.

Requiere:

- Producción.
- Cosecha.
- Precio de venta.

Debe compararse exclusivamente con otros proyectos en transición.

---

### Maduro

Proyecto en producción comercial plena.

Requiere carga completa.

---

### Mixto

Proyecto que combina áreas jóvenes y áreas productivas.

Requiere carga comercial si existe producción.

---

## 9.2. Escala

El sistema deberá permitir configurar los rangos de superficie que definen cada escala.

Configuración inicial sugerida:

```text
PEQUEÑO
MEDIANO
GRANDE
```

Ejemplo conceptual:

```text
Pequeño: < X Ha
Mediano: X - Y Ha
Grande:  > Y Ha
```

> Los valores X e Y deberán ser configurables por la cámara o por el administrador del sistema.

---

## 9.3. Zona Geográfica

Las zonas deberán ser administrables por cada cámara.

Ejemplo:

```text
Argentina
├── NOA
├── NEA
├── Centro
├── Cuyo
└── Patagonia
```

La estructura real no deberá estar hardcodeada.

Debe existir una entidad administrable:

```text
Zona Geográfica
```

---

# 10. Brecha de Costos

## Definición

La Brecha de Costos mide la diferencia entre el costo del productor y el costo de los productores más eficientes de su segmento.

## Grupo de referencia

El sistema utilizará:

```text
Cuartil Superior de Eficiencia
```

Es decir, el 25 % de productores con mejor desempeño dentro del segmento comparable.

---

## Fórmula Conceptual

```text
Brecha de Costos =
Costo del Productor -
Costo de Referencia del Cuartil Superior
```

---

## Ejemplo

```text
Productor:
USD 450/Ha

Cuartil Superior:
USD 310/Ha

Brecha:
USD 140/Ha
```

---

## Requisito Estadístico

La Brecha de Costos solo debe mostrarse si existe una cantidad suficiente de productores dentro del segmento.

Ejemplo:

```text
MIN_SAMPLE_SIZE = 5
```

Este valor deberá ser configurable.

---

# 11. Cierre Asistido de Campaña

## Objetivo

Garantizar que los datos utilizados para benchmarking estén completos y sean estadísticamente utilizables.

El sistema utilizará un modelo de:

```text
Cierre Asistido mediante Refuerzo Positivo
```

No se busca bloquear al usuario desde el inicio.

Se busca incentivar la finalización de la carga mostrando el beneficio.

---

## Elementos de UI

### Candado de Benchmarking

Mientras la campaña no esté completa:

```text
Benchmarking visible
Benchmarking bloqueado
```

Mensaje sugerido:

> Completa los datos clave de tu campaña para desbloquear tu comparativa confidencial contra productores de tu misma zona, escala y estado productivo.

---

### Barra de Progreso

El sistema deberá calcular:

```text
Porcentaje de completitud de campaña
```

Ejemplo:

```text
████████░░ 80 %
```

---

### Estado Apto para Estadística

Cuando la campaña cumple los requisitos:

```text
status = READY_FOR_STATISTICS
```

Entonces:

1. Se desbloquea el benchmarking.
2. Se habilitan indicadores comparativos.
3. La campaña puede ingresar al dataset estadístico.

---

# 12. Matriz de Validación

La validación deberá adaptarse según:

```text
Arquetipo
+
Escala
```

---

## Tabla de Validación

| Ítem | Joven | Transición | Maduro | Mixto | Pequeño | Grande |
|---|---|---|---|---|---|---|
| Insumos | Requerido | Requerido | Requerido | Requerido | Requerido | Requerido |
| Combustible | Requerido | Requerido | Requerido | Requerido | Requerido | Requerido |
| Mano de Obra | Requerido | Requerido | Requerido | Requerido | Requerido | Requerido |
| Energía | Requerido | Requerido | Requerido | Requerido | Flexible | Requerido |
| Cosecha | No requerido | Requerido | Requerido | Requerido | Requerido | Requerido |
| Administración | Requerido | Requerido | Requerido | Requerido | Flexible | Requerido |
| Mantenimiento | Requerido | Requerido | Requerido | Requerido | Requerido | Requerido |
| Arrendamiento | Flexible | Flexible | Flexible | Flexible | Flexible | Flexible |
| Otros | Opcional | Opcional | Opcional | Opcional | Opcional | Opcional |
| Precio de Venta | No requerido | Requerido | Requerido | Requerido | Requerido | Requerido |

---

## Regla Fundamental

```text
IF arquetipo == JOVEN
THEN
    NO requerir Cosecha
    NO requerir Precio de Venta
END
```

---

# 13. Estados de Campaña

Se propone el siguiente modelo.

```text
DRAFT
↓
IN_PROGRESS
↓
VALIDATION_PENDING
↓
READY_FOR_STATISTICS
↓
CLOSED
```

---

## DRAFT

La campaña fue creada pero no posee datos relevantes.

---

## IN_PROGRESS

La campaña posee actividad, pero todavía no cumple los requisitos.

---

## VALIDATION_PENDING

El usuario inició el proceso de cierre y el sistema detectó información pendiente.

---

## READY_FOR_STATISTICS

La campaña cumple los requisitos estadísticos.

Puede utilizarse para benchmarking.

---

## CLOSED

Estado final administrativo de la campaña.

---

# 14. Monitor de Salud de Datos

Este módulo estará disponible para administradores.

---

## DATA-01: Cobertura Nacional

### Fórmula

```text
Cobertura Nacional (%) =
(Hectáreas Registradas /
Hectáreas Estimadas Nacionales) × 100
```

---

## DATA-02: Cobertura Zonal

### Fórmula

```text
Cobertura Zonal (%) =
(Hectáreas Registradas Zona /
Hectáreas Estimadas Zona) × 100
```

---

## DATA-03: Densidad por Segmento

El sistema deberá mostrar la cantidad de productores por combinación.

Ejemplo:

```text
NOA
+
MEDIANO
+
MADURO

= 14 productores
```

---

## DATA-04: Tasa de Cierre

### Fórmula

```text
Tasa de Cierre (%) =
Campañas Aptas para Estadística /
Campañas Activas
× 100
```

---

# 15. Detección de Valores Atípicos

## Objetivo

Evitar que errores de carga afecten los indicadores sectoriales.

---

## Proceso

```text
Dato ingresado
      │
      ▼
Comparación con segmento
      │
      ▼
¿Está dentro de rango?
      │
 ┌────┴────┐
 Sí         No
 │          │
 ▼          ▼
Aceptar   Cuarentena
```

---

## Estado de Cuarentena

```text
OUTLIER_PENDING_REVIEW
```

El dato:

- No afecta promedios.
- No afecta benchmarks.
- Puede ser revisado.
- Puede requerir confirmación del productor.

---

## Ejemplo

```text
Promedio segmento: USD 300/Ha
Máximo histórico:   USD 500/Ha

Dato ingresado:
USD 2.500/Ha
```

El sistema genera:

```text
ALERTA DE DESVIACIÓN EXTREMA
```

---

## Métodos Estadísticos Sugeridos

La implementación puede utilizar:

- Rango intercuartílico (IQR).
- Desviación estándar.
- Percentiles.
- Z-Score.

Recomendación inicial:

```text
IQR + límites configurables
```

Esto permitirá adaptar el sistema a distribuciones de costos no necesariamente normales.

---

# 16. Tablero Administrativo

El tablero deberá dividirse en módulos.

---

## Dashboard 1: Costos Macro

Indicadores:

- Costo promedio USD/Ha.
- Costo promedio USD/Kg.
- Evolución interanual.
- Distribución por rubros.

---

## Dashboard 2: Eficiencia

Indicadores:

- Incidencia de rubros.
- Variaciones interanuales.
- Productores dentro de rangos.
- Desviaciones.

---

## Dashboard 3: Brechas de Costos

Filtros:

```text
País
Zona
Escala
Arquetipo
Campaña
```

Indicadores:

- Promedio.
- Mediana.
- Cuartil inferior.
- Cuartil superior.
- Brecha de costos.

---

## Dashboard 4: Participación

Estados:

### Campaña Cerrada

```text
READY_FOR_STATISTICS
```

### Carga en Proceso

```text
IN_PROGRESS
```

### Campaña en Blanco

```text
DRAFT
```

---

# 17. Benchmarking Internacional

## Objetivo

Comparar indicadores entre países.

Países iniciales:

```text
Argentina
Brasil
Uruguay
```

---

## Requisito Monetario

Todos los indicadores comparables deberán almacenarse o calcularse en:

```text
USD
```

---

## Indicadores

### Costo País

```text
USD/Ha
USD/Kg
```

---

### Participación Regional

```text
Hectáreas por país
Productores por país
Producción por país
```

---

### Matriz de Costos

Ejemplo:

| Rubro | Argentina | Brasil | Uruguay |
|---|---:|---:|---:|
| Insumos | X | X | X |
| Combustible | X | X | X |
| Mano de Obra | X | X | X |
| Energía | X | X | X |

---

# 18. Reglas de Privacidad

## Regla N Mínimo

Nunca publicar estadísticas de grupos demasiado pequeños.

Configuración sugerida:

```text
MIN_SAMPLE_SIZE = 5
```

---

## Regla

```text
IF productores_segmento < MIN_SAMPLE_SIZE
THEN
    ocultar estadísticas
END
```

---

## Información que no debe exponerse

El benchmarking no deberá mostrar:

- Nombre del productor.
- Empresa.
- Datos de contacto.
- Costos individuales identificables.

---

# 19. Reglas de Negocio

## RN-01

Una campaña Joven no requiere:

- Cosecha.
- Precio de Venta.

---

## RN-02

Una campaña con producción comercial requiere Precio de Venta para acceder al benchmarking financiero.

---

## RN-03

Las campañas abiertas no deben formar parte del benchmark anual definitivo.

---

## RN-04

Las comparaciones deben respetar:

```text
Zona
+
Escala
+
Arquetipo
```

---

## RN-05

No se deben mostrar estadísticas cuando el segmento no alcanza el tamaño mínimo.

---

## RN-06

Los valores atípicos deben excluirse temporalmente de los cálculos hasta ser confirmados.

---

## RN-07

Las zonas geográficas deben ser administrables y no hardcodeadas.

---

## RN-08

Los límites de escala deben ser configurables.

---

## RN-09

Los umbrales de alertas deben ser configurables.

---

## RN-10

Los datos estadísticos deben recalcularse cuando se modifica una campaña apta para estadísticas.

---

# 20. Requisitos Funcionales

## RF-01: Cálculo de KPIs

El sistema debe calcular automáticamente todos los indicadores definidos.

---

## RF-02: Comparación Interanual

El sistema debe comparar una campaña contra campañas anteriores del mismo proyecto.

---

## RF-03: Segmentación

El sistema debe clasificar automáticamente o permitir clasificar cada proyecto según:

- Zona.
- Escala.
- Arquetipo.

---

## RF-04: Benchmarking

El sistema debe generar benchmarks utilizando únicamente productores del mismo segmento.

---

## RF-05: Cierre Asistido

El sistema debe validar los datos antes de habilitar el benchmarking.

---

## RF-06: Alertas

El sistema debe generar alertas automáticas por:

- Variación.
- Incidencia.
- Desviación.
- Valores atípicos.

---

## RF-07: Privacidad

El sistema debe bloquear estadísticas de muestras insuficientes.

---

## RF-08: Exportación

El administrador debe poder exportar informes en:

- PDF.
- Excel.

---

## RF-09: Configuración

El administrador debe poder configurar:

- Zonas.
- Escalas.
- Tamaño mínimo de muestra.
- Umbrales de alertas.
- Parámetros estadísticos.

---

# 21. Modelo de Datos Sugerido

## Entidad: Producer

```typescript
Producer {
    id
    name
    country_id
    chamber_id
}
```

---

## Entidad: Farm

```typescript
Farm {
    id
    producer_id
    name
    zone_id
    total_hectares
}
```

---

## Entidad: ProductionProject

```typescript
ProductionProject {
    id
    farm_id

    archetype
    scale

    productive_hectares
    total_hectares
}
```

---

## Entidad: Campaign

```typescript
Campaign {
    id
    project_id

    year

    status

    total_hectares
    production_kg
    sale_price_usd

    statistical_status
}
```

---

## Entidad: CostCategory

```typescript
CostCategory {
    id
    name
    code
}
```

---

## Entidad: CampaignCost

```typescript
CampaignCost {
    id

    campaign_id
    category_id

    amount_usd
}
```

---

## Entidad: GeographicZone

```typescript
GeographicZone {
    id

    country_id
    chamber_id

    name
    code

    estimated_hectares
}
```

---

## Entidad: StatisticalSegment

Representa una combinación estadística.

```typescript
StatisticalSegment {
    id

    country_id
    zone_id

    scale
    archetype

    campaign_year
}
```

---

# 22. Estados y Flujos

## Flujo Principal del Productor

```text
Crear Proyecto
      │
      ▼
Definir Zona
      │
      ▼
Definir Arquetipo
      │
      ▼
Definir Escala
      │
      ▼
Crear Campaña
      │
      ▼
Registrar Costos
      │
      ▼
Registrar Producción
      │
      ▼
Registrar Precio
      │
      ▼
Validación
      │
      ├── Datos faltantes
      │        │
      │        ▼
      │   Corregir datos
      │
      ▼
Apto para Estadística
      │
      ▼
Benchmarking desbloqueado
```

---

## Flujo Estadístico

```text
Campañas Aptas
      │
      ▼
Filtrar por País
      │
      ▼
Filtrar por Zona
      │
      ▼
Filtrar por Escala
      │
      ▼
Filtrar por Arquetipo
      │
      ▼
Validar Tamaño de Muestra
      │
      ├── Insuficiente
      │       │
      │       ▼
      │   No publicar
      │
      ▼
Calcular Estadísticas
      │
      ▼
Promedio
Mediana
Cuartiles
Percentiles
Brechas
```

---

# 23. Futuras Extensiones

Las siguientes funcionalidades quedan fuera del alcance inicial, pero la arquitectura debería permitir incorporarlas.

## Fase 2

- Predicción de costos.
- Proyección de rentabilidad.
- Simulador de escenarios.
- Comparación de proveedores.
- Evolución histórica multianual.

---

## Fase 3

- Machine Learning para detección de anomalías.
- Recomendaciones automáticas.
- Predicción de costos por campaña.
- Detección de patrones de eficiencia.
- Clustering automático de productores.

---

## Fase 4

- Integración con sensores.
- Datos climáticos.
- Datos satelitales.
- Rendimiento por lote.
- Mapas productivos.
- Agricultura de precisión.

---

# Resumen de Arquitectura Funcional

```text
                         CALCULADOR PECAN
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
   PRODUCTOR                                      ADMINISTRADOR
        │                                               │
        ▼                                               ▼
 Registro de Costos                             Salud de Datos
        │                                               │
        ▼                                               ▼
 KPIs Individuales                              Costos Sectoriales
        │                                               │
        ▼                                               ▼
 Cierre Asistido                                Benchmarking
        │                                               │
        ▼                                               ▼
 Benchmarking Personal                          Competitividad
        │                                               │
        └───────────────────────┬───────────────────────┘
                                │
                                ▼
                       BASE ESTADÍSTICA
                                │
                                ▼
                     INTELIGENCIA SECTORIAL
                                │
                                ▼
                  DECISIONES ESTRATÉGICAS
```

---

# Objetivo Final

El sistema no debe limitarse a registrar costos individuales.

La arquitectura propuesta busca convertir:

```text
DATOS INDIVIDUALES
        ↓
DATOS ESTRUCTURADOS
        ↓
DATOS VALIDADOS
        ↓
ESTADÍSTICAS
        ↓
BENCHMARKING
        ↓
INTELIGENCIA SECTORIAL
        ↓
DECISIONES ESTRATÉGICAS
```

El valor central de la plataforma será transformar la información dispersa de cada productor en conocimiento colectivo, preservando la privacidad individual y generando herramientas concretas para mejorar la competitividad de la producción de pecan.