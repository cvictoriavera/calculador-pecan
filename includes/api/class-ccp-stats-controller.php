<?php
/**
 * REST API Controller for Statistics
 *
 * @package Calculador_Pecan
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class CCP_Stats_Controller.
 */
class CCP_Stats_Controller extends WP_REST_Controller {

	/**
	 * The namespace of this controller's route.
	 *
	 * @var string
	 */
	protected $namespace = 'ccp/v1';

	/**
	 * The base of this controller's route.
	 *
	 * @var string
	 */
	protected $rest_base = 'stats';

	/**
	 * Register the routes for the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/regional',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_regional_stats' ),
					'permission_callback' => array( $this, 'get_stats_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/resumen',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_resumen_stats' ),
					'permission_callback' => array( $this, 'get_stats_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Check if request has access to stats data.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return bool|WP_Error True if request has read access, WP_Error object otherwise.
	 */
	public function get_stats_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Debes iniciar sesión para acceder a las estadísticas.', 'calculador-pecan' ),
				array( 'status' => 401 )
			);
		}

		$current_user = wp_get_current_user();
		if ( ! current_user_can( 'manage_options' ) && ! in_array( 'administrator', (array) $current_user->roles, true ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'No tienes permisos para ver las estadísticas administrativas.', 'calculador-pecan' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Helper to format cost category names.
	 */
	private function format_category_name( $category ) {
		$map = array(
			'cosecha'            => 'Cosecha',
			'insumos'            => 'Insumos',
			'mano-obra'          => 'Mano de Obra',
			'mantenimientos'     => 'Mantenimientos',
			'combustible'        => 'Combustible',
			'gastos-admin'       => 'Administración',
			'energia'            => 'Energía',
			'costos-oportunidad' => 'Oportunidad',
			'otros'              => 'Otros',
		);
		$key = strtolower( trim( $category ) );
		return isset( $map[ $key ] ) ? $map[ $key ] : ucfirst( $category );
	}

	/**
	 * Retrieve executive summary stats.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_resumen_stats( $request ) {
		global $wpdb;

		$table_projects  = $wpdb->prefix . 'pecan_projects';
		$table_montes    = $wpdb->prefix . 'pecan_montes';
		$table_campaigns = $wpdb->prefix . 'pecan_campaigns';
		$table_costs     = $wpdb->prefix . 'pecan_costs';

		// 1. Count Active Producers
		$productores_activos = (int) $wpdb->get_var(
			"SELECT COUNT(DISTINCT user_id) FROM {$table_projects} WHERE status = 'active'"
		);

		// 2. Total active hectares
		$total_ha = (float) $wpdb->get_var(
			"SELECT COALESCE(SUM(m.area_hectareas), 0)
			 FROM {$table_montes} m
			 INNER JOIN {$table_projects} p ON m.project_id = p.id
			 WHERE m.status = 'active' AND p.status = 'active'"
		);

		// 3. Total production in kg
		$total_prod_kg = (float) $wpdb->get_var(
			"SELECT COALESCE(SUM(c.total_production), 0)
			 FROM {$table_campaigns} c
			 INNER JOIN {$table_projects} p ON c.project_id = p.id
			 WHERE p.status = 'active'"
		);

		// 4. Total operational costs USD
		$total_costs_usd = (float) $wpdb->get_var(
			"SELECT COALESCE(SUM(co.total_amount), 0)
			 FROM {$table_costs} co
			 INNER JOIN {$table_projects} p ON co.project_id = p.id
			 WHERE p.status = 'active'"
		);

		// Calculate KPIs
		$costo_productivo_promedio = $total_prod_kg > 0 ? round( $total_costs_usd / $total_prod_kg, 2 ) : 0.0;
		$costo_por_ha_promedio     = $total_ha > 0 ? round( $total_costs_usd / $total_ha, 2 ) : 0.0;

		// 5. Ranking de Costos por Rubro
		$cost_categories_results = $wpdb->get_results(
			"SELECT 
				co.category, 
				SUM(co.total_amount) AS total_cat
			 FROM {$table_costs} co
			 INNER JOIN {$table_projects} p ON co.project_id = p.id
			 WHERE p.status = 'active'
			 GROUP BY co.category
			 ORDER BY total_cat DESC",
			ARRAY_A
		);

		$ranking_costos   = array();
		$rubro_mayor_peso = array(
			'name'       => 'N/A',
			'porcentaje' => 0.0,
		);

		$colors = array(
			'bg-[#f2794a]',
			'bg-[#16af92]',
			'bg-[#ba995c]',
			'bg-[#cb2030]',
			'bg-[#22469c]',
			'bg-[#762c4d]',
			'bg-[#f2c02b]',
			'bg-[#bc5930]',
			'bg-[#64748b]',
		);

		if ( ! empty( $cost_categories_results ) && $total_costs_usd > 0 ) {
			$rank = 1;
			foreach ( $cost_categories_results as $row ) {
				$cat_total  = (float) $row['total_cat'];
				$porcentaje = round( ( $cat_total / $total_costs_usd ) * 100, 1 );
				$cat_name   = $this->format_category_name( $row['category'] );
				$color      = isset( $colors[ $rank - 1 ] ) ? $colors[ $rank - 1 ] : 'bg-primary/65';

				$ranking_costos[] = array(
					'rank'       => $rank,
					'name'       => $cat_name,
					'porcentaje' => $porcentaje,
					'color'      => $color,
				);

				if ( $rank === 1 ) {
					$rubro_mayor_peso = array(
						'name'       => $cat_name,
						'porcentaje' => $porcentaje,
					);
				}
				$rank++;
			}
		}

		// 6. Resumen de Producción y Precios por Campaña (año)
		$campaign_trends = $wpdb->get_results(
			"SELECT 
				c.year,
				COALESCE(SUM(c.total_production), 0) AS produccion,
				COALESCE(AVG(NULLIF(c.average_price, 0)), 0) AS precio
			 FROM {$table_campaigns} c
			 INNER JOIN {$table_projects} p ON c.project_id = p.id
			 WHERE p.status = 'active'
			 GROUP BY c.year
			 ORDER BY c.year ASC",
			ARRAY_A
		);

		$resumen_data = array();
		if ( ! empty( $campaign_trends ) ) {
			foreach ( $campaign_trends as $row ) {
				$resumen_data[] = array(
					'name'       => 'Campaña ' . $row['year'],
					'produccion' => round( (float) $row['produccion'], 1 ),
					'precio'     => round( (float) $row['precio'], 2 ),
				);
			}
		}

		$response_data = array(
			'kpis' => array(
				'rubroMayorPeso'          => $rubro_mayor_peso,
				'costoProductivoPromedio' => $costo_productivo_promedio,
				'costoPorHaPromedio'      => $costo_por_ha_promedio,
				'productoresActivos'      => $productores_activos,
			),
			'resumenData'   => $resumen_data,
			'rankingCostos' => $ranking_costos,
		);

		return rest_ensure_response( $response_data );
	}

	/**
	 * Retrieve regional aggregated stats.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_regional_stats( $request ) {
		global $wpdb;

		$table_projects  = $wpdb->prefix . 'pecan_projects';
		$table_montes    = $wpdb->prefix . 'pecan_montes';
		$table_campaigns = $wpdb->prefix . 'pecan_campaigns';

		$query = "
			SELECT 
				COALESCE(NULLIF(TRIM(p.provincia), ''), 'Sin Especificar') AS region,
				COUNT(DISTINCT p.user_id) AS productores,
				CAST(COALESCE(SUM(pm.total_hectareas), 0) AS FLOAT) AS hectareas,
				CAST(COALESCE(SUM(pc.total_prod_kg), 0) AS FLOAT) AS total_produccion_kg,
				CASE 
					WHEN COALESCE(SUM(pm.total_hectareas), 0) > 0 THEN 
						ROUND(COALESCE(SUM(pc.total_prod_kg), 0) / SUM(pm.total_hectareas), 0)
					ELSE 0 
				END AS rendimiento
			FROM {$table_projects} p
			LEFT JOIN (
				SELECT project_id, SUM(area_hectareas) AS total_hectareas
				FROM {$table_montes}
				WHERE status = 'active'
				GROUP BY project_id
			) pm ON p.id = pm.project_id
			LEFT JOIN (
				SELECT project_id, SUM(total_production) AS total_prod_kg
				FROM {$table_campaigns}
				GROUP BY project_id
			) pc ON p.id = pc.project_id
			WHERE p.status = 'active'
			GROUP BY COALESCE(NULLIF(TRIM(p.provincia), ''), 'Sin Especificar')
			ORDER BY hectareas DESC
		";

		$results = $wpdb->get_results( $query, ARRAY_A );

		$formatted = array();
		if ( ! empty( $results ) ) {
			foreach ( $results as $row ) {
				$formatted[] = array(
					'region'      => (string) $row['region'],
					'hectareas'   => round( (float) $row['hectareas'], 1 ),
					'productores' => (int) $row['productores'],
					'rendimiento' => (int) $row['rendimiento'],
				);
			}
		}

		return rest_ensure_response( $formatted );
	}
}
