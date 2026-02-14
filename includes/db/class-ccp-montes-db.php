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
		* Get a single monte by its ID, verifying user ownership.
		*
		* @param int $monte_id The ID of the monte.
		* @param int $user_id  The ID of the user.
		* @return object|null A monte object or null if not found or not owned by the user.
		*/
	public function get_by_id( $monte_id, $user_id ) {
		if ( ! is_numeric( $monte_id ) || ! is_numeric( $user_id ) ) {
			return null;
		}

		$query = $this->wpdb->prepare(
			"SELECT m.* FROM {$this->table_montes} m
			 JOIN {$this->table_projects} p ON m.project_id = p.id
			 WHERE m.id = %d AND p.user_id = %d",
			absint( $monte_id ),
			absint( $user_id )
		);

		return $this->wpdb->get_row( $query );
	}

	/**
	 * Create a new monte.
	 *
	 * @param array $data    The data for the new monte. It must contain project_id, campaign_created_id, etc.
	 * @param int   $user_id The ID of the current user to verify ownership.
	 * @return int|false The ID of the newly created monte or false on failure.
	 */
	public function create( $data, $user_id ) {
		if ( empty( $data['project_id'] ) || empty( $data['monte_name'] ) ) {
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
				'project_id'           => absint( $data['project_id'] ),
				'campaign_created_id'  => isset( $data['campaign_created_id'] ) ? absint( $data['campaign_created_id'] ) : null,
				'monte_name'           => sanitize_text_field( $data['monte_name'] ),
				'area_hectareas'       => (float) $data['area_hectareas'],
				'plantas_por_hectarea' => absint( $data['plantas_por_hectarea'] ),
				'fecha_plantacion'     => $data['fecha_plantacion'] ?? null,
				'variedad'             => sanitize_text_field( $data['variedad'] ?? '' ),
				'status'               => 'active',
				'created_at'           => current_time( 'mysql', 1 ),
				'updated_at'           => current_time( 'mysql', 1 ),
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
		if ( ! is_numeric( $monte_id ) || empty( $data ) || ! is_numeric( $user_id ) ) {
			return false;
		}

		// Verify the user owns the monte's project.
		$project_owner = $this->wpdb->get_var(
			$this->wpdb->prepare(
				"SELECT p.user_id FROM {$this->table_projects} p
				 JOIN {$this->table_montes} m ON p.id = m.project_id
				 WHERE m.id = %d",
				$monte_id
			)
		);

		if ( absint( $project_owner ) !== absint( $user_id ) ) {
			return false; // User does not own the project.
		}

		$update_data = array();
		$update_format = array();

		if ( isset( $data['monte_name'] ) ) {
			$update_data['monte_name'] = sanitize_text_field( $data['monte_name'] );
			$update_format[] = '%s';
		}

		if ( isset( $data['area_hectareas'] ) ) {
			$update_data['area_hectareas'] = (float) $data['area_hectareas'];
			$update_format[] = '%f';
		}

		if ( isset( $data['plantas_por_hectarea'] ) ) {
			$update_data['plantas_por_hectarea'] = absint( $data['plantas_por_hectarea'] );
			$update_format[] = '%d';
		}

		if ( isset( $data['fecha_plantacion'] ) ) {
			$update_data['fecha_plantacion'] = $data['fecha_plantacion'];
			$update_format[] = '%s';
		}

		if ( isset( $data['variedad'] ) ) {
			$update_data['variedad'] = sanitize_text_field( $data['variedad'] );
			$update_format[] = '%s';
		}

		if ( isset( $data['status'] ) ) {
			$update_data['status'] = sanitize_text_field( $data['status'] );
			$update_format[] = '%s';
		}

		$update_data['updated_at'] = current_time( 'mysql', 1 );
		$update_format[] = '%s';

		if ( empty( $update_data ) ) {
			return false; // Nothing to update.
		}

		$result = $this->wpdb->update(
			$this->table_montes,
			$update_data,
			array( 'id' => absint( $monte_id ) ),
			$update_format,
			array( '%d' )
		);

		return $result !== false;
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
		if ( ! is_numeric( $monte_id ) || ! is_numeric( $user_id ) ) {
			return false;
		}

		// Verify the user owns the monte's project.
		$project_owner = $this->wpdb->get_var(
			$this->wpdb->prepare(
				"SELECT p.user_id FROM {$this->table_projects} p
				 JOIN {$this->table_montes} m ON p.id = m.project_id
				 WHERE m.id = %d",
				$monte_id
			)
		);

		if ( absint( $project_owner ) !== absint( $user_id ) ) {
			return false; // User does not own the project.
		}

		$result = $this->wpdb->delete(
			$this->table_montes,
			array( 'id' => absint( $monte_id ) ),
			array( '%d' )
		);

		return $result !== false;
	}

	/**
		* Delete all montes for a specific project.
		* Used during project import to clear existing data.
		*
		* @param int $project_id The ID of the project.
		* @return bool True on success, false on failure.
		*/
	public function delete_by_project( $project_id ) {
		if ( ! is_numeric( $project_id ) ) {
			return false;
		}

		$result = $this->wpdb->delete(
			$this->table_montes,
			array( 'project_id' => absint( $project_id ) ),
			array( '%d' )
		);

		return $result !== false;
	}
}
