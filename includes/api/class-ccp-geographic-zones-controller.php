<?php
/**
 * REST API Controller para Zonas Geográficas.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

class CCP_Geographic_Zones_Controller extends WP_REST_Controller {

    public function __construct() {
        $this->namespace = 'ccp/v1';
        $this->rest_base = 'zones';
    }

    public function register_routes() {
        $namespaces = array( $this->namespace, 'calculador-pecan/v1' );

        foreach ( $namespaces as $ns ) {
            register_rest_route($ns, '/' . $this->rest_base, [
                [
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => [$this, 'get_items'],
                    'permission_callback' => [$this, 'read_permissions_check'],
                ],
                [
                    'methods' => WP_REST_Server::CREATABLE,
                    'callback' => [$this, 'create_item'],
                    'permission_callback' => [$this, 'admin_permissions_check'],
                ],
            ]);

            register_rest_route($ns, '/' . $this->rest_base . '/(?P<id>\d+)', [
                [
                    'methods' => WP_REST_Server::READABLE,
                    'callback' => [$this, 'get_item'],
                    'permission_callback' => [$this, 'read_permissions_check'],
                ],
                [
                    'methods' => WP_REST_Server::EDITABLE,
                    'callback' => [$this, 'update_item'],
                    'permission_callback' => [$this, 'admin_permissions_check'],
                ],
                [
                    'methods' => WP_REST_Server::DELETABLE,
                    'callback' => [$this, 'delete_item'],
                    'permission_callback' => [$this, 'admin_permissions_check'],
                ],
            ]);

            register_rest_route($ns, '/' . $this->rest_base . '/check-conflicts', [
                [
                    'methods' => WP_REST_Server::CREATABLE,
                    'callback' => [$this, 'check_conflicts'],
                    'permission_callback' => [$this, 'admin_permissions_check'],
                ],
            ]);

            register_rest_route($ns, '/' . $this->rest_base . '/resolve-project', [
                [
                    'methods' => WP_REST_Server::CREATABLE,
                    'callback' => [$this, 'resolve_project'],
                    'permission_callback' => [$this, 'read_permissions_check'],
                ],
            ]);

            register_rest_route($ns, '/' . $this->rest_base . '/recalculate-all', [
                [
                    'methods' => WP_REST_Server::CREATABLE,
                    'callback' => [$this, 'recalculate_all'],
                    'permission_callback' => [$this, 'admin_permissions_check'],
                ],
            ]);
        }
    }

    public function read_permissions_check($request) {
        return is_user_logged_in();
    }

    public function admin_permissions_check($request) {
        if (!is_user_logged_in()) {
            return false;
        }

        $user = wp_get_current_user();
        $roles = (array) $user->roles;

        return (
            in_array('administrator', $roles, true) ||
            in_array('admin_country', $roles, true) ||
            current_user_can('manage_options')
        );
    }

    public function get_items($request) {
        $country_id = $request->get_param('country_id');
        $user_country_id = CCP_Geographic_Hierarchy_Service::get_user_assigned_country_id();

        // Para admin_country, restringir obligatoriamente a su país asignado
        if ($user_country_id !== null) {
            $country_id = $user_country_id;
        }

        $zones = CCP_Geographic_Zones_DB::get_zones([
            'country_id' => $country_id,
            'is_active' => 1
        ]);

        return rest_ensure_response([
            'success' => true,
            'data' => $zones
        ]);
    }

    public function get_item($request) {
        $id = intval($request['id']);
        $zone = CCP_Geographic_Zones_DB::get_zone_by_id($id);

        if (!$zone) {
            return new WP_Error('NOT_FOUND', 'Zona no encontrada', ['status' => 404]);
        }

        return rest_ensure_response([
            'success' => true,
            'data' => $zone
        ]);
    }

    public function create_item($request) {
        $body = $request->get_json_params();

        if (empty($body['name'])) {
            return new WP_Error('BAD_REQUEST', 'El nombre de la zona es obligatorio.', ['status' => 400]);
        }

        // Para admin_country, tomar automáticamente el country_id asignado en ACF pais
        $user_country_id = CCP_Geographic_Hierarchy_Service::get_user_assigned_country_id();
        if ($user_country_id !== null) {
            $body['country_id'] = $user_country_id;
        } else if (empty($body['country_id'])) {
            $body['country_id'] = 1;
        }

        $result = CCP_Geographic_Zone_Service::create_zone($body);

        if (is_wp_error($result)) {
            return $result;
        }

        return rest_ensure_response([
            'success' => true,
            'data' => $result
        ]);
    }

    public function update_item($request) {
        $id = intval($request['id']);
        $body = $request->get_json_params();

        $result = CCP_Geographic_Zone_Service::update_zone($id, $body);

        if (is_wp_error($result)) {
            return $result;
        }

        return rest_ensure_response([
            'success' => true,
            'data' => $result
        ]);
    }

    public function delete_item($request) {
        $id = intval($request['id']);

        $result = CCP_Geographic_Zone_Service::delete_zone($id);

        if (is_wp_error($result)) {
            return $result;
        }

        return rest_ensure_response([
            'success' => true,
            'message' => 'Zona eliminada / desactivada correctamente.'
        ]);
    }

    public function check_conflicts($request) {
        $body = $request->get_json_params();

        $country_id = $body['country_id'] ?? null;
        $user_country_id = CCP_Geographic_Hierarchy_Service::get_user_assigned_country_id();
        if ($user_country_id !== null) {
            $country_id = $user_country_id;
        } else if (!$country_id) {
            $country_id = 1;
        }

        $territory_ids = $body['territory_ids'] ?? [];
        $exclude_zone_id = $body['exclude_zone_id'] ?? null;

        $check = CCP_Geographic_Zone_Validation_Service::check_conflicts($country_id, $territory_ids, $exclude_zone_id);

        return rest_ensure_response([
            'success' => true,
            'data' => $check
        ]);
    }

    public function resolve_project($request) {
        $body = $request->get_json_params();
        $project_id = intval($body['project_id'] ?? 0);

        if (!$project_id) {
            return new WP_Error('BAD_REQUEST', 'El id del proyecto es obligatorio.', ['status' => 400]);
        }

        $res = CCP_Geographic_Zone_Resolver::resolve_project_zone($project_id);

        return rest_ensure_response([
            'success' => true,
            'data' => $res
        ]);
    }

    public function recalculate_all($request) {
        $count = CCP_Geographic_Zone_Resolver::recalculate_affected_projects();

        return rest_ensure_response([
            'success' => true,
            'message' => "Se recalcularon $count proyectos correctamente."
        ]);
    }
}
