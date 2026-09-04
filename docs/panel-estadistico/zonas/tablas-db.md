# Estructura de Base de Datos - Gestión Geográfica y Zonas

## 1. Objetivo del documento

Este documento define las nuevas tablas y modificaciones necesarias en la base de datos de Pecan Calculador para implementar:

- Gestión multi-país.
- Almacenamiento normalizado de divisiones geográficas.
- Soporte para diferentes estructuras administrativas según el país.
- Selección geográfica durante la creación de proyectos.
- Creación de zonas geográficas por parte de los administradores.
- Asignación automática de proyectos a zonas.
- Base territorial para el futuro módulo de benchmarking estadístico.

La implementación inicial debe soportar:

- Argentina.


La arquitectura debe permanecer abierta para incorporar nuevos países en el futuro:

- Brasil.
- Uruguay.

---

# 2. Principios de diseño

## 2.1. La geografía es administrada internamente

La aplicación no debe depender de una API externa durante el uso cotidiano.

Las APIs o fuentes externas se utilizarán únicamente para:

- Carga inicial de información geográfica.
- Importación de nuevos países.
- Actualización eventual de divisiones territoriales.

Una vez importados, los datos quedan almacenados en la base de datos local de Pecan Calculador.

Flujo:

```text
API / Fuente Geográfica Externa
            |
            v
Proceso de Importación
            |
            v
Base de Datos Pecan Calculador
            |
            +-------------------+
            |                   |
            v                   v
       Proyectos          Zonas Geográficas
```

---

## 2.2. Los proyectos no almacenan nombres geográficos como texto

Los proyectos deben almacenar referencias mediante IDs.

No recomendado:

```text
country = "Argentina"
province = "Tucumán"
department = "Burruyacú"
municipality = "El Chañar"
```

Recomendado:

```text
country_id = 1
admin_level_1_id = 100
admin_level_2_id = 200
admin_level_3_id = 300
```

Esto permite:

- Evitar inconsistencias de nombres.
- Evitar duplicados.
- Facilitar filtros.
- Permitir cambios en nombres geográficos.
- Resolver automáticamente zonas.
- Mantener relaciones entre tablas.

---

## 2.3. Las zonas no son seleccionadas manualmente por el productor

El productor solamente define la ubicación geográfica de su proyecto.

Ejemplo:

```text
País: Argentina
Provincia: Tucumán
Departamento: Burruyacú
Localidad: El Chañar
```

El sistema determina automáticamente la zona correspondiente.

Ejemplo:

```text
Proyecto
    |
    v
El Chañar
    |
    v
Burruyacú
    |
    v
Tucumán
    |
    v
Zona NOA
```

---

## 2.4. Una zona puede contener territorios de diferentes niveles

Una zona puede estar compuesta por:

- Una provincia completa.
- Varias provincias completas.
- Departamentos específicos.
- Municipios específicos.
- Fragmentos de diferentes provincias.
- Combinaciones transprovinciales.

Ejemplos:

```text
Zona NOA
- Tucumán
- Salta
- Catamarca
```

```text
Zona BA Delta
- Tigre
- San Fernando
```

```text
Zona Costa del Paraná
- Territorios específicos de Entre Ríos
- Territorios específicos de Corrientes
```

---

# 3. Tablas nuevas

La implementación requiere las siguientes tablas:

```text
wp_pecan_countries

wp_pecan_geographic_territories

wp_pecan_geographic_zones

wp_pecan_geographic_zone_territories
```

Además se modificarán tablas existentes:

```text
wp_pecan_projects
```

---

# 4. Tabla: wp_pecan_countries

## 4.1. Propósito

Almacena los países disponibles dentro de la plataforma.

Inicialmente:

- Argentina.


En el futuro se podrán agregar nuevos países:

- Brasil.
- Uruguay.

---

## 4.2. Estructura

