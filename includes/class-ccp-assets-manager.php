<?php
/**
 * Manejador de assets (scripts y estilos) para la Calculadora de Costos Pecan.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

class CCP_Assets_Manager {

    /**
     * Registra el hook para encolar los assets.
     */
    public function register_hooks() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'), 999);
    }

    /**
     * Carga los scripts y estilos del plugin.
     * 
     * Solo se cargan en la página específica del dashboard para no afectar
     * el resto del sitio.
     */
    public function enqueue_assets() {
        if (is_page('calculadora-costos-pecan')) {
            $asset_file = include(CALCULADORA_PECAN_PLUGIN_DIR . 'build/index.asset.php');
            
            // Encolar el script principal de la aplicación React.
            wp_enqueue_script(
                'calculadora-pecan-script',
                CALCULADORA_PECAN_PLUGIN_URL . 'build/index.js',
                $asset_file['dependencies'],
                $asset_file['version'],
                true // Cargar en el footer.
            );

            // Localizar el script con la configuración de la API REST.
            wp_localize_script(
                'calculadora-pecan-script',
                'wpApiSettings',
                array(
                    'root' => esc_url_raw(rest_url()),
                    'nonce' => wp_create_nonce('wp_rest'),
                )
            );
            
            // Encolar la hoja de estilos principal.
            wp_enqueue_style(
                'calculadora-pecan-style',
                CALCULADORA_PECAN_PLUGIN_URL . 'build/index.css',
                array(), // Sin dependencias de estilo.
                $asset_file['version']
            );
        }
    }
}
