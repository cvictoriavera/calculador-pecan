<?php
/**
 * Class for managing Cost data in the database.
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Manages all database operations for the Costs.
 */
class CCP_Costs_DB {

	/**
	 * The WordPress database object.
	 *
	 * @var wpdb
	 */
	private $wpdb;

	/**
	 * The name of the costs table.
	 *
	 * @var string
	 */
	private $table_costs;

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
	 * CCP_Costs_DB constructor.
	 */
	public function __construct() {
		global $wpdb;
		$this->wpdb           = $wpdb;
		$this->table_costs    = $wpdb->prefix . 'pecan_costs';
		$this->table_projects = $wpdb->prefix . 'pecan_projects';
		$this->table_campaigns = $wpdb->prefix . 'pecan_campaigns';
	}

	/**
	 * Get all costs for a specific project and campaign, verifying user ownership.
	 *
	 * @param int $project_id  The ID of the project.
	 * @param int $campaign_id The ID of the campaign.
	 * @param int $user_id     The ID of the user.
	 * @return array|null An array of cost objects or null if none found or project not owned by user.
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
			"SELECT * FROM {$this->table_costs} WHERE project_id = %d AND campaign_id = %d ORDER BY created_at DESC",
			absint( $project_id ),
			absint( $campaign_id )
		);

		return $this->wpdb->get_results( $query );
	}

	/**
	 * Get a cost by its ID, verifying user ownership.
	 *
	 * @param int $cost_id The ID of the cost.
	 * @param int $user_id The ID of the user.
	 * @return object|null The cost object or null if not found or not owned by user.
	 */
	public function get_by_id( $cost_id, $user_id ) {
		if ( ! is_numeric( $cost_id ) || ! is_numeric( $user_id ) ) {
			return null;
		}

		$query = $this->wpdb->prepare(
			"SELECT c.* FROM {$this->table_costs} c
			 INNER JOIN {$this->table_projects} p ON c.project_id = p.id
			 WHERE c.id = %d AND p.user_id = %d",
			absint( $cost_id ),
			absint( $user_id )
		);

		return $this->wpdb->get_row( $query );
	}

	/**
	 * Create a new cost.
	 *
	 * @param array $data   The data for the new cost.
	 * @param int   $user_id The ID of the current user to verify ownership.
	 * @return int|false The ID of the newly created cost or false on failure.
	 */
	public function create( $data, $user_id ) {
	  if ( empty( $data['project_id'] ) || empty( $data['campaign_id'] ) || empty( $data['category'] ) ) {
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
	    $this->table_costs,
	    array(
	      'project_id'   => absint( $data['project_id'] ),
	      'campaign_id'  => absint( $data['campaign_id'] ),
	      'category'     => sanitize_text_field( $data['category'] ),
	      'total_amount' => isset( $data['total_amount'] ) ? floatval( $data['total_amount'] ) : 0.00,
	      'cost_data'    => isset( $data['details'] ) ? wp_json_encode( $data['details'] ) : null,
	      'created_at'   => current_time( 'mysql', 1 ),
	      'updated_at'   => current_time( 'mysql', 1 ),
	    ),
	    array(
	      '%d', // project_id
	      '%d', // campaign_id
	      '%s', // category
	      '%f', // total_amount
	      '%s', // cost_data
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
	 * Update an existing cost.
	 *
	 * @param int   $cost_id The ID of the cost to update.
	 * @param array $data    The new data for the cost.
	 * @param int   $user_id The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function update( $cost_id, $data, $user_id ) {
		if ( ! is_numeric( $cost_id ) || ! is_numeric( $user_id ) || empty( $data ) ) {
			return false;
		}

		// Verify the user owns the cost.
		$existing_cost = $this->get_by_id( $cost_id, $user_id );
		if ( ! $existing_cost ) {
			return false;
		}

		$update_data = array();
		$update_format = array();

		// Build update data array dynamically.
		if ( isset( $data['category'] ) ) {
			$update_data['category'] = sanitize_text_field( $data['category'] );
			$update_format[] = '%s';
		}

		if ( isset( $data['details'] ) ) {
			$update_data['cost_data'] = wp_json_encode( $data['details'] );
			$update_format[] = '%s';
		}

		if ( isset( $data['total_amount'] ) ) {
			$update_data['total_amount'] = floatval( $data['total_amount'] );
			$update_format[] = '%f';
		}

		// Always update the updated_at timestamp.
		$update_data['updated_at'] = current_time( 'mysql', 1 );
		$update_format[] = '%s';

		if ( empty( $update_data ) ) {
			return false; // Nothing to update.
		}

		$result = $this->wpdb->update(
			$this->table_costs,
			$update_data,
			array( 'id' => absint( $cost_id ) ),
			$update_format,
			array( '%d' )
		);

		return false !== $result;
	}

	/**
	 * Delete a cost.
	 *
	 * @param int $cost_id The ID of the cost to delete.
	 * @param int $user_id The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function delete( $cost_id, $user_id ) {
		if ( ! is_numeric( $cost_id ) || ! is_numeric( $user_id ) ) {
			return false;
		}

		// Verify the user owns the cost.
		$existing_cost = $this->get_by_id( $cost_id, $user_id );
		if ( ! $existing_cost ) {
			return false;
		}

		$result = $this->wpdb->delete(
			$this->table_costs,
			array( 'id' => absint( $cost_id ) ),
			array( '%d' )
		);

		return false !== $result;
	}
}