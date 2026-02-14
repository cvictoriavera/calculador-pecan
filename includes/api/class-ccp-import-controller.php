<?php
/**
 * REST API Import Controller
 *
 * @package Calculador_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_Import_Controller.
 */
class CCP_Import_Controller extends WP_REST_Controller {

	protected $namespace = 'ccp/v1';
	protected $rest_base = 'projects';

	private $proyectos_db;
	private $montes_db;
	private $campaigns_db;
	private $costs_db;
	private $investments_db;
	private $productions_db;
	private $yield_models_db;
	private $annual_records_db;

	public function __construct() {
		$this->proyectos_db      = new CCP_Proyectos_DB();
		$this->montes_db         = new CCP_Montes_DB();
		$this->campaigns_db      = new CCP_Campaigns_DB();
		$this->costs_db          = new CCP_Costs_DB();
		$this->investments_db    = new CCP_Investments_DB();
		$this->productions_db    = new CCP_Productions_DB();
		$this->yield_models_db   = new CCP_Yield_Models_DB();
		$this->annual_records_db = new CCP_Annual_Records_DB();
	}

	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/import',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'import_project' ),
					'permission_callback' => array( $this, 'import_project_permissions_check' ),
					'args'                => array(
						'id'   => array( 'required' => true, 'type' => 'integer' ),
						'data' => array( 'required' => true, 'type' => 'string' ),
					),
				),
			)
		);
	}

	public function import_project_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) return new WP_Error( 'rest_forbidden', 'Login required', array( 'status' => 401 ) );
		$project_id = $request->get_param( 'id' );
		$user_id    = get_current_user_id();
		$project    = $this->proyectos_db->get_by_id( $project_id, $user_id );
		if ( ! $project ) return new WP_Error( 'rest_forbidden', 'Access denied', array( 'status' => 403 ) );
		return true;
	}

	public function import_project( $request ) {
		// Limpiar buffers para evitar contaminación del JSON
		if ( ob_get_level() > 0 ) ob_clean();
		
		$project_id = $request->get_param( 'id' );
		$json_data  = $request->get_param( 'data' );
		$user_id    = get_current_user_id();

		// Arrays para mapear IDs Viejos => IDs Nuevos
		// Esto es CLAVE para que las relaciones (Campaña->Costo) no se rompan
		$id_mapping = array(
			'campaigns' => array(),
			'montes'    => array(),
		);

		try {
			$import_data = json_decode( $json_data, true );
			if ( json_last_error() !== JSON_ERROR_NONE ) {
				throw new Exception( 'Invalid JSON' );
			}

			if ( ! isset( $import_data['project'] ) ) {
				throw new Exception( 'Invalid structure' );
			}

			global $wpdb;
			$wpdb->query( 'START TRANSACTION' );

			// 1. Limpiar datos existentes del proyecto destino
			$this->delete_existing_project_data( $project_id );
			
			// 2. Actualizar datos base del Proyecto
			$this->update_project_data( $project_id, $import_data['project'], $user_id );

			// 3. Importar Campañas (PRIMERO para obtener los nuevos IDs)
			if ( ! empty( $import_data['campaigns'] ) ) {
				$id_mapping['campaigns'] = $this->import_campaigns( $project_id, $import_data['campaigns'], $user_id );
			}

			// 4. Importar Montes (Guardamos el mapeo para usarlo en producciones)
			if ( ! empty( $import_data['montes'] ) ) {
				$id_mapping['montes'] = $this->import_montes( $project_id, $import_data['montes'], $user_id, $id_mapping );
			}

			// 5. Importar Costos (Usando el mapa de campañas traducido)
			if ( ! empty( $import_data['costs'] ) ) {
				$this->import_costs( $project_id, $import_data['costs'], $user_id, $id_mapping );
			}

			// 6. Importar Inversiones
			if ( ! empty( $import_data['investments'] ) ) {
				$this->import_investments( $project_id, $import_data['investments'], $user_id, $id_mapping );
			}

			// 7. Importar Producciones (Requiere mapa de Campañas Y Montes)
			if ( ! empty( $import_data['productions'] ) ) {
				$this->import_productions( $project_id, $import_data['productions'], $user_id, $id_mapping );
			}

			// 8. Importar Yield Models
			if ( ! empty( $import_data['yield_models'] ) ) {
				$this->import_yield_models( $project_id, $import_data['yield_models'], $user_id );
			}

			// 9. Importar Annual Records
			if ( ! empty( $import_data['annual_records'] ) ) {
				$this->import_annual_records( $project_id, $import_data['annual_records'], $user_id, $id_mapping );
			}
			
			$wpdb->query( 'COMMIT' );

			return new WP_REST_Response( array( 'success' => true, 'message' => 'Project imported successfully.' ), 200 );

		} catch ( Exception $e ) {
			global $wpdb;
			$wpdb->query( 'ROLLBACK' );
			error_log( 'Import error: ' . $e->getMessage() );
			return new WP_Error( 'import_error', $e->getMessage(), array( 'status' => 500 ) );
		}
	}

	private function delete_existing_project_data( $project_id ) {
		// Orden inverso de dependencia para borrar
		$this->annual_records_db->delete_by_project( $project_id );
		$this->productions_db->delete_by_project( $project_id );
		$this->costs_db->delete_by_project( $project_id );
		$this->investments_db->delete_by_project( $project_id );
		$this->montes_db->delete_by_project( $project_id );
		$this->campaigns_db->delete_by_project( $project_id );
		$this->yield_models_db->delete_by_project( $project_id );
	}

	private function update_project_data( $project_id, $project_data, $user_id ) {
		$update_data = array(
			'project_name'       => sanitize_text_field( $project_data['project_name'] ?? '' ),
			'description'        => sanitize_textarea_field( $project_data['description'] ?? '' ),
			'pais'               => sanitize_text_field( $project_data['pais'] ?? 'Argentina' ),
			'provincia'          => sanitize_text_field( $project_data['provincia'] ?? '' ),
			'departamento'       => sanitize_text_field( $project_data['departamento'] ?? '' ),
			'municipio'          => sanitize_text_field( $project_data['municipio'] ?? '' ),
			'initial_year'       => intval( $project_data['initial_year'] ?? date( 'Y' ) ),
			'allow_benchmarking' => isset( $project_data['allow_benchmarking'] ) ? (bool) $project_data['allow_benchmarking'] : true,
		);
		$this->proyectos_db->update( $project_id, $update_data, $user_id );
	}

	private function import_campaigns( $project_id, $campaigns_data, $user_id ) {
		$id_map = array();
		
		foreach ( $campaigns_data as $campaign ) {
			$old_id = intval( $campaign['id'] ?? 0 );
			
			$insert_data = array(
				'project_id'     => $project_id, // Forzamos ID del proyecto actual
				'year'           => intval( $campaign['year'] ?? 0 ),
				'campaign_name'  => sanitize_text_field( $campaign['campaign_name'] ?? $campaign['name'] ?? '' ),
				'description'    => sanitize_textarea_field( $campaign['description'] ?? '' ),
				'average_price'  => floatval( $campaign['average_price'] ?? 0 ),
				'start_date'     => sanitize_text_field( $campaign['start_date'] ?? date('Y-m-d') ),
				'status'         => sanitize_text_field( $campaign['status'] ?? 'open' ),
				'is_current'     => intval( $campaign['is_current'] ?? 0 ),
				'notes'          => sanitize_textarea_field( $campaign['notes'] ?? '' ),
			);
			
			$new_id = $this->campaigns_db->create( $insert_data, $user_id );
			if ( $new_id && $old_id ) {
				$id_map[ $old_id ] = $new_id; // Guardamos la relación
			}
		}
		return $id_map;
	}

	private function import_montes( $project_id, $montes_data, $user_id, $id_mapping ) {
		$id_map = array();

		foreach ( $montes_data as $monte ) {
			$old_id = intval( $monte['id'] ?? 0 );
			$old_camp_id = intval( $monte['campaign_created_id'] ?? 0 );
			
			// TRADUCCIÓN: ¿Cuál es el nuevo ID de esta campaña?
			$new_camp_id = isset( $id_mapping['campaigns'][$old_camp_id] ) ? $id_mapping['campaigns'][$old_camp_id] : null;

			$insert_data = array(
				'project_id'           => $project_id,
				'campaign_created_id'  => $new_camp_id,
				'monte_name'           => sanitize_text_field( $monte['monte_name'] ?? '' ),
				'area_hectareas'       => sanitize_text_field( $monte['area_hectareas'] ?? '' ),
				'plantas_por_hectarea' => intval( $monte['plantas_por_hectarea'] ?? 0 ),
				'fecha_plantacion'     => sanitize_text_field( $monte['fecha_plantacion'] ?? '' ),
				'variedad'             => sanitize_text_field( $monte['variedad'] ?? '' ),
				'status'               => sanitize_text_field( $monte['status'] ?? 'active' ),
			);
			
			$new_id = $this->montes_db->create( $insert_data, $user_id );
			if ( $new_id && $old_id ) {
				$id_map[ $old_id ] = $new_id;
			}
		}
		return $id_map;
	}

	private function import_costs( $project_id, $costs_data, $user_id, $id_mapping ) {
		foreach ( $costs_data as $cost ) {
			$old_camp_id = intval( $cost['campaign_id'] ?? 0 );
			
			// Si la campaña no existe en el mapa, es huérfana, la saltamos
			if ( ! isset( $id_mapping['campaigns'][$old_camp_id] ) ) continue;

			// Recuperar detalles (a veces viene como 'cost_data', a veces 'details')
			$details = $cost['cost_data'] ?? $cost['details'] ?? null;
			if ( is_string( $details ) ) {
				$details = json_decode( $details, true );
			}

			$insert_data = array(
				'project_id'   => $project_id,
				'campaign_id'  => $id_mapping['campaigns'][$old_camp_id], // ID Traducido
				'category'     => sanitize_text_field( $cost['category'] ?? '' ),
				'details'      => $details,
				'total_amount' => floatval( $cost['total_amount'] ?? 0 ),
			);
			$this->costs_db->create( $insert_data, $user_id );
		}
	}

	private function import_investments( $project_id, $investments_data, $user_id, $id_mapping ) {
		foreach ( $investments_data as $investment ) {
			$old_camp_id = intval( $investment['campaign_id'] ?? 0 );
			$new_camp_id = isset( $id_mapping['campaigns'][$old_camp_id] ) ? $id_mapping['campaigns'][$old_camp_id] : 0;

			$details = $investment['details'] ?? $investment['data'] ?? null;
             if ( is_string( $details ) ) {
				$details = json_decode( $details, true );
			}

			$insert_data = array(
				'project_id'  => $project_id,
				'campaign_id' => $new_camp_id,
				'category'    => sanitize_text_field( $investment['category'] ?? '' ),
				'description' => sanitize_textarea_field( $investment['description'] ?? '' ),
				'total_value' => floatval( $investment['amount'] ?? $investment['total_value'] ?? 0 ),
				'details'     => $details,
			);
			$this->investments_db->create( $insert_data, $user_id );
		}
	}

	private function import_productions( $project_id, $productions_data, $user_id, $id_mapping ) {
		global $wpdb;
		$table_name = $wpdb->prefix . 'pecan_productions';

		foreach ( $productions_data as $production ) {
			$old_camp_id  = intval( $production['campaign_id'] ?? 0 );
			$old_monte_id = intval( $production['monte_id'] ?? 0 );

			// Si no podemos mapear la campaña o el monte, saltamos
			if ( ! isset( $id_mapping['campaigns'][ $old_camp_id ] ) ) {
				continue;
			}
			if ( ! isset( $id_mapping['montes'][ $old_monte_id ] ) ) {
				continue;
			}

			// OBTENER LOS NUEVOS IDs
			$new_campaign_id = $id_mapping['campaigns'][ $old_camp_id ];
			$new_monte_id    = $id_mapping['montes'][ $old_monte_id ];

			// CORRECCIÓN CRÍTICA: Regenerar el entry_group_id con los NUEVOS IDs
			// El formato debe coincidir con tu sistema: PROD-P{Proyecto}-C{Campaña}
			$new_entry_group_id = 'PROD-P' . $project_id . '-C' . $new_campaign_id;

			$insert_data = array(
				'project_id'     => $project_id,
				'campaign_id'    => $new_campaign_id,
				'monte_id'       => $new_monte_id,
				'entry_group_id' => $new_entry_group_id, // <--- Aquí usamos el nuevo código generado
				'input_type'     => sanitize_text_field( $production['input_type'] ?? 'total' ),
				'quantity_kg'    => floatval( $production['quantity_kg'] ?? 0 ),
				'is_estimated'   => intval( $production['is_estimated'] ?? 0 ),
				'created_at'     => current_time( 'mysql', 1 ),
				'updated_at'     => current_time( 'mysql', 1 ),
			);

			$wpdb->insert( $table_name, $insert_data );
		}
	}

	private function import_yield_models( $project_id, $yield_models_data, $user_id ) {
		foreach ( $yield_models_data as $yield_model ) {
			$insert_data = array(
				'project_id'  => $project_id,
				'variety'     => sanitize_text_field( $yield_model['variety'] ?? 'general' ),
				'model_name'  => sanitize_text_field( $yield_model['model_name'] ?? 'Modelo Importado' ),
				'yield_data'  => $yield_model['yield_data'] ?? $yield_model['parameters'] ?? '[]',
				'is_active'   => intval( $yield_model['is_active'] ?? 1 ),
			);
			$this->yield_models_db->create( $insert_data, $user_id );
		}
	}

	private function import_annual_records( $project_id, $annual_records_data, $user_id, $id_mapping ) {
		foreach ( $annual_records_data as $record ) {
			$old_camp_id = intval( $record['campaign_id'] ?? 0 );
			$new_camp_id = isset( $id_mapping['campaigns'][$old_camp_id] ) ? $id_mapping['campaigns'][$old_camp_id] : 0;

            $old_monte_id = isset($record['monte_id']) ? intval($record['monte_id']) : 0;
            $new_monte_id = ($old_monte_id && isset($id_mapping['montes'][$old_monte_id])) ? $id_mapping['montes'][$old_monte_id] : null;

			$this->annual_records_db->save_record(
				$project_id,
				$new_camp_id,
				sanitize_text_field( $record['type'] ?? $record['data_type'] ?? '' ),
				sanitize_text_field( $record['category'] ?? '' ),
				floatval( $record['total_value'] ?? $record['value'] ?? 0 ),
				is_string($record['details']) ? $record['details'] : json_encode($record['details'] ?? []),
				$user_id,
				$new_monte_id
			);
		}
	}
}