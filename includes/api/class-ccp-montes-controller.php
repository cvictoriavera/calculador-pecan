<?php
/**
 * REST API Montes Controller
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_Montes_Controller.
 */
class CCP_Montes_Controller extends WP_REST_Controller {

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
	protected $rest_base = 'montes';

	/**
	 * The Montes DB instance.
	 *
	 * @var CCP_Montes_DB
	 */
	private $montes_db;

	/**
	 * CCP_Montes_Controller constructor.
	 */
	public function __construct() {
		$this->montes_db = new CCP_Montes_DB();
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
					'args'                => array(
						'id' => array(
							'description' => __( 'Unique identifier for the monte.', 'calculador-pecan' ),
							'type'        => 'integer',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'Unique identifier for the monte.', 'calculador-pecan' ),
							'type'        => 'integer',
						),
					),
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
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to view montes.', 'calculador-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Check if a given request has access to create items.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to create montes.', 'calculador-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Check if a given request has access to update a specific item.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has access to update the item, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to update montes.', 'calculador-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Check if a given request has access to delete a specific item.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has access to delete the item, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to delete montes.', 'calculador-pecan' ), array( 'status' => 401 ) );
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
		$montes     = $this->montes_db->get_all_by_project( $project_id, $user_id );

		if ( is_null( $montes ) ) {
			// This could mean the project doesn't exist, the user doesn't own it, or it has no montes.
			// For security, we don't reveal which. We just return an empty array.
			$montes = array();
		}

		$response = rest_ensure_response( $montes );
		return $response;
	}

	/**
		* Create one item from the collection.
		*
		* @param WP_REST_Request $request Full data about the request.
		* @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
		*/
	public function create_item( $request ) {
		$user_id = get_current_user_id();
		$params  = $request->get_json_params();

		if ( empty( $params['project_id'] ) ) {
			return new WP_Error( 'missing_params', __( 'Project ID is required.', 'calculador-pecan' ), array( 'status' => 400 ) );
		}

		$monte_data = array(
			'project_id'           => absint( $params['project_id'] ),

			'monte_name'           => sanitize_text_field( $params['monte_name'] ?? 'Nuevo Monte' ),
			'area_hectareas'       => floatval( $params['area_hectareas'] ?? 0 ),
			'plantas_por_hectarea' => intval( $params['plantas_por_hectarea'] ?? 0 ),
			'fecha_plantacion'     => $params['fecha_plantacion'] ?? null,
			'variedad'             => sanitize_text_field( $params['variedad'] ?? '' ),
		);

		$monte_id = $this->montes_db->create( $monte_data, $user_id );

		if ( ! $monte_id ) {
			return new WP_Error( 'create_failed', __( 'Could not create monte.', 'calculador-pecan' ), array( 'status' => 500 ) );
		}

		$monte = $this->montes_db->get_by_id( $monte_id, $user_id );

		$response = rest_ensure_response( $monte );
		$response->set_status( 201 );
		return $response;
	}

	/**
		* Update one item from the collection.
		*
		* @param WP_REST_Request $request Full data about the request.
		* @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
		*/
	public function update_item( $request ) {
		$user_id  = get_current_user_id();
		$monte_id = (int) $request->get_param( 'id' );
		$params   = $request->get_json_params();

		error_log('CCP: update_item called for monte_id: ' . $monte_id . ', params: ' . print_r($params, true));

		$update_data = array();

		if ( isset( $params['monte_name'] ) ) {
			$update_data['monte_name'] = sanitize_text_field( $params['monte_name'] );
		}

		if ( isset( $params['area_hectareas'] ) ) {
			$update_data['area_hectareas'] = floatval( $params['area_hectareas'] );
		}

		if ( isset( $params['plantas_por_hectarea'] ) ) {
			$update_data['plantas_por_hectarea'] = intval( $params['plantas_por_hectarea'] );
		}

		if ( isset( $params['fecha_plantacion'] ) ) {
			$update_data['fecha_plantacion'] = $params['fecha_plantacion'];
		}

		if ( isset( $params['variedad'] ) ) {
			$update_data['variedad'] = sanitize_text_field( $params['variedad'] );
		}

		error_log('CCP: update_data: ' . print_r($update_data, true));

		if ( empty( $update_data ) ) {
			return new WP_Error( 'no_data', __( 'No data provided for update.', 'calculador-pecan' ), array( 'status' => 400 ) );
		}

		$updated = $this->montes_db->update( $monte_id, $update_data, $user_id );

		error_log('CCP: update result: ' . ($updated ? 'success' : 'failed'));

		if ( ! $updated ) {
			return new WP_Error( 'update_failed', __( 'Could not update monte.', 'calculador-pecan' ), array( 'status' => 500 ) );
		}

		$monte = $this->montes_db->get_by_id( $monte_id, $user_id );

		$response = rest_ensure_response( $monte );
		return $response;
	}

	/**
		* Delete one item from the collection.
		*
		* @param WP_REST_Request $request Full data about the request.
		* @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
		*/
	public function delete_item( $request ) {
		$user_id  = get_current_user_id();
		$monte_id = (int) $request->get_param( 'id' );

		error_log('CCP: delete_item called for monte_id: ' . $monte_id);

		$deleted = $this->montes_db->delete_permanent( $monte_id, $user_id );

		error_log('CCP: delete result: ' . ($deleted ? 'success' : 'failed'));

		if ( ! $deleted ) {
			return new WP_Error( 'delete_failed', __( 'Could not delete monte.', 'calculador-pecan' ), array( 'status' => 500 ) );
		}

		$response = rest_ensure_response( array( 'deleted' => true ) );
		return $response;
	}

}
