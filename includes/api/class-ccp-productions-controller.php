<?php
/**
 * REST API Productions Controller
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_Productions_Controller.
 */
class CCP_Productions_Controller extends WP_REST_Controller {

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
	protected $rest_base = 'productions';

	/**
	 * The Productions DB instance.
	 *
	 * @var CCP_Productions_DB
	 */
	private $productions_db;

	/**
	 * CCP_Productions_Controller constructor.
	 */
	public function __construct() {
		$this->productions_db = new CCP_Productions_DB();
	}

	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/by-campaign/(?P<campaign_id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items_by_campaign' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'campaign_id' => array(
							'validate_callback' => function( $param, $request, $key ) {
								return is_numeric( $param );
							},
							'required' => true,
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_items_by_campaign' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => array(
						'campaign_id' => array(
							'validate_callback' => function( $param, $request, $key ) {
								return is_numeric( $param );
							},
							'required' => true,
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_items_by_campaign' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
					'args'                => array(
						'campaign_id' => array(
							'validate_callback' => function( $param, $request, $key ) {
								return is_numeric( $param );
							},
							'required' => true,
						),
					),
				),
			)
		);

		// Batch route for multiple campaigns
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/by-campaigns/batch',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'get_items_by_campaigns_batch' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => array(
						'campaign_ids' => array(
							'validate_callback' => function( $param, $request, $key ) {
								return is_array( $param ) && ! empty( $param );
							},
							'required' => true,
							'sanitize_callback' => function( $param, $request, $key ) {
								return array_map( 'intval', $param );
							},
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
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to view productions.', 'calculadora-costos-pecan' ), array( 'status' => 401 ) );
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
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to create productions.', 'calculadora-costos-pecan' ), array( 'status' => 401 ) );
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
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to delete productions.', 'calculadora-costos-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Retrieve productions for a given campaign.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items_by_campaign( $request ) {
		$user_id     = get_current_user_id();
		$campaign_id = (int) $request['campaign_id'];

		$productions = $this->productions_db->get_summary_by_campaign( $campaign_id, $user_id );

		if ( is_null( $productions ) ) {
			$productions = array();
		}

		$response = rest_ensure_response( $productions );
		return $response;
	}

	/**
	 * Create or update productions for a campaign.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_items_by_campaign( $request ) {
		$user_id     = get_current_user_id();
		$campaign_id = (int) $request['campaign_id'];

		// Get JSON data
		$json_data = $request->get_json_params();

		if ( empty( $json_data['project_id'] ) || empty( $json_data['productions'] ) || empty( $json_data['input_type'] ) ) {
			return new WP_Error( 'missing_data', 'Missing required data: project_id, productions, input_type.', array( 'status' => 400 ) );
		}

		$project_id  = (int) $json_data['project_id'];
		$productions = $json_data['productions'];
		$input_type  = sanitize_text_field( $json_data['input_type'] );

		// Validate input_type
		if ( ! in_array( $input_type, array( 'total', 'detail' ), true ) ) {
			return new WP_Error( 'invalid_input_type', 'Input type must be "total" or "detail".', array( 'status' => 400 ) );
		}

		// Validate productions array
		if ( ! is_array( $productions ) ) {
			return new WP_Error( 'invalid_productions', 'Productions must be an array.', array( 'status' => 400 ) );
		}

		foreach ( $productions as $production ) {
			if ( ! isset( $production['monte_id'] ) || ! isset( $production['quantity_kg'] ) ) {
				return new WP_Error( 'invalid_production_data', 'Each production must have monte_id and quantity_kg.', array( 'status' => 400 ) );
			}
		}

		// Create/update productions
		$result = $this->productions_db->update_batch( $project_id, $campaign_id, $productions, $input_type, $user_id );

		if ( false === $result ) {
			return new WP_Error( 'production_creation_failed', 'Failed to create/update productions.', array( 'status' => 500 ) );
		}

		// Get updated productions
		$updated_productions = $this->productions_db->get_summary_by_campaign( $campaign_id, $user_id );

		$response = rest_ensure_response( array(
			'success'     => true,
			'productions' => $updated_productions,
		) );
		$response->set_status( 201 );

		return $response;
	}

	/**
	 * Delete all productions for a campaign.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_items_by_campaign( $request ) {
		$user_id     = get_current_user_id();
		$campaign_id = (int) $request['campaign_id'];

		$result = $this->productions_db->delete_by_campaign( $campaign_id, $user_id );

		if ( false === $result ) {
			return new WP_Error( 'production_deletion_failed', 'Failed to delete productions.', array( 'status' => 500 ) );
		}

		$response = rest_ensure_response( array( 'success' => true ) );
		return $response;
	}

	/**
		* Retrieve productions for multiple campaigns in batch.
		*
		* @param WP_REST_Request $request Full data about the request.
		* @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
		*/
	public function get_items_by_campaigns_batch( $request ) {
		$user_id      = get_current_user_id();

		// Get JSON data
		$json_data = $request->get_json_params();
		$campaign_ids = isset( $json_data['campaign_ids'] ) ? $json_data['campaign_ids'] : $request['campaign_ids'];

		// campaign_ids is already sanitized by the args validation
		$sanitized_campaign_ids = $campaign_ids;

		$batch_productions = array();

		foreach ( $sanitized_campaign_ids as $campaign_id ) {
			$productions = $this->productions_db->get_summary_by_campaign( $campaign_id, $user_id );
			if ( ! is_null( $productions ) ) {
				$batch_productions[ $campaign_id ] = $productions;
			} else {
				$batch_productions[ $campaign_id ] = array();
			}
		}

		$response = rest_ensure_response( $batch_productions );
		return $response;
	}
}