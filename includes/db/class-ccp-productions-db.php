<?php
/**
 * Class for managing Production data in the database.
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Manages all database operations for the Productions.
 */
class CCP_Productions_DB {

	/**
	 * The WordPress database object.
	 *
	 * @var wpdb
	 */
	private $wpdb;

	/**
	 * The name of the productions table.
	 *
	 * @var string
	 */
	private $table_productions;

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
	 * CCP_Productions_DB constructor.
	 */
	public function __construct() {
		global $wpdb;
		$this->wpdb              = $wpdb;
		$this->table_productions = $wpdb->prefix . 'pecan_productions';
		$this->table_projects    = $wpdb->prefix . 'pecan_projects';
		$this->table_campaigns   = $wpdb->prefix . 'pecan_campaigns';
	}

	/**
	 * Generate entry group ID for a production entry.
	 *
	 * @param int $project_id  The project ID.
	 * @param int $campaign_id The campaign ID.
	 * @return string The formatted entry group ID.
	 */
	private function generate_entry_group_id( $project_id, $campaign_id ) {
		return 'PROD-P' . $project_id . '-C' . $campaign_id;
	}

	/**
	 * Get all productions for a specific project.
	 * Required for Export Controller.
	 *
	 * @param int $project_id The ID of the project.
	 * @param int $user_id    The ID of the user.
	 * @return array|null An array of production objects.
	 */
	public function get_all_by_project( $project_id, $user_id ) {
		if ( ! is_numeric( $project_id ) || ! is_numeric( $user_id ) ) {
			return null;
		}

		// Verify project ownership
		$project_owner = $this->wpdb->get_var(
			$this->wpdb->prepare( "SELECT user_id FROM {$this->table_projects} WHERE id = %d", $project_id )
		);

		if ( absint( $project_owner ) !== absint( $user_id ) ) {
			return null;
		}

		$query = $this->wpdb->prepare(
			"SELECT * FROM {$this->table_productions} WHERE project_id = %d ORDER BY created_at DESC",
			absint( $project_id )
		);

		return $this->wpdb->get_results( $query );
	}

	/**
	 * Get all productions for a specific campaign, verifying user ownership.
	 *
	 * @param int $campaign_id The ID of the campaign.
	 * @param int $user_id     The ID of the user.
	 * @return array|null An array of production objects or null if none found or campaign not owned by user.
	 */
	public function get_all_by_campaign( $campaign_id, $user_id ) {
		if ( ! is_numeric( $campaign_id ) || ! is_numeric( $user_id ) ) {
			return null;
		}

		// Verify the user owns the campaign through project ownership.
		$query = $this->wpdb->prepare(
			"SELECT p.* FROM {$this->table_productions} p
			 INNER JOIN {$this->table_campaigns} c ON p.campaign_id = c.id
			 INNER JOIN {$this->table_projects} pr ON c.project_id = pr.id
			 WHERE p.campaign_id = %d AND pr.user_id = %d
			 ORDER BY p.created_at ASC",
			absint( $campaign_id ),
			absint( $user_id )
		);

		return $this->wpdb->get_results( $query );
	}

	/**
	 * Get productions grouped by entry_group_id for a specific campaign.
	 *
	 * @param int $campaign_id The ID of the campaign.
	 * @param int $user_id     The ID of the user.
	 * @return array|null An array of production groups or null if none found or campaign not owned by user.
	 */
	public function get_groups_by_campaign( $campaign_id, $user_id ) {
		if ( ! is_numeric( $campaign_id ) || ! is_numeric( $user_id ) ) {
			return null;
		}

		// Get all productions for the campaign
		$productions = $this->get_all_by_campaign( $campaign_id, $user_id );
		if ( empty( $productions ) ) {
			return array();
		}

		// Group by entry_group_id
		$groups = array();
		foreach ( $productions as $production ) {
			$group_id = $production->entry_group_id;
			if ( ! isset( $groups[ $group_id ] ) ) {
				$groups[ $group_id ] = array(
					'entry_group_id' => $group_id,
					'input_type'     => $production->input_type,
					'created_at'     => $production->created_at,
					'productions'    => array(),
				);
			}
			$groups[ $group_id ]['productions'][] = $production;
		}

		return array_values( $groups );
	}

