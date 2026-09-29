<?php
/**
 * Servicio de Negocio para Zonas Geográficas.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

class CCP_Geographic_Zone_Service {

    /**
     * Valida permisos y crea una nueva zona geográfica.
     */
    public static function create_zone($data, $user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }

        // Inspeccionar país asignado si el usuario es admin_country
        $user_country_id = CCP_Geographic_Hierarchy_Service::get_user_assigned_country_id($user_id);
        if ($user_country_id !== null && intval($data['country_id']) !== intval($user_country_id)) {
            return new WP_Error('REST_FORBIDDEN', 'No posee permisos para crear zonas en otro país.', ['status' => 403]);
        }

        // Validar conflictos de superposición
        $check = CCP_Geographic_Zone_Validation_Service::check_conflicts(
            $data['country_id'],
            $data['territory_ids'] ?? []
        );

        if ($check['has_conflicts']) {
            return new WP_Error('TERRITORY_CONFLICT', 'Uno o más territorios están asignados a otra zona activa.', [
                'status' => 409,
                'conflicts' => $check['conflicts']
            ]);
        }

        $zone_id = CCP_Geographic_Zones_DB::create_zone($data);

        if ($zone_id) {
            // Recalcular proyectos afectados
            CCP_Geographic_Zone_Resolver::recalculate_affected_projects($data['territory_ids'] ?? []);
        }

        return CCP_Geographic_Zones_DB::get_zone_by_id($zone_id);
    }

    /**
     * Valida permisos y actualiza una zona geográfica existente.
     */
    public static function update_zone($zone_id, $data, $user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }

        $existing = CCP_Geographic_Zones_DB::get_zone_by_id($zone_id);
        if (!$existing) {
            return new WP_Error('NOT_FOUND', 'Zona geográfica no encontrada.', ['status' => 404]);
        }

        // Validar país si es admin_country
        $user_country_id = CCP_Geographic_Hierarchy_Service::get_user_assigned_country_id($user_id);
        if ($user_country_id !== null && intval($existing['country_id']) !== intval($user_country_id)) {
            return new WP_Error('REST_FORBIDDEN', 'No posee permisos para editar zonas de este país.', ['status' => 403]);
        }

        if (isset($data['territory_ids'])) {
            $check = CCP_Geographic_Zone_Validation_Service::check_conflicts(
                $existing['country_id'],
                $data['territory_ids'],
                $zone_id
            );

            if ($check['has_conflicts']) {
                return new WP_Error('TERRITORY_CONFLICT', 'Uno o más territorios están asignados a otra zona activa.', [
                    'status' => 409,
                    'conflicts' => $check['conflicts']
                ]);
            }
        }

        CCP_Geographic_Zones_DB::update_zone($zone_id, $data);

        // Recalcular proyectos
        CCP_Geographic_Zone_Resolver::recalculate_affected_projects();

        return CCP_Geographic_Zones_DB::get_zone_by_id($zone_id);
    }

    /**
     * Elimina / Desactiva una zona geográfica.
     */
    public static function delete_zone($zone_id, $user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }

        $existing = CCP_Geographic_Zones_DB::get_zone_by_id($zone_id);
        if (!$existing) {
            return new WP_Error('NOT_FOUND', 'Zona geográfica no encontrada.', ['status' => 404]);
        }

        $user_country_id = CCP_Geographic_Hierarchy_Service::get_user_assigned_country_id($user_id);
        if ($user_country_id !== null && intval($existing['country_id']) !== intval($user_country_id)) {
            return new WP_Error('REST_FORBIDDEN', 'No posee permisos para eliminar zonas de este país.', ['status' => 403]);
        }

        CCP_Geographic_Zones_DB::delete_zone($zone_id);
        CCP_Geographic_Zone_Resolver::recalculate_affected_projects();

        return true;
    }
}
