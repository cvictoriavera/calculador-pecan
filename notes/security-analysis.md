# 🔒 Análisis de Seguridad — Calculador Pecan

> **Fecha de análisis:** 31 de marzo de 2026  
> **Versión analizada:** 2.0.11.4  
> **Alcance:** Backend PHP (REST API + capa de base de datos)

---

## Resumen ejecutivo

El proyecto cuenta con una base de seguridad sólida para los flujos principales de datos. Se implementan correctamente los controles fundamentales: autenticación obligatoria, aislamiento por usuario, consultas preparadas y sanitización de entradas. Sin embargo, se detectaron vulnerabilidades puntuales que deben corregirse antes de un despliegue en producción con múltiples usuarios.

---

## ✅ Medidas implementadas correctamente

### 1. Autenticación obligatoria en todos los endpoints

Cada controlador de la REST API verifica la sesión del usuario antes de procesar cualquier solicitud. Si el usuario no está autenticado, se devuelve HTTP `401 Unauthorized`.

**Archivos:** todos los `class-ccp-*-controller.php`

```php
public function permissions_check( $request ) {
    if ( ! is_user_logged_in() ) {
        return new WP_Error(
            'rest_forbidden',
            esc_html__( 'You must be logged in.', 'calculador-pecan' ),
            array( 'status' => 401 )
        );
    }
    return true;
}
```

---

### 2. Aislamiento completo de datos por usuario

Todas las consultas a la base de datos incluyen el `user_id` del usuario autenticado en la cláusula `WHERE`. Esto garantiza que un usuario nunca puede acceder a datos de otro.

**Archivo:** `includes/db/class-ccp-proyectos-db.php`

```php
// Al leer un proyecto, siempre se filtra por user_id
$query = $this->wpdb->prepare(
    "SELECT * FROM {$this->table_name} WHERE id = %d AND user_id = %d",
    absint( $project_id ),
    absint( $user_id )
);
```

---

### 3. Verificación de propiedad antes de modificar o eliminar

Antes de ejecutar operaciones de escritura (`UPDATE`, `DELETE`), el sistema verifica que el recurso solicitado pertenece al usuario autenticado.

**Archivo:** `includes/api/class-ccp-projects-controller.php`

```php
// Verify ownership antes de actualizar
$existing_project = $this->proyectos_db->get_by_id( $project_id, $user_id );
if ( is_null( $existing_project ) ) {
    return new WP_Error(
        'rest_project_invalid_id',
        __( 'Invalid project ID or access denied.', 'calculador-pecan' ),
        array( 'status' => 404 )
    );
}
```

---

### 4. Consultas preparadas (prevención de SQL Injection)

Se usa `$wpdb->prepare()` en toda la capa de base de datos. Los valores dinámicos nunca se interpolan directamente en las queries.

```php
$query = $this->wpdb->prepare(
    "SELECT * FROM {$this->table_name} WHERE user_id = %d ORDER BY created_at DESC",
    absint( $user_id )
);
```

---

### 5. Sanitización de todas las entradas

Los datos recibidos del frontend son sanitizados antes de ser procesados o almacenados:

| Tipo de dato | Función aplicada |
|---|---|
| Texto corto (nombre, categoría) | `sanitize_text_field()` |
| Texto largo (descripción, notas) | `sanitize_textarea_field()` |
| Números enteros | `intval()` / `absint()` |
| Números decimales | `floatval()` |

**Ejemplo en** `includes/api/class-ccp-projects-controller.php`:

```php
$project_data = array(
    'user_id'      => $user_id,
    'project_name' => sanitize_text_field( $params['project_name'] ?? 'Nuevo Proyecto' ),
    'description'  => sanitize_textarea_field( $params['description'] ?? '' ),
    'pais'         => sanitize_text_field( $params['pais'] ?? '' ),
    'provincia'    => sanitize_text_field( $params['provincia'] ?? '' ),
    // ...
);
```

---

### 6. Transacciones de base de datos

Las operaciones complejas que involucran múltiples tablas utilizan transacciones (`START TRANSACTION` / `COMMIT` / `ROLLBACK`), garantizando la integridad de los datos ante errores parciales.

**Archivo:** `includes/api/class-ccp-projects-controller.php` — método `create_item()`

```php
$wpdb->query('START TRANSACTION');
try {
    // 1. Crear proyecto
    // 2. Crear campaña inicial
    // 3. Crear montes
    // 4. Guardar inversiones iniciales
    $wpdb->query('COMMIT');
} catch (Exception $e) {
    $wpdb->query('ROLLBACK');
    error_log('CCP: Project creation failed: ' . $e->getMessage());
    return new WP_Error('create-failed', ...);
}
```

---

### 7. Claves foráneas con CASCADE

Las tablas de la base de datos están relacionadas con `FOREIGN KEY ... ON DELETE CASCADE`, lo que garantiza que al eliminar un proyecto se eliminan automáticamente todos sus datos (campañas, costos, producciones, inversiones, etc.), evitando registros huérfanos.

---

### 8. Bloqueo de acceso directo a archivos PHP

Todos los archivos PHP del plugin comienzan con:

```php
if ( !defined( 'ABSPATH' ) ) {
    exit;
}
```

Esto impide que los archivos sean ejecutados directamente desde el navegador fuera del contexto de WordPress.

---

## ⚠️ Vulnerabilidades detectadas

### 🔴 CRÍTICA — Sin verificación de ownership en `get_costs_batch`

**Archivo:** `includes/api/class-ccp-costs-controller.php` — método `get_costs_batch()` (línea 322)