	/**
	 * Create new production records for a campaign.
	 *
	 * @param int   $project_id  The ID of the project.
	 * @param int   $campaign_id The ID of the campaign.
	 * @param array $productions Array of production data (each with monte_id, quantity_kg, is_estimated).
	 * @param string $input_type The input type ('total' or 'detail').
	 * @param int   $user_id     The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function create_batch( $project_id, $campaign_id, $productions, $input_type, $user_id ) {
		if ( ! is_numeric( $project_id ) || ! is_numeric( $campaign_id ) || ! is_array( $productions ) || ! is_numeric( $user_id ) ) {
			return false;
		}

		// Verify the user owns the project.
		$project_owner = $this->wpdb->get_var(
			$this->wpdb->prepare( "SELECT user_id FROM {$this->table_projects} WHERE id = %d", $project_id )
		);

		if ( absint( $project_owner ) !== absint( $user_id ) ) {
			return false; // User does not own the project.
		}

		$entry_group_id = $this->generate_entry_group_id( $project_id, $campaign_id );
		$success_count  = 0;

		foreach ( $productions as $production ) {
			if ( empty( $production['monte_id'] ) || ! isset( $production['quantity_kg'] ) ) {
				continue;
			}

			$insert_data = array(
				'project_id'     => absint( $project_id ),
				'campaign_id'    => absint( $campaign_id ),
				'monte_id'       => absint( $production['monte_id'] ),
				'entry_group_id' => $entry_group_id,
				'input_type'     => sanitize_text_field( $input_type ),
				'quantity_kg'    => floatval( $production['quantity_kg'] ),
				'is_estimated'   => isset( $production['is_estimated'] ) ? absint( $production['is_estimated'] ) : 0,
				'created_at'     => current_time( 'mysql', 1 ),
				'updated_at'     => current_time( 'mysql', 1 ),
			);

			$result = $this->wpdb->insert(
				$this->table_productions,
				$insert_data,
				array( '%d', '%d', '%d', '%s', '%s', '%f', '%d', '%s', '%s' )
			);

			if ( false !== $result ) {
				$success_count++;
			}
		}

		return $success_count > 0;
	}

	/**
	 * Update production records for a campaign (replace all existing records).
	 *
	 * @param int   $project_id  The ID of the project.
	 * @param int   $campaign_id The ID of the campaign.
	 * @param array $productions Array of production data (each with monte_id, quantity_kg, is_estimated).
	 * @param string $input_type The input type ('total' or 'detail').
	 * @param int   $user_id     The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function update_batch( $project_id, $campaign_id, $productions, $input_type, $user_id ) {
		if ( ! is_numeric( $project_id ) || ! is_numeric( $campaign_id ) || ! is_array( $productions ) || ! is_numeric( $user_id ) ) {
			return false;
		}

		// First delete existing productions for this campaign
		$this->delete_by_campaign( $campaign_id, $user_id );

		// Then create new ones
		return $this->create_batch( $project_id, $campaign_id, $productions, $input_type, $user_id );
	}

	/**
	 * Delete all productions for a specific campaign.
	 *
	 * @param int $campaign_id The ID of the campaign.
	 * @param int $user_id     The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function delete_by_campaign( $campaign_id, $user_id ) {
		if ( ! is_numeric( $campaign_id ) || ! is_numeric( $user_id ) ) {
			return false;
		}

		// Verify the user owns the campaign through project ownership.
		$query = $this->wpdb->prepare(
			"SELECT pr.user_id FROM {$this->table_campaigns} c
			 INNER JOIN {$this->table_projects} pr ON c.project_id = pr.id
			 WHERE c.id = %d AND pr.user_id = %d",
			absint( $campaign_id ),
			absint( $user_id )
		);

		$owner_check = $this->wpdb->get_var( $query );
		if ( ! $owner_check ) {
			return false; // User does not own the campaign.
		}

		$result = $this->wpdb->delete(
			$this->table_productions,
			array( 'campaign_id' => absint( $campaign_id ) ),
			array( '%d' )
		);

		return false !== $result;
	}

	/**
	 * Get production summary for a campaign (total kg by monte).
	 *
	 * @param int $campaign_id The ID of the campaign.
	 * @param int $user_id     The ID of the user.
	 * @return array|null An array with production summary or null if not found or not owned by user.
	 */
	public function get_summary_by_campaign( $campaign_id, $user_id ) {
		if ( ! is_numeric( $campaign_id ) || ! is_numeric( $user_id ) ) {
			return null;
		}

		$query = $this->wpdb->prepare(
			"SELECT p.monte_id, p.quantity_kg, p.input_type, p.entry_group_id, p.is_estimated,
			        m.monte_name, m.area_hectareas
			 FROM {$this->table_productions} p
			 INNER JOIN {$this->table_campaigns} c ON p.campaign_id = c.id
			 INNER JOIN {$this->table_projects} pr ON c.project_id = pr.id
			 LEFT JOIN {$this->wpdb->prefix}pecan_montes m ON p.monte_id = m.id
			 WHERE p.campaign_id = %d AND pr.user_id = %d
			 ORDER BY p.entry_group_id, p.monte_id",
			absint( $campaign_id ),
			absint( $user_id )
		);

		return $this->wpdb->get_results( $query );
	}

	/**
		* Delete all productions for a specific project.
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
			$this->table_productions,
			array( 'project_id' => absint( $project_id ) ),
			array( '%d' )
		);

		return $result !== false;
	}
}