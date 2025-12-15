<?php
/**
 * Archivo de debug para la base de datos del plugin Calculadora de Costos Pecan
 * Este archivo permite resetear o borrar las tablas de la base de datos.
 *
 * USO: Acceder a este archivo desde el navegador para ejecutar las funciones de debug.
 * Ejemplo: http://tu-sitio.com/wp-content/plugins/calculador-pecan/debug-db.php
 */

// Evitar acceso directo
if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente
}

// Incluir WordPress
require_once('../../../wp-load.php');

// Verificar permisos de administrador
if (!current_user_can('manage_options')) {
    wp_die('No tienes permisos para acceder a esta página.');
}

// Incluir el manejador de base de datos
require_once plugin_dir_path(__FILE__) . 'includes/db/class-ccp-database-manager.php';

$message = '';
$action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';

if ($action === 'reset_version') {
    CCP_Database_Manager::reset_version();
    $message = 'Versión de base de datos reseteada. Las tablas se recrearán en la próxima activación.';
} elseif ($action === 'drop_tables') {
    CCP_Database_Manager::drop_all_tables();
    $message = 'Todas las tablas han sido borradas. Se recrearán en la próxima activación.';
} elseif ($action === 'create_missing') {
    CCP_Database_Manager::create_tables();
    $message = 'Se han creado las tablas faltantes (si las había).';
} elseif ($action === 'check_status') {
    $status = CCP_Database_Manager::check_tables_status();
    $message = '<pre>' . print_r($status, true) . '</pre>';
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Base de Datos - Calculadora Pecan</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .message { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .info { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        .warning { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .button { display: inline-block; padding: 10px 20px; margin: 5px; background-color: #007cba; color: white; text-decoration: none; border-radius: 5px; }
        .button:hover { background-color: #005a87; }
        .button.danger { background-color: #dc3545; }
        .button.danger:hover { background-color: #c82333; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Debug Base de Datos - Calculadora de Costos Pecan</h1>

        <?php if ($message): ?>
            <div class="message <?php echo strpos($message, 'borradas') !== false ? 'warning' : 'success'; ?>">
                <?php echo $message; ?>
            </div>
        <?php endif; ?>

        <div class="message info">
            <strong>Estado actual:</strong><br>
            <?php
            $status = CCP_Database_Manager::check_tables_status();
            echo 'Versión DB: ' . $status['version'] . '<br>';
            foreach ($status['tables'] as $table => $state) {
                echo "$table: $state<br>";
            }
            ?>
        </div>

        <h2>Acciones disponibles:</h2>

        <p><strong>Resetear versión:</strong> Fuerza la recreación de tablas en la próxima activación del plugin.</p>
        <a href="?action=reset_version" class="button" onclick="return confirm('¿Estás seguro de resetear la versión?')">Resetear Versión</a>

        <p><strong>Crear tablas faltantes:</strong> Crea solo las tablas que no existen, sin borrar las existentes.</p>
        <a href="?action=create_missing" class="button" onclick="return confirm('¿Crear las tablas faltantes?')">Crear Tablas Faltantes</a>

        <p><strong>Borrar todas las tablas:</strong> Elimina completamente todas las tablas del plugin. Se recrearán automáticamente en la próxima activación.</p>
        <a href="?action=drop_tables" class="button danger" onclick="return confirm('¿Estás seguro de borrar TODAS las tablas? Esta acción no se puede deshacer.')">Borrar Todas las Tablas</a>

        <p><strong>Verificar estado:</strong> Muestra el estado actual de las tablas.</p>
        <a href="?action=check_status" class="button">Verificar Estado</a>

        <h2>Problema identificado:</h2>
        <p>El plugin solo verificaba la existencia de la tabla <code>annual_records</code> para decidir si crear tablas. Si esta tabla existía pero otras tablas (como <code>costs</code>) no existían, no se recreaban las tablas faltantes.</p>

        <p><strong>Solución aplicada:</strong></p>
        <ul>
            <li>Ahora verifica que TODAS las tablas existan antes de saltar la creación</li>
            <li>Crea tablas faltantes individualmente sin borrar las existentes</li>
            <li>Agregada función para borrar todas las tablas si es necesario</li>
            <li>Corregido el índice en la tabla costs (cost_type → category)</li>
        </ul>

        <p><strong>Para crear solo la tabla faltante (costs):</strong></p>
        <ol>
            <li>Haz clic en "Crear Tablas Faltantes"</li>
            <li>Solo se creará la tabla costs si no existe</li>
            <li>Las otras tablas permanecerán intactas</li>
        </ol>

        <p><strong>Para recrear todas las tablas (si hay problemas):</strong></p>
        <ol>
            <li>Haz clic en "Borrar Todas las Tablas"</li>
            <li>Desactiva y vuelve a activar el plugin desde WordPress</li>
            <li>Las tablas se recrearán correctamente</li>
        </ol>

        <p><em>Nota: Borra este archivo después de usarlo por seguridad.</em></p>
    </div>
</body>
</html>