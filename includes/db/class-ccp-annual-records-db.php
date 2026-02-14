<?php
/**
 * Class for managing Annual Records (production, investments, costs) in the database.
 *
 * @package Calculadora_Costos_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Manages all database operations for the Annual Records.
 */
class CCP_Annual_Records_DB {

	/**
	 * The WordPress database object.
	 *
	 * @var wpdb
	 */
	private $wpdb;

	/**
	 * The name of the annual records table.
	 *
	 * @var string
	 */
	private $table_annual_records;

	/**
	 * The name of the projects table.
	 *
	 * @var string
	 */
	private $table_projects;

	/**
	 * CCP_Annual_Records_DB constructor.
	 */
	public function __construct() {
		global $wpdb;
		$this->wpdb                = $wpdb;
		$this->table_annual_records = $wpdb->prefix . 'pecan_annual_records';
		$this->table_projects      = $wpdb->prefix . 'pecan_projects';
	}

	/**
	 * Get all annual records for a specific project.
	 * Required for Export Controller.
	 */
	public function get_all_by_project( $project_id, $user_id ) {
		if ( ! is_numeric( $project_id ) || ! is_numeric( $user_id ) ) {
			return null;
		}

		$project_owner = $this->wpdb->get_var(
			$this->wpdb->prepare( "SELECT user_id FROM {$this->table_projects} WHERE id = %d", $project_id )
		);

		if ( absint( $project_owner ) !== absint( $user_id ) ) {
			return null;
		}

        // CORRECCIÓN: Cambiado 'created_at' por 'id' porque created_at no existe en esta tabla
		$query = $this->wpdb->prepare(
			"SELECT * FROM {$this->table_annual_records} WHERE project_id = %d ORDER BY id DESC",
			absint( $project_id )
		);

		return $this->wpdb->get_results( $query );
	}

	/**
	 * Get all records for a specific campaign.
	 *
	 * @param int $project_id  The ID of the project.
	 * @param int $campaign_id The ID of the campaign.
	 * @param int $user_id     The ID of the user to verify ownership.
	 * @return array|null An array of records or null if none found or not owned by the user.
	 */
	public function get_campaign_records( $project_id, $campaign_id, $user_id ) {
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

		$query = "SELECT * FROM {$this->table_annual_records} WHERE project_id = %d AND campaign_id = %d ORDER BY type, category";

		return $this->wpdb->get_results( $this->wpdb->prepare( $query, absint( $project_id ), absint( $campaign_id ) ) );
	}

