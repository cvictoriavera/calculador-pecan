<?php
/**
 * Class for managing Project data in the database.
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Manages all database operations for the Projects.
 */
class CCP_Proyectos_DB {

	/**
	 * The WordPress database object.
	 *
	 * @var wpdb
	 */
	private $wpdb;

	/**
	 * The name of the projects table.
	 *
	 * @var string
	 */
	private $table_name;

	/**
	 * CCP_Proyectos_DB constructor.
	 */
	public function __construct() {
		global $wpdb;
		$this->wpdb       = $wpdb;
		$this->table_name = $wpdb->prefix . 'pecan_projects';
	}

	/**
	 * Get all projects for a specific user.
	 *
	 * @param int $user_id The ID of the user.
	 * @return array|null An array of project objects or null if none found.
	 */
	public function get_all_by_user( $user_id ) {
		if ( ! is_numeric( $user_id ) ) {
			return null;
		}

		$query = $this->wpdb->prepare(
			"SELECT * FROM {$this->table_name} WHERE user_id = %d ORDER BY created_at DESC",
			absint( $user_id )
		);

		return $this->wpdb->get_results( $query );
	}

	/**
	 * Get a single project by its ID.
	 *
	 * @param int $project_id The ID of the project.
	 * @param int $user_id    The ID of the user to verify ownership.
	 * @return object|null A project object or null if not found or not owned by the user.
	 */
	public function get_by_id( $project_id, $user_id ) {
		if ( ! is_numeric( $project_id ) || ! is_numeric( $user_id ) ) {
			return null;
		}

		$query = $this->wpdb->prepare(
			"SELECT * FROM {$this->table_name} WHERE id = %d AND user_id = %d",
			absint( $project_id ),
			absint( $user_id )
		);

		return $this->wpdb->get_row( $query );
	}

	/**
	 * Create a new project.
	 *
	 * @param array $data The data for the new project.
	 * @return int|false The ID of the newly created project or false on failure.
	 */
	public function create( $data ) {
		$user_id = isset( $data['user_id'] ) ? absint( $data['user_id'] ) : get_current_user_id();
		if ( ! $user_id ) {
			return false;
		}

		$project_name = isset( $data['project_name'] ) ? sanitize_text_field( $data['project_name'] ) : 'Nuevo Proyecto';
		$description  = isset( $data['description'] ) ? sanitize_textarea_field( $data['description'] ) : '';
		$pais         = isset( $data['pais'] ) ? sanitize_text_field( $data['pais'] ) : '';
		$region       = isset( $data['region'] ) ? sanitize_text_field( $data['region'] ) : '';

		$result = $this->wpdb->insert(
			$this->table_name,
			array(
				'user_id'      => $user_id,
				'project_name' => $project_name,
				'description'  => $description,
				'pais'         => $pais,
				'region'       => $region,
				'status'       => 'active',
				'created_at'   => current_time( 'mysql', 1 ),
				'updated_at'   => current_time( 'mysql', 1 ),
			),
			array(
				'%d', // user_id
				'%s', // project_name
				'%s', // description
				'%s', // pais
				'%s', // region
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
	 * Update an existing project.
	 *
	 * @param int   $project_id The ID of the project to update.
	 * @param array $data       The new data for the project.
	 * @param int   $user_id    The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function update( $project_id, $data, $user_id ) {
		if ( ! is_numeric( $project_id ) || ! is_numeric( $user_id ) || empty( $data ) ) {
			return false;
		}

		// Verify ownership
		$existing = $this->get_by_id( $project_id, $user_id );
		if ( null === $existing ) {
			return false;
		}

		// Prepare update data
		$update_data = array();
		$format = array();

		if ( isset( $data['project_name'] ) ) {
			$update_data['project_name'] = sanitize_text_field( $data['project_name'] );
			$format[] = '%s';
		}
		if ( isset( $data['description'] ) ) {
			$update_data['description'] = sanitize_textarea_field( $data['description'] );
			$format[] = '%s';
		}
		if ( isset( $data['pais'] ) ) {
			$update_data['pais'] = sanitize_text_field( $data['pais'] );
			$format[] = '%s';
		}
		if ( isset( $data['region'] ) ) {
			$update_data['region'] = sanitize_text_field( $data['region'] );
			$format[] = '%s';
		}
		if ( isset( $data['status'] ) ) {
			$update_data['status'] = sanitize_text_field( $data['status'] );
			$format[] = '%s';
		}

		if ( empty( $update_data ) ) {
			return false;
		}

		// Add updated_at
		$update_data['updated_at'] = current_time( 'mysql', 1 );
		$format[] = '%s';

		$where = array(
			'id'      => absint( $project_id ),
			'user_id' => absint( $user_id ),
		);
		$where_format = array( '%d', '%d' );

		$result = $this->wpdb->update(
			$this->table_name,
			$update_data,
			$where,
			$format,
			$where_format
		);

		return $result !== false;
	}

	/**
	 * Delete a project.
	 *
	 * @param int $project_id The ID of the project to delete.
	 * @param int $user_id    The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function delete( $project_id, $user_id ) {
		// Stub: Implementation to be added later.
		return false;
	}

	/**
	 * Change the status of a project (e.g., 'active', 'archived').
	 *
	 * @param int    $project_id The ID of the project.
	 * @param string $status     The new status.
	 * @param int    $user_id    The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function change_status( $project_id, $status, $user_id ) {
		// Stub: Implementation to be added later.
		return false;
	}
}