```sql
CREATE TABLE wp_pecan_countries (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    iso_code_2 CHAR(2) NOT NULL,

    iso_code_3 CHAR(3) NULL,

    is_active TINYINT(1) NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NULL DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_iso_code_2 (iso_code_2),

    UNIQUE KEY unique_iso_code_3 (iso_code_3),

    INDEX idx_active (is_active)

);
```

---

## 4.3. Descripción de campos

| Campo | Tipo | Descripción |
|---|---|---|
| id | BIGINT | Identificador interno |
| name | VARCHAR | Nombre del país |
| iso_code_2 | CHAR(2) | Código ISO de 2 caracteres |
| iso_code_3 | CHAR(3) | Código ISO de 3 caracteres |
| is_active | BOOLEAN | Indica si el país está disponible |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Fecha de actualización |

---

## 4.4. Datos iniciales

```text
+----+-----------+------+------+
| ID | País      | ISO2 | ISO3 |
+----+-----------+------+------+
| 1  | Argentina | AR   | ARG  |
| 2  | Brasil    | BR   | BRA  |
| 3  | Uruguay   | UY   | URY  |
+----+-----------+------+------+
```

Estos registros pueden ser creados durante el proceso inicial de instalación.

---

# 5. Tabla: wp_pecan_geographic_territories

## 5.1. Propósito

Esta es la tabla central del sistema geográfico.

Almacena todas las divisiones administrativas de los países soportados.

Ejemplos:

### Argentina

```text
Argentina
    |
    +-- Tucumán
    |     |
    |     +-- Burruyacú
    |     |      |
    |     |      +-- El Chañar
    |     |
    |     +-- Trancas
    |
    +-- Salta
```

### Brasil

```text
Brasil
    |
    +-- São Paulo
    |      |
    |      +-- Campinas
    |
    +-- Paraná
```

### Uruguay

```text
Uruguay
    |
    +-- Canelones
    |
    +-- Colonia
```

Todos estos territorios se almacenan en una única tabla.

---

## 5.2. Estructura

```sql
CREATE TABLE wp_pecan_geographic_territories (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    country_id BIGINT UNSIGNED NOT NULL,
    parent_id BIGINT UNSIGNED NULL,
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    territory_type VARCHAR(50) NOT NULL,
    level_number TINYINT UNSIGNED NOT NULL,
    external_source VARCHAR(100) NULL,
    external_id VARCHAR(255) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_country (country_id),

    INDEX idx_parent (parent_id),

    INDEX idx_country_parent (
        country_id,
        parent_id
    ),

    INDEX idx_territory_type (territory_type),

    INDEX idx_level_number (level_number),

    INDEX idx_external (
        external_source,
        external_id
    ),

    INDEX idx_active (is_active)

);
```

---

# 6. Funcionamiento de la jerarquía territorial

La relación entre territorios se construye mediante:

```text
parent_id
```

Cada territorio puede tener un territorio padre.

Ejemplo:

```text
Argentina
    |
    +-- Tucumán
          |
          +-- Burruyacú
                |
                +-- El Chañar
```

En la tabla:

| id | parent_id | name | type |
|---|---:|---|---|
| 10 | NULL | Tucumán | province |
| 20 | 10 | Burruyacú | department |
| 30 | 20 | El Chañar | locality |

---

# 7. Campos de wp_pecan_geographic_territories

## id

Identificador interno del territorio.

```text
10
```

---

## country_id

Referencia al país al cual pertenece el territorio.

Ejemplo:

```text
Argentina = 1
Brasil = 2
Uruguay = 3
```

---

## parent_id

Referencia al territorio inmediatamente superior.

Ejemplo:

```text
El Chañar
parent_id = Burruyacú
```

```text
Burruyacú
parent_id = Tucumán
```

```text
Tucumán
parent_id = NULL
```

---

## name

Nombre oficial o principal del territorio.

Ejemplos:

```text
Tucumán
São Paulo
Burruyacú
El Chañar
```

---

## normalized_name

Nombre normalizado utilizado para:

- búsquedas;
- comparaciones;
- importaciones;
- prevención de duplicados.

