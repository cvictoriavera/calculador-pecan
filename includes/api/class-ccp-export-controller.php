<?php
/**
 * REST API Export Controller
 *
 * @package Calculador_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_Export_Controller.
 */
class CCP_Export_Controller extends WP_REST_Controller {

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
	 * CCP_Export_Controller constructor.
	 */
	public function __construct() {
		$this->proyectos_db = new CCP_Proyectos_DB();
		$this->montes_db = new CCP_Montes_DB();
		$this->campaigns_db = new CCP_Campaigns_DB();
		$this->costs_db = new CCP_Costs_DB();
		$this->investments_db = new CCP_Investments_DB();
		$this->productions_db = new CCP_Productions_DB();
		$this->yield_models_db = new CCP_Yield_Models_DB();
		$this->annual_records_db = new CCP_Annual_Records_DB();
	}

	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/export',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'export_project' ),
					'permission_callback' => array( $this, 'export_project_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'Unique identifier for the project.', 'calculador-pecan' ),
							'type'        => 'integer',
							'required'    => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Check if a given request has access to export project.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function export_project_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to export projects.', 'calculador-pecan' ), array( 'status' => 401 ) );
		}

		$user = wp_get_current_user();
		if ( in_array( 'subscriber', $user->roles, true ) ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'Subscribers cannot export projects.', 'calculador-pecan' ), array( 'status' => 403 ) );
		}

		$project_id = $request->get_param( 'id' );
		$user_id = get_current_user_id();

		// Check if user owns the project
		$project = $this->proyectos_db->get_by_id( $project_id, $user_id );
		if ( ! $project ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You do not have permission to export this project.', 'calculador-pecan' ), array( 'status' => 403 ) );
		}

		return true;
	}

	/**
	 * Export project data as JSON.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function export_project( $request ) {
		error_log( 'Export: Starting export for project ID: ' . $request->get_param( 'id' ) );
		$project_id = $request->get_param( 'id' );
		$user_id = get_current_user_id();
		error_log( 'Export: User ID: ' . $user_id );

		try {
			// Get project data
			error_log( 'Export: Getting project data' );
			$project = $this->proyectos_db->get_by_id( $project_id, $user_id );
			if ( ! $project ) {
				error_log( 'Export: Project not found' );
				return new WP_Error( 'project_not_found', __( 'Project not found.', 'calculador-pecan' ), array( 'status' => 404 ) );
			}
			error_log( 'Export: Project found: ' . print_r( $project, true ) );

			// Build export data structure
			$export_data = array(
				'version'     => '1.0',
				'exported_at' => current_time( 'c' ),
				'project'     => array(
					'project_name'      => $project->project_name,
					'description'       => $project->description,
					'pais'              => $project->pais,
					'provincia'         => $project->provincia,
					'departamento'      => $project->departamento,
					'municipio'         => $project->municipio,
					'initial_year'      => (int) $project->initial_year,
					'allow_benchmarking' => (bool) $project->allow_benchmarking,
				),
			);

			// Get montes
			error_log( 'Export: Getting montes' );
			$export_data['montes'] = $this->montes_db->get_all_by_project( $project_id, $user_id );
			error_log( 'Export: Montes: ' . print_r( $export_data['montes'], true ) );

			// Get campaigns
			error_log( 'Export: Getting campaigns' );
			$export_data['campaigns'] = $this->campaigns_db->get_all_by_project( $project_id, $user_id );
			error_log( 'Export: Campaigns count: ' . count( $export_data['campaigns'] ) );

			// Get costs
			error_log( 'Export: Getting costs' );
			$export_data['costs'] = $this->costs_db->get_all_by_project( $project_id, $user_id );
			error_log( 'Export: Costs count: ' . count( $export_data['costs'] ) );

			// Get investments
			error_log( 'Export: Getting investments' );
			$export_data['investments'] = $this->investments_db->get_all_by_project( $project_id, $user_id );
			error_log( 'Export: Investments count: ' . count( $export_data['investments'] ) );

			// Get productions
			error_log( 'Export: Getting productions' );
			$export_data['productions'] = $this->productions_db->get_all_by_project( $project_id, $user_id );
			error_log( 'Export: Productions count: ' . count( $export_data['productions'] ) );

			// Get yield models
			error_log( 'Export: Getting yield models' );
			$export_data['yield_models'] = $this->yield_models_db->get_all_by_project( $project_id, $user_id );
			error_log( 'Export: Yield models count: ' . count( $export_data['yield_models'] ) );

			// Get annual records
			error_log( 'Export: Getting annual records' );
			$export_data['annual_records'] = $this->annual_records_db->get_all_by_project( $project_id, $user_id );
			error_log( 'Export: Annual records count: ' . count( $export_data['annual_records'] ) );

			// Return JSON response
			error_log( 'Export: Preparing response' );
			$response = new WP_REST_Response( $export_data );
			$response->set_status( 200 );
			$response->header( 'Content-Type', 'application/json' );
			error_log( 'Export: Response prepared, returning' );

			return $response;

		} catch ( Exception $e ) {
			error_log( 'Export error: ' . $e->getMessage() );
			error_log( 'Export error trace: ' . $e->getTraceAsString() );
			return new WP_Error( 'export_error', __( 'Error exporting project data.', 'calculador-pecan' ), array( 'status' => 500 ) );
		}
	}
}