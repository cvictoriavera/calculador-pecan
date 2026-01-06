<?php
/**
 * REST API Controller for database management operations.
 * Useful for development and debugging.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

/**
 * Class CCP_Database_Controller.
 */
class CCP_Database_Controller {

    /**
     * Register the routes for this controller.
     */
    public function register_routes() {
        register_rest_route('ccp/v1', '/database/reset', [
            'methods' => 'POST',
            'callback' => [$this, 'reset_database_version'],
            'permission_callback' => [$this, 'check_admin_permissions'],
        ]);

        register_rest_route('ccp/v1', '/database/status', [
            'methods' => 'GET',
            'callback' => [$this, 'get_database_status'],
            'permission_callback' => [$this, 'check_admin_permissions'],
        ]);

        register_rest_route('ccp/v1', '/database/migrate-production', [
            'methods' => 'POST',
            'callback' => [$this, 'migrate_production_data'],
            'permission_callback' => [$this, 'check_admin_permissions'],
        ]);
    }

    /**
     * Reset the database version to force table recreation.
     *
     * @return WP_REST_Response
     */
    public function reset_database_version() {
        require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/db/class-ccp-database-manager.php';

        CCP_Database_Manager::reset_version();

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Database version reset successfully. Reactivate the plugin to recreate tables.',
        ], 200);
    }

    /**
     * Get the current database status.
     *
     * @return WP_REST_Response
     */
    public function get_database_status() {
        require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/db/class-ccp-database-manager.php';

        $status = CCP_Database_Manager::check_tables_status();

        return new WP_REST_Response([
            'version' => $status['version'],
            'tables' => $status['tables'],
        ], 200);
    }

    /**
     * Migrate production data from campaigns JSON to productions table.
     *
     * @return WP_REST_Response
     */
    public function migrate_production_data() {
        require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/db/class-ccp-database-manager.php';

        $result = CCP_Database_Manager::migrate_production_json_to_table();

        if ($result['status'] === 'success') {
            return new WP_REST_Response([
                'success' => true,
                'message' => $result['message'],
                'errors' => $result['errors']
            ], 200);
        } else {
            return new WP_REST_Response([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }
    }

    /**
     * Check if the current user has admin permissions.
     *
     * @return bool
     */
    public function check_admin_permissions() {
        return current_user_can('manage_options');
    }
}