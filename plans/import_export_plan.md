# Plan de Implementación: Funcionalidad de Import/Export de Proyectos

## Estado Actual del Sistema

### ✅ Lo que funciona:
- Plugin WordPress "Calculador Pecan" v2.0.10.2
- Dashboard interactivo con React frontend
- API REST completa para gestión de proyectos, montes, campañas, costos, inversiones, producciones
- Base de datos con todas las tablas necesarias
- Sistema de autenticación y permisos

### ❌ Lo que NO funciona:
- **Funcionalidad de Import/Export de proyectos NO está implementada**
- Los controladores de API existen pero NO están registrados
- NO hay interfaz de usuario para importar/exportar

## Problemas Identificados

### 1. Controladores no registrados en API Manager
Los archivos `class-ccp-export-controller.php` y `class-ccp-import-controller.php` existen y están bien implementados, pero **NO están incluidos** en `class-ccp-api-manager.php`.

### 2. Falta interfaz de usuario
No existe ningún componente o sección en el frontend (React) que permita al usuario:
- Exportar un proyecto actual
- Importar un proyecto desde archivo JSON

## Plan de Implementación

### Fase 1: Backend - Registrar APIs
**Archivo:** `includes/api/class-ccp-api-manager.php`

1. Incluir los archivos de controladores de import/export
2. Instanciar los controladores
3. Registrar las rutas de la API

```php
// Incluir controladores
require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/api/class-ccp-export-controller.php';
require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/api/class-ccp-import-controller.php';

// Instanciar y registrar
$export_controller = new CCP_Export_Controller();
$export_controller->register_routes();

$import_controller = new CCP_Import_Controller();
$import_controller->register_routes();
```

### Fase 2: Frontend - Componentes de UI
**Ubicación:** `src/pages/Config.tsx`

1. Agregar nueva sección "Import/Export de Proyecto" en la página de configuración
2. Crear botones para:
   - Exportar proyecto actual (descarga JSON)
   - Importar proyecto (subir archivo JSON)

### Fase 3: Servicios Frontend
**Ubicación:** `src/services/`

1. Crear funciones en `projectService.js` para:
   - `exportProject(projectId)` - Llamar a API de export
   - `importProject(projectId, jsonData)` - Llamar a API de import

### Fase 4: Integración con Context
**Archivo:** `src/contexts/AppContext.tsx`

1. Agregar funciones de import/export al contexto si es necesario
2. Manejar estados de carga durante import/export

## Endpoints de API a implementar

### Export
- **GET** `/wp-json/ccp/v1/projects/{id}/export`
- Retorna JSON completo del proyecto con todos los datos relacionados
- Requiere autenticación y ownership del proyecto

### Import
- **POST** `/wp-json/ccp/v1/projects/{id}/import`
- Recibe JSON con datos a importar
- Reemplaza todos los datos del proyecto existente
- Requiere autenticación y ownership del proyecto

## Consideraciones de Seguridad

1. **Permisos:** Solo usuarios autenticados que sean owners del proyecto
2. **Validación:** Validar estructura del JSON de import
3. **Transacciones:** Usar transacciones de BD para import (ya implementado)
4. **Backup implícito:** El export sirve como backup antes de import

## Testing

1. Probar export de proyecto pequeño
2. Probar import en proyecto vacío
3. Probar import que reemplace datos existentes
4. Verificar integridad de datos después de import
5. Probar permisos (usuarios sin acceso)

## Timeline Estimado

- **Fase 1 (Backend):** 30 minutos
- **Fase 2 (UI Frontend):** 1 hora
- **Fase 3 (Servicios):** 30 minutos
- **Fase 4 (Context):** 15 minutos
- **Testing:** 30 minutos

**Total estimado:** 2.5 horas