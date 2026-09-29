<?php
/**
 * Servicio de Validación y Detección de Conflictos Territoriales.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

class CCP_Geographic_Zone_Validation_Service {

    /**
     * Valida una lista de IDs de territorios seleccionados para una zona.
     */
    public static function check_conflicts($country_id, $territory_ids, $exclude_zone_id = null) {
        $assigned_map = CCP_Geographic_Zones_DB::get_active_territory_zone_map($exclude_zone_id);
        $conflicts = [];

        foreach ($territory_ids as $t_id) {
            $t_id = intval($t_id);
            $territory = CCP_Geographic_Territories_DB::get_territory_by_id($t_id);

            if (!$territory) {
                continue;
            }

            // Conflicto 1: Asignación directa exacta
            if (isset($assigned_map[$t_id])) {
                $conflicts[] = [
                    'territory_id' => $t_id,
                    'territory_name' => $territory['name'],
                    'conflict_type' => 'EXACT_MATCH',
                    'assigned_zone_id' => $assigned_map[$t_id]['zone_id'],
                    'assigned_zone_name' => $assigned_map[$t_id]['zone_name'],
                    'message' => sprintf(
                        'El territorio "%s" ya pertenece a la zona "%s".',
                        $territory['name'],
                        $assigned_map[$t_id]['zone_name']
                    )
                ];
                continue;
            }

            // Conflicto 2: Padre ya asignado
            $ancestors = CCP_Geographic_Territories_DB::get_ancestors($t_id);
            foreach ($ancestors as $ancestor) {
                $a_id = intval($ancestor['id']);
                if ($a_id !== $t_id && isset($assigned_map[$a_id])) {
                    $conflicts[] = [
                        'territory_id' => $t_id,
                        'territory_name' => $territory['name'],
                        'conflict_type' => 'PARENT_ALREADY_ASSIGNED',
                        'assigned_zone_id' => $assigned_map[$a_id]['zone_id'],
                        'assigned_zone_name' => $assigned_map[$a_id]['zone_name'],
                        'message' => sprintf(
                            'El territorio "%s" está incluido dentro de "%s" asignado a la zona "%s".',
                            $territory['name'],
                            $ancestor['name'],
                            $assigned_map[$a_id]['zone_name']
                        )
                    ];
                    break;
                }
            }

            // Conflicto 3: Descendiente ya asignado
            $descendants = CCP_Geographic_Territories_DB::get_descendant_ids($t_id);
            foreach ($descendants as $d_id) {
                if ($d_id !== $t_id && isset($assigned_map[$d_id])) {
                    $descendant = CCP_Geographic_Territories_DB::get_territory_by_id($d_id);
                    $conflicts[] = [
                        'territory_id' => $t_id,
                        'territory_name' => $territory['name'],
                        'conflict_type' => 'CHILD_ALREADY_ASSIGNED',
                        'assigned_zone_id' => $assigned_map[$d_id]['zone_id'],
                        'assigned_zone_name' => $assigned_map[$d_id]['zone_name'],
                        'message' => sprintf(
                            'El territorio "%s" contiene la localidad "%s" asignada previamente a la zona "%s".',
                            $territory['name'],
                            $descendant['name'],
                            $assigned_map[$d_id]['zone_name']
                        )
                    ];
                    break;
                }
            }
        }

        return [
            'has_conflicts' => !empty($conflicts),
            'conflicts' => $conflicts
        ];
    }
}
