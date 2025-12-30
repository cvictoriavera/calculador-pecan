<?php
/**
 * REST API Campaigns Controller
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_Campaigns_Controller.
 */
class CCP_Campaigns_Controller extends WP_REST_Controller {

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
	protected $rest_base = 'campaigns';

	/**
	 * The Campaigns DB instance.
	 *
	 * @var CCP_Campaigns_DB
	 */
	private $campaigns_db;

	/**
	 * CCP_Campaigns_Controller constructor.
	 */
	public function __construct() {
		$this->campaigns_db = new CCP_Campaigns_DB();
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
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/close-active',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'close_active_campaign' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
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
	}

	/**
	 * Check if a given request has access to get items.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to view campaigns.', 'calculadora-costos-pecan' ), array( 'status' => 401 ) );
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
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to create campaigns.', 'calculadora-costos-pecan' ), array( 'status' => 401 ) );
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
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to update campaigns.', 'calculadora-costos-pecan' ), array( 'status' => 401 ) );
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
		$campaigns  = $this->campaigns_db->get_all_by_project( $project_id, $user_id );

		if ( is_null( $campaigns ) ) {
			$campaigns = array();
		}

		$response = rest_ensure_response( $campaigns );
		return $response;
	}

	/**
	 * Create a campaign.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		$user_id = get_current_user_id();

		error_log( 'CCP Campaigns: Starting create_item for user ' . $user_id );

		$data = array(
			'project_id'             => (int) $request->get_param( 'project_id' ),
			'campaign_name'          => sanitize_text_field( $request->get_param( 'campaign_name' ) ),
			'year'                   => (int) $request->get_param( 'year' ),
			'start_date'             => sanitize_text_field( $request->get_param( 'start_date' ) ),
			'end_date'               => $request->get_param( 'end_date' ) ? sanitize_text_field( $request->get_param( 'end_date' ) ) : null,
			'status'                 => $request->get_param( 'status' ) ? sanitize_text_field( $request->get_param( 'status' ) ) : 'open',
			'is_current'             => $request->get_param( 'is_current' ) ? (int) $request->get_param( 'is_current' ) : 0,
			'notes'                  => $request->get_param( 'notes' ) ? sanitize_textarea_field( $request->get_param( 'notes' ) ) : null,
			'average_price'          => $request->get_param( 'average_price' ) ? floatval( $request->get_param( 'average_price' ) ) : 0.00,
			'total_production'       => $request->get_param( 'total_production' ) ? floatval( $request->get_param( 'total_production' ) ) : 0.00,
			'montes_contribuyentes'  => $request->get_param( 'montes_contribuyentes' ) ? sanitize_text_field( $request->get_param( 'montes_contribuyentes' ) ) : null,
			'montes_production'      => $request->get_param( 'montes_production' ) ? sanitize_text_field( $request->get_param( 'montes_production' ) ) : null,
		);

		error_log( 'CCP Campaigns: Prepared data: ' . print_r( $data, true ) );

		$campaign_id = $this->campaigns_db->create( $data, $user_id );

		error_log( 'CCP Campaigns: DB create result: ' . print_r( $campaign_id, true ) );

		if ( is_wp_error( $campaign_id ) ) {
			error_log( 'CCP Campaigns: WP_Error from DB create: ' . $campaign_id->get_error_message() );
			// Return the WP_Error directly to provide proper error response
			return $campaign_id;
		}

		if ( false === $campaign_id ) {
			error_log( 'CCP Campaigns: DB create returned false' );
			return new WP_Error( 'campaign_creation_failed', 'Failed to create campaign.', array( 'status' => 500 ) );
		}

		error_log( 'CCP Campaigns: Campaign created with ID: ' . $campaign_id );

		// Get the created campaign
		$campaign = $this->campaigns_db->get_by_id( $campaign_id, $user_id );

		error_log( 'CCP Campaigns: Retrieved campaign: ' . print_r( $campaign, true ) );

		$response = rest_ensure_response( $campaign );
		$response->set_status( 201 );

		return $response;
	}

	/**
		* Update a campaign.
		*
		* @param WP_REST_Request $request Full data about the request.
		* @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
		*/
	public function update_item( $request ) {
		$user_id     = get_current_user_id();
		$campaign_id = (int) $request['id'];

		$data = array();
		$json_params = $request->get_json_params();

		// Build data array from request parameters.
		if ( $request->has_param( 'campaign_name' ) ) {
			$data['campaign_name'] = sanitize_text_field( $request->get_param( 'campaign_name' ) );
		}

		if ( $request->has_param( 'year' ) ) {
			$data['year'] = (int) $request->get_param( 'year' );
		}

		if ( $request->has_param( 'start_date' ) ) {
			$data['start_date'] = sanitize_text_field( $request->get_param( 'start_date' ) );
		}

		if ( $request->has_param( 'end_date' ) ) {
			$data['end_date'] = sanitize_text_field( $request->get_param( 'end_date' ) );
		}

		if ( $request->has_param( 'status' ) ) {
			$data['status'] = sanitize_text_field( $request->get_param( 'status' ) );
		}

		if ( $request->has_param( 'is_current' ) ) {
			$data['is_current'] = (int) $request->get_param( 'is_current' );
		}

		if ( $request->has_param( 'notes' ) ) {
			$data['notes'] = sanitize_textarea_field( $request->get_param( 'notes' ) );
		}

		if ( $request->has_param( 'average_price' ) ) {
			$data['average_price'] = floatval( $request->get_param( 'average_price' ) );
		}

		if ( $request->has_param( 'total_production' ) ) {
			$data['total_production'] = floatval( $request->get_param( 'total_production' ) );
		}

		// New fields from JSON body
		if ( array_key_exists( 'montes_contribuyentes', $json_params ) ) {
			$data['montes_contribuyentes'] = $json_params['montes_contribuyentes'] ? sanitize_text_field( $json_params['montes_contribuyentes'] ) : null;
		}

		if ( array_key_exists( 'montes_production', $json_params ) ) {
			$data['montes_production'] = $json_params['montes_production'] ? sanitize_text_field( $json_params['montes_production'] ) : null;
		}

		$result = $this->campaigns_db->update( $campaign_id, $data, $user_id );

		if ( false === $result ) {
			return new WP_Error( 'campaign_update_failed', 'Failed to update campaign.', array( 'status' => 500 ) );
		}

		// Get the updated campaign
		$campaign = $this->campaigns_db->get_by_id( $campaign_id, $user_id );

		$response = rest_ensure_response( $campaign );
		return $response;
	}

	/**
	 * Close the currently active campaign for a project.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function close_active_campaign( $request ) {
		$user_id = get_current_user_id();

		$project_id = (int) $request->get_param( 'project_id' );

		$result = $this->campaigns_db->close_active_campaign( $project_id, $user_id );

		if ( false === $result ) {
			return new WP_Error( 'campaign_close_failed', 'Failed to close active campaign.', array( 'status' => 500 ) );
		}

		$response = rest_ensure_response( array( 'success' => true, 'closed' => $result > 0 ) );
		return $response;
	}
}