Ejemplos:

```text
Tucumán
→ tucuman

São Paulo
→ sao paulo

El Chañar
→ el chanar
```

---

## territory_type

Tipo administrativo del territorio.

Ejemplos:

```text
province
state
department
municipality
locality
county
```

Este campo permite conservar la denominación real utilizada por cada país.

---

## level_number

Nivel jerárquico administrativo.

Ejemplo para Argentina:

```text
1 = Provincia
2 = Departamento
3 = Municipio / Localidad
```

Ejemplo para Brasil:

```text
1 = Estado
2 = Municipio
```

El sistema no debe asumir que todos los países poseen la misma cantidad de niveles.

---

## external_source

Fuente desde la cual se importó el dato.

Ejemplos:

```text
georef_argentina
ibge_brazil
official_dataset
manual
```

---

## external_id

Identificador original del territorio en la fuente externa.

Permite:

- actualizar información;
- detectar duplicados;
- sincronizar futuras modificaciones;
- rastrear el origen del dato.

---

# 8. Ejemplo de datos completos

## Argentina

| id | country_id | parent_id | name | type | level |
|---|---:|---:|---|---|---:|
| 1 | 1 | NULL | Tucumán | province | 1 |
| 2 | 1 | NULL | Salta | province | 1 |
| 10 | 1 | 1 | Burruyacú | department | 2 |
| 11 | 1 | 1 | Trancas | department | 2 |
| 100 | 1 | 10 | El Chañar | locality | 3 |

---

## Brasil

| id | country_id | parent_id | name | type | level |
|---|---:|---:|---|---|---:|
| 1000 | 2 | NULL | São Paulo | state | 1 |
| 1001 | 2 | NULL | Paraná | state | 1 |
| 1010 | 2 | 1000 | Campinas | municipality | 2 |

---

## Uruguay

| id | country_id | parent_id | name | type | level |
|---|---:|---:|---|---|---:|
| 2000 | 3 | NULL | Canelones | department | 1 |
| 2001 | 3 | NULL | Colonia | department | 1 |

---

# 9. Tabla: wp_pecan_geographic_zones

## 9.1. Propósito

Almacena las zonas geográficas creadas por los administradores de cada cámara.

Las zonas son utilizadas para:

- benchmarking;
- análisis estadístico;
- segmentación de productores;
- informes zonales;
- cobertura territorial;
- comparativas de costos.

Una zona pertenece a:

- un país.

---

## 9.2. Estructura

```sql
CREATE TABLE wp_pecan_geographic_zones (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    country_id BIGINT UNSIGNED NOT NULL,

    code VARCHAR(50) NULL,

    name VARCHAR(255) NOT NULL,

    description TEXT NULL,

    is_active TINYINT(1) NOT NULL DEFAULT 1,

    created_by BIGINT UNSIGNED NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NULL DEFAULT NULL
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_country (country_id),

    INDEX idx_active (is_active)

);
```

---

# 10. Campos de wp_pecan_geographic_zones

| Campo | Descripción |
|---|---|
| id | Identificador de la zona |
| country_id | País al que pertenece |
| code | Código interno opcional |
| name | Nombre de la zona |
| description | Descripción opcional |
| is_active | Estado de la zona |
| created_by | Usuario administrador creador |
| created_at | Fecha de creación |
| updated_at | Fecha de modificación |

---

# 11. Ejemplos de zonas

```text
+----+----------------------------+-----------+
| ID | Zona                       | País      |
+----+----------------------------+-----------+
| 1  | NOA                        | Argentina |
| 2  | BA Delta                   | Argentina |
| 3  | BA Sur                     | Argentina |
| 4  | BA Centro Norte            | Argentina |
| 5  | BA Oeste                   | Argentina |
| 6  | ER-Ctes Costa del Paraná   | Argentina |
+----+----------------------------+-----------+
```

---

# 12. Tabla: wp_pecan_geographic_zone_territories

