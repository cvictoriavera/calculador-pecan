<?php
/**
 * Semillero de datos geográficos para Calculador Pecan.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

class CCP_Geographic_Seeder {

    /**
     * Ejecuta el sembrado inicial de países y provincias/departamentos/localidades desde JSON.
     */
    public static function seed() {
        global $wpdb;

        $table_countries = $wpdb->prefix . 'pecan_countries';

        // 1. Países iniciales
        $countries = [
            ['id' => 1, 'name' => 'Argentina', 'iso_code_2' => 'AR', 'iso_code_3' => 'ARG', 'is_active' => 1],
            ['id' => 2, 'name' => 'Brasil', 'iso_code_2' => 'BR', 'iso_code_3' => 'BRA', 'is_active' => 1],
            ['id' => 3, 'name' => 'Uruguay', 'iso_code_2' => 'UY', 'iso_code_3' => 'URY', 'is_active' => 1],
        ];

        foreach ($countries as $country) {
            $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_countries WHERE iso_code_2 = %s", $country['iso_code_2']));
            if (!$exists) {
                $wpdb->insert($table_countries, $country);
            }
        }

        // 2. Mapeo de archivos JSON por código ISO de país
        $country_files = [
            'AR' => 'geo-argentina.json',
            'BR' => 'geo-brasil.json',
            'UY' => 'geo-uruguay.json',
        ];

        foreach ($country_files as $iso_code => $file_name) {
            $country_id = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table_countries WHERE iso_code_2 = %s", $iso_code));
            if (!$country_id) {
                continue;
            }

            // Buscar en carpeta public/ o en la raíz del plugin
            $json_path = CALCULADOR_PECAN_PLUGIN_DIR . 'public/' . $file_name;
            if (!file_exists($json_path)) {
                $json_path = CALCULADOR_PECAN_PLUGIN_DIR . $file_name;
            }

            if (file_exists($json_path)) {
                self::seed_from_json_file(intval($country_id), $json_path);
            }
        }
    }

    /**
     * Procesa y siembra la estructura territorial (Provincias, Departamentos y Localidades) desde un JSON.
     */
    public static function seed_from_json_file($country_id, $json_path) {
        global $wpdb;
        $table_territories = $wpdb->prefix . 'pecan_geographic_territories';

        $raw_content = @file_get_contents($json_path);
        if (empty($raw_content)) {
            return;
        }

        $data = json_decode($raw_content, true);
        if (!is_array($data)) {
            return;
        }

        // Obtener el array principal (soporta localidades_censales u otras claves)
        $items = $data['localidades_censales'] ?? $data['localidades'] ?? $data['territorios'] ?? [];
        if (empty($items)) {
            return;
        }

        // 1. Cargar registros existentes en memoria para evitar queries duplicadas
        $existing_records = $wpdb->get_results($wpdb->prepare(
            "SELECT id, parent_id, normalized_name, level_number FROM $table_territories WHERE country_id = %d",
            $country_id
        ), ARRAY_A);

        $provinces_map   = []; // norm_name => id
        $departments_map = []; // prov_id . '_' . norm_name => id
        $localities_map  = []; // dept_id . '_' . norm_name => id

        if (!empty($existing_records)) {
            foreach ($existing_records as $row) {
                $lvl  = intval($row['level_number']);
                $norm = $row['normalized_name'];
                $id   = intval($row['id']);
                $p_id = $row['parent_id'] ? intval($row['parent_id']) : 0;

                if ($lvl === 1) {
                    $provinces_map[$norm] = $id;
                } elseif ($lvl === 2) {
                    $departments_map[$p_id . '_' . $norm] = $id;
                } elseif ($lvl === 3) {
                    $localities_map[$p_id . '_' . $norm] = $id;
                }
            }
        }

        @set_time_limit(300);

        foreach ($items as $item) {
            // Extraer nombre de Provincia
            $prov_name = '';
            if (is_array($item['provincia'] ?? null)) {
                $prov_name = trim($item['provincia']['nombre'] ?? '');
            } elseif (is_string($item['provincia'] ?? null)) {
                $prov_name = trim($item['provincia']);
            }

            // Extraer nombre de Departamento
            $dept_name = '';
            if (is_array($item['departamento'] ?? null)) {
                $dept_name = trim($item['departamento']['nombre'] ?? '');
            } elseif (is_string($item['departamento'] ?? null)) {
                $dept_name = trim($item['departamento']);
            }

            // Extraer nombre de Localidad / Municipio
            $loc_name = trim($item['nombre'] ?? '');

            if (empty($prov_name)) {
                continue;
            }

            // Nivel 1: Provincia
            $prov_norm = self::normalize($prov_name);
            if (!isset($provinces_map[$prov_norm])) {
                $wpdb->insert($table_territories, [
                    'country_id'     => $country_id,
                    'parent_id'      => null,
                    'name'           => $prov_name,
                    'normalized_name'=> $prov_norm,
                    'territory_type' => 'province',
                    'level_number'   => 1,
                    'external_source'=> 'json_seed',
                    'is_active'      => 1,
                ]);
                $provinces_map[$prov_norm] = $wpdb->insert_id;
            }
            $prov_id = $provinces_map[$prov_norm];

            // Nivel 2: Departamento
            if (empty($dept_name)) {
                $dept_name = $prov_name;
            }
            $dept_norm = self::normalize($dept_name);
            $dept_key  = $prov_id . '_' . $dept_norm;

            if (!isset($departments_map[$dept_key])) {
                $wpdb->insert($table_territories, [
                    'country_id'     => $country_id,
                    'parent_id'      => $prov_id,
                    'name'           => $dept_name,
                    'normalized_name'=> $dept_norm,
                    'territory_type' => 'department',
                    'level_number'   => 2,
                    'external_source'=> 'json_seed',
                    'is_active'      => 1,
                ]);
                $departments_map[$dept_key] = $wpdb->insert_id;
            }
            $dept_id = $departments_map[$dept_key];

            // Nivel 3: Localidad / Municipio
            if (!empty($loc_name)) {
                $loc_norm = self::normalize($loc_name);
                $loc_key  = $dept_id . '_' . $loc_norm;

                if (!isset($localities_map[$loc_key])) {
                    $wpdb->insert($table_territories, [
                        'country_id'     => $country_id,
                        'parent_id'      => $dept_id,
                        'name'           => $loc_name,
                        'normalized_name'=> $loc_norm,
                        'territory_type' => 'locality',
                        'level_number'   => 3,
                        'external_source'=> 'json_seed',
                        'is_active'      => 1,
                    ]);
                    $localities_map[$loc_key] = $wpdb->insert_id;
                }
            }
        }
    }

    /**
     * Helper para normalizar nombres para búsqueda insensible a acentos/mayúsculas.
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
}
