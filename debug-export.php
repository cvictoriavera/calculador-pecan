<?php
/**
 * Debug script para verificar el export controller
 */

// Cargar WordPress
require_once('../../../wp-load.php');

// Activar errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Debug Export Controller</h1>";

// Verificar si las clases DB existen
echo "<h2>Verificando clases DB:</h2>";
$db_classes = [
    'CCP_Proyectos_DB',
    'CCP_Montes_DB',
    'CCP_Campaigns_DB',
    'CCP_Costs_DB',
    'CCP_Investments_DB',
    'CCP_Productions_DB',
    'CCP_Yield_Models_DB',
    'CCP_Annual_Records_DB',
];

foreach ($db_classes as $class) {
    if (class_exists($class)) {
        echo "✅ $class existe<br>";
    } else {
        echo "❌ $class NO existe<br>";
    }
}

// Verificar si el export controller existe
echo "<h2>Verificando Export Controller:</h2>";
if (class_exists('CCP_Export_Controller')) {
    echo "✅ CCP_Export_Controller existe<br>";
    
    // Intentar instanciar
    try {
        $controller = new CCP_Export_Controller();
        echo "✅ CCP_Export_Controller se puede instanciar<br>";
    } catch (Exception $e) {
        echo "❌ Error al instanciar: " . $e->getMessage() . "<br>";
    }
} else {
    echo "❌ CCP_Export_Controller NO existe<br>";
}

// Verificar rutas registradas
echo "<h2>Verificando rutas REST:</h2>";
$routes = rest_get_server()->get_routes();
if (isset($routes['/ccp/v1/projects/(?P<id>[\d]+)/export'])) {
    echo "✅ Ruta /ccp/v1/projects/{id}/export está registrada<br>";
    print_r($routes['/ccp/v1/projects/(?P<id>[\d]+)/export']);
} else {
    echo "❌ Ruta /ccp/v1/projects/{id}/export NO está registrada<br>";
    echo "<h3>Rutas disponibles en /ccp/v1/:</h3>";
    foreach ($routes as $route => $handlers) {
        if (strpos($route, '/ccp/v1/') === 0) {
            echo "$route<br>";
        }
    }
}