## 12.1. Propósito

Esta tabla relaciona las zonas con los territorios que las componen.

Permite que una zona contenga:

- provincias completas;
- estados completos;
- departamentos;
- municipios;
- localidades;
- territorios de diferentes provincias.

Esta tabla resuelve la relación:

```text
Zona ↔ Uno o varios territorios
```

---

## 12.2. Estructura

```sql
CREATE TABLE wp_pecan_geographic_zone_territories (

    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    geographic_zone_id BIGINT UNSIGNED NOT NULL,

    geographic_territory_id BIGINT UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_zone_territory (
        geographic_zone_id,
        geographic_territory_id
    ),

    INDEX idx_zone (
        geographic_zone_id
    ),

    INDEX idx_territory (
        geographic_territory_id
    )

);
```

---

# 13. Ejemplo: Zona NOA

La zona:

```text
9 - NOA
```

Incluye:

```text
Tucumán
Salta
Catamarca
```

Tabla:

| geographic_zone_id | geographic_territory_id |
|---:|---:|
| 9 | Tucumán |
| 9 | Salta |
| 9 | Catamarca |

No es necesario guardar individualmente todos los departamentos y localidades.

Al incluir una provincia, se considera incluida toda su jerarquía descendente.

Ejemplo:

```text
Zona NOA
    |
    +-- Tucumán
          |
          +-- Burruyacú
          |      |
          |      +-- El Chañar
          |
          +-- Trancas
```

Todos los proyectos dentro de Tucumán pertenecen automáticamente a la Zona NOA.

---

# 14. Ejemplo: Zona BA Delta

La zona:

```text
BA Delta
```

Incluye solamente:

```text
Tigre
San Fernando
```

Tabla:

| geographic_zone_id | geographic_territory_id |
|---:|---|
| 3 | Tigre |
| 3 | San Fernando |

Buenos Aires no se encuentra incluido completo.

Por lo tanto:

```text
Buenos Aires
    |
    +-- Tigre              -> BA Delta
    |
    +-- San Fernando       -> BA Delta
    |
    +-- Bahía Blanca       -> Otra zona
```

---

# 15. Ejemplo: Zona transprovincial

Zona:

```text
ER-Ctes Costa del Paraná
```

Puede contener:

```text
Entre Ríos
    +-- Territorio A
    +-- Territorio B

Corrientes
    +-- Territorio C
    +-- Territorio D
```

En la tabla:

| zone_id | territory_id |
|---:|---:|
| 7 | Territorio A |
| 7 | Territorio B |
| 7 | Territorio C |
| 7 | Territorio D |

No existe ninguna restricción que obligue a todos los territorios de una zona a pertenecer a la misma provincia.

---

# 16. Modificación de wp_pecan_projects

## 16.1. Objetivo

Los proyectos deben dejar de depender de campos de texto para almacenar su ubicación.

La ubicación debe utilizar referencias a la nueva estructura geográfica.

---

## 16.2. Campos actuales

Actualmente la tabla utiliza campos relacionados con:

```text
provincia
departamento
municipio
```

Estos campos pueden contener nombres como texto.

La migración debe evaluar la estructura actual antes de eliminar o modificar datos existentes.

---

## 16.3. Nuevos campos

Se recomienda agregar:

```sql
ALTER TABLE wp_pecan_projects

ADD COLUMN country_id BIGINT UNSIGNED NULL,

ADD COLUMN geographic_territory_id BIGINT UNSIGNED NULL,

ADD COLUMN geographic_zone_id BIGINT UNSIGNED NULL;
```

---

# 17. Modelo recomendado para Projects

La estructura mínima recomendada es:

| Campo | Descripción |
|---|---|
| country_id | País del proyecto |
| geographic_territory_id | Ubicación geográfica más específica |
| geographic_zone_id | Zona asignada automáticamente |

Ejemplo:

```text
Proyecto
    |
    +-- country_id
    |       Argentina
    |
    +-- geographic_territory_id
    |       El Chañar
    |
    +-- geographic_zone_id
            NOA
```

