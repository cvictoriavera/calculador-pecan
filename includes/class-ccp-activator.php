<?php
/**
 * Clase de activación del plugin Calculadora Costos Pecan.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

/**
 * Clase que define toda la lógica necesaria para la activación del plugin.
 *
 * @since 1.0.0
 */
class CCP_Activator {

    /**
     * Ejecuta la lógica de activación.
     *
     * @since 1.0.0
     */
    public static function activate() {
        // Incluir el manejador de la base de datos.
        require_once __DIR__ . '/db/class-ccp-database-manager.php';

        // Crear las tablas de la base de datos.
        CCP_Database_Manager::create_tables();

        // Incluir el manejador de páginas.
        require_once __DIR__ . '/core/class-ccp-page-handler.php';
        
        // Crear la página del dashboard.
        CCP_Page_Handler::create_dashboard_page();

        // Refrescar las reglas de reescritura.
        flush_rewrite_rules();
    }
}