	/**
	 * Get records by type for a specific campaign.
	 *
	 * @param int    $project_id  The ID of the project.
	 * @param int    $campaign_id The ID of the campaign.
	 * @param string $type        The type of records ('production', 'investment', 'cost').
	 * @param int    $user_id     The ID of the user to verify ownership.
	 * @return array|null An array of records or null if none found or not owned by the user.
	 */
	public function get_records_by_type( $project_id, $campaign_id, $type, $user_id ) {
		if ( ! is_numeric( $project_id ) || ! is_numeric( $campaign_id ) || ! is_numeric( $user_id ) ||
			 ! in_array( $type, array( 'production', 'investment', 'cost', 'global_config' ) ) ) {
			return null;
		}

		// Verify the user owns the project first.
		$project_owner = $this->wpdb->get_var(
			$this->wpdb->prepare( "SELECT user_id FROM {$this->table_projects} WHERE id = %d", $project_id )
		);

		if ( absint( $project_owner ) !== absint( $user_id ) ) {
			return null; // User does not own the project.
		}

		$query = "SELECT * FROM {$this->table_annual_records} WHERE project_id = %d AND campaign_id = %d AND type = %s ORDER BY category";

		return $this->wpdb->get_results( $this->wpdb->prepare( $query, absint( $project_id ), absint( $campaign_id ), sanitize_text_field( $type ) ) );
	}
	/**
	 * Save (insert or update) an annual record.
	 *
	 * @param int    $project_id  The ID of the project.
	 * @param int    $campaign_id The ID of the campaign.
	 * @param string $type        The type of record ('production', 'investment', 'cost').
	 * @param string $category    The category of the record.
	 * @param float  $total_value The total value for the record.
	 * @param string $details     The JSON string of details.
	 * @param int    $user_id     The ID of the user to verify ownership.
	 * @param int    $monte_id    The ID of the monte (optional, for granular records).
	 * @return int|false The ID of the inserted/updated row, or false on failure.
	 */
	public function save_record( $project_id, $campaign_id, $type, $category, $total_value, $details, $user_id, $monte_id = null ) {
		if ( ! is_numeric( $project_id ) || ! is_numeric( $user_id ) ||
			 ! in_array( $type, array( 'production', 'investment', 'cost', 'global_config' ) ) || empty( $category ) ||
			 ! is_numeric( $total_value ) || ! is_string( $details ) ) {
			return false;
		}

		// For global_config, campaign_id can be null
		if ('global_config' !== $type && ! is_numeric( $campaign_id )) {
			return false;
		}

		// Verify the user owns the project.
		$project_owner = $this->wpdb->get_var(
			$this->wpdb->prepare( "SELECT user_id FROM {$this->table_projects} WHERE id = %d", $project_id )
		);

		if ( absint( $project_owner ) !== absint( $user_id ) ) {
			return false; // User does not own the project.
		}

		// Check if record already exists.
		$query = "SELECT id FROM {$this->table_annual_records} WHERE project_id = %d AND type = %s AND category = %s";
		$params = array( absint( $project_id ), sanitize_text_field( $type ), sanitize_text_field( $category ) );

		if ('global_config' === $type) {
			$query .= " AND campaign_id IS NULL";
		} else {
			$query .= " AND campaign_id = %d";
			$params[] = absint( $campaign_id );
		}

		// Include monte_id in uniqueness check if provided
		if (null !== $monte_id) {
			$query .= " AND monte_id = %d";
			$params[] = absint( $monte_id );
		} else {
			$query .= " AND monte_id IS NULL";
		}

		$existing_record = $this->wpdb->get_row( $this->wpdb->prepare( $query, $params ) );

		$data_to_save = array(
			'project_id'  => absint( $project_id ),
			'monte_id'    => null !== $monte_id ? absint( $monte_id ) : null,
			'type'        => sanitize_text_field( $type ),
			'category'    => sanitize_text_field( $category ),
			'total_value' => floatval( $total_value ),
			'details'     => $details, // JSON string, already validated.
			'updated_at' => current_time( 'mysql', 1 ),
		);

		$format_to_save = array( '%d', '%d', '%s', '%s', '%f', '%s', '%s' );

		if ('global_config' !== $type) {
			$data_to_save['campaign_id'] = absint( $campaign_id );
			$format_to_save[] = '%d';
		} else {
			$data_to_save['campaign_id'] = null;
			$format_to_save[] = null; // For insert, null is fine
		}

		if ( $existing_record ) {
			// Update existing record.
			$where_clause = array(
				'project_id' => absint( $project_id ),
				'type'       => sanitize_text_field( $type ),
				'category'   => sanitize_text_field( $category ),
			);
			$where_format = array( '%d', '%s', '%s' );

			if ('global_config' === $type) {
				$where_clause['campaign_id'] = null;
				$where_format[] = '%s';
			} else {
				$where_clause['campaign_id'] = absint( $campaign_id );
				$where_format[] = '%d';
			}

			if (null !== $monte_id) {
				$where_clause['monte_id'] = absint( $monte_id );
				$where_format[] = '%d';
			} else {
				$where_clause['monte_id'] = null;
				$where_format[] = '%s';
			}

			$result = $this->wpdb->update(
				$this->table_annual_records,
				$data_to_save,
				$where_clause,
				$format_to_save,
				$where_format
			);

			return false !== $result ? $existing_record->id : false;
		} else {
			// Insert new record.
			$insert_data = array(
				'project_id'  => absint( $project_id ),
				'monte_id'    => null !== $monte_id ? absint( $monte_id ) : null,
				'type'        => sanitize_text_field( $type ),
				'category'    => sanitize_text_field( $category ),
				'total_value' => floatval( $total_value ),
				'details'     => $details,
				'updated_at' => current_time( 'mysql', 1 ),
			);

			$insert_format = array( '%d', '%d', '%s', '%s', '%f', '%s', '%s' );

			if ('global_config' === $type) {
				$insert_data['campaign_id'] = null;
				$insert_format[] = '%s';
			} else {
				$insert_data['campaign_id'] = absint( $campaign_id );
				$insert_format[] = '%d';
			}

			$result = $this->wpdb->insert(
				$this->table_annual_records,
				$insert_data,
				$insert_format
			);

			return false !== $result ? $this->wpdb->insert_id : false;
		}
	}

