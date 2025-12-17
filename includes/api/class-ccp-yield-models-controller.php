<?php
/**
 * REST API Yield Models Controller
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_Yield_Models_Controller.
 */
class CCP_Yield_Models_Controller extends WP_REST_Controller {

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
	protected $rest_base = 'yield-models';

	/**
	 * The Yield Models DB instance.
	 *
	 * @var CCP_Yield_Models_DB
	 */
	private $yield_models_db;

	/**
	 * CCP_Yield_Models_Controller constructor.
	 */
	public function __construct() {
		$this->yield_models_db = new CCP_Yield_Models_DB();
	}

	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/by-project/(?P<project_id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items_by_project' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'project_id' => array(
							'validate_callback' => function( $param, $request, $key ) {
								return is_numeric( $param );
							},
							'required' => true,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::CREATABLE ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Check if a given request has access to get items.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to view yield models.', 'calculadora-costos-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Check if a given request has access to create items.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has create access, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to create yield models.', 'calculadora-costos-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Check if a given request has access to update items.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has update access, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to update yield models.', 'calculadora-costos-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Check if a given request has access to delete items.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has delete access, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to delete yield models.', 'calculadora-costos-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Retrieve a collection of items for a given project.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items_by_project( $request ) {
		$user_id    = get_current_user_id();
		$project_id = (int) $request['project_id'];
		$yield_models = $this->yield_models_db->get_all_by_project( $project_id, $user_id );

		if ( is_null( $yield_models ) ) {
			$yield_models = array();
		}

		$response = rest_ensure_response( $yield_models );
		return $response;
	}

	/**
	 * Create a yield model.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		$user_id = get_current_user_id();

		$data = array(
			'project_id' => (int) $request->get_param( 'project_id' ),
			'variety'    => $request->get_param( 'variety' ) ? sanitize_text_field( $request->get_param( 'variety' ) ) : 'general',
			'model_name' => sanitize_text_field( $request->get_param( 'model_name' ) ),
			'yield_data' => $request->get_param( 'yield_data' ), // JSON string
			'is_active'  => $request->get_param( 'is_active' ) ? (int) $request->get_param( 'is_active' ) : 1,
		);

		$model_id = $this->yield_models_db->create( $data, $user_id );

		if ( is_wp_error( $model_id ) ) {
			return $model_id;
		}

		if ( false === $model_id ) {
			return new WP_Error( 'yield_model_creation_failed', 'Failed to create yield model.', array( 'status' => 500 ) );
		}

		// Get the created yield model
		$yield_model = $this->yield_models_db->get_by_id( $model_id, $user_id );

		$response = rest_ensure_response( $yield_model );
		$response->set_status( 201 );

		return $response;
	}

	/**
	 * Update a yield model.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$user_id   = get_current_user_id();
		$model_id  = (int) $request['id'];

		$data = array();

		// Build data array from request parameters.
		if ( $request->has_param( 'model_name' ) ) {
			$data['model_name'] = sanitize_text_field( $request->get_param( 'model_name' ) );
		}

		if ( $request->has_param( 'yield_data' ) ) {
			$data['yield_data'] = $request->get_param( 'yield_data' ); // JSON string
		}

		if ( $request->has_param( 'is_active' ) ) {
			$data['is_active'] = (int) $request->get_param( 'is_active' );
		}

		$result = $this->yield_models_db->update( $model_id, $data, $user_id );

		if ( false === $result ) {
			return new WP_Error( 'yield_model_update_failed', 'Failed to update yield model.', array( 'status' => 500 ) );
		}

		// Get the updated yield model
		$yield_model = $this->yield_models_db->get_by_id( $model_id, $user_id );

		$response = rest_ensure_response( $yield_model );
		return $response;
	}

	/**
	 * Delete a yield model.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		$user_id  = get_current_user_id();
		$model_id = (int) $request['id'];

		$result = $this->yield_models_db->delete( $model_id, $user_id );

		if ( false === $result ) {
			return new WP_Error( 'yield_model_delete_failed', 'Failed to delete yield model.', array( 'status' => 500 ) );
		}

		return new WP_REST_Response( null, 204 );
	}
}