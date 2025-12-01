<?php
/**
 * Class for managing Monte data in the database.
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Manages all database operations for the Montes.
 */
class CCP_Montes_DB {

	/**
	 * The WordPress database object.
	 *
	 * @var wpdb
	 */
	private $wpdb;

	/**
	 * The name of the montes table.
	 *
	 * @var string
	 */
	private $table_montes;

	/**
	 * The name of the projects table.
	 *
	 * @var string
	 */
	private $table_projects;


	/**
	 * CCP_Montes_DB constructor.
	 */
	public function __construct() {
		global $wpdb;
		$this->wpdb           = $wpdb;
		$this->table_montes   = $wpdb->prefix . 'pecan_montes';
		$this->table_projects = $wpdb->prefix . 'pecan_projects';
	}

	/**
	 * Get all montes for a specific project, verifying user ownership.
	 *
	 * @param int $project_id The ID of the project.
	 * @param int $user_id    The ID of the user.
	 * @return array|null An array of monte objects or null if none found or project not owned by user.
	 */
	public function get_all_by_project( $project_id, $user_id ) {
		if ( ! is_numeric( $project_id ) || ! is_numeric( $user_id ) ) {
			return null;
		}

		// Verify the user owns the project first.
		$project_owner = $this->wpdb->get_var(
			$this->wpdb->prepare( "SELECT user_id FROM {$this->table_projects} WHERE id = %d", $project_id )
		);

		if ( absint( $project_owner ) !== absint( $user_id ) ) {
			return null; // User does not own the project.
		}

		$query = $this->wpdb->prepare(
			"SELECT * FROM {$this->table_montes} WHERE project_id = %d ORDER BY created_at ASC",
			absint( $project_id )
		);

		return $this->wpdb->get_results( $query );
	}

	/**
	 * Create a new monte.
	 *
	 * @param array $data    The data for the new monte. It must contain project_id, campaign_created_id, etc.
	 * @param int   $user_id The ID of the current user to verify ownership.
	 * @return int|false The ID of the newly created monte or false on failure.
	 */
	public function create( $data, $user_id ) {
		if ( empty( $data['project_id'] ) || empty( $data['campaign_created_id'] ) || empty( $data['monte_name'] ) ) {
			return false;
		}

		// Verify the user owns the project.
		$project_owner = $this->wpdb->get_var(
			$this->wpdb->prepare( "SELECT user_id FROM {$this->table_projects} WHERE id = %d", $data['project_id'] )
		);

		if ( absint( $project_owner ) !== absint( $user_id ) ) {
			return false; // User does not own the project.
		}

		$result = $this->wpdb->insert(
			$this->table_montes,
			array(
				'project_id'            => absint( $data['project_id'] ),
				'campaign_created_id'   => absint( $data['campaign_created_id'] ),
				'monte_name'            => sanitize_text_field( $data['monte_name'] ),
				'area_hectareas'        => (float) $data['area_hectareas'],
				'plantas_por_hectarea'  => absint( $data['plantas_por_hectarea'] ),
				'fecha_plantacion'      => $data['fecha_plantacion'] ?? null,
				'variedad'              => sanitize_text_field( $data['variedad'] ?? '' ),
				'status'                => 'active',
				'created_at'            => current_time( 'mysql', 1 ),
				'updated_at'            => current_time( 'mysql', 1 ),
			),
			array(
				'%d', // project_id
				'%d', // campaign_created_id
				'%s', // monte_name
				'%f', // area_hectareas
				'%d', // plantas_por_hectarea
				'%s', // fecha_plantacion
				'%s', // variedad
				'%s', // status
				'%s', // created_at
				'%s', // updated_at
			)
		);

		if ( false === $result ) {
			return false;
		}

		return $this->wpdb->insert_id;
	}

	/**
	 * Update an existing monte.
	 *
	 * @param int   $monte_id The ID of the monte to update.
	 * @param array $data     The new data for the monte.
	 * @param int   $user_id  The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function update( $monte_id, $data, $user_id ) {
		// Stub: Implementation to be added later.
		return false;
	}

	/**
	 * Retire a monte, making it inactive from a certain campaign onwards.
	 *
	 * @param int $monte_id            The ID of the monte to retire.
	 * @param int $campaign_retired_id The campaign ID from which the monte is considered retired.
	 * @param int $user_id             The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function retire( $monte_id, $campaign_retired_id, $user_id ) {
		// Stub: Implementation to be added later.
		return false;
	}

	/**
	 * Permanently delete a monte. This is a destructive action.
	 *
	 * @param int $monte_id The ID of the monte to delete.
	 * @param int $user_id  The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function delete_permanent( $monte_id, $user_id ) {
		// Stub: Implementation to be added later.
		return false;
	}
}
