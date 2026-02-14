<?php
/**
 * REST API Import Controller
 *
 * @package Calculador_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_Import_Controller.
 */
class CCP_Import_Controller extends WP_REST_Controller {

	/**
	 * The namespace of this controller's route.
	 *
	 * @var string
	 */
	protected $namespace = 'ccp/v1';

	/**
	 * The base of this controller's route.
	 *
	 * @var string
	 */
	protected $rest_base = 'projects';

	/**
	 * The Projects DB instance.
	 *
	 * @var CCP_Proyectos_DB
	 */
	private $proyectos_db;

	/**
	 * The Montes DB instance.
	 *
	 * @var CCP_Montes_DB
	 */
	private $montes_db;

	/**
	 * The Campaigns DB instance.
	 *
	 * @var CCP_Campaigns_DB
	 */
	private $campaigns_db;

	/**
	 * The Costs DB instance.
	 *
	 * @var CCP_Costs_DB
	 */
	private $costs_db;

	/**
	 * The Investments DB instance.
	 *
	 * @var CCP_Investments_DB
	 */
	private $investments_db;

	/**
	 * The Productions DB instance.
	 *
	 * @var CCP_Productions_DB
	 */
	private $productions_db;

	/**
	 * The Yield Models DB instance.
	 *
	 * @var CCP_Yield_Models_DB
	 */
	private $yield_models_db;

	/**
	 * The Annual Records DB instance.
	 *
	 * @var CCP_Annual_Records_DB
	 */
	private $annual_records_db;

