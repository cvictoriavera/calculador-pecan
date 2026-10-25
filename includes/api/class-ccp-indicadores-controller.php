<?php
/**
 * REST API Indicadores Controller (Admin Only)
 *
 * Agrega y consolida datos reales de la base de datos para benchmarking multianual por cohorte etaria.
 *
 * @package Calculador_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CCP_Indicadores_Controller.
 */
class CCP_Indicadores_Controller extends WP_REST_Controller {

	/**
	 * Namespace del controller.
	 *
	 * @var string
	 */
	protected $namespace = 'ccp/v1';

	/**
	 * Base del controller.
	 *
	 * @var string
	 */
	protected $rest_base = 'admin/indicadores';

	/**
	 * Registrar rutas REST.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_indicadores' ),
					'permission_callback' => array( $this, 'check_admin_permissions' ),
					'args'                => array(
						'min_age' => array(
							'type'              => 'integer',
							'default'           => 9,
							'sanitize_callback' => 'absint',
						),
						'max_age' => array(
							'type'              => 'integer',
							'default'           => 11,
							'sanitize_callback' => 'absint',
						),
					),
				),
			)
		);
	}

	/**
	 * Permisos: solo administradores pueden acceder a datos consolidados de todos los usuarios.
	 */
	public function check_admin_permissions( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_forbidden', 'Debes iniciar sesión para acceder a estos datos.', array( 'status' => 401 ) );
		}

		$current_user = wp_get_current_user();
		$is_admin = current_user_can( 'manage_options' ) || in_array( 'administrator', (array) ( $current_user->roles ?? array() ), true );

		if ( ! $is_admin ) {
			return new WP_Error( 'rest_forbidden', 'Acceso denegado. Se requieren permisos de administrador.', array( 'status' => 403 ) );
		}

