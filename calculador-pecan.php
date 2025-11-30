<?php
/**
 * Plugin Name: Calculador Pecan
 * Plugin URI: https://cappecam.com.ar
 * Description: Dashboard interactivo para registro de produccion, costos operativos e inversiones del cultivo de pecan.
 * Version: 1.0.0
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
    // Crear la página del dashboard si no existe
    $page_title = 'Calculador pecan';
    $page_content = ''; // Contenido vacío, la plantilla maneja todo
    $page_template = 'templates/dashboard.php';

    $page_check = get_page_by_title($page_title);
    if (!$page_check) {
        $page_id = wp_insert_post(array(
            'post_title'    => $page_title,
            'post_content'  => $page_content,
            'post_status'   => 'publish',
            'post_type'     => 'page',
            'meta_input'    => array(
                '_wp_page_template' => $page_template,
            ),
        ));
        // Opcional: guardar el ID de la página para referencia futura
        update_option('calculador_pecan_dashboard_page_id', $page_id);
    }
}
register_activation_hook(__FILE__, 'calculador_pecan_activate');