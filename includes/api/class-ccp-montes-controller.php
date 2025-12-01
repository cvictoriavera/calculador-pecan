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
	}

	/**
	 * Check if a given request has access to get items.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to view montes.', 'calculadora-costos-pecan' ), array( 'status' => 401 ) );
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
}
