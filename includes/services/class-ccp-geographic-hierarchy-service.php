<?php
/**
 * Servicio de Jerarquía Territorial e Inspección de Contexto de Usuario ACF.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

class CCP_Geographic_Hierarchy_Service {

    /**
     * Obtiene el ID del país asignado al usuario actual mediante el campo ACF 'pais'.
     */
    public static function get_user_assigned_country_id($user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }

        if (!$user_id) {
            return null;
        }

        $user = get_userdata($user_id);
        if (!$user) {
            return null;
        }

        // Super administradores tienen acceso global
        if (in_array('administrator', (array) $user->roles, true)) {
            return null; // Null indica acceso ilimitado / multi-país
        }

        // Obtener campo ACF 'pais' o user meta
        $country_val = null;

        if (function_exists('get_field')) {
            $country_val = get_field('pais', 'user_' . $user_id);
        }

        if (empty($country_val)) {
            $country_val = get_user_meta($user_id, 'pais', true);
        }

        if (empty($country_val)) {
            // Por defecto Argentina si no está configurado
            $country_val = 'Argentina';
        }

        $country = CCP_Geographic_Territories_DB::get_country_by_identifier($country_val);
        return $country ? intval($country['id']) : 1;
    }

    /**
     * Construye el árbol territorial completo de un país inyectando el estado de disponibilidad.
     */
    public static function get_territory_tree($country_id, $exclude_zone_id = null) {
        $country_id = intval($country_id);

        // Mapa de territorios asignados a zonas activas
        $assigned_map = CCP_Geographic_Zones_DB::get_active_territory_zone_map($exclude_zone_id);

        // Obtener todas las divisiones del país
        $all_territories = CCP_Geographic_Territories_DB::get_territories([
            'country_id' => $country_id,
            'is_active' => 1
        ]);

        // Agrupar por parent_id
        $by_parent = [];
        $by_id = [];

        foreach ($all_territories as $t) {
            $t_id = intval($t['id']);
            $p_id = $t['parent_id'] ? intval($t['parent_id']) : 0;

            $t['children'] = [];
            $by_id[$t_id] = $t;
            $by_parent[$p_id][] = $t_id;
        }

        // Calcular estado de cada nodo recursivamente
        return self::build_tree_nodes(0, $by_parent, $by_id, $assigned_map);
    }

    /**
     * Construye recursivamente los nodos del árbol.
     */
    private static function build_tree_nodes($parent_id, &$by_parent, &$by_id, &$assigned_map, $inherited_blocked_info = null) {
        if (empty($by_parent[$parent_id])) {
            return [];
        }

        $nodes = [];

        foreach ($by_parent[$parent_id] as $t_id) {
            $node = $by_id[$t_id];

            // Determinar si este nodo o su ancestro está bloqueado directamente
            $is_directly_assigned = isset($assigned_map[$t_id]);

            $current_blocked_info = null;
            if ($is_directly_assigned) {
                $current_blocked_info = [
                    'assigned_zone_id' => $assigned_map[$t_id]['zone_id'],
                    'assigned_zone_name' => $assigned_map[$t_id]['zone_name'],
                ];
            } else if ($inherited_blocked_info) {
                $current_blocked_info = $inherited_blocked_info;
            }

            // Construir hijos pasando la información de bloqueo si existe
            $children = self::build_tree_nodes($t_id, $by_parent, $by_id, $assigned_map, $current_blocked_info);
            $node['children'] = $children;

            if ($current_blocked_info) {
                $node['availability_state'] = 'BLOCKED';
                $node['assigned_zone_id'] = $current_blocked_info['assigned_zone_id'];
                $node['assigned_zone_name'] = $current_blocked_info['assigned_zone_name'];
            } else if (!empty($children)) {
                $blocked_children = 0;
                $partial_children = 0;

                foreach ($children as $child) {
                    if ($child['availability_state'] === 'BLOCKED' || $child['availability_state'] === 'FULLY_ASSIGNED') {
                        $blocked_children++;
                    } else if ($child['availability_state'] === 'PARTIALLY_ASSIGNED') {
                        $partial_children++;
                    }
                }

                if ($blocked_children === count($children)) {
                    $node['availability_state'] = 'FULLY_ASSIGNED';
                } else if ($blocked_children > 0 || $partial_children > 0) {
                    $node['availability_state'] = 'PARTIALLY_ASSIGNED';
                } else {
                    $node['availability_state'] = 'AVAILABLE';
                }
            } else {
                $node['availability_state'] = 'AVAILABLE';
            }

            $nodes[] = $node;
        }

        return $nodes;
    }
}
