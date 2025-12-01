<?php
/**
 * REST API Annual Records Controller
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_Annual_Records_Controller.
 */
class CCP_Annual_Records_Controller extends WP_REST_Controller {

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
	protected $rest_base = 'annual-records';

	/**
	 * The Annual Records DB instance.
	 *
	 * @var CCP_Annual_Records_DB
	 */
	private $annual_records_db;

	/**
	 * CCP_Annual_Records_Controller constructor.
	 */
	public function __construct() {
		$this->annual_records_db = new CCP_Annual_Records_DB();
	}

	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {
		// Route for getting all records for a campaign
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<project_id>[\d]+)/(?P<campaign_id>[\d]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_campaign_records' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_path_params(),
				),
			)
		);

		// Route for getting records by type for a campaign
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<project_id>[\d]+)/(?P<campaign_id>[\d]+)/(?P<type>[\w]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_records_by_type' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_type_params(),
				),
			)
		);

		// Route for saving a record
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_record' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_save_params(),
				),
			)
		);

		// Route for deleting a record
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<project_id>[\d]+)/(?P<campaign_id>[\d]+)/(?P<type>[\w]+)/(?P<category>[\w\-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_record' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_delete_params(),
				),
			)
		);

		// Route for saving a batch of records
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/batch',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_batch_records' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => $this->get_batch_params(),
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
	 * Retrieve all records for a specific campaign.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_campaign_records( $request ) {
		$user_id     = get_current_user_id();
		$project_id  = (int) $request['project_id'];
		$campaign_id = (int) $request['campaign_id'];

		$all_records = $this->annual_records_db->get_campaign_records( $project_id, $campaign_id, $user_id );

		if ( is_null( $all_records ) ) {
			$all_records = array();
		}

		// Decode JSON details for the response
		foreach ( $all_records as $record ) {
			if ( ! empty( $record->details ) ) {
				$record->details = json_decode( $record->details );
			}
		}

		$response = rest_ensure_response( $all_records );
		return $response;
	}

	/**
	 * Retrieve records by type for a specific campaign.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_records_by_type( $request ) {
		$user_id     = get_current_user_id();
		$project_id  = (int) $request['project_id'];
		$campaign_id = (int) $request['campaign_id'];
		$type        = sanitize_text_field( $request['type'] );

		if ( ! in_array( $type, array( 'production', 'investment', 'cost', 'global_config' ) ) ) {
			return new WP_Error( 'invalid_type', esc_html__( 'Invalid record type.', 'calculadora-costos-pecan' ), array( 'status' => 400 ) );
		}

		$records = $this->annual_records_db->get_records_by_type( $project_id, $campaign_id, $type, $user_id );

		if ( is_null( $records ) ) {
			$records = array();
		}

		// Decode JSON details for the response
		foreach ( $records as $record ) {
			if ( ! empty( $record->details ) ) {
				$record->details = json_decode( $record->details );
			}
		}

		$response = rest_ensure_response( $records );
		return $response;
	}

	/**
	 * Save (insert/update) an annual record.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function save_record( $request ) {
		$user_id     = get_current_user_id();
		$params      = $request->get_json_params();

		$project_id  = isset( $params['project_id'] ) ? (int) $params['project_id'] : 0;
		$campaign_id = isset( $params['campaign_id'] ) ? (int) $params['campaign_id'] : 0;
		$monte_id    = isset( $params['monte_id'] ) ? (int) $params['monte_id'] : null;
		$type        = isset( $params['type'] ) ? sanitize_text_field( $params['type'] ) : '';
		$category    = isset( $params['category'] ) ? sanitize_text_field( $params['category'] ) : '';
		$total_value = isset( $params['total_value'] ) ? floatval( $params['total_value'] ) : 0.0;
		$details     = isset( $params['details'] ) ? wp_json_encode( $params['details'] ) : '';

		if ( empty( $project_id ) || empty( $campaign_id ) || empty( $type ) || empty( $category ) ) {
			return new WP_Error( 'missing-params', esc_html__( 'Missing required parameters.', 'calculadora-costos-pecan' ), array( 'status' => 400 ) );
		}

		if ( ! in_array( $type, array( 'production', 'investment', 'cost', 'global_config' ) ) ) {
			return new WP_Error( 'invalid_type', esc_html__( 'Invalid record type.', 'calculadora-costos-pecan' ), array( 'status' => 400 ) );
		}

		$result = $this->annual_records_db->save_record( $project_id, $campaign_id, $type, $category, $total_value, $details, $user_id, $monte_id );

		if ( false === $result ) {
			return new WP_Error( 'cant-save', esc_html__( 'Could not save the record.', 'calculadora-costos-pecan' ), array( 'status' => 500 ) );
		}

		return rest_ensure_response( array( 'success' => true, 'id' => $result ) );
	}

	/**
	 * Delete an annual record.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_record( $request ) {
		$user_id     = get_current_user_id();
		$project_id  = (int) $request['project_id'];
		$campaign_id = (int) $request['campaign_id'];
		$type        = sanitize_text_field( $request['type'] );
		$category    = sanitize_text_field( $request['category'] );

		if ( ! in_array( $type, array( 'production', 'investment', 'cost', 'global_config' ) ) ) {
			return new WP_Error( 'invalid_type', esc_html__( 'Invalid record type.', 'calculadora-costos-pecan' ), array( 'status' => 400 ) );
		}

		$result = $this->annual_records_db->delete_record( $project_id, $campaign_id, $type, $category, $user_id );

		if ( false === $result ) {
			return new WP_Error( 'cant-delete', esc_html__( 'Could not delete the record.', 'calculadora-costos-pecan' ), array( 'status' => 500 ) );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Get the path parameters for the campaign records endpoint.
	 *
	 * @return array
	 */
	private function get_path_params() {
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
	 * Get the path parameters for the records by type endpoint.
	 *
	 * @return array
	 */
	private function get_type_params() {
		return array(
			'project_id'  => array(
				'validate_callback' => function( $param ) { return is_numeric( $param ); },
				'required'          => true,
			),
			'campaign_id' => array(
				'validate_callback' => function( $param ) { return is_numeric( $param ); },
				'required'          => true,
			),
			'type' => array(
				'validate_callback' => function( $param ) {
					return in_array( $param, array( 'production', 'investment', 'cost', 'global_config' ) );
				},
				'required' => true,
			),
		);
	}

	/**
	 * Get the path parameters for the delete record endpoint.
	 *
	 * @return array
	 */
	private function get_delete_params() {
		return array(
			'project_id'  => array(
				'validate_callback' => function( $param ) { return is_numeric( $param ); },
				'required'          => true,
			),
			'campaign_id' => array(
				'validate_callback' => function( $param ) { return is_numeric( $param ); },
				'required'          => true,
			),
			'type' => array(
				'validate_callback' => function( $param ) {
					return in_array( $param, array( 'production', 'investment', 'cost', 'global_config' ) );
				},
				'required' => true,
			),
			'category' => array(
				'validate_callback' => function( $param ) { return is_string( $param ) && ! empty( $param ); },
				'required'          => true,
			),
		);
	}

	/**
	 * Save a batch of annual records.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function save_batch_records( $request ) {
		global $wpdb;
		$user_id = get_current_user_id();
		$params  = $request->get_json_params();

		$project_id    = isset( $params['project_id'] ) ? (int) $params['project_id'] : 0;
		$campaign_id   = isset( $params['campaign_id'] ) ? (int) $params['campaign_id'] : 0;
		$date_occurred = isset( $params['date_occurred'] ) ? sanitize_text_field( $params['date_occurred'] ) : '';
		$records       = isset( $params['records'] ) ? $params['records'] : array();

		if ( empty( $project_id ) || empty( $campaign_id ) || empty( $records ) || ! is_array( $records ) ) {
			return new WP_Error( 'missing-params', esc_html__( 'Missing required parameters.', 'calculadora-costos-pecan' ), array( 'status' => 400 ) );
		}

		// Start transaction
		$wpdb->query( 'START TRANSACTION' );

		try {
			$saved_ids = array();

			foreach ( $records as $record ) {
				$record_monte_id = isset( $record['monte_id'] ) ? (int) $record['monte_id'] : null;
				$type            = isset( $record['type'] ) ? sanitize_text_field( $record['type'] ) : '';
				$category        = isset( $record['category'] ) ? sanitize_text_field( $record['category'] ) : '';
				$total_value     = isset( $record['total_value'] ) ? floatval( $record['total_value'] ) : 0.0;
				$details         = isset( $record['details'] ) ? wp_json_encode( $record['details'] ) : '';

				if ( empty( $type ) || empty( $category ) ) {
					throw new Exception( 'Invalid record data' );
				}

				if ( ! in_array( $type, array( 'production', 'investment', 'cost', 'global_config' ) ) ) {
					throw new Exception( 'Invalid record type' );
				}

				$result = $this->annual_records_db->save_record( $project_id, $campaign_id, $type, $category, $total_value, $details, $user_id, $record_monte_id );

				if ( false === $result ) {
					throw new Exception( 'Could not save record' );
				}

				$saved_ids[] = $result;
			}

			// Commit transaction
			$wpdb->query( 'COMMIT' );

			return rest_ensure_response( array(
				'success' => true,
				'saved_ids' => $saved_ids,
				'count' => count( $saved_ids )
			) );

		} catch ( Exception $e ) {
			// Rollback on error
			$wpdb->query( 'ROLLBACK' );
			return new WP_Error( 'batch-save-failed', esc_html__( 'Could not save batch records: ' . $e->getMessage(), 'calculadora-costos-pecan' ), array( 'status' => 500 ) );
		}
	}

	/**
	 * Get the body parameters for the save record endpoint.
	 *
	 * @return array
	 */
	private function get_save_params() {
		return array(
			'project_id'  => array( 'type' => 'integer', 'required' => true ),
			'campaign_id' => array( 'type' => 'integer', 'required' => true ),
			'monte_id'    => array( 'type' => 'integer', 'required' => false ),
			'type'        => array(
				'type' => 'string',
				'required' => true,
				'enum' => array( 'production', 'investment', 'cost', 'global_config' )
			),
			'category'    => array( 'type' => 'string', 'required' => true ),
			'total_value' => array( 'type' => 'number', 'required' => false, 'default' => 0.0 ),
			'details'     => array( 'type' => 'object', 'required' => false, 'default' => array() ),
		);
	}

	/**
	 * Get the body parameters for the batch save endpoint.
	 *
	 * @return array
	 */
	private function get_batch_params() {
		return array(
			'project_id'    => array( 'type' => 'integer', 'required' => true ),
			'campaign_id'   => array( 'type' => 'integer', 'required' => true ),
			'date_occurred' => array( 'type' => 'string', 'required' => false ),
			'records'       => array(
				'type'     => 'array',
				'required' => true,
				'items'    => array(
					'type'       => 'object',
					'properties' => array(
						'monte_id'    => array( 'type' => 'integer', 'required' => false ),
						'type'        => array(
							'type' => 'string',
							'required' => true,
							'enum' => array( 'production', 'investment', 'cost', 'global_config' )
						),
						'category'    => array( 'type' => 'string', 'required' => true ),
						'total_value' => array( 'type' => 'number', 'required' => false, 'default' => 0.0 ),
						'details'     => array( 'type' => 'object', 'required' => false, 'default' => array() ),
					),
				),
			),
		);
	}
}
