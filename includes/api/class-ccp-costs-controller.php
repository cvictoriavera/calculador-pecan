<?php
/**
 * REST API Costs Controller
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_Costs_Controller.
 */
class CCP_Costs_Controller extends WP_REST_Controller {

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
	protected $rest_base = 'costs';

	/**
	 * The Costs DB instance.
	 *
	 * @var CCP_Costs_DB
	 */
	private $costs_db;

	/**
	 * CCP_Costs_Controller constructor.
	 */
	public function __construct() {
		$this->costs_db = new CCP_Costs_DB();
	}

	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {
		// Route for getting costs by campaign
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<project_id>[\d]+)/(?P<campaign_id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_campaign_costs' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_campaign_params(),
				),
			)
		);

		// Route for creating a new cost
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_cost' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_create_params(),
				),
			)
		);

		// Route for updating a cost
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<cost_id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_cost' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_update_params(),
				),
			)
		);

		// Route for deleting a cost
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<cost_id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_cost' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_delete_params(),
				),
			)
		);
	}

	/**
	 * Generic permissions check for the routes.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has access, WP_Error object otherwise.
	 */
	public function permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in.', 'calculadora-costos-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Get costs for a specific campaign.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_campaign_costs( $request ) {
		$user_id     = get_current_user_id();
		$project_id  = (int) $request['project_id'];
		$campaign_id = (int) $request['campaign_id'];

		$costs = $this->costs_db->get_by_campaign( $project_id, $campaign_id, $user_id );

		if ( is_null( $costs ) ) {
			$costs = array();
		}

		// Decode JSON cost_data for the response
		foreach ( $costs as $cost ) {
			if ( ! empty( $cost->cost_data ) ) {
				$cost->details = json_decode( $cost->cost_data );
			}
		}

		$response = rest_ensure_response( $costs );
		return $response;
	}

	/**
	 * Create a new cost.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_cost( $request ) {
	  $user_id = get_current_user_id();
	  $params  = $request->get_json_params();

	  $project_id   = isset( $params['project_id'] ) ? (int) $params['project_id'] : 0;
	  $campaign_id  = isset( $params['campaign_id'] ) ? (int) $params['campaign_id'] : 0;
	  $category     = isset( $params['category'] ) ? sanitize_text_field( $params['category'] ) : '';
	  $details      = isset( $params['details'] ) ? $params['details'] : null;
	  $total_amount = isset( $params['total_amount'] ) ? floatval( $params['total_amount'] ) : 0.0;

	  if ( empty( $project_id ) || empty( $campaign_id ) || empty( $category ) ) {
	    return new WP_Error( 'missing-params', esc_html__( 'Missing required parameters.', 'calculadora-costos-pecan' ), array( 'status' => 400 ) );
	  }

	  $data = array(
	    'project_id'   => $project_id,
	    'campaign_id'  => $campaign_id,
	    'category'     => $category,
	    'details'      => $details,
	    'total_amount' => $total_amount,
	  );

	  $result = $this->costs_db->create( $data, $user_id );

	  if ( false === $result ) {
	    return new WP_Error( 'cant-create', esc_html__( 'Could not create the cost.', 'calculadora-costos-pecan' ), array( 'status' => 500 ) );
	  }

	  return rest_ensure_response( array( 'success' => true, 'id' => $result ) );
	}

	/**
	 * Update an existing cost.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_cost( $request ) {
		$user_id  = get_current_user_id();
		$cost_id  = (int) $request['cost_id'];
		$params   = $request->get_json_params();

		$update_data = array();

		if ( isset( $params['category'] ) ) {
			$update_data['category'] = sanitize_text_field( $params['category'] );
		}

		if ( isset( $params['details'] ) ) {
			$update_data['details'] = $params['details'];
		}

		if ( isset( $params['total_amount'] ) ) {
			$update_data['total_amount'] = floatval( $params['total_amount'] );
		}

		if ( empty( $update_data ) ) {
			return new WP_Error( 'no-updates', esc_html__( 'No valid updates provided.', 'calculadora-costos-pecan' ), array( 'status' => 400 ) );
		}

		$result = $this->costs_db->update( $cost_id, $update_data, $user_id );

		if ( false === $result ) {
			return new WP_Error( 'cant-update', esc_html__( 'Could not update the cost.', 'calculadora-costos-pecan' ), array( 'status' => 500 ) );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Delete a cost.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_cost( $request ) {
		$user_id = get_current_user_id();
		$cost_id = (int) $request['cost_id'];

		$result = $this->costs_db->delete( $cost_id, $user_id );

		if ( false === $result ) {
			return new WP_Error( 'cant-delete', esc_html__( 'Could not delete the cost.', 'calculadora-costos-pecan' ), array( 'status' => 500 ) );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Get the path parameters for campaign routes.
	 *
	 * @return array
	 */
	private function get_campaign_params() {
		return array(
			'project_id'  => array(
				'validate_callback' => function( $param ) { return is_numeric( $param ); },
				'required'          => true,
			),
			'campaign_id' => array(
				'validate_callback' => function( $param ) { return is_numeric( $param ); },
				'required'          => true,
			),
		);
	}

	/**
	 * Get the body parameters for create cost.
	 *
	 * @return array
	 */
	private function get_create_params() {
		return array(
			'project_id'   => array( 'type' => 'integer', 'required' => true ),
			'campaign_id'  => array( 'type' => 'integer', 'required' => true ),
			'category'     => array( 'type' => 'string', 'required' => true ),
			'details'      => array( 'type' => 'object', 'required' => false, 'default' => null ),
			'total_amount' => array( 'type' => 'number', 'required' => false, 'default' => 0.0 ),
		);
	}

	/**
	 * Get the path parameters for update route.
	 *
	 * @return array
	 */
	private function get_update_params() {
		return array(
			'cost_id' => array(
				'validate_callback' => function( $param ) { return is_numeric( $param ); },
				'required'          => true,
			),
		);
	}

	/**
	 * Get the path parameters for delete route.
	 *
	 * @return array
	 */
	private function get_delete_params() {
		return array(
			'cost_id' => array(
				'validate_callback' => function( $param ) { return is_numeric( $param ); },
				'required'          => true,
			),
		);
	}
}