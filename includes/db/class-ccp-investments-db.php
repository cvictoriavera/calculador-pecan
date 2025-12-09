<?php
/**
 * Class for managing Investment data in the database.
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Manages all database operations for the Investments.
 */
class CCP_Investments_DB {

	/**
	 * The WordPress database object.
	 *
	 * @var wpdb
	 */
	private $wpdb;

	/**
	 * The name of the investments table.
	 *
	 * @var string
	 */
	private $table_investments;

	/**
	 * The name of the projects table.
	 *
	 * @var string
	 */
	private $table_projects;

	/**
	 * The name of the campaigns table.
	 *
	 * @var string
	 */
	private $table_campaigns;

	/**
	 * CCP_Investments_DB constructor.
	 */
	public function __construct() {
		global $wpdb;
		$this->wpdb              = $wpdb;
		$this->table_investments = $wpdb->prefix . 'pecan_investments';
		$this->table_projects    = $wpdb->prefix . 'pecan_projects';
		$this->table_campaigns   = $wpdb->prefix . 'pecan_campaigns';
	}

	/**
	 * Get all investments for a specific project, verifying user ownership.
	 *
	 * @param int $project_id The ID of the project.
	 * @param int $user_id    The ID of the user.
	 * @return array|null An array of investment objects or null if none found or project not owned by user.
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
			"SELECT * FROM {$this->table_investments} WHERE project_id = %d ORDER BY created_at DESC",
			absint( $project_id )
		);

		return $this->wpdb->get_results( $query );
	}

	/**
	 * Get investments by campaign for a specific project, verifying user ownership.
	 *
	 * @param int $project_id  The ID of the project.
	 * @param int $campaign_id The ID of the campaign.
	 * @param int $user_id     The ID of the user.
	 * @return array|null An array of investment objects or null if none found or project not owned by user.
	 */
	public function get_by_campaign( $project_id, $campaign_id, $user_id ) {
		if ( ! is_numeric( $project_id ) || ! is_numeric( $campaign_id ) || ! is_numeric( $user_id ) ) {
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
			"SELECT * FROM {$this->table_investments} WHERE project_id = %d AND campaign_id = %d ORDER BY created_at DESC",
			absint( $project_id ),
			absint( $campaign_id )
		);

		return $this->wpdb->get_results( $query );
	}

	/**
	 * Get an investment by its ID, verifying user ownership.
	 *
	 * @param int $investment_id The ID of the investment.
	 * @param int $user_id       The ID of the user.
	 * @return object|null The investment object or null if not found or not owned by user.
	 */
	public function get_by_id( $investment_id, $user_id ) {
		if ( ! is_numeric( $investment_id ) || ! is_numeric( $user_id ) ) {
			return null;
		}

		$query = $this->wpdb->prepare(
			"SELECT i.* FROM {$this->table_investments} i
			 INNER JOIN {$this->table_projects} p ON i.project_id = p.id
			 WHERE i.id = %d AND p.user_id = %d",
			absint( $investment_id ),
			absint( $user_id )
		);

		return $this->wpdb->get_row( $query );
	}

	/**
	 * Create a new investment.
	 *
	 * @param array $data    The data for the new investment.
	 * @param int   $user_id The ID of the current user to verify ownership.
	 * @return int|false The ID of the newly created investment or false on failure.
	 */
	public function create( $data, $user_id ) {
		if ( empty( $data['project_id'] ) || empty( $data['category'] ) || empty( $data['description'] ) ) {
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
			$this->table_investments,
			array(
				'project_id'  => absint( $data['project_id'] ),
				'campaign_id' => isset( $data['campaign_id'] ) ? absint( $data['campaign_id'] ) : null,
				'category'    => sanitize_text_field( $data['category'] ),
				'description' => sanitize_text_field( $data['description'] ),
				'total_value' => isset( $data['total_value'] ) ? floatval( $data['total_value'] ) : 0.00,
				'details'     => isset( $data['details'] ) ? wp_json_encode( $data['details'] ) : null,
				'created_at'  => current_time( 'mysql', 1 ),
				'updated_at'  => current_time( 'mysql', 1 ),
			),
			array(
				'%d', // project_id
				'%d', // campaign_id
				'%s', // category
				'%s', // description
				'%f', // total_value
				'%s', // details
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
	 * Update an existing investment.
	 *
	 * @param int   $investment_id The ID of the investment to update.
	 * @param array $data          The new data for the investment.
	 * @param int   $user_id       The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function update( $investment_id, $data, $user_id ) {
		if ( ! is_numeric( $investment_id ) || ! is_numeric( $user_id ) || empty( $data ) ) {
			return false;
		}

		// Verify the user owns the investment.
		$existing_investment = $this->get_by_id( $investment_id, $user_id );
		if ( ! $existing_investment ) {
			return false;
		}

		$update_data = array();
		$update_format = array();

		// Build update data array dynamically.
		if ( isset( $data['category'] ) ) {
			$update_data['category'] = sanitize_text_field( $data['category'] );
			$update_format[] = '%s';
		}

		if ( isset( $data['description'] ) ) {
			$update_data['description'] = sanitize_text_field( $data['description'] );
			$update_format[] = '%s';
		}

		if ( isset( $data['total_value'] ) ) {
			$update_data['total_value'] = floatval( $data['total_value'] );
			$update_format[] = '%f';
		}

		if ( isset( $data['details'] ) ) {
			$update_data['details'] = wp_json_encode( $data['details'] );
			$update_format[] = '%s';
		}

		// Always update the updated_at timestamp.
		$update_data['updated_at'] = current_time( 'mysql', 1 );
		$update_format[] = '%s';

		if ( empty( $update_data ) ) {
			return false; // Nothing to update.
		}

		$result = $this->wpdb->update(
			$this->table_investments,
			$update_data,
			array( 'id' => absint( $investment_id ) ),
			$update_format,
			array( '%d' )
		);

		return false !== $result;
	}

	/**
	 * Delete an investment.
	 *
	 * @param int $investment_id The ID of the investment to delete.
	 * @param int $user_id       The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function delete( $investment_id, $user_id ) {
		if ( ! is_numeric( $investment_id ) || ! is_numeric( $user_id ) ) {
			return false;
		}

		// Verify the user owns the investment.
		$existing_investment = $this->get_by_id( $investment_id, $user_id );
		if ( ! $existing_investment ) {
			return false;
		}

		$result = $this->wpdb->delete(
			$this->table_investments,
			array( 'id' => absint( $investment_id ) ),
			array( '%d' )
		);

		return false !== $result;
	}
}