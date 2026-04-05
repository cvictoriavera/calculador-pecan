<?php
/**
 * Manejador de assets (scripts y estilos) para la Calculadora de Costos Pecan.
 */

if (!defined('ABSPATH')) {
    exit; 
}

class CCP_Assets_Manager {

    public function register_hooks() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'), 999);
    }

    public function enqueue_assets() {
        // Temporarily commenting condition to force loading
        // if (is_page_template('templates/dashboard.php')) {
            // CORRECCIÓN AQUÍ: CALCULADOR_... (sin la A)
            $asset_path = CALCULADOR_PECAN_PLUGIN_DIR . 'build/index.asset.php';

            // Verificamos que el archivo exista para evitar otro error fatal
            if (!file_exists($asset_path)) {
                return;
            }

            $asset_file = include($asset_path);

            wp_enqueue_script(
                'calculadora-pecan-script',
                CALCULADOR_PECAN_PLUGIN_URL . 'build/index.js',
                $asset_file['dependencies'],
                $asset_file['version'],
                true
            );

            wp_localize_script(
                'calculadora-pecan-script',
                'wpApiSettings',
                array(
                    'root'  => esc_url_raw(rest_url()),
                    'nonce' => wp_create_nonce('wp_rest'),
                )
            );
            wp_enqueue_style(
                'calculadora-pecan-style',
                CALCULADOR_PECAN_PLUGIN_URL . 'build/index.css',
                array(),
                $asset_file['version']
            );
        // }
    }
}