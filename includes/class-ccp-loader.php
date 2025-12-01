<?php
/**
 * Clase principal del cargador del plugin Calculadora Costos Pecan.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

/**
 * Clase que orquesta la carga de todos los hooks y funcionalidades del plugin.
 *
 * @since 1.0.0
 */
class CCP_Loader {

    /**
     * Array de los hooks registrados.
     *
     * @var array
     */
    protected $actions;

    /**
     * Array de los filtros registrados.
     *
     * @var array
     */
    protected $filters;

    /**
     * Constructor de la clase.
     * Inicializa las colecciones de hooks.
     *
     * @since 1.0.0
     */
    public function __construct() {
        $this->actions = array();
        $this->filters = array();
    }

    /**
     * Añade una acción a la colección de hooks.
     *
     * @since 1.0.0
     * @param string $hook          El nombre del hook de WordPress.
     * @param object $component     Una instancia del componente que contendrá el callback.
     * @param string $callback      El nombre del método del componente a llamar.
     * @param int    $priority      Opcional. La prioridad en la que se ejecuta el callback. Por defecto 10.
     * @param int    $accepted_args Opcional. El número de argumentos que el callback acepta. Por defecto 1.
     */
    public function add_action($hook, $component, $callback, $priority = 10, $accepted_args = 1) {
        $this->actions = $this->add($this->actions, $hook, $component, $callback, $priority, $accepted_args);
    }

    /**
     * Añade un filtro a la colección de hooks.
     *
     * @since 1.0.0
     * @param string $hook          El nombre del hook de WordPress.
     * @param object $component     Una instancia del componente que contendrá el callback.
     * @param string $callback      El nombre del método del componente a llamar.
     * @param int    $priority      Opcional. La prioridad en la que se ejecuta el callback. Por defecto 10.
     * @param int    $accepted_args Opcional. El número de argumentos que el callback acepta. Por defecto 1.
     */
    public function add_filter($hook, $component, $callback, $priority = 10, $accepted_args = 1) {
        $this->filters = $this->add($this->filters, $hook, $component, $callback, $priority, $accepted_args);
    }

    /**
     * Una función de utilidad para registrar un solo hook (acción o filtro).
     *
     * @since 1.0.0
     * @access   private
     * @param array  $hooks         La colección de hooks a la que añadir.
     * @param string $hook          El nombre del hook de WordPress.
     * @param object $component     Una instancia del componente que contendrá el callback.
     * @param string $callback      El nombre del método del componente a llamar.
     * @param int    $priority      Opcional. La prioridad en la que se ejecuta el callback. Por defecto 10.
     * @param int    $accepted_args Opcional. El número de argumentos que el callback acepta. Por defecto 1.
     * @return array La colección de hooks modificada.
     */
    private function add($hooks, $hook, $component, $callback, $priority, $accepted_args) {
        $hooks[] = array(
            'hook'          => $hook,
            'component'     => $component,
            'callback'      => $callback,
            'priority'      => $priority,
            'accepted_args' => $accepted_args
        );
        return $hooks;
    }

    /**
     * Registra los hooks con WordPress.
     *
     * @since 1.0.0
     */
    public function run() {
        foreach ($this->actions as $hook) {
            add_action($hook['hook'], array($hook['component'], $hook['callback']), $hook['priority'], $hook['accepted_args']);
        }

        foreach ($this->filters as $hook) {
            add_filter($hook['hook'], array($hook['component'], $hook['callback']), $hook['priority'], $hook['accepted_args']);
        }
    }
}
