<?php
/**
 * REST API Users Controller
 *
 * @package Calculador_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_Users_Controller.
 */
class CCP_Users_Controller extends WP_REST_Controller {

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
	protected $rest_base = 'users';

	/**
	 * Register the routes for the objects of the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/me',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_current_user' ),
					'permission_callback' => array( $this, 'get_current_user_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Check if a given request has access to get current user.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_current_user_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', esc_html__( 'You must be logged in to view user data.', 'calculador-pecan' ), array( 'status' => 401 ) );
		}
		return true;
	}

	/**
	 * Retrieve current user data.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_current_user( $request ) {
		$current_user = wp_get_current_user();

		if ( ! $current_user || ! $current_user->ID ) {
			return new WP_Error( 'rest_user_not_found', __( 'User not found.', 'calculador-pecan' ), array( 'status' => 404 ) );
		}

		$user_data = array(
			'id'       => $current_user->ID,
			'name'     => $current_user->display_name,
			'email'    => $current_user->user_email,
			'username' => $current_user->user_login,
			'roles'    => $current_user->roles,
		);

		$response = rest_ensure_response( $user_data );
		return $response;
	}
}