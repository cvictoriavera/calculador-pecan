<?php
/**
 * REST API Projects Controller
 *
 * @package Calculador_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_Projects_Controller.
 */
class CCP_Projects_Controller extends WP_REST_Controller {

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
	 * The Campaigns DB instance.
	 *
	 * @var CCP_Campaigns_DB
	 */
	private $campaigns_db;

	/**
	 * The Montes DB instance.
	 *
	 * @var CCP_Montes_DB
	 */
	private $montes_db;

	/**
	 * The Annual Records DB instance.
	 *
	 * @var CCP_Annual_Records_DB
	 */
	private $annual_records_db;

	/**
	 * CCP_Projects_Controller constructor.
	 */
	public function __construct() {
		$this->proyectos_db = new CCP_Proyectos_DB();
		$this->campaigns_db = new CCP_Campaigns_DB();
		$this->montes_db = new CCP_Montes_DB();
		$this->annual_records_db = new CCP_Annual_Records_DB();
	}

	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
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
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description' => __( 'Unique identifier for the project.', 'calculador-pecan' ),
							'type'        => 'integer',
						),
					),
				),
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
					'args'                => array(
						'id' => array(
							'description' => __( 'Unique identifier for the project.', 'calculador-pecan' ),
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
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to view projects.', 'calculador-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Retrieve a collection of items.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$user_id  = get_current_user_id();
		$projects = $this->proyectos_db->get_all_by_user( $user_id );

		if ( is_null( $projects ) ) {
			$projects = array();
		}

		$response = rest_ensure_response( $projects );
		return $response;
	}

	/**
	 * Check if a given request has access to get a specific item.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to view projects.', 'calculador-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Retrieve a single item.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$user_id = get_current_user_id();
		$project_id = (int) $request->get_param( 'id' );

		$project = $this->proyectos_db->get_by_id( $project_id, $user_id );

		if ( is_null( $project ) ) {
			return new WP_Error( 'rest_project_invalid_id', __( 'Invalid project ID.', 'calculador-pecan' ), array( 'status' => 404 ) );
		}

		$response = rest_ensure_response( $project );
		return $response;
	}

	/**
		* Check if a given request has access to update an item.
		*
		* @param WP_REST_Request $request Full data about the request.
		* @return bool|WP_Error True if the request has access to update items, WP_Error object otherwise.
		*/
	public function update_item_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to update a project.', 'calculador-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
		* Update one item from the collection.
		*
		* @param WP_REST_Request $request Full data about the request.
		* @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
		*/
	public function update_item( $request ) {
		$user_id = get_current_user_id();
		$project_id = (int) $request->get_param( 'id' );
		$params = $request->get_json_params();

		// Verify ownership
		$existing_project = $this->proyectos_db->get_by_id( $project_id, $user_id );
		if ( is_null( $existing_project ) ) {
			return new WP_Error( 'rest_project_invalid_id', __( 'Invalid project ID or access denied.', 'calculador-pecan' ), array( 'status' => 404 ) );
		}

		// Prepare update data
		$update_data = array();
		if ( isset( $params['project_name'] ) ) {
			$update_data['project_name'] = sanitize_text_field( $params['project_name'] );
		}
		if ( isset( $params['pais'] ) ) {
			$update_data['pais'] = sanitize_text_field( $params['pais'] );
		}
		if ( isset( $params['provincia'] ) ) {
			$update_data['provincia'] = sanitize_text_field( $params['provincia'] );
		}
		if ( isset( $params['departamento'] ) ) {
			$update_data['departamento'] = sanitize_text_field( $params['departamento'] );
		}
		if ( isset( $params['municipio'] ) ) {
			$update_data['municipio'] = sanitize_text_field( $params['municipio'] );
		}
		if ( isset( $params['allow_benchmarking'] ) ) {
			$update_data['allow_benchmarking'] = intval( $params['allow_benchmarking'] );
		}
		if ( isset( $params['description'] ) ) {
			$update_data['description'] = sanitize_textarea_field( $params['description'] );
		}

		if ( empty( $update_data ) ) {
			return new WP_Error( 'rest_no_data', __( 'No valid data provided for update.', 'calculador-pecan' ), array( 'status' => 400 ) );
		}

		// Update the project
		$result = $this->proyectos_db->update( $project_id, $update_data, $user_id );

		if ( ! $result ) {
			return new WP_Error( 'update_failed', __( 'Could not update project.', 'calculador-pecan' ), array( 'status' => 500 ) );
		}

		// Get updated project
		$updated_project = $this->proyectos_db->get_by_id( $project_id, $user_id );

		$response = rest_ensure_response( $updated_project );
		return $response;
	}

	/**
		* Check if a given request has access to delete an item.
		*
		* @param WP_REST_Request $request Full data about the request.
		* @return bool|WP_Error True if the request has access to delete items, WP_Error object otherwise.
		*/
	public function delete_item_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to delete a project.', 'calculador-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
		* Delete one item from the collection.
		*
		* @param WP_REST_Request $request Full data about the request.
		* @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
		*/
	public function delete_item( $request ) {
		$user_id = get_current_user_id();
		$project_id = (int) $request->get_param( 'id' );

		// Verify ownership
		$existing_project = $this->proyectos_db->get_by_id( $project_id, $user_id );
		if ( is_null( $existing_project ) ) {
			return new WP_Error( 'rest_project_invalid_id', __( 'Invalid project ID or access denied.', 'calculador-pecan' ), array( 'status' => 404 ) );
		}

		// Delete the project
		$result = $this->proyectos_db->delete( $project_id, $user_id );

		if ( ! $result ) {
			return new WP_Error( 'delete_failed', __( 'Could not delete project.', 'calculador-pecan' ), array( 'status' => 500 ) );
		}

		return new WP_REST_Response( null, 204 );
	}

	/**
		* Check if a given request has access to create an item.
		*
		* @param WP_REST_Request $request Full data about the request.
		* @return bool|WP_Error True if the request has access to create items, WP_Error object otherwise.
		*/
	public function create_item_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to create a project.', 'calculador-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Create one item from the collection.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		global $wpdb;

		$params = $request->get_json_params();
		$user_id = get_current_user_id();

		// Start transaction
		$wpdb->query('START TRANSACTION');

		try {

			// 1. Create Project
			$project_data = array(
				'user_id' => $user_id,
				'project_name' => sanitize_text_field($params['project_name'] ?? 'Nuevo Proyecto'),
				'description' => sanitize_textarea_field($params['description'] ?? ''),
				'pais' => sanitize_text_field($params['pais'] ?? ''),
				'provincia' => sanitize_text_field($params['provincia'] ?? ''),
				'departamento' => sanitize_text_field($params['departamento'] ?? ''),
				'municipio' => sanitize_text_field($params['municipio'] ?? ''),
				'zona' => sanitize_text_field($params['zona'] ?? ''),
				'allow_benchmarking' => intval($params['allow_benchmarking'] ?? 0),
			);

			$project_id = $this->proyectos_db->create($project_data);

			if (!$project_id) {
				throw new Exception('Could not create project');
			}

			// 2. Create Campaigns (bulk via `campaigns` or legacy `initial_campaign`)
			$campaign_id = null;
			if (isset($params['campaigns']) && is_array($params['campaigns']) && !empty($params['campaigns'])) {
				$years_seen = array();
				$latest_year = null;
				$latest_campaign_id = null;

				foreach ($params['campaigns'] as $campaign_payload) {
					if (!is_array($campaign_payload)) {
						throw new Exception('Invalid campaign payload');
					}

					$campaign_year = intval($campaign_payload['year'] ?? 0);
					if ($campaign_year <= 0) {
						throw new Exception('Invalid campaign year');
					}

					if (in_array($campaign_year, $years_seen, true)) {
						throw new Exception('Duplicate campaign year in payload');
					}
					$years_seen[] = $campaign_year;

					$is_current = !empty($campaign_payload['is_current']) ? 1 : 0;
					$campaign_data = array(
						'project_id' => $project_id,
						'campaign_name' => sanitize_text_field($campaign_payload['campaign_name'] ?? ('Campaña ' . $campaign_year)),
						'year' => $campaign_year,
						'start_date' => sanitize_text_field($campaign_payload['start_date'] ?? ('Julio ' . $campaign_year)),
						'end_date' => isset($campaign_payload['end_date']) ? sanitize_text_field($campaign_payload['end_date']) : null,
						'status' => sanitize_text_field($campaign_payload['status'] ?? ($is_current ? 'open' : 'closed')),
						'is_current' => $is_current,
						'notes' => isset($campaign_payload['notes']) ? sanitize_textarea_field($campaign_payload['notes']) : null,
						'average_price' => isset($campaign_payload['average_price']) ? floatval($campaign_payload['average_price']) : 0.00,
						'total_production' => isset($campaign_payload['total_production']) ? floatval($campaign_payload['total_production']) : 0.00,
					);

					$created_campaign_id = $this->campaigns_db->create($campaign_data, $user_id);
					if (!$created_campaign_id) {
						throw new Exception('Could not create campaign');
					}

					if ($is_current === 1) {
						$campaign_id = $created_campaign_id;
					}

					if (is_null($latest_year) || $campaign_year > $latest_year) {
						$latest_year = $campaign_year;
						$latest_campaign_id = $created_campaign_id;
					}
				}

				if (is_null($campaign_id)) {
					$campaign_id = $latest_campaign_id;
				}
			} elseif (isset($params['initial_campaign'])) {
				$campaign_year = intval($params['initial_campaign']['year'] ?? date('Y'));
				$campaign_data = array(
					'project_id' => $project_id,
					'campaign_name' => 'Campaña ' . $campaign_year,
					'year' => $campaign_year,
					'start_date' => $params['initial_campaign']['start_date'] ?? date('Y-01-01'),
					'end_date' => $params['initial_campaign']['end_date'] ?? date('Y-12-31'),
					'status' => 'open',
					'is_current' => 1,
				);

				$campaign_id = $this->campaigns_db->create($campaign_data, $user_id);

				if (!$campaign_id) {
					throw new Exception('Could not create campaign');
				}
			}

			// 3. Create Montes
			$montes_ids = array();
			if (isset($params['montes']) && is_array($params['montes'])) {
				foreach ($params['montes'] as $monte_data) {
					$monte = array(
						'project_id' => $project_id,
						'campaign_created_id' => $campaign_id,
						'monte_name' => sanitize_text_field($monte_data['name'] ?? 'Monte'),
						'area_hectareas' => floatval($monte_data['area'] ?? 0),
						'plantas_por_hectarea' => intval($monte_data['trees_quantity'] ?? 0),
						'fecha_plantacion' => $monte_data['year_planted'] ? $monte_data['year_planted'] . '-01-01' : date('Y-01-01'),
						'variedad' => sanitize_text_field($monte_data['variety'] ?? ''),
					);

					$monte_id = $this->montes_db->create($monte, $user_id);
					if (!$monte_id) {
						throw new Exception('Could not create monte: ' . $monte['monte_name']);
					}
					$montes_ids[] = $monte_id;
				}
			}

			// 4. Save Initial Investments
			if (isset($params['initial_investments']) && is_array($params['initial_investments'])) {
				foreach ($params['initial_investments'] as $investment) {
					$result = $this->annual_records_db->save_record(
						$project_id,
						$campaign_id,
						'investment',
						sanitize_text_field($investment['category'] ?? 'general'),
						floatval($investment['total_value'] ?? 0),
						wp_json_encode($investment['details'] ?? array()),
						$user_id
					);

					if (!$result) {
						throw new Exception('Could not save investment: ' . $investment['category']);
					}
				}
			}

			// 5. Save superficieTotal as global_config
			if (isset($params['superficieTotal'])) {
				$global_config = array(
					'superficie_total' => floatval($params['superficieTotal']),
					'montes_count' => count($montes_ids),
				);

				$result = $this->annual_records_db->save_record(
					$project_id,
					null, // campaign_id null for global
					'global_config',
					'project_config',
					0, // total_value not used for config
					wp_json_encode($global_config),
					$user_id
				);

				if (!$result) {
					throw new Exception('Could not save project configuration');
				}
			}

			// Commit transaction
			$wpdb->query('COMMIT');

			// Get the complete project data
			$project = $this->proyectos_db->get_by_id($project_id, $user_id);

			$response = rest_ensure_response($project);
			$response->set_status(201);
			$response->header('Location', rest_url(sprintf('%s/%s/%d', $this->namespace, $this->rest_base, $project_id)));

			return $response;

		} catch (Exception $e) {
			// Rollback on error
			$wpdb->query('ROLLBACK');
			return new WP_Error('create-failed', esc_html__('Could not create project.', 'calculador-pecan'), array('status' => 500));
		}
	}
}