---

# 18. ¿Por qué almacenar solamente el territorio más específico?

La jerarquía completa puede reconstruirse mediante `parent_id`.

Ejemplo:

```text
El Chañar
    |
    parent_id
    v
Burruyacú
    |
    parent_id
    v
Tucumán
```

Por lo tanto, si el proyecto tiene:

```text
geographic_territory_id = El Chañar
```

el sistema puede obtener:

```text
Localidad: El Chañar
Departamento: Burruyacú
Provincia: Tucumán
País: Argentina
```

Esto evita duplicar información geográfica dentro de `wp_pecan_projects`.

---

# 19. Campo geographic_zone_id

Este campo representa la zona resuelta automáticamente para el proyecto.

Ejemplo:

```text
Ubicación:

Argentina
Tucumán
Burruyacú
El Chañar
```

El sistema encuentra:

```text
Zona NOA
```

Y guarda:

```text
geographic_zone_id = 9
```

---

# 20. Reglas para geographic_zone_id

El campo no debe ser editable directamente por el productor.

Debe ser calculado por el sistema.

Se recalcula cuando:

- se crea un proyecto;
- se modifica la ubicación del proyecto;
- se modifica la composición de una zona;
- se elimina un territorio de una zona;
- se desactiva una zona.

---

# 21. Algoritmo conceptual de asignación de zona

Al guardar la ubicación del proyecto:

```text
1. Obtener geographic_territory_id.

2. Buscar si el territorio pertenece directamente a una zona.

3. Si no pertenece:
   obtener parent_id.

4. Buscar si el padre pertenece a una zona.

5. Repetir hasta llegar al nivel superior.

6. Si se encuentra una zona:
   asignar geographic_zone_id.

7. Si no se encuentra:
   dejar geographic_zone_id como NULL.
```

Ejemplo:

```text
Proyecto
Ubicación: El Chañar

Buscar:

El Chañar
    |
    | ¿Está en una zona?
    | NO
    v

Burruyacú
    |
    | ¿Está en una zona?
    | NO
    v

Tucumán
    |
    | ¿Está en una zona?
    | SÍ
    v

Zona NOA
```

Resultado:

```text
geographic_zone_id = NOA
```

---

# 22. Reglas de integridad territorial

El sistema debe evitar territorios ambiguos.

## Regla 1: Un territorio no debe pertenecer a dos zonas activas simultáneamente

Ejemplo incorrecto:

```text
Tigre
    |
    +-- BA Delta
    |
    +-- BA Centro Norte
```

Esto generaría ambigüedad.

El sistema debe impedirlo.

---

## Regla 2: No se puede incluir una provincia completa si parte de ella ya pertenece a otra zona

Ejemplo:

```text
Buenos Aires
```

Si Tigre y San Fernando ya fueron asignados a:

```text
BA Delta
```

no debe ser posible seleccionar toda Buenos Aires para otra zona.

La interfaz debe indicar:

```text
Buenos Aires
Estado: Parcialmente asignada
```

---

## Regla 3: Una zona puede contener territorios de múltiples provincias

Ejemplo válido:

```text
Zona Costa del Paraná

Entre Ríos:
    Territorio A
    Territorio B

Corrientes:
    Territorio C
    Territorio D
```

---

## Regla 4: La selección de un territorio padre incluye automáticamente sus descendientes

Si se selecciona:

```text
Tucumán
```

se incluyen automáticamente:

```text
Todos sus departamentos
Todas sus localidades
```

No deben guardarse individualmente todos los descendientes en `wp_pecan_geographic_zone_territories`.

Solo se guarda:

```text
Zona NOA -> Tucumán
```

---

# 23. Proceso de carga inicial

## 23.1. Instalación de la aplicación

Durante la instalación:

```text
Instalación Pecan Calculador
            |
            v
Crear tablas geográficas
            |
            v
Obtener datos geográficos externos
            |
            v
Importar países
            |
            v
Importar territorios
            |
            v
Validar estructura
            |
            v
Datos disponibles
```