	/**
	 * CCP_Import_Controller constructor.
	 */
	public function __construct() {
		$this->proyectos_db      = new CCP_Proyectos_DB();
		$this->montes_db         = new CCP_Montes_DB();
		$this->campaigns_db      = new CCP_Campaigns_DB();
		$this->costs_db          = new CCP_Costs_DB();
		$this->investments_db    = new CCP_Investments_DB();
		$this->productions_db    = new CCP_Productions_DB();
		$this->yield_models_db   = new CCP_Yield_Models_DB();
		$this->annual_records_db = new CCP_Annual_Records_DB();
	}

	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/import',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'import_project' ),
					'permission_callback' => array( $this, 'import_project_permissions_check' ),
					'args'                => array(
						'id'   => array(
							'description' => __( 'Unique identifier for the project.', 'calculador-pecan' ),
							'type'        => 'integer',
							'required'    => true,
						),
						'data' => array(
							'description' => __( 'JSON data to import.', 'calculador-pecan' ),
							'type'        => 'string',
							'required'    => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Check if a given request has access to import project.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has write access, WP_Error object otherwise.
	 */
	public function import_project_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to import projects.', 'calculador-pecan' ), array( 'status' => 401 ) );
		}

		$user = wp_get_current_user();
		if ( in_array( 'subscriber', $user->roles, true ) ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'Subscribers cannot import projects.', 'calculador-pecan' ), array( 'status' => 403 ) );
		}

		$project_id = $request->get_param( 'id' );
		$user_id    = get_current_user_id();

		// Check if user owns the project
		$project = $this->proyectos_db->get_by_id( $project_id, $user_id );
		if ( ! $project ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You do not have permission to import into this project.', 'calculador-pecan' ), array( 'status' => 403 ) );
		}

		return true;
	}

	/**
	 * Import project data from JSON.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function import_project( $request ) {
		$project_id = $request->get_param( 'id' );
		$json_data  = $request->get_param( 'data' );
		
		// Obtener el ID del usuario actual para pasarlo a las funciones
		$user_id = get_current_user_id();

		try {
			// Parse JSON data
			$import_data = json_decode( $json_data, true );
			if ( json_last_error() !== JSON_ERROR_NONE ) {
				return new WP_Error( 'invalid_json', __( 'Invalid JSON data provided.', 'calculador-pecan' ), array( 'status' => 400 ) );
			}

			// Validate structure
			if ( ! isset( $import_data['project'] ) || ! isset( $import_data['version'] ) ) {
				return new WP_Error( 'invalid_structure', __( 'Invalid import data structure.', 'calculador-pecan' ), array( 'status' => 400 ) );
			}

			// Start transaction
			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );

			// Delete existing data
			$this->delete_existing_project_data( $project_id );
			
			// Update project data
			$this->update_project_data( $project_id, $import_data['project'], $user_id );

			// Import related data (Pasando user_id a todos)
			$this->import_montes( $project_id, $import_data['montes'] ?? array(), $user_id );
			$this->import_campaigns( $project_id, $import_data['campaigns'] ?? array(), $user_id );
			$this->import_costs( $project_id, $import_data['costs'] ?? array(), $user_id );
			$this->import_investments( $project_id, $import_data['investments'] ?? array(), $user_id );
			$this->import_productions( $project_id, $import_data['productions'] ?? array(), $user_id );
			$this->import_yield_models( $project_id, $import_data['yield_models'] ?? array(), $user_id );
			$this->import_annual_records( $project_id, $import_data['annual_records'] ?? array(), $user_id );
			
			// Commit transaction
			$wpdb->query( 'COMMIT' );

			return new WP_REST_Response( array( 'success' => true, 'message' => 'Project imported successfully.' ), 200 );
		} catch ( Exception $e ) {
			// Rollback on error
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
			error_log( 'Import error: ' . $e->getMessage() );
			return new WP_Error( 'import_error', __( 'Error importing project data.', 'calculador-pecan' ), array( 'status' => 500 ) );
		}
	}

	/**
	 * Delete existing project data.
	 *
	 * @param int $project_id Project ID.
	 */
	private function delete_existing_project_data( $project_id ) {
		$this->montes_db->delete_by_project( $project_id );
		$this->campaigns_db->delete_by_project( $project_id );
		$this->costs_db->delete_by_project( $project_id );
		$this->investments_db->delete_by_project( $project_id );
		$this->productions_db->delete_by_project( $project_id );
		$this->yield_models_db->delete_by_project( $project_id );
		$this->annual_records_db->delete_by_project( $project_id );
	}

	/**
	 * Update project data.
	 *
	 * @param int   $project_id Project ID.
	 * @param array $project_data Project data.
	 * @param int   $user_id User ID.
	 */
	private function update_project_data( $project_id, $project_data, $user_id ) {
		$update_data = array(
			'project_name'       => sanitize_text_field( $project_data['project_name'] ?? '' ),
			'description'        => sanitize_textarea_field( $project_data['description'] ?? '' ),
			'pais'               => sanitize_text_field( $project_data['pais'] ?? 'Argentina' ),
			'provincia'          => sanitize_text_field( $project_data['provincia'] ?? '' ),
			'departamento'       => sanitize_text_field( $project_data['departamento'] ?? '' ),
			'municipio'          => sanitize_text_field( $project_data['municipio'] ?? '' ),
			'initial_year'       => intval( $project_data['initial_year'] ?? date( 'Y' ) ),
			'allow_benchmarking' => isset( $project_data['allow_benchmarking'] ) ? (bool) $project_data['allow_benchmarking'] : true,
		);
		
		$this->proyectos_db->update( $project_id, $update_data, $user_id );
	}

	/**
	 * Import montes data.
	 *
	 * @param int   $project_id Project ID.
	 * @param array $montes_data Montes data.
	 * @param int   $user_id User ID.
	 */
	private function import_montes( $project_id, $montes_data, $user_id ) {
		foreach ( $montes_data as $monte ) {
			$insert_data = array(
				'project_id'           => $project_id,
				'campaign_created_id'  => intval( $monte['campaign_created_id'] ?? 0 ),
				'monte_name'           => sanitize_text_field( $monte['monte_name'] ?? '' ),
				'area_hectareas'       => sanitize_text_field( $monte['area_hectareas'] ?? '' ),
				'plantas_por_hectarea' => intval( $monte['plantas_por_hectarea'] ?? 0 ),
				// CORRECCIÓN: Usar '' en lugar de null para evitar warnings de deprecación en PHP 8.1+
				'fecha_plantacion'     => sanitize_text_field( $monte['fecha_plantacion'] ?? '' ),
				'variedad'             => sanitize_text_field( $monte['variedad'] ?? '' ),
				'status'               => sanitize_text_field( $monte['status'] ?? 'active' ),
			);
			$this->montes_db->create( $insert_data, $user_id );
		}
	}

	/**
	 * Import campaigns data.
	 *
	 * @param int   $project_id Project ID.
	 * @param array $campaigns_data Campaigns data.
	 * @param int   $user_id User ID.
	 */
	private function import_campaigns( $project_id, $campaigns_data, $user_id ) {
		foreach ( $campaigns_data as $campaign ) {
			$insert_data = array(
				'project_id'     => $project_id,
				'year'           => intval( $campaign['year'] ?? 0 ),
				'campaign_name'  => sanitize_text_field( $campaign['campaign_name'] ?? $campaign['name'] ?? '' ),
				'description'    => sanitize_textarea_field( $campaign['description'] ?? '' ),
				'average_price'  => floatval( $campaign['average_price'] ?? 0 ),
				'start_date'     => sanitize_text_field( $campaign['start_date'] ?? date('Y-m-d') ),
			);
			$this->campaigns_db->create( $insert_data, $user_id );
		}
	}

	/**
	 * Import costs data.
	 *
	 * @param int   $project_id Project ID.
	 * @param array $costs_data Costs data.
	 * @param int   $user_id User ID.
	 */
	private function import_costs( $project_id, $costs_data, $user_id ) {
		foreach ( $costs_data as $cost ) {
			$insert_data = array(
				'project_id'   => $project_id,
				'campaign_id'  => intval( $cost['campaign_id'] ?? 0 ),
				'category'     => sanitize_text_field( $cost['category'] ?? '' ),
				'details'      => $cost['details'] ?? null,
				'total_amount' => floatval( $cost['total_amount'] ?? 0 ),
			);
			$this->costs_db->create( $insert_data, $user_id );
		}
	}

	/**
	 * Import investments data.
	 *
	 * @param int   $project_id Project ID.
	 * @param array $investments_data Investments data.
	 * @param int   $user_id User ID.
	 */
	private function import_investments( $project_id, $investments_data, $user_id ) {
		foreach ( $investments_data as $investment ) {
			$insert_data = array(
				'project_id'  => $project_id,
				'campaign_id' => intval( $investment['campaign_id'] ?? 0 ),
				'category'    => sanitize_text_field( $investment['category'] ?? '' ),
				'description' => sanitize_textarea_field( $investment['description'] ?? '' ),
				'total_value' => floatval( $investment['amount'] ?? $investment['total_value'] ?? 0 ),
				'details'     => $investment['data'] ?? $investment['details'] ?? null,
			);
			$this->investments_db->create( $insert_data, $user_id );
		}
	}

	/**
	 * Import productions data.
	 *
	 * @param int   $project_id Project ID.
	 * @param array $productions_data Productions data.
	 * @param int   $user_id User ID.
	 */
	private function import_productions( $project_id, $productions_data, $user_id ) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'pecan_productions';

		foreach ( $productions_data as $production ) {
			$insert_data = array(
				'project_id'       => $project_id,
				'campaign_id'      => intval( $production['campaign_id'] ?? 0 ),
				'monte_id'         => intval( $production['monte_id'] ?? 0 ),
				'entry_group_id'   => sanitize_text_field( $production['entry_group_id'] ?? '' ),
				'input_type'       => sanitize_text_field( $production['input_type'] ?? 'total' ),
				'quantity_kg'      => floatval( $production['quantity_kg'] ?? 0 ),
				'is_estimated'     => intval( $production['is_estimated'] ?? 0 ),
				'created_at'       => current_time( 'mysql', 1 ),
				'updated_at'       => current_time( 'mysql', 1 ),
			);
			
			if ( ! empty( $insert_data['monte_id'] ) ) {
				$wpdb->insert( $table_name, $insert_data );
			}
		}
	}

	/**
	 * Import yield models data.
	 *
	 * @param int   $project_id Project ID.
	 * @param array $yield_models_data Yield models data.
	 * @param int   $user_id User ID.
	 */
	private function import_yield_models( $project_id, $yield_models_data, $user_id ) {
		foreach ( $yield_models_data as $yield_model ) {
			$insert_data = array(
				'project_id'  => $project_id,
				'variety'     => sanitize_text_field( $yield_model['variety'] ?? 'general' ),
				'model_name'  => sanitize_text_field( $yield_model['model_name'] ?? 'Modelo Importado' ),
				'yield_data'  => $yield_model['yield_data'] ?? $yield_model['parameters'] ?? '[]',
				'is_active'   => intval( $yield_model['is_active'] ?? 1 ),
			);
			$this->yield_models_db->create( $insert_data, $user_id );
		}
	}

	/**
	 * Import annual records data.
	 *
	 * @param int   $project_id Project ID.
	 * @param array $annual_records_data Annual records data.
	 * @param int   $user_id User ID.
	 */
	private function import_annual_records( $project_id, $annual_records_data, $user_id ) {
		foreach ( $annual_records_data as $record ) {
			$this->annual_records_db->save_record(
				$project_id,
				intval( $record['campaign_id'] ?? 0 ),
				sanitize_text_field( $record['type'] ?? $record['data_type'] ?? '' ),
				sanitize_text_field( $record['category'] ?? '' ),
				floatval( $record['total_value'] ?? $record['value'] ?? 0 ),
				is_string($record['details']) ? $record['details'] : json_encode($record['details'] ?? []),
				$user_id,
				isset($record['monte_id']) ? intval($record['monte_id']) : null
			);
		}
	}
}