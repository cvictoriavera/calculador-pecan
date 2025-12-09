<?php
/**
 * Manages the registration of all REST API routes for the plugin.
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_API_Manager.
 */
class CCP_API_Manager {

	/**
	 * Register all the REST API routes.
	 */
	public function register_rest_routes() {
		// Include base classes
		require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/db/class-ccp-proyectos-db.php';
		require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/db/class-ccp-montes-db.php';
		require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/db/class-ccp-campaigns-db.php';
		require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/db/class-ccp-annual-records-db.php';
		require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/db/class-ccp-investments-db.php';

		// Include controller classes
		require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/api/class-ccp-projects-controller.php';
		require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/api/class-ccp-montes-controller.php';
		require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/api/class-ccp-campaigns-controller.php';
		require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/api/class-ccp-annual-records-controller.php';
		require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/api/class-ccp-investments-controller.php';
		require_once CALCULADOR_PECAN_PLUGIN_DIR . 'includes/api/class-ccp-database-controller.php';

		// Instantiate controllers and register routes
		$projects_controller = new CCP_Projects_Controller();
		$projects_controller->register_routes();

		$montes_controller = new CCP_Montes_Controller();
		$montes_controller->register_routes();

		$campaigns_controller = new CCP_Campaigns_Controller();
		$campaigns_controller->register_routes();

		$annual_records_controller = new CCP_Annual_Records_Controller();
		$annual_records_controller->register_routes();

		$investments_controller = new CCP_Investments_Controller();
		$investments_controller->register_routes();

		$database_controller = new CCP_Database_Controller();
		$database_controller->register_routes();
	}
}