---

## 23.2. Importación inicial

Inicialmente deben cargarse:

```text
Argentina
Brasil
Uruguay
```

Cada país tendrá una fuente geográfica definida.

El importador debe:

1. Consultar la fuente externa.
2. Obtener las divisiones administrativas.
3. Normalizar los datos.
4. Crear los países si no existen.
5. Crear los territorios.
6. Mantener la relación padre-hijo.
7. Guardar `external_source`.
8. Guardar `external_id`.
9. Evitar duplicados.

---

# 24. Estrategia de actualización

La información geográfica cambia poco.

Por esta razón, la aplicación no debe sincronizar automáticamente en cada uso.

Las actualizaciones pueden realizarse mediante:

```text
Administrador
    |
    v
Actualizar datos geográficos
```

O mediante una tarea programada.

Proceso:

```text
Fuente externa
      |
      v
Comparar external_id
      |
      +-- Existe -> actualizar
      |
      +-- No existe -> insertar
      |
      +-- Ya no existe -> marcar inactivo
```

Nunca se deben eliminar automáticamente territorios utilizados por proyectos existentes.

Se recomienda utilizar:

```text
is_active = 0
```

---

# 25. Relación entre tablas

```text
wp_pecan_countries
        |
        | 1:N
        v
wp_pecan_geographic_territories
        |
        | parent_id
        |
        v
Jerarquía territorial


wp_pecan_geographic_zones
        |
        | N:N
        v
wp_pecan_geographic_zone_territories
        |
        |
        v
wp_pecan_geographic_territories


wp_pecan_projects
        |
        +-- country_id
        |
        +-- geographic_territory_id
        |
        +-- geographic_zone_id
```

---

# 26. Diagrama completo

```text
                    COUNTRIES
                        |
        +---------------+---------------+
        |               |               |
        v               v               v

   ARGENTINA         BRASIL          URUGUAY
        |               |               |
        v               v               v

   TERRITORIES      TERRITORIES      TERRITORIES
        |
        |
        +----------------------------------+
        |                                  |
        v                                  v

    PROJECTS                       ZONE TERRITORIES
        |                                  |
        |                                  v
        |                             GEOGRAPHIC
        |                               ZONES
        |                                  |
        +----------------------------------+
                       |
                       v

                  BENCHMARKING
```

---

# 27. Índices recomendados

## wp_pecan_geographic_territories

Consultas frecuentes:

```text
Obtener territorios por país.

Obtener hijos de un territorio.

Buscar territorios por nombre.

Resolver jerarquías.
```

Índices:

```sql
INDEX idx_country (country_id);

INDEX idx_parent (parent_id);

INDEX idx_country_parent (
    country_id,
    parent_id
);

INDEX idx_active (is_active);
```

---

## wp_pecan_geographic_zone_territories

Consultas frecuentes:

```text
¿A qué zona pertenece este territorio?

¿Qué territorios pertenecen a esta zona?
```

Índices:

```sql
INDEX idx_zone (geographic_zone_id);

INDEX idx_territory (geographic_territory_id);
```

---

## wp_pecan_projects

Consultas futuras:

```text
Proyectos por país.

Proyectos por zona.

Proyectos utilizados para benchmarking.

Proyectos por territorio.
```

Índices recomendados:

```sql
INDEX idx_project_country (country_id);

INDEX idx_project_territory (geographic_territory_id);

INDEX idx_project_zone (geographic_zone_id);
```

---

# 28. Resumen de tablas

| Tabla | Propósito |
|---|---|
| wp_pecan_countries | Países soportados |
| wp_pecan_geographic_territories | Todas las divisiones geográficas |
| wp_pecan_geographic_zones | Zonas creadas por cámaras |
| wp_pecan_geographic_zone_territories | Territorios que componen cada zona |
| wp_pecan_projects | Proyectos vinculados a ubicación y zona |