		return true;
	}

	/**
	 * Obtener indicadores agregados por productor según rango etario biológico.
	 */
	public function get_indicadores( $request ) {
		global $wpdb;

		$min_age = (int) $request->get_param( 'min_age' );
		$max_age = (int) $request->get_param( 'max_age' );

		if ( $min_age <= 0 ) {
			$min_age = 1;
		}
		if ( $max_age < $min_age ) {
			$max_age = $min_age;
		}

		$table_projects    = $wpdb->prefix . 'pecan_projects';
		$table_users       = $wpdb->prefix . 'users';
		$table_montes      = $wpdb->prefix . 'pecan_montes';
		$table_campaigns   = $wpdb->prefix . 'pecan_campaigns';
		$table_productions = $wpdb->prefix . 'pecan_productions';
		$table_costs       = $wpdb->prefix . 'pecan_costs';

		// Obtener todos los proyectos activos con benchmarking habilitado (allow_benchmarking != 0)
		$projects = $wpdb->get_results( "
			SELECT 
				p.id AS project_id, 
				p.user_id, 
				p.project_name, 
				p.provincia, 
				p.allow_benchmarking,
				u.display_name, 
				u.user_login
			FROM {$table_projects} p
			JOIN {$table_users} u ON p.user_id = u.ID
			WHERE p.status = 'active'
			  AND p.allow_benchmarking != 0
			  AND p.allow_benchmarking IS NOT NULL
			ORDER BY p.id ASC
		" );

		if ( empty( $projects ) ) {
			return rest_ensure_response( array(
				'min_age'    => $min_age,
				'max_age'    => $max_age,
				'producers'  => array(),
			) );
		}

		$producers_output = array();

		foreach ( $projects as $proj ) {
			// Excluir proyectos con benchmarking desactivado (0)
			if ( isset( $proj->allow_benchmarking ) && (int) $proj->allow_benchmarking === 0 ) {
				continue;
			}

			$p_id = (int) $proj->project_id;

			// Montes activos del proyecto
			$montes = $wpdb->get_results( $wpdb->prepare( "
				SELECT id, monte_name, area_hectareas, fecha_plantacion 
				FROM {$table_montes} 
				WHERE project_id = %d AND status = 'active'
			", $p_id ) );

			if ( empty( $montes ) ) {
				continue;
			}

			// Mapear años de plantación de los montes
			$montes_by_id = array();
			foreach ( $montes as $m ) {
				$plant_year = 0;
				if ( ! empty( $m->fecha_plantacion ) ) {
					$plant_year = (int) substr( $m->fecha_plantacion, 0, 4 );
				}
				$montes_by_id[ (int) $m->id ] = array(
					'id'         => (int) $m->id,
					'name'       => $m->monte_name,
					'has'        => (float) $m->area_hectareas,
					'plant_year' => $plant_year,
				);
			}

			// Campañas del proyecto
			$campaigns = $wpdb->get_results( $wpdb->prepare( "
				SELECT id, year, status, total_production 
				FROM {$table_campaigns} 
				WHERE project_id = %d 
				ORDER BY year ASC
			", $p_id ) );

			if ( empty( $campaigns ) ) {
				continue;
			}

			// Producciones del proyecto
			$productions = $wpdb->get_results( $wpdb->prepare( "
				SELECT campaign_id, monte_id, quantity_kg 
				FROM {$table_productions} 
				WHERE project_id = %d
			", $p_id ) );

			// Costos del proyecto
			$costs = $wpdb->get_results( $wpdb->prepare( "
				SELECT campaign_id, category, total_amount, cost_data 
				FROM {$table_costs} 
				WHERE project_id = %d
			", $p_id ) );

			// Variables acumuladoras de cohorte
			$cohort_ha_years_cost = 0.0;
			$cohort_ha_years_prod = 0.0;
			$cohort_total_kilos   = 0.0;
			$cohort_total_costs   = 0.0;

			$cohort_insumos_total    = 0.0;
			$cohort_insumos_suelo    = 0.0;
			$cohort_insumos_foliares = 0.0;
			$cohort_insumos_fung     = 0.0;
			$cohort_insumos_herb     = 0.0;
			$cohort_insumos_insect   = 0.0;

			$cohort_combustible = 0.0;
			$cohort_m_obra      = 0.0;
			$cohort_energia     = 0.0;
			$cohort_cosecha     = 0.0;
			$cohort_adm         = 0.0;
			$cohort_mant        = 0.0;

			$matching_montes_seen = array();
			$instances_count      = 0;

			// Procesar cada campaña histórica
			foreach ( $campaigns as $camp ) {
				$c_year   = (int) $camp->year;
				$c_id     = (int) $camp->id;
				$c_status = $camp->status;

				if ( $c_year <= 0 ) {
					continue;
				}

				// Superficie viva total de la finca en ese año
				$farm_planted_in_year = array_filter( $montes_by_id, function( $m ) use ( $c_year ) {
					return $m['plant_year'] > 0 && $m['plant_year'] <= $c_year;
				} );

				$farm_total_area = array_reduce( $farm_planted_in_year, function( $sum, $m ) {
					return $sum + $m['has'];
				}, 0.0 );

				if ( $farm_total_area <= 0 ) {
					continue;
				}

				// Montes que en este año cumplieron la condición biológica [min_age, max_age]
				$matching_in_year = array_filter( $farm_planted_in_year, function( $m ) use ( $c_year, $min_age, $max_age ) {
					$age = $c_year - $m['plant_year'];
					return $age >= $min_age && $age <= $max_age;
				} );

				if ( empty( $matching_in_year ) ) {
					continue;
				}

				$matching_area = array_reduce( $matching_in_year, function( $sum, $m ) {
					return $sum + $m['has'];
				}, 0.0 );

				$matching_ids = array_map( function( $m ) { return $m['id']; }, $matching_in_year );
				foreach ( $matching_ids as $mid ) {
					$matching_montes_seen[ $mid ] = true;
				}

				$area_ratio = $matching_area / $farm_total_area;

				// 1. Producción atribuible de esta campaña
				$camp_prods = array_filter( $productions, function( $p ) use ( $c_id ) {
					return (int) $p->campaign_id === $c_id;
				} );

				$camp_matching_prods = array_filter( $camp_prods, function( $p ) use ( $matching_ids ) {
					return in_array( (int) $p->monte_id, $matching_ids, true );
				} );

				$camp_kg = 0.0;
				if ( ! empty( $camp_matching_prods ) ) {
					$camp_kg = array_reduce( $camp_matching_prods, function( $sum, $p ) {
						return $sum + (float) $p->quantity_kg;
					}, 0.0 );
				} elseif ( ! empty( $camp->total_production ) && (float) $camp->total_production > 0 ) {
					$camp_kg = ( (float) $camp->total_production ) * $area_ratio;
				}

				// Regla de inclusión de producción
				$has_prod_data = false;
				if ( $camp_kg > 0 ) {
					$cohort_total_kilos += $camp_kg;
					$has_prod_data = true;
				} elseif ( $c_status === 'closed' || $min_age <= 5 ) {
					// Pérdida real de cosecha en campaña cerrada o etapa de formación
					$has_prod_data = true;
				}

				if ( $has_prod_data ) {
					$cohort_ha_years_prod += $matching_area;
				}

				// 2. Costos atribuibles de esta campaña
				$camp_costs = array_filter( $costs, function( $c ) use ( $c_id ) {
					return (int) $c->campaign_id === $c_id;
				} );

				$camp_total_cost = array_reduce( $camp_costs, function( $sum, $c ) {
					return $sum + (float) $c->total_amount;
				}, 0.0 );

				if ( $camp_total_cost > 0 ) {
					$cohort_ha_years_cost += $matching_area;
					$instances_count++;

					foreach ( $camp_costs as $cost_item ) {
						$cat    = trim( $cost_item->category );
						$amount = ( (float) $cost_item->total_amount ) * $area_ratio;
						$cohort_total_costs += $amount;

						switch ( $cat ) {
							case 'combustible':
								$cohort_combustible += $amount;
								break;
							case 'mano-obra':
								$cohort_m_obra += $amount;
								break;
							case 'energia':
								$cohort_energia += $amount;
								break;
							case 'cosecha':
								$cohort_cosecha += $amount;
								break;
							case 'gastos-admin':
								$cohort_adm += $amount;
								break;
							case 'mantenimientos':
								$cohort_mant += $amount;
								break;
							case 'insumos':
								$cohort_insumos_total += $amount;
								$this->parse_insumos_details(
									$cost_item->cost_data,
									$amount,
									$cohort_insumos_suelo,
									$cohort_insumos_foliares,
									$cohort_insumos_fung,
									$cohort_insumos_herb,
									$cohort_insumos_insect
								);
								break;
						}
					}
				}
			}

			// Superficie representativa (suma de has físicas de los montes involucrados)
			$physical_has_evaluated = 0.0;
			foreach ( array_keys( $matching_montes_seen ) as $mid ) {
				if ( isset( $montes_by_id[ $mid ] ) ) {
					$physical_has_evaluated += $montes_by_id[ $mid ]['has'];
				}
			}

			// Solo incluir al productor si tuvo montes en este rango y tiene datos
			if ( $physical_has_evaluated > 0 && ( $cohort_total_costs > 0 || $cohort_total_kilos > 0 ) ) {
				$producers_output[] = array(
					'id'          => 'proj_' . $p_id,
					'productor'   => ! empty( $proj->display_name ) ? $proj->display_name : $proj->user_login,
					'finca'       => $proj->project_name,
					'provincia'   => ! empty( $proj->provincia ) ? $proj->provincia : 'Sin provincia',
					'has'         => round( $physical_has_evaluated, 1 ),
					'kilos'       => round( $cohort_total_kilos ),
					'totalCostos' => round( $cohort_total_costs ),
					'insumos'     => array(
						'total'    => round( $cohort_insumos_total ),
						'suelo'    => $cohort_insumos_suelo > 0 ? round( $cohort_insumos_suelo ) : null,
						'foliares' => $cohort_insumos_foliares > 0 ? round( $cohort_insumos_foliares ) : null,
						'fung'     => $cohort_insumos_fung > 0 ? round( $cohort_insumos_fung ) : null,
						'herb'     => $cohort_insumos_herb > 0 ? round( $cohort_insumos_herb ) : null,
						'insect'   => $cohort_insumos_insect > 0 ? round( $cohort_insumos_insect ) : null,
					),
					'combustible' => round( $cohort_combustible ),
					'mObra'       => round( $cohort_m_obra ),
					'energia'     => round( $cohort_energia ),
					'cosecha'     => round( $cohort_cosecha ),
					'adm'         => $cohort_adm > 0 ? round( $cohort_adm ) : null,
					'mant'        => $cohort_mant > 0 ? round( $cohort_mant ) : null,
					'meta'        => array(
						'haYearsCost' => round( $cohort_ha_years_cost, 1 ),
						'haYearsProd' => round( $cohort_ha_years_prod, 1 ),
						'instances'   => $instances_count,
					),
				);
			}
		}

		return rest_ensure_response( array(
			'min_age'   => $min_age,
			'max_age'   => $max_age,
			'count'     => count( $producers_output ),
			'producers' => $producers_output,
		) );
	}

	/**
	 * Desglosa el JSON de insumos en subtotales.
	 */
	private function parse_insumos_details(
		$cost_data_json,
		$attributed_amount,
		&$suelo,
		&$foliares,
		&$fung,
		&$herb,
		&$insect
	) {
		if ( empty( $cost_data_json ) ) {
			return;
		}

		$data = json_decode( $cost_data_json, true );
		if ( ! is_array( $data ) ) {
			return;
		}

		// Si viene de modo rápido con subtotales
		if ( isset( $data['quickMode'] ) && ! empty( $data['subtotals'] ) && is_array( $data['subtotals'] ) ) {
			$raw_sum = array_sum( array_map( 'floatval', $data['subtotals'] ) );
			$factor  = ( $raw_sum > 0 ) ? ( $attributed_amount / $raw_sum ) : 1.0;

			foreach ( $data['subtotals'] as $key => $val ) {
				$amount = ( (float) $val ) * $factor;
				$lower  = strtolower( (string) $key );

				if ( strpos( $lower, 'suelo' ) !== false ) {
					$suelo += $amount;
				} elseif ( strpos( $lower, 'foliar' ) !== false ) {
					$foliares += $amount;
				} elseif ( strpos( $lower, 'fung' ) !== false ) {
					$fung += $amount;
				} elseif ( strpos( $lower, 'herb' ) !== false ) {
					$herb += $amount;
				} elseif ( strpos( $lower, 'insect' ) !== false ) {
					$insect += $amount;
				}
			}
			return;
		}

		// Si viene con tipo explícito en el formulario
		$type_str = '';
		if ( ! empty( $data['type'] ) ) {
			$type_str = strtolower( (string) $data['type'] );
		} elseif ( ! empty( $data['tipo_insumo'] ) ) {
			$type_str = strtolower( (string) $data['tipo_insumo'] );
		}

		if ( ! empty( $type_str ) ) {
			if ( strpos( $type_str, 'suelo' ) !== false ) {
				$suelo += $attributed_amount;
			} elseif ( strpos( $type_str, 'foliar' ) !== false ) {
				$foliares += $attributed_amount;
			} elseif ( strpos( $type_str, 'fung' ) !== false ) {
				$fung += $attributed_amount;
			} elseif ( strpos( $type_str, 'herb' ) !== false ) {
				$herb += $attributed_amount;
			} elseif ( strpos( $type_str, 'insect' ) !== false ) {
				$insect += $attributed_amount;
			}
		}
	}
}
