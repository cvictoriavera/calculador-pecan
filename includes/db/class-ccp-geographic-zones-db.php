<?php
/**
 * DB Handler para Zonas Geográficas y Territorios Asignados.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

class CCP_Geographic_Zones_DB {

    /**
     * Obtiene la lista de zonas geográficas.
     */
    public static function get_zones($args = []) {
        global $wpdb;
        $table_zones = $wpdb->prefix . 'pecan_geographic_zones';
        $table_countries = $wpdb->prefix . 'pecan_countries';

        $where = ["1=1"];
        $params = [];

        if (!empty($args['country_id'])) {
            $where[] = "z.country_id = %d";
            $params[] = intval($args['country_id']);
        }

        if (isset($args['is_active'])) {
            $where[] = "z.is_active = %d";
            $params[] = intval($args['is_active']);
        }

        $sql = "SELECT z.*, c.name as country_name, c.iso_code_2 
                FROM $table_zones z
                LEFT JOIN $table_countries c ON z.country_id = c.id
                WHERE " . implode(" AND ", $where) . " 
                ORDER BY z.name ASC";

        if (!empty($params)) {
            $sql = $wpdb->prepare($sql, $params);
        }

        $zones = $wpdb->get_results($sql, ARRAY_A);

        // Enriquecer con conteos y territorios vinculados
        foreach ($zones as &$zone) {
            $zone_id = intval($zone['id']);
            $zone['territory_ids'] = self::get_zone_territory_ids($zone_id);
            $zone['territories_count'] = count($zone['territory_ids']);

            // Conteos de proyectos y hectáreas
            $stats = self::get_zone_stats($zone_id);
            $zone['projects_count'] = $stats['projects_count'];
            $zone['producers_count'] = $stats['producers_count'];
            $zone['registered_hectares'] = $stats['registered_hectares'];
        }

        return $zones;
    }

    /**
     * Obtiene una zona por su ID.
     */
    public static function get_zone_by_id($id) {
        global $wpdb;
        $table_zones = $wpdb->prefix . 'pecan_geographic_zones';
        $table_countries = $wpdb->prefix . 'pecan_countries';

        $sql = $wpdb->prepare(
            "SELECT z.*, c.name as country_name, c.iso_code_2 
             FROM $table_zones z
             LEFT JOIN $table_countries c ON z.country_id = c.id
             WHERE z.id = %d",
            intval($id)
        );

        $zone = $wpdb->get_row($sql, ARRAY_A);

        if ($zone) {
            $zone_id = intval($zone['id']);
            $zone['territory_ids'] = self::get_zone_territory_ids($zone_id);
            $zone['territories_count'] = count($zone['territory_ids']);

            $stats = self::get_zone_stats($zone_id);
            $zone['projects_count'] = $stats['projects_count'];
            $zone['producers_count'] = $stats['producers_count'];
            $zone['registered_hectares'] = $stats['registered_hectares'];
        }

        return $zone;
    }

    /**
     * Obtiene la lista de IDs de territorios vinculados a una zona.
     */
    public static function get_zone_territory_ids($zone_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'pecan_geographic_zone_territories';
        $ids = $wpdb->get_col($wpdb->prepare("SELECT geographic_territory_id FROM $table WHERE geographic_zone_id = %d", intval($zone_id)));
        return array_map('intval', $ids);
    }

    /**
     * Inserta una nueva zona.
     */
    public static function create_zone($data) {
        global $wpdb;
        $table_zones = $wpdb->prefix . 'pecan_geographic_zones';

        $insert_data = [
            'country_id' => intval($data['country_id']),
            'name' => sanitize_text_field($data['name']),
            'description' => !empty($data['description']) ? sanitize_textarea_field($data['description']) : null,
            'is_active' => isset($data['is_active']) ? intval($data['is_active']) : 1,
            'created_by' => get_current_user_id() ? get_current_user_id() : null,
        ];

        $wpdb->insert($table_zones, $insert_data);
        $zone_id = $wpdb->insert_id;

        if ($zone_id && !empty($data['territory_ids'])) {
            self::set_zone_territories($zone_id, $data['territory_ids']);
        }

        return $zone_id;
    }

    /**
     * Actualiza una zona existente.
     */
    public static function update_zone($zone_id, $data) {
        global $wpdb;
        $table_zones = $wpdb->prefix . 'pecan_geographic_zones';

        $update_data = [];
        if (isset($data['name'])) $update_data['name'] = sanitize_text_field($data['name']);
        if (isset($data['description'])) $update_data['description'] = sanitize_textarea_field($data['description']);
        if (isset($data['is_active'])) $update_data['is_active'] = intval($data['is_active']);

        if (!empty($update_data)) {
            $wpdb->update($table_zones, $update_data, ['id' => intval($zone_id)]);
        }

        if (isset($data['territory_ids'])) {
            self::set_zone_territories($zone_id, $data['territory_ids']);
        }

        return true;
    }

    /**
     * Asigna los territorios de una zona en la tabla pivote.
     */
    public static function set_zone_territories($zone_id, $territory_ids) {
        global $wpdb;
        $table = $wpdb->prefix . 'pecan_geographic_zone_territories';

        // Limpiar anteriores
        $wpdb->delete($table, ['geographic_zone_id' => intval($zone_id)]);

        // Insertar nuevos
        foreach ($territory_ids as $t_id) {
            $wpdb->insert($table, [
                'geographic_zone_id' => intval($zone_id),
                'geographic_territory_id' => intval($t_id),
            ]);
        }
    }

    /**
     * Elimina / desactiva una zona (baja lógica).
     */
    public static function delete_zone($zone_id) {
        global $wpdb;
        $table_zones = $wpdb->prefix . 'pecan_geographic_zones';
        return $wpdb->update($table_zones, ['is_active' => 0], ['id' => intval($zone_id)]);
    }

    /**
     * Obtiene estadísticas agregadas de proyectos para una zona.
     */
    public static function get_zone_stats($zone_id) {
        global $wpdb;
        $t_projects = $wpdb->prefix . 'pecan_projects';
        $t_montes = $wpdb->prefix . 'pecan_montes';

        $sql = $wpdb->prepare(
            "SELECT 
                COUNT(DISTINCT p.id) as projects_count,
                COUNT(DISTINCT p.user_id) as producers_count,
                COALESCE(SUM(m.area_hectareas), 0) as registered_hectares
             FROM $t_projects p
             LEFT JOIN $t_montes m ON m.project_id = p.id AND m.status = 'active'
             WHERE p.geographic_zone_id = %d AND p.status = 'active'",
            intval($zone_id)
        );

        $row = $wpdb->get_row($sql, ARRAY_A);
        return [
            'projects_count' => intval($row['projects_count'] ?? 0),
            'producers_count' => intval($row['producers_count'] ?? 0),
            'registered_hectares' => floatval($row['registered_hectares'] ?? 0),
        ];
    }

    /**
     * Obtiene un mapa global de todos los territorios asignados a cualquier zona activa.
     */
    public static function get_active_territory_zone_map($exclude_zone_id = null) {
        global $wpdb;
        $t_zt = $wpdb->prefix . 'pecan_geographic_zone_territories';
        $t_z = $wpdb->prefix . 'pecan_geographic_zones';

        $where = "z.is_active = 1";
        $params = [];

        if ($exclude_zone_id) {
            $where .= " AND z.id != %d";
            $params[] = intval($exclude_zone_id);
        }

        $sql = "SELECT zt.geographic_territory_id, z.id as zone_id, z.name as zone_name
                FROM $t_zt zt
                JOIN $t_z z ON zt.geographic_zone_id = z.id
                WHERE $where";

        if (!empty($params)) {
            $sql = $wpdb->prepare($sql, $params);
        }

        $rows = $wpdb->get_results($sql, ARRAY_A);
        $map = [];

        foreach ($rows as $r) {
            $t_id = intval($r['geographic_territory_id']);
            $map[$t_id] = [
                'zone_id' => intval($r['zone_id']),
                'zone_name' => $r['zone_name'],
            ];
        }

        return $map;
    }
}