---

# 29. Flujo completo del sistema

## Paso 1: Instalación

```text
Instalar aplicación
        |
        v
Crear tablas
        |
        v
Importar países
        |
        v
Importar territorios
```

---

## Paso 2: Productor crea proyecto

```text
Selecciona país
        |
        v
Selecciona división nivel 1
        |
        v
Selecciona división nivel 2
        |
        v
Selecciona división nivel 3
        |
        v
Guardar territorio final
```

---

## Paso 3: Sistema resuelve zona

```text
Territorio seleccionado
        |
        v
Buscar zona directa
        |
        +-- Encontrada
        |       |
        |       v
        |    Asignar zona
        |
        +-- No encontrada
                |
                v
          Buscar territorio padre
                |
                v
           Repetir proceso
```

---

## Paso 4: Administrador crea zona

```text
Seleccionar país
        |
        v
Explorar árbol territorial
        |
        v
Seleccionar provincias completas
o territorios específicos
        |
        v
Validar conflictos
        |
        v
Guardar zona
```

---

# 30. Consideraciones para futuras funcionalidades

Esta estructura será utilizada posteriormente por:

## Benchmarking

```text
Costo por hectárea por zona geográfica.
```

## Comparativas

```text
Productor vs Promedio de productores de su misma zona.
```

## Cobertura estadística

```text
Hectáreas registradas vs Hectáreas estimadas por zona.
```

## Informes institucionales

```text
Costos regionales.

Eficiencia por zona.

Brechas de costos.

Representatividad territorial.
```

## Benchmarking internacional

```text
Argentina
vs
Brasil
vs
Uruguay
```

---

# 31. Decisión arquitectónica final

La arquitectura geográfica de Calculador Pecan se basa en los siguientes principios:

```text
1. Los países y territorios se cargan previamente.

2. Las APIs externas solo se utilizan para importar
   o actualizar información geográfica.

3. La aplicación trabaja diariamente con su propia
   base de datos geográfica.

4. Los territorios utilizan una estructura jerárquica
   mediante parent_id.

5. Los países pueden tener diferentes estructuras
   administrativas.

6. Los productores seleccionan únicamente su ubicación.

7. Las zonas son definidas por administradores.

8. Las zonas pueden agrupar territorios de cualquier
   nivel administrativo.

9. La zona de un proyecto se asigna automáticamente.

10. Ningún territorio debe pertenecer simultáneamente
    a más de una zona activa.

11. La estructura debe servir como base para el futuro
    sistema de benchmarking y análisis estadístico.
```

---

# 32. Estado de implementación

## Tablas a crear

```text
[ ] wp_pecan_countries

[ ] wp_pecan_geographic_territories

[ ] wp_pecan_geographic_zones

[ ] wp_pecan_geographic_zone_territories
```

## Tabla a modificar

```text
[ ] wp_pecan_projects
```

## Servicios a desarrollar

```text
[ ] Geographic Import Service

[ ] Geographic Hierarchy Service

[ ] Geographic Zone Resolver

[ ] Geographic Zone Validation Service
```

## Funcionalidades frontend

```text
[ ] Selector de país

[ ] Selector jerárquico de territorios

[ ] Gestión de zonas para administradores

[ ] Árbol geográfico con selección múltiple

[ ] Indicador de territorios parcialmente asignados

[ ] Resolución automática de zona
```

---

# 33. Próximo paso

Una vez implementada la estructura de tablas, el siguiente documento técnico deberá definir:

```text
geographic-services.md
```

Este documento deberá especificar:

- Importación de datos geográficos.
- Comunicación con APIs externas.
- Normalización de datos.
- Resolución de jerarquías.
- Algoritmo de asignación de zonas.
- Validación de conflictos entre zonas.
- Endpoints internos.
- Caché de datos geográficos.

La estructura definida en este documento constituye la capa de datos sobre la cual se construirá toda la gestión geográfica y la futura segmentación estadística de Pecan Calculador.