**Descripción:** El endpoint `/ccp/v1/costs/batch` recibe un `project_id` por parámetro y ejecuta una query directamente sobre él **sin verificar que ese proyecto le pertenece al usuario autenticado**. Un usuario malintencionado podría iterar IDs y obtener datos financieros de proyectos ajenos.

**Código actual (vulnerable):**

```php
public function get_costs_batch( $request ) {
    $user_id    = get_current_user_id();
    $project_id = (int) $request->get_param( 'project_id' );
    // ❌ No se verifica que project_id pertenezca a $user_id

    $query = $wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}pecan_costs
         WHERE project_id = %d
         AND campaign_id IN ($placeholders) ...",
        array_merge( array( $project_id ), $campaign_ids )
    );
    // ...
}
```

**Fix recomendado:**

```php
public function get_costs_batch( $request ) {
    $user_id    = get_current_user_id();
    $project_id = (int) $request->get_param( 'project_id' );

    // ✅ Verificar ownership del proyecto antes de continuar
    $owner = $wpdb->get_var( $wpdb->prepare(
        "SELECT user_id FROM {$wpdb->prefix}pecan_projects WHERE id = %d",
        $project_id
    ));

    if ( absint( $owner ) !== absint( $user_id ) ) {
        return new WP_Error( 'forbidden', 'Access denied', array( 'status' => 403 ) );
    }

    // ... resto del método
}
```

---

### 🟠 MEDIA — Datos sensibles en logs de producción

**Archivos:** `includes/db/class-ccp-proyectos-db.php` (líneas 87, 117, 138, 149–151)

**Descripción:** Existen múltiples llamadas a `error_log()` que vuelcan el contenido completo de los datos de proyectos y usuarios. En un entorno de producción, estos logs quedan escritos en archivos de texto planos accesibles potencialmente desde el servidor.

**Código problemático:**

```php
error_log('CCP: Create project called with data: ' . print_r($data, true));
error_log('CCP: Inserting data: ' . print_r($insert_data, true));
error_log('CCP: projects found: ' . print_r($projects, true));
```

**Fix recomendado:** eliminar o condicionar los logs a un modo `WP_DEBUG` explícito:

```php
if ( defined('WP_DEBUG') && WP_DEBUG ) {
    error_log('CCP: Project created with ID: ' . $project_id);
    // Log solo el ID, nunca el contenido del dato completo
}
```

---

### 🟡 BAJA — Sin rate limiting en endpoints financieros

**Descripción:** No existe ningún mecanismo de limitación de solicitudes (rate limiting) en los endpoints de la REST API. Esto expone al sistema a ataques de fuerza bruta o scraping masivo de datos si un atacante obtiene un token de sesión válido.

**Recomendación:** Implementar rate limiting a nivel de servidor (nginx/Apache) o mediante un plugin de seguridad WordPress (como Wordfence o WP Cerber) que limite solicitudes a la API REST por IP.

---

### 🟡 BAJA — HTTPS no forzado a nivel de plugin

**Descripción:** El plugin no fuerza el uso de HTTPS en sus comunicaciones. Si el servidor no está correctamente configurado con SSL/TLS, los datos financieros podrían viajar en texto plano.

**Recomendación:** Agregar en el plugin principal o en la configuración de WordPress:

```php
// En wp-config.php
define('FORCE_SSL_ADMIN', true);
```

O verificar en el plugin que las requests provengan de HTTPS:

```php
if ( ! is_ssl() ) {
    return new WP_Error( 'ssl_required', 'HTTPS required', array( 'status' => 403 ) );
}
```

---

## 📋 Tabla resumen de hallazgos

| # | Severidad | Descripción | Archivo afectado | Estado |
|---|---|---|---|---|
| 1 | 🔴 Crítica | Sin ownership check en `get_costs_batch` | `class-ccp-costs-controller.php` | ❌ Sin corregir |
| 2 | 🟠 Media | Logs con datos sensibles en producción | `class-ccp-proyectos-db.php` y otros | ❌ Sin corregir |
| 3 | 🟡 Baja | Sin rate limiting en la API REST | Global | ❌ Sin corregir |
| 4 | 🟡 Baja | HTTPS no forzado a nivel de aplicación | Global | ❌ Sin corregir |
| 5 | ✅ OK | Autenticación obligatoria en todos los endpoints | Todos los controllers | ✅ Implementado |
| 6 | ✅ OK | Aislamiento de datos por usuario | Capa DB | ✅ Implementado |
| 7 | ✅ OK | Verificación de propiedad en CRUD | Controllers principales | ✅ Implementado |
| 8 | ✅ OK | Consultas preparadas (anti SQL Injection) | Capa DB | ✅ Implementado |
| 9 | ✅ OK | Sanitización de entradas | Controllers y capa DB | ✅ Implementado |
| 10 | ✅ OK | Transacciones de base de datos | `class-ccp-projects-controller.php` | ✅ Implementado |
| 11 | ✅ OK | Claves foráneas con CASCADE | `class-ccp-database-manager.php` | ✅ Implementado |
| 12 | ✅ OK | Bloqueo de acceso directo a PHP | Todos los archivos | ✅ Implementado |

---

## 🎯 Prioridad de corrección recomendada

1. **Inmediato** → Corregir el ownership check en `get_costs_batch` (vulnerabilidad IDOR)
2. **Antes de producción** → Limpiar todos los `error_log` con datos sensibles
3. **Configuración de servidor** → Forzar HTTPS y configurar rate limiting a nivel de infraestructura

---

*Análisis realizado sobre el código fuente del plugin. No se realizaron pruebas de penetración (pentesting) activas.*
