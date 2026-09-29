<?php
/**
 * REST API Controller para Países.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

class CCP_Countries_Controller extends WP_REST_Controller {

    public function __construct() {
        $this->namespace = 'ccp/v1';
        $this->rest_base = 'countries';
    }

    public function register_routes() {
        $namespaces = array( $this->namespace, 'calculador-pecan/v1' );

        foreach ( $namespaces as $ns ) {
            register_rest_route($ns, '/' . $this->rest_base, [
                [
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => [$this, 'get_items'],
                    'permission_callback' => [$this, 'get_items_permissions_check'],
                ],
            ]);
        }
    }

    public function get_items_permissions_check($request) {
        return is_user_logged_in();
    }

    public function get_items($request) {
        $countries = CCP_Geographic_Territories_DB::get_countries(true);
        $user_country_id = CCP_Geographic_Hierarchy_Service::get_user_assigned_country_id();

        // Para admin_country, incluir metadata indicando si es su país asignado
        foreach ($countries as &$country) {
            $country['id'] = intval($country['id']);
            $country['is_active'] = (bool) $country['is_active'];
            $country['is_user_country'] = ($user_country_id === null || intval($country['id']) === intval($user_country_id));
        }

        return rest_ensure_response([
            'success' => true,
            'data' => $countries
        ]);
    }
}
