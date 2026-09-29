<?php
/**
 * REST API Controller para Territorios y Árbol Geográfico.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

class CCP_Territories_Controller extends WP_REST_Controller {

    public function __construct() {
        $this->namespace = 'ccp/v1';
        $this->rest_base = 'territories';
    }

    public function register_routes() {
        $namespaces = array( $this->namespace, 'calculador-pecan/v1' );

        foreach ( $namespaces as $ns ) {
            register_rest_route($ns, '/' . $this->rest_base, [
                [
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => [$this, 'get_items'],
                    'permission_callback' => [$this, 'permissions_check'],
                ],
            ]);

            register_rest_route($ns, '/' . $this->rest_base . '/tree', [
                [
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => [$this, 'get_tree'],
                    'permission_callback' => [$this, 'permissions_check'],
                ],
            ]);
        }
    }

    public function permissions_check($request) {
        return is_user_logged_in();
    }

    public function get_items($request) {
        $country_id = $request->get_param('country_id');
        $parent_id = $request->get_param('parent_id');
        $level_number = $request->get_param('level_number');

        // Si no se indica país, tomar el del usuario
        if (!$country_id) {
            $country_id = CCP_Geographic_Hierarchy_Service::get_user_assigned_country_id();
            if (!$country_id) {
                $country_id = 1;
            }
        }

        $args = [
            'country_id' => $country_id,
            'is_active' => 1
        ];

        if ($parent_id !== null) {
            $args['parent_id'] = $parent_id;
        }

        if ($level_number !== null) {
            $args['level_number'] = $level_number;
        }

        $territories = CCP_Geographic_Territories_DB::get_territories($args);

        foreach ($territories as &$t) {
            $t['id'] = intval($t['id']);
            $t['country_id'] = intval($t['country_id']);
            $t['parent_id'] = $t['parent_id'] ? intval($t['parent_id']) : null;
            $t['level_number'] = intval($t['level_number']);
            $t['is_active'] = (bool) $t['is_active'];
        }

        return rest_ensure_response([
            'success' => true,
            'data' => $territories
        ]);
    }

    public function get_tree($request) {
        $country_id = $request->get_param('country_id');
        $exclude_zone_id = $request->get_param('exclude_zone_id');

        if (!$country_id) {
            $country_id = CCP_Geographic_Hierarchy_Service::get_user_assigned_country_id();
            if (!$country_id) {
                $country_id = 1;
            }
        }

        $tree = CCP_Geographic_Hierarchy_Service::get_territory_tree($country_id, $exclude_zone_id);

        return rest_ensure_response([
            'success' => true,
            'data' => $tree
        ]);
    }
}
