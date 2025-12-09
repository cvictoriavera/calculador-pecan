<?php
/**
 * Class for managing Campaign data in the database.
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Manages all database operations for the Campaigns.
 */
class CCP_Campaigns_DB {

	/**
	 * The WordPress database object.
	 *
	 * @var wpdb
	 */
	private $wpdb;

	/**
	 * The name of the campaigns table.
	 *
	 * @var string
	 */
	private $table_campaigns;

	/**
	 * The name of the projects table.
	 *
	 * @var string
	 */
	private $table_projects;


	/**
	 * CCP_Campaigns_DB constructor.
	 */
	public function __construct() {
		global $wpdb;
		$this->wpdb            = $wpdb;
		$this->table_campaigns = $wpdb->prefix . 'pecan_campaigns';
		$this->table_projects  = $wpdb->prefix . 'pecan_projects';
	}

	/**
	 * Get all campaigns for a specific project, verifying user ownership.
	 *
	 * @param int $project_id The ID of the project.
	 * @param int $user_id    The ID of the user.
	 * @return array|null An array of campaign objects or null if none found or project not owned by user.
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
			"SELECT * FROM {$this->table_campaigns} WHERE project_id = %d ORDER BY year ASC",
			absint( $project_id )
		);

		return $this->wpdb->get_results( $query );
	}

	/**
	 * Get the active campaign for a specific project, verifying user ownership.
	 *
	 * @param int $project_id The ID of the project.
	 * @param int $user_id    The ID of the user.
	 * @return object|null The active campaign object or null if none found or project not owned by user.
	 */
	public function get_active_campaign_by_project( $project_id, $user_id ) {
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
			"SELECT * FROM {$this->table_campaigns} WHERE project_id = %d AND status = 'open'",
			absint( $project_id )
		);

		return $this->wpdb->get_row( $query );
	}

	/**
	 * Get a campaign by its ID, verifying user ownership.
	 *
	 * @param int $campaign_id The ID of the campaign.
	 * @param int $user_id     The ID of the user.
	 * @return object|null The campaign object or null if not found or not owned by user.
	 */
	public function get_by_id( $campaign_id, $user_id ) {
		if ( ! is_numeric( $campaign_id ) || ! is_numeric( $user_id ) ) {
			return null;
		}

		$query = $this->wpdb->prepare(
			"SELECT c.* FROM {$this->table_campaigns} c
			 INNER JOIN {$this->table_projects} p ON c.project_id = p.id
			 WHERE c.id = %d AND p.user_id = %d",
			absint( $campaign_id ),
			absint( $user_id )
		);

		return $this->wpdb->get_row( $query );
	}

	/**
	 * Create a new campaign.
	 *
	 * @param array $data    The data for the new campaign.
	 * @param int   $user_id The ID of the current user to verify ownership.
	 * @return int|false The ID of the newly created campaign or false on failure.
	 */
	public function create( $data, $user_id ) {
		if ( empty( $data['project_id'] ) || empty( $data['campaign_name'] ) || empty( $data['year'] ) || empty( $data['start_date'] ) ) {
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
			$this->table_campaigns,
			array(
				'project_id'      => absint( $data['project_id'] ),
				'campaign_name'   => sanitize_text_field( $data['campaign_name'] ),
				'year'            => absint( $data['year'] ),
				'start_date'      => sanitize_text_field( $data['start_date'] ),
				'end_date'        => isset( $data['end_date'] ) ? sanitize_text_field( $data['end_date'] ) : null,
				'status'          => isset( $data['status'] ) ? sanitize_text_field( $data['status'] ) : 'open',
				'is_current'      => isset( $data['is_current'] ) ? absint( $data['is_current'] ) : 0,
				'notes'           => isset( $data['notes'] ) ? sanitize_textarea_field( $data['notes'] ) : null,
				'average_price'   => isset( $data['average_price'] ) ? floatval( $data['average_price'] ) : 0.00,
				'total_production' => isset( $data['total_production'] ) ? floatval( $data['total_production'] ) : 0.00,
				'created_at'      => current_time( 'mysql', 1 ),
				'updated_at'      => current_time( 'mysql', 1 ),
			),
			array(
				'%d', // project_id
				'%s', // campaign_name
				'%d', // year
				'%s', // start_date
				'%s', // end_date
				'%s', // status
				'%d', // is_current
				'%s', // notes
				'%f', // average_price
				'%f', // total_production
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
	 * Update an existing campaign.
	 *
	 * @param int   $campaign_id The ID of the campaign to update.
	 * @param array $data        The new data for the campaign.
	 * @param int   $user_id     The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function update( $campaign_id, $data, $user_id ) {
		if ( ! is_numeric( $campaign_id ) || ! is_numeric( $user_id ) || empty( $data ) ) {
			return false;
		}

		// Verify the user owns the campaign.
		$existing_campaign = $this->get_by_id( $campaign_id, $user_id );
		if ( ! $existing_campaign ) {
			return false;
		}

		$update_data = array();
		$update_format = array();

		// Build update data array dynamically.
		if ( isset( $data['campaign_name'] ) ) {
			$update_data['campaign_name'] = sanitize_text_field( $data['campaign_name'] );
			$update_format[] = '%s';
		}

		if ( isset( $data['year'] ) ) {
			$update_data['year'] = absint( $data['year'] );
			$update_format[] = '%d';
		}

		if ( isset( $data['start_date'] ) ) {
			$update_data['start_date'] = sanitize_text_field( $data['start_date'] );
			$update_format[] = '%s';
		}

		if ( isset( $data['end_date'] ) ) {
			$update_data['end_date'] = sanitize_text_field( $data['end_date'] );
			$update_format[] = '%s';
		}

		if ( isset( $data['status'] ) ) {
			$update_data['status'] = sanitize_text_field( $data['status'] );
			$update_format[] = '%s';
		}

		if ( isset( $data['is_current'] ) ) {
			$update_data['is_current'] = absint( $data['is_current'] );
			$update_format[] = '%d';
		}

		if ( isset( $data['notes'] ) ) {
			$update_data['notes'] = sanitize_textarea_field( $data['notes'] );
			$update_format[] = '%s';
		}

		if ( isset( $data['average_price'] ) ) {
			$update_data['average_price'] = floatval( $data['average_price'] );
			$update_format[] = '%f';
		}

		if ( isset( $data['total_production'] ) ) {
			$update_data['total_production'] = floatval( $data['total_production'] );
			$update_format[] = '%f';
		}

		// Always update the updated_at timestamp.
		$update_data['updated_at'] = current_time( 'mysql', 1 );
		$update_format[] = '%s';

		if ( empty( $update_data ) ) {
			return false; // Nothing to update.
		}

		$result = $this->wpdb->update(
			$this->table_campaigns,
			$update_data,
			array( 'id' => absint( $campaign_id ) ),
			$update_format,
			array( '%d' )
		);

		return false !== $result;
	}

	/**
	 * Archive a campaign.
	 *
	 * @param int $campaign_id The ID of the campaign to archive.
	 * @param int $user_id     The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function archive( $campaign_id, $user_id ) {
		// Stub: Implementation to be added later.
		return false;
	}

	/**
	 * Restore an archived campaign.
	 *
	 * @param int $campaign_id The ID of the campaign to restore.
	 * @param int $user_id     The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function restore( $campaign_id, $user_id ) {
		// Stub: Implementation to be added later.
		return false;
	}
}
