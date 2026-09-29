<?php
/**
 * Motor de Resolución Automática de Zonas Geográficas para Proyectos.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

class CCP_Geographic_Zone_Resolver {

    /**
     * Resuelve y actualiza la zona geográfica de un proyecto según su geographic_territory_id.
     */
    public static function resolve_project_zone($project_id) {
        global $wpdb;
        $t_projects = $wpdb->prefix . 'pecan_projects';

        $project = $wpdb->get_row($wpdb->prepare("SELECT * FROM $t_projects WHERE id = %d", intval($project_id)), ARRAY_A);
        if (!$project) {
            return null;
        }

        $territory_id = !empty($project['geographic_territory_id']) ? intval($project['geographic_territory_id']) : null;
        $resolved_zone_id = null;
        $resolved_zone = null;

        if ($territory_id) {
            // Mapa de asignación activa
            $assigned_map = CCP_Geographic_Zones_DB::get_active_territory_zone_map();

            // Cadena de ancestros desde la localidad hasta el nivel superior
            $ancestors = CCP_Geographic_Territories_DB::get_ancestors($territory_id);

            foreach ($ancestors as $anc) {
                $anc_id = intval($anc['id']);
                if (isset($assigned_map[$anc_id])) {
                    $resolved_zone_id = $assigned_map[$anc_id]['zone_id'];
                    $resolved_zone = CCP_Geographic_Zones_DB::get_zone_by_id($resolved_zone_id);
                    break;
                }
            }
        }

        // Actualizar proyecto en BD
        $update_data = [
            'geographic_zone_id' => $resolved_zone_id,
            'zona' => $resolved_zone ? $resolved_zone['name'] : null
        ];

        $wpdb->update($t_projects, $update_data, ['id' => intval($project_id)]);

        return [
            'project_id' => intval($project_id),
            'country_id' => intval($project['country_id'] ?? 1),
            'geographic_territory_id' => $territory_id,
            'geographic_zone_id' => $resolved_zone_id,
            'geographic_zone_name' => $resolved_zone ? $resolved_zone['name'] : null,
            'resolution_status' => $resolved_zone_id ? 'ASSIGNED' : 'UNASSIGNED',
        ];
    }

    /**
     * Recalcula la zona para todos los proyectos pertenecientes a una lista de territorios.
     */
    public static function recalculate_affected_projects($territory_ids = []) {
        global $wpdb;
        $t_projects = $wpdb->prefix . 'pecan_projects';

        if (empty($territory_ids)) {
            // Recalcular todos los proyectos activos
            $project_ids = $wpdb->get_col("SELECT id FROM $t_projects WHERE status = 'active'");
        } else {
            // Expandir a todos los descendientes
            $all_desc_ids = [];
            foreach ($territory_ids as $t_id) {
                $all_desc_ids = array_merge($all_desc_ids, CCP_Geographic_Territories_DB::get_descendant_ids($t_id));
            }
            $all_desc_ids = array_unique($all_desc_ids);

            if (empty($all_desc_ids)) {
                return 0;
            }

            $in_clause = implode(',', array_map('intval', $all_desc_ids));
            $project_ids = $wpdb->get_col("SELECT id FROM $t_projects WHERE geographic_territory_id IN ($in_clause) AND status = 'active'");
        }

        $count = 0;
        foreach ($project_ids as $p_id) {
            self::resolve_project_zone($p_id);
            $count++;
        }

        return $count;
    }
}
