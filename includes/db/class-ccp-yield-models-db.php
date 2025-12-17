<?php
/**
 * Class for managing Yield Models data in the database.
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Manages all database operations for the Yield Models.
 */
class CCP_Yield_Models_DB {

	/**
	 * The WordPress database object.
	 *
	 * @var wpdb
	 */
	private $wpdb;

	/**
	 * The name of the yield models table.
	 *
	 * @var string
	 */
	private $table_yield_models;

	/**
	 * The name of the projects table.
	 *
	 * @var string
	 */
	private $table_projects;

	/**
	 * CCP_Yield_Models_DB constructor.
	 */
	public function __construct() {
		global $wpdb;
		$this->wpdb              = $wpdb;
		$this->table_yield_models = $wpdb->prefix . 'pecan_yield_models';
		$this->table_projects    = $wpdb->prefix . 'pecan_projects';
	}

	/**
	 * Get all yield models for a specific project, verifying user ownership.
	 *
	 * @param int $project_id The ID of the project.
	 * @param int $user_id    The ID of the user.
	 * @return array|null An array of yield model objects or null if none found or project not owned by user.
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
			"SELECT * FROM {$this->table_yield_models} WHERE project_id = %d ORDER BY created_at DESC",
			absint( $project_id )
		);

		return $this->wpdb->get_results( $query );
	}

	/**
	 * Get a yield model by its ID, verifying user ownership.
	 *
	 * @param int $model_id The ID of the yield model.
	 * @param int $user_id  The ID of the user.
	 * @return object|null The yield model object or null if not found or not owned by user.
	 */
	public function get_by_id( $model_id, $user_id ) {
		if ( ! is_numeric( $model_id ) || ! is_numeric( $user_id ) ) {
			return null;
		}

		$query = $this->wpdb->prepare(
			"SELECT ym.* FROM {$this->table_yield_models} ym
			 INNER JOIN {$this->table_projects} p ON ym.project_id = p.id
			 WHERE ym.id = %d AND p.user_id = %d",
			absint( $model_id ),
			absint( $user_id )
		);

		return $this->wpdb->get_row( $query );
	}

	/**
	 * Get the active yield model for a specific project and variety.
	 *
	 * @param int    $project_id The ID of the project.
	 * @param string $variety    The variety (default 'general').
	 * @param int    $user_id    The ID of the user.
	 * @return object|null The active yield model object or null if not found.
	 */
	public function get_active_by_project_and_variety( $project_id, $variety, $user_id ) {
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
			"SELECT * FROM {$this->table_yield_models} WHERE project_id = %d AND variety = %s AND is_active = 1 ORDER BY updated_at DESC LIMIT 1",
			absint( $project_id ),
			sanitize_text_field( $variety )
		);

		return $this->wpdb->get_row( $query );
	}

	/**
	 * Create a new yield model.
	 *
	 * @param array $data    The data for the new yield model.
	 * @param int   $user_id The ID of the current user to verify ownership.
	 * @return int|false The ID of the newly created yield model or false on failure.
	 */
	public function create( $data, $user_id ) {
		if ( empty( $data['project_id'] ) || empty( $data['model_name'] ) || empty( $data['yield_data'] ) ) {
			return false;
		}

		// Verify the user owns the project.
		$project_owner = $this->wpdb->get_var(
			$this->wpdb->prepare( "SELECT user_id FROM {$this->table_projects} WHERE id = %d", $data['project_id'] )
		);

		if ( absint( $project_owner ) !== absint( $user_id ) ) {
			return false; // User does not own the project.
		}

		$insert_data = array(
			'project_id'  => absint( $data['project_id'] ),
			'variety'     => isset( $data['variety'] ) ? sanitize_text_field( $data['variety'] ) : 'general',
			'model_name'  => sanitize_text_field( $data['model_name'] ),
			'yield_data'  => $data['yield_data'], // JSON data
			'is_active'   => isset( $data['is_active'] ) ? absint( $data['is_active'] ) : 1,
			'created_at'  => current_time( 'mysql', 1 ),
			'updated_at'  => current_time( 'mysql', 1 ),
		);

		$result = $this->wpdb->insert(
			$this->table_yield_models,
			$insert_data,
			array(
				'%d', // project_id
				'%s', // variety
				'%s', // model_name
				'%s', // yield_data
				'%d', // is_active
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
	 * Update an existing yield model.
	 *
	 * @param int   $model_id The ID of the yield model to update.
	 * @param array $data     The new data for the yield model.
	 * @param int   $user_id  The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function update( $model_id, $data, $user_id ) {
		if ( ! is_numeric( $model_id ) || ! is_numeric( $user_id ) || empty( $data ) ) {
			return false;
		}

		// Verify the user owns the yield model.
		$existing_model = $this->get_by_id( $model_id, $user_id );
		if ( ! $existing_model ) {
			return false;
		}

		$update_data = array();
		$update_format = array();

		// Build update data array dynamically.
		if ( isset( $data['model_name'] ) ) {
			$update_data['model_name'] = sanitize_text_field( $data['model_name'] );
			$update_format[] = '%s';
		}

		if ( isset( $data['yield_data'] ) ) {
			$update_data['yield_data'] = $data['yield_data']; // JSON data
			$update_format[] = '%s';
		}

		if ( array_key_exists( 'is_active', $data ) ) {
			$update_data['is_active'] = absint( $data['is_active'] );
			$update_format[] = '%d';
		}

		// Always update the updated_at timestamp.
		$update_data['updated_at'] = current_time( 'mysql', 1 );
		$update_format[] = '%s';

		if ( empty( $update_data ) ) {
			return false; // Nothing to update.
		}

		$result = $this->wpdb->update(
			$this->table_yield_models,
			$update_data,
			array( 'id' => absint( $model_id ) ),
			$update_format,
			array( '%d' )
		);

		return false !== $result;
	}

	/**
	 * Delete a yield model.
	 *
	 * @param int $model_id The ID of the yield model to delete.
	 * @param int $user_id  The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function delete( $model_id, $user_id ) {
		if ( ! is_numeric( $model_id ) || ! is_numeric( $user_id ) ) {
			return false;
		}

		// Verify the user owns the yield model.
		$existing_model = $this->get_by_id( $model_id, $user_id );
		if ( ! $existing_model ) {
			return false;
		}

		$result = $this->wpdb->delete(
			$this->table_yield_models,
			array( 'id' => absint( $model_id ) ),
			array( '%d' )
		);

		return false !== $result;
	}
}