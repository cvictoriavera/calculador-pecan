<?php
/**
 * DB Handler para Países y Territorios Geográficos.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

class CCP_Geographic_Territories_DB {

    /**
     * Obtiene la lista de países soportados.
     */
    public static function get_countries($active_only = true) {
        global $wpdb;
        $table = $wpdb->prefix . 'pecan_countries';
        $sql = "SELECT * FROM $table";
        if ($active_only) {
            $sql .= " WHERE is_active = 1";
        }
        $sql .= " ORDER BY name ASC";
        return $wpdb->get_results($sql, ARRAY_A);
    }

    /**
     * Helper para normalizar nombres.
     */
    public static function normalize($string) {
        $string = mb_strtolower($string, 'UTF-8');
        $string = str_replace(
            ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ'],
            ['a', 'e', 'i', 'o', 'u', 'u', 'n'],
            $string
        );
        return trim(preg_replace('/[^a-z0-9\s]/', '', $string));
    }

    /**
     * Obtiene un país por su ID o por su código ISO / Nombre.
     */
    public static function get_country_by_identifier($identifier) {
        global $wpdb;
        $table = $wpdb->prefix . 'pecan_countries';

        if (is_numeric($identifier)) {
            return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", intval($identifier)), ARRAY_A);
        }

        $norm = self::normalize($identifier);
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE iso_code_2 = %s OR iso_code_3 = %s OR LOWER(name) = %s",
            strtoupper($identifier), strtoupper($identifier), strtolower($identifier)
        ), ARRAY_A);
    }

    /**
     * Obtiene divisiones territoriales filtradas.
     */
    public static function get_territories($args = []) {
        global $wpdb;
        $table = $wpdb->prefix . 'pecan_geographic_territories';

        $where = ["1=1"];
        $params = [];

        if (!empty($args['country_id'])) {
            $where[] = "country_id = %d";
            $params[] = intval($args['country_id']);
        }

        if (isset($args['parent_id'])) {
            if ($args['parent_id'] === null || $args['parent_id'] === 'null') {
                $where[] = "parent_id IS NULL";
            } else {
                $where[] = "parent_id = %d";
                $params[] = intval($args['parent_id']);
            }
        }

        if (!empty($args['level_number'])) {
            $where[] = "level_number = %d";
            $params[] = intval($args['level_number']);
        }

        if (isset($args['is_active'])) {
            $where[] = "is_active = %d";
            $params[] = intval($args['is_active']);
        }

        $sql = "SELECT * FROM $table WHERE " . implode(" AND ", $where) . " ORDER BY name ASC";

        if (!empty($params)) {
            $sql = $wpdb->prepare($sql, $params);
        }

        return $wpdb->get_results($sql, ARRAY_A);
    }

    /**
     * Obtiene un territorio por su ID.
     */
    public static function get_territory_by_id($id) {
        global $wpdb;
        $table = $wpdb->prefix . 'pecan_geographic_territories';
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", intval($id)), ARRAY_A);
    }

    /**
     * Obtiene la lista completa de ancestros de un territorio (hacia arriba por parent_id).
     */
    public static function get_ancestors($territory_id) {
        $ancestors = [];
        $current_id = $territory_id;

        while ($current_id) {
            $territory = self::get_territory_by_id($current_id);
            if (!$territory) {
                break;
            }
            $ancestors[] = $territory;
            $current_id = $territory['parent_id'];
        }

        return $ancestors;
    }

    /**
     * Obtiene la lista completa de descendientes de un territorio (hacia abajo por parent_id).
     */
    public static function get_descendant_ids($territory_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'pecan_geographic_territories';

        $descendants = [intval($territory_id)];
        $to_process = [intval($territory_id)];

        while (!empty($to_process)) {
            $current_parent = array_shift($to_process);
            $children_ids = $wpdb->get_col($wpdb->prepare("SELECT id FROM $table WHERE parent_id = %d", $current_parent));
            if (!empty($children_ids)) {
                foreach ($children_ids as $c_id) {
                    $c_id = intval($c_id);
                    $descendants[] = $c_id;
                    $to_process[] = $c_id;
                }
            }
        }

        return array_unique($descendants);
    }
}
