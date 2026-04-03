# 🌰 Calculador Pecan

**Plugin de WordPress para la gestión integral del cultivo de pecán.**  
Dashboard interactivo para el registro de producción, costos operativos e inversiones, orientado a productores agropecuarios de Argentina y la región.

---

## ¿Qué es este proyecto?

**Calculador Pecan** es un plugin de WordPress que funciona como una aplicación web completa embebida dentro del sitio. Permite a productores de pecán llevar un control detallado y organizado de:

- Sus **montes** (parcelas de cultivo) y sus características.
- Las **campañas** anuales de producción.
- Los **kilos producidos** por monte y por temporada.
- Los **costos operativos** del campo (combustible, cosecha, mano de obra, insumos, etc.).
- Las **inversiones** realizadas en el establecimiento.
- Un **dashboard** con métricas y resúmenes visuales de toda la operación.

El objetivo es brindar a los productores una herramienta clara, visual y centralizada para tomar decisiones basadas en datos reales de su campo.

---

## Arquitectura general

El proyecto combina dos tecnologías principales:

```
┌─────────────────────────────────────────┐
│             WordPress (PHP)             │
│  Plugin host · REST API · Base de datos │
└─────────────────┬───────────────────────┘
                  │  REST API (wp-json)
┌─────────────────▼───────────────────────┐
│         React + Vite (Frontend)         │
│  SPA embebida · React Router · Recharts │
└─────────────────────────────────────────┘
```

- **Backend**: PHP con WordPress. Maneja la autenticación de usuarios, la persistencia de datos en MySQL y expone una REST API propia.
- **Frontend**: Una Single Page Application (SPA) construida con React 18 + TypeScript y empaquetada con Vite, que se carga dentro de una página de WordPress usando una plantilla de página personalizada (`templates/dashboard.php`).

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| CMS / Host | WordPress |
| Backend / API | PHP · WordPress REST API |
| Base de datos | MySQL (tablas propias con prefijo `pecan_`) |
| Frontend | React 18 + TypeScript |
| Build tool | Vite |
| Estilos | Tailwind CSS |
| Componentes UI | Radix UI + shadcn/ui |
| Routing | React Router DOM v6 (HashRouter) |
| Estado global | Zustand |
| Fetching / cache | TanStack React Query |
| Gráficos | Recharts |
| Formularios | React Hook Form + Zod |

---

## Estructura del proyecto

```
calculador/
├── calculador-pecan.php        # Punto de entrada del plugin (registro, activación, API)
├── includes/
│   ├── api/                    # Controladores de la REST API (uno por entidad)
│   ├── db/                     # Clases de acceso a la base de datos
│   └── class-ccp-assets-manager.php  # Registro y carga de scripts/estilos
├── templates/
│   └── dashboard.php           # Plantilla de página de WordPress que monta la SPA
├── src/                        # Código fuente del frontend (React + TypeScript)
│   ├── pages/                  # Páginas de la aplicación (rutas principales)
│   ├── components/             # Componentes reutilizables
│   ├── contexts/               # Contextos de React (estado global por contexto)
│   ├── hooks/                  # Custom hooks
│   ├── services/               # Capa de comunicación con la REST API
│   ├── stores/                 # Stores de Zustand
│   └── types/                  # Tipos e interfaces TypeScript
├── dist/                       # Build de producción (generado por Vite)
├── scripts/                    # Scripts de utilidad (ej: empaquetado del plugin)
└── public/                     # Assets estáticos
```

---

## Módulos del frontend

La aplicación está dividida en las siguientes páginas/secciones:

| Ruta | Página | Descripción |
|---|---|---|
| `/projects` | **Proyectos** | Listado y selección del establecimiento/proyecto activo |
| `/dashboard` | **Dashboard** | Resumen general con KPIs, gráficos y métricas de la campaña actual |
| `/montes` | **Montes** | Gestión de parcelas: area, plantas por hectárea, variedad, fecha de plantación |
| `/campanas` | **Campañas** | Alta y administración de temporadas anuales de producción |
| `/produccion` | **Producción** | Registro de kilos cosechados por monte y campaña |
| `/inversiones` | **Inversiones** | Registro de inversiones por categoría |
| `/costos` | **Costos** | Registro detallado de costos operativos por categoría |
| `/config` | **Configuración** | Parámetros del proyecto, modelos de rendimiento y ajustes |
| `/onboarding` | **Onboarding** | Flujo de configuración inicial para nuevos usuarios |

---

## Base de datos

Al activarse el plugin, se crean automáticamente 8 tablas en la base de datos de WordPress con el prefijo `pecan_`:

| Tabla | Contenido |
|---|---|
| `pecan_projects` | Proyectos/establecimientos (uno por productor o campo) |
| `pecan_campaigns` | Campañas anuales por proyecto |
| `pecan_montes` | Montes (parcelas) por proyecto |
| `pecan_productions` | Registros de producción (kg) por monte y campaña |
| `pecan_annual_records` | Consolidados anuales agrupados por tipo y categoría |
| `pecan_investments` | Inversiones por categoría y campaña |
| `pecan_costs` | Costos operativos por categoría y campaña |
| `pecan_yield_models` | Modelos de curvas de rendimiento por variedad |

Las tablas usan `InnoDB` con claves foráneas (`ON DELETE CASCADE`) para mantener integridad referencial.

---

## REST API

El plugin registra endpoints propios bajo el namespace `calculador-pecan/v1`. Cada entidad tiene su propio controlador PHP:

- `/projects` — CRUD de proyectos
- `/campaigns` — CRUD de campañas
- `/montes` — CRUD de montes
- `/productions` — Registro de producción
- `/investments` — Registro de inversiones
- `/costs` — Registro de costos
- `/annual-records` — Registros anuales consolidados
- `/yield-models` — Modelos de rendimiento
- `/export` — Exportación de datos
- `/import` — Importación de datos

---

## Flujo de uso

```
1. El productor instala y activa el plugin
       ↓
2. WordPress crea las tablas y la página del dashboard automáticamente
       ↓
3. El usuario accede a la página "Calculador Pecan" en el sitio
       ↓
4. Onboarding: configura su primer proyecto (nombre, ubicación, etc.)
       ↓
5. Crea sus Montes (parcelas del campo)
       ↓
6. Crea una Campaña anual
       ↓
7. Registra Producción, Costos e Inversiones para esa campaña
       ↓
8. El Dashboard muestra resúmenes, KPIs y gráficos actualizados
```

---

## Desarrollo local

### Requisitos

- WordPress instalado localmente (ej: Local by Flywheel)
- Node.js >= 18
- npm

### Instalar dependencias

```bash
npm install
```

### Modo desarrollo (frontend)

```bash
npm run dev
```

Esto levanta Vite en modo desarrollo. Para verlo dentro de WordPress, primero hay que hacer el build.

### Build de producción

```bash
npm run build
```

Los archivos compilados se generan en `/dist` y WordPress los carga automáticamente desde la plantilla del dashboard.

### Empaquetar el plugin

```bash
npm run package
```

Genera un archivo `.zip` listo para instalar en cualquier sitio WordPress.

---

## Versión actual

**Plugin:** v2.0.11.4  
**Base de datos:** v1.5.4  
**Autor:** Conrrado Venturelli  
**Sitio:** [cappecam.com.ar](https://cappecam.com.ar)
