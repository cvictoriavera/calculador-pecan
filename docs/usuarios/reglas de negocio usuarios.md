# Reglas de Negocio: Gestión de Usuarios y Campo Inmutable de País

## 1. Objetivo del documento

Este documento define la especificación funcional y técnica sobre la gestión del perfil de usuario en Pecan Calculador, centrándose en el **campo personalizado de país (`pais`)** gestionado mediante **Advanced Custom Fields (ACF)** en WordPress.

Este campo determina la pertenencia territorial del usuario y tiene un impacto directo en el **Gestor de Zonas Geográficas**, el **Flujo de Onboarding**, la **Creación de Proyectos** y el **Panel Estadístico**.

---

# 2. Principio Fundamental: Inmutabilidad del País desde la Aplicación

El país de un usuario **es un dato inmutable desde la aplicación frontend (React App)**.

```text
               ADMINISTRACIÓN WORDPRESS (wp-admin)
                                │
                                ▼
                   Campo ACF `pais` en Usuario
                                │
                                ▼
                       PECAN CALCULADOR APP
        ┌───────────────────────┴───────────────────────┐
        │                                               │
        ▼                                               ▼
  PRODUCTOR / USUARIO                            ADMIN DE PAÍS (`admin_country`)
  - País fijado por perfil                       - País de gestión fijado por perfil
  - Inmutable en Onboarding                      - Solo gestiona Zonas de su País
  - Inmutable en Ajustes/Perfil                  - Selector de país bloqueado
```

## Puntos clave:
1. **Asignación exclusiva desde WordPress:** El valor del campo `pais` es asignado y administrado únicamente por los administradores del sitio desde el panel de WordPress (`wp-admin`).
2. **Sin edición en Onboarding:** Durante el proceso de Onboarding, el usuario **no selecciona su país**. La aplicación toma automáticamente el país asignado en su perfil.
3. **Sin edición en Ajustes / Configuración:** En la pantalla de ajustes o perfil (`/config`), el país se presenta como información de **solo lectura (Read-Only)** y no puede ser alterado.
4. **Protección en la API REST:** El backend de WordPress/PHP bloquea cualquier intento de modificación del campo `pais` proveniente de peticiones de usuarios sin rol `administrator`.

---

# 3. Reglas de Negocio (RN-USER)

## RN-USER-01: Campo Personalizado ACF `pais`
Todo usuario registrado en la plataforma posee un campo personalizado creado con el plugin ACF llamado `pais` asociado a su perfil de WordPress (`user_$user_id`).

---

## RN-USER-02: Inmutabilidad desde la Aplicación Frontend
El valor del campo `pais` no puede ser modificado por el propio usuario ni por administradores de país desde ninguna vista de la aplicación React (Onboarding, Ajustes, Proyectos).

---

## RN-USER-03: Preselección de País en Creación de Proyectos
Cuando un productor crea un proyecto productivo, la ubicación inicial (País) queda fijada automáticamente en base al campo `pais` de su perfil de usuario.

---

## RN-USER-04: Limitación del Alcance del `admin_country`
Para los usuarios con el rol `admin_country`, el campo `pais` define de manera estricta el **único país** sobre el cual tienen permisos para crear, editar, activar/desactivar y eliminar **Zonas Geográficas**.

---

## RN-USER-05: Protección en el Backend (API REST)
El controlador de usuarios (`CCP_Users_Controller`) y las funciones de actualización de perfil en PHP deben ignorar o rechazar (`403 Forbidden`) cualquier parámetro `pais` enviado en peticiones `PUT` / `POST` realizadas por usuarios estándar o `admin_country`.

---

## RN-USER-06: Mapeo Normalizado de País
El valor almacenado en el campo ACF `pais` (ej: `"Argentina"`, `"AR"` o ID) se mapea internamente contra la tabla de base de datos `wp_pecan_countries` para resolver su correspondiente `country_id`.

---

# 4. Impacto en los Módulos de la Aplicación

## 4.1. Flujo de Onboarding (`Onboarding.tsx`)
- Se elimina cualquier paso o selector que solicite al usuario elegir su país de origen.
- El sistema detecta el `country_id` asignado a su usuario y adapta directamente los selectores de divisiones administrativas secundarias (Provincia / Departamento / Localidad).

---

## 4.2. Pantalla de Ajustes y Perfil (`Config.tsx`)
- El campo "País" se muestra deshabilitado / solo lectura con un indicador visual (Badge o campo readonly).
- Se muestra una nota explicativa: *"El país asignado a tu cuenta es gestionado por la administración institucional."*

---

## 4.3. Creación y Edición de Proyectos (`Projects.tsx` / `LocationSelector.tsx`)
- Al crear un proyecto, el selector de país aparece pre-seleccionado con el país del usuario y bloqueado para cambios.
- El productor solo selecciona las divisiones internas (Nivel 1: Provincia, Nivel 2: Departamento, Nivel 3: Localidad).

---

## 4.4. Panel Estadístico y Gestor de Zonas (`ZonasGeograficas.tsx` / `/zonas-geograficas`)
- Para el usuario `admin_country`:
  - El gestor de zonas accesible desde el menú lateral (`/zonas-geograficas` debajo de Resumen Ejecutivo) bloquea el selector de país en el país asignado por su campo ACF `pais`.
  - Todas las peticiones al backend envían su `country_id` autorizado.

---

# 5. Requisitos Funcionales (RF-USER)

## RF-USER-01
El sistema debe leer el campo ACF `pais` del usuario actual al autenticarse e incluirlo en la respuesta del contexto de usuario (`/users/me` o `useApp()`).

## RF-USER-02
El sistema debe mostrar el país del usuario en la pantalla de perfil como un campo inmutable.

## RF-USER-03
El sistema debe bloquear las peticiones REST API que intenten modificar el metadato `pais` de un usuario sin permisos de Super Administrador.

---

# 6. Requisitos de Interfaz (UI-USER)

## UI-USER-01
En las vistas de perfil y proyectos, los elementos de entrada del país deben utilizar el estado `disabled` o renderizarse como un texto estático / Badge descriptivo.

## UI-USER-02
Si un usuario `admin_country` ingresa al Gestor de Zonas, la interfaz debe mostrar un banner o título indicando la cámara a la que pertenece (ej: *"Gestión de Zonas - Argentina"*).
