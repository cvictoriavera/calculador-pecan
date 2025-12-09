<?php
/**
 * REST API Investments Controller
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_Investments_Controller.
 */
class CCP_Investments_Controller extends WP_REST_Controller {

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
	protected $rest_base = 'investments';

	/**
	 * The Investments DB instance.
	 *
	 * @var CCP_Investments_DB
	 */
	private $investments_db;

	/**
	 * CCP_Investments_Controller constructor.
	 */
	public function __construct() {
		$this->investments_db = new CCP_Investments_DB();
	}

	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {
		// Route for getting all investments for a project
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<project_id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_project_investments' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_project_params(),
				),
			)
		);

		// Route for getting investments by campaign
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<project_id>[\d]+)/(?P<campaign_id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_campaign_investments' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_campaign_params(),
				),
			)
		);

		// Route for creating a new investment
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_investment' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_create_params(),
				),
			)
		);

		// Route for updating an investment
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<investment_id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_investment' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_update_params(),
				),
			)
		);

		// Route for deleting an investment
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<investment_id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_investment' ),
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
	 * Get all investments for a project.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_project_investments( $request ) {
		$user_id    = get_current_user_id();
		$project_id = (int) $request['project_id'];

		$investments = $this->investments_db->get_all_by_project( $project_id, $user_id );

		if ( is_null( $investments ) ) {
			$investments = array();
		}

		// Decode JSON details for the response
		foreach ( $investments as $investment ) {
			if ( ! empty( $investment->details ) ) {
				$investment->details = json_decode( $investment->details );
			}
		}

		$response = rest_ensure_response( $investments );
		return $response;
	}

	/**
	 * Get investments for a specific campaign.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_campaign_investments( $request ) {
		$user_id     = get_current_user_id();
		$project_id  = (int) $request['project_id'];
		$campaign_id = (int) $request['campaign_id'];

		$investments = $this->investments_db->get_by_campaign( $project_id, $campaign_id, $user_id );

		if ( is_null( $investments ) ) {
			$investments = array();
		}

		// Decode JSON details for the response
		foreach ( $investments as $investment ) {
			if ( ! empty( $investment->details ) ) {
				$investment->details = json_decode( $investment->details );
			}
		}

		$response = rest_ensure_response( $investments );
		return $response;
	}

	/**
	 * Create a new investment.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_investment( $request ) {
		$user_id = get_current_user_id();
		$params  = $request->get_json_params();

		$project_id  = isset( $params['project_id'] ) ? (int) $params['project_id'] : 0;
		$campaign_id = isset( $params['campaign_id'] ) ? (int) $params['campaign_id'] : null;
		$category    = isset( $params['category'] ) ? sanitize_text_field( $params['category'] ) : '';
		$description = isset( $params['description'] ) ? sanitize_text_field( $params['description'] ) : '';
		$total_value = isset( $params['total_value'] ) ? floatval( $params['total_value'] ) : 0.0;
		$details     = isset( $params['details'] ) ? $params['details'] : null;

		if ( empty( $project_id ) || empty( $category ) || empty( $description ) ) {
			return new WP_Error( 'missing-params', esc_html__( 'Missing required parameters.', 'calculadora-costos-pecan' ), array( 'status' => 400 ) );
		}

		$data = array(
			'project_id'  => $project_id,
			'campaign_id' => $campaign_id,
			'category'    => $category,
			'description' => $description,
			'total_value' => $total_value,
			'details'     => $details,
		);

		$result = $this->investments_db->create( $data, $user_id );

		if ( false === $result ) {
			return new WP_Error( 'cant-create', esc_html__( 'Could not create the investment.', 'calculadora-costos-pecan' ), array( 'status' => 500 ) );
		}

		return rest_ensure_response( array( 'success' => true, 'id' => $result ) );
	}

	/**
	 * Update an existing investment.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_investment( $request ) {
		$user_id       = get_current_user_id();
		$investment_id = (int) $request['investment_id'];
		$params        = $request->get_json_params();

		$update_data = array();

		if ( isset( $params['category'] ) ) {
			$update_data['category'] = sanitize_text_field( $params['category'] );
		}

		if ( isset( $params['description'] ) ) {
			$update_data['description'] = sanitize_text_field( $params['description'] );
		}

		if ( isset( $params['total_value'] ) ) {
			$update_data['total_value'] = floatval( $params['total_value'] );
		}

		if ( isset( $params['details'] ) ) {
			$update_data['details'] = $params['details'];
		}

		if ( empty( $update_data ) ) {
			return new WP_Error( 'no-updates', esc_html__( 'No valid updates provided.', 'calculadora-costos-pecan' ), array( 'status' => 400 ) );
		}

		$result = $this->investments_db->update( $investment_id, $update_data, $user_id );

		if ( false === $result ) {
			return new WP_Error( 'cant-update', esc_html__( 'Could not update the investment.', 'calculadora-costos-pecan' ), array( 'status' => 500 ) );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Delete an investment.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_investment( $request ) {
		$user_id       = get_current_user_id();
		$investment_id = (int) $request['investment_id'];

		$result = $this->investments_db->delete( $investment_id, $user_id );

		if ( false === $result ) {
			return new WP_Error( 'cant-delete', esc_html__( 'Could not delete the investment.', 'calculadora-costos-pecan' ), array( 'status' => 500 ) );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Get the path parameters for project routes.
	 *
	 * @return array
	 */
	private function get_project_params() {
		return array(
			'project_id' => array(
				'validate_callback' => function( $param ) { return is_numeric( $param ); },
				'required'          => true,
			),
		);
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
	 * Get the body parameters for create investment.
	 *
	 * @return array
	 */
	private function get_create_params() {
		return array(
			'project_id'  => array( 'type' => 'integer', 'required' => true ),
			'campaign_id' => array( 'type' => 'integer', 'required' => false ),
			'category'    => array( 'type' => 'string', 'required' => true ),
			'description' => array( 'type' => 'string', 'required' => true ),
			'total_value' => array( 'type' => 'number', 'required' => false, 'default' => 0.0 ),
			'details'     => array( 'type' => 'object', 'required' => false, 'default' => null ),
		);
	}

	/**
	 * Get the path parameters for update route.
	 *
	 * @return array
	 */
	private function get_update_params() {
		return array(
			'investment_id' => array(
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
			'investment_id' => array(
				'validate_callback' => function( $param ) { return is_numeric( $param ); },
				'required'          => true,
			),
		);
	}
}