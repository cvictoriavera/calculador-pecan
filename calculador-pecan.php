<?php
/**
 * Plugin Name: Calculador Pecan
 * Plugin URI: https://cappecam.com.ar
 * Description: Dashboard interactivo para registro de produccion, costos operativos e inversiones del cultivo de pecan.
 * Version: 2.0.10
 * Author: Conrrado Venturelli
 * Text Domain: calculador-pecan
 */

// Evitar acceso directo
if (!defined('ABSPATH')) {
    exit;
}

// Definir constantes del plugin
define('CALCULADOR_PECAN_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CALCULADOR_PECAN_PLUGIN_URL', plugin_dir_url(__FILE__));

// Registrar la plantilla de página personalizada
function calculador_pecan_register_page_template($templates) {
    $templates['templates/dashboard.php'] = 'Calculador Pecan Dashboard';
    return $templates;
}
add_filter('theme_page_templates', 'calculador_pecan_register_page_template');

// Incluir la plantilla cuando se selecciona
function calculador_pecan_load_page_template($template) {
    if (get_page_template_slug() === 'templates/dashboard.php') {
        $template = CALCULADOR_PECAN_PLUGIN_DIR . 'templates/dashboard.php';
    }
    return $template;
}
add_filter('page_template', 'calculador_pecan_load_page_template');

// Función de activación del plugin
function calculador_pecan_activate() {
    error_log('CCP: Starting plugin activation');

    // Crear las tablas de la base de datos
    error_log('CCP: Requiring database manager');
    require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/db/class-ccp-database-manager.php';
    error_log('CCP: Calling create_tables');
    CCP_Database_Manager::create_tables();
    error_log('CCP: Tables created successfully');

    // Crear la página del dashboard si no existe
    $page_title = 'Calculador pecan';
    $page_content = ''; // Contenido vacío, la plantilla maneja todo
    $page_template = 'templates/dashboard.php';

    error_log('CCP: Checking for existing dashboard page');
    $page_check = get_page_by_title($page_title);
    if (!$page_check) {
        error_log('CCP: Creating new dashboard page');
        $page_id = wp_insert_post(array(
            'post_title'    => $page_title,
            'post_content'  => $page_content,
            'post_status'   => 'publish',
            'post_type'     => 'page',
            'meta_input'    => array(
                '_wp_page_template' => $page_template,
            ),
        ));
        if (is_wp_error($page_id)) {
            error_log('CCP: Error creating page: ' . $page_id->get_error_message());
        } else {
            error_log('CCP: Page created with ID: ' . $page_id);
        }
    } else {
        $page_id = $page_check->ID;
        error_log('CCP: Existing page found with ID: ' . $page_id);
    }
    // Guardar el ID de la página para referencia futura
    update_option('calculador_pecan_dashboard_page_id', $page_id);
    error_log('CCP: Plugin activation completed');
}
register_activation_hook(__FILE__, 'calculador_pecan_activate');

// Registrar las rutas de la API REST
function calculador_pecan_register_rest_routes() {
    require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/api/class-ccp-api-manager.php';
    $api_manager = new CCP_API_Manager();
    $api_manager->register_rest_routes();
}
add_action('rest_api_init', 'calculador_pecan_register_rest_routes');


/**
 * Modificar la etiqueta <script> para agregar type="module"
 * Esto es obligatorio para scripts generados por Vite
 */
add_filter('script_loader_tag', function($tag, $handle, $src) {
    // Verificamos si el ID del script pertenece a nuestro plugin
    // Esto detectará 'calculador-pecan-js' (tu app) y 'calculador-pecan-...' (los vendors)
    if (strpos($handle, 'calculador-pecan') !== false) {
        // Reconstruimos la etiqueta script agregando type="module"
        return '<script type="module" src="' . esc_url($src) . '"></script>';
    }
    
    return $tag;
}, 10, 3);