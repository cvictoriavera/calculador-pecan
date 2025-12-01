<?php
/**
 * Clase de desactivación del plugin Calculadora Costos Pecan.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

/**
 * Clase que define toda la lógica necesaria para la desactivación del plugin.
 *
 * @since 1.0.0
 */
class CCP_Deactivator {

    /**
     * Ejecuta la lógica de desactivación.
     *
     * @since 1.0.0
     */
    public static function deactivate() {
        // Refrescar las reglas de reescritura para eliminar las del plugin si fuera necesario en el futuro.
        flush_rewrite_rules();
    }
}