	/**
	 * Delete a specific annual record.
	 *
	 * @param int    $project_id  The ID of the project.
	 * @param int    $campaign_id The ID of the campaign.
	 * @param string $type        The type of record.
	 * @param string $category    The category of the record.
	 * @param int    $user_id     The ID of the user to verify ownership.
	 * @return bool True on success, false on failure.
	 */
	public function delete_record( $project_id, $campaign_id, $type, $category, $user_id ) {
		if ( ! is_numeric( $project_id ) || ! is_numeric( $campaign_id ) || ! is_numeric( $user_id ) ||
			 ! in_array( $type, array( 'production', 'investment', 'cost', 'global_config' ) ) || empty( $category ) ) {
			return false;
		}

		// Verify the user owns the project.
		$project_owner = $this->wpdb->get_var(
			$this->wpdb->prepare( "SELECT user_id FROM {$this->table_projects} WHERE id = %d", $project_id )
		);

		if ( absint( $project_owner ) !== absint( $user_id ) ) {
			return false; // User does not own the project.
		}

		$result = $this->wpdb->delete(
			$this->table_annual_records,
			array(
				'project_id'  => absint( $project_id ),
				'campaign_id' => absint( $campaign_id ),
				'type'        => sanitize_text_field( $type ),
				'category'    => sanitize_text_field( $category ),
			),
			array( '%d', '%d', '%s', '%s' )
		);

		return false !== $result;
	}

	/**
	 * Get aggregated totals for analytics.
	 *
	 * @param int    $project_id  The ID of the project.
	 * @param int    $campaign_id The ID of the campaign (optional).
	 * @param string $type        The type of records to aggregate (optional).
	 * @param int    $user_id     The ID of the user to verify ownership.
	 * @return array|null Aggregated data or null if not owned by the user.
	 */
	public function get_aggregated_totals( $project_id, $campaign_id = null, $type = null, $user_id ) {
		if ( ! is_numeric( $project_id ) || ! is_numeric( $user_id ) ) {
			return null;
		}

		// Verify the user owns the project.
		$project_owner = $this->wpdb->get_var(
			$this->wpdb->prepare( "SELECT user_id FROM {$this->table_projects} WHERE id = %d", $project_id )
		);

		if ( absint( $project_owner ) !== absint( $user_id ) ) {
			return null; // User does not own the project.
		}

		$query = "SELECT type, SUM(total_value) as total FROM {$this->table_annual_records} WHERE project_id = %d";
		$params = array( absint( $project_id ) );

		if ( null !== $campaign_id ) {
			$query .= " AND campaign_id = %d";
			$params[] = absint( $campaign_id );
		}

		if ( null !== $type && in_array( $type, array( 'production', 'investment', 'cost', 'global_config' ) ) ) {
			$query .= " AND type = %s";
			$params[] = sanitize_text_field( $type );
		}

		$query .= " GROUP BY type";

		return $this->wpdb->get_results( $this->wpdb->prepare( $query, $params ) );
	}

	/**
		* Delete all annual records for a specific project.
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
			$this->table_annual_records,
			array( 'project_id' => absint( $project_id ) ),
			array( '%d' )
		);

		return $result !== false;
	}
}