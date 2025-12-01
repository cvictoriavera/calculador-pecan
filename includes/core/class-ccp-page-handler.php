<?php

if (!defined('ABSPATH')) {
    exit;
}

class CCP_Page_Handler {
    
    /**
     * Crear la página del dashboard
     */
    public static function create_dashboard_page() {
        // Verificar si la página ya existe
        $page = get_page_by_path('calculadora-costos-pecan');
        
        if (!$page) {
            // Crear la página
            $page_id = wp_insert_post(array(
                'post_title'     => 'Calculadora Costos Pecan',
                'post_name'      => 'calculadora-costos-pecan',
                'post_content'   => '',
                'post_status'    => 'publish',
                'post_type'      => 'page',
                'post_author'    => 1,
                'comment_status' => 'closed',
                'ping_status'    => 'closed'
            ));
            
            if ($page_id) {
                // Guardar el ID de la página en las opciones
                update_option('calculadora_pecan_page_id', $page_id);
                
                // Asignar la plantilla personalizada
                update_post_meta($page_id, '_wp_page_template', 'templates/template-fullwidth.php');
            }
        } else {
            // Si la página ya existe, asegurar que tenga la plantilla correcta
            update_post_meta($page->ID, '_wp_page_template', 'templates/template-fullwidth.php');
        }
    }
    
    /**
     * Eliminar la página del dashboard
     */
    public static function delete_dashboard_page() {
        $page_id = get_option('calculadora_pecan_page_id');
        
        if ($page_id) {
            wp_delete_post($page_id, true);
            delete_option('calculadora_pecan_page_id');
        }
    }

    /**
     * Modificar el contenido de la página del dashboard.
     *
     * @param string $content El contenido original de la página.
     * @return string El contenido modificado.
     */
    public function page_content($content) {
        if (is_page('calculadora-costos-pecan') && is_main_query()) {
            if (is_user_logged_in()) {
                return '<div id="calculadora-pecan-root"></div>';
            } else {
                $login_url = wp_login_url(get_permalink());
                return '<div class="calculadora-pecan-login-message">Por favor, <a href="' . esc_url($login_url) . '">inicia sesión</a> para acceder a la calculadora de costos.</div>';
            }
        }
        return $content;
    }

    /**
     * Remover el admin bar en la página del dashboard para mejor visualización.
     */
    public function remove_admin_bar() {
        if (is_page('calculadora-costos-pecan')) {
            show_admin_bar(false);
        }
    }

    /**
     * Agregar body class personalizada para la página del dashboard.
     *
     * @param array $classes Clases CSS del body.
     * @return array Clases CSS del body modificadas.
     */
    public function body_class($classes) {
        if (is_page('calculadora-costos-pecan')) {
            $classes[] = 'calculadora-pecan-page';
        }
        return $classes;
    }

    /**
     * Registrar plantillas personalizadas del plugin.
     *
     * @param string $template La ruta de la plantilla actual.
     * @return string La ruta de la plantilla personalizada si aplica, de lo contrario la original.
     */
    public function register_template($template) {
        if (is_page('calculadora-costos-pecan')) {
            $plugin_template = CALCULADORA_PECAN_PLUGIN_DIR . 'templates/template-fullwidth.php';
            if (file_exists($plugin_template)) {
                return $plugin_template;
            }
        }
        return $template;
    }
}