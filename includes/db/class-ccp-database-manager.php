<?php
/**
 * Manejador de la base de datos para la Calculadora de Costos Pecan.
 *
 * @package Calculadora_Costos_Pecan
 */

if (!defined('ABSPATH')) {
    exit; // Salir si se accede directamente.
}

class CCP_Database_Manager {

    /**
     * Versión de la base de datos.
     * Se usa para detectar si se necesitan actualizaciones en la estructura.
     *
     * @var string
     */
    private static $db_version = '1.1';

    /**
     * Clave para guardar la versión de la BD en la tabla de opciones.
     *
     * @var string
     */
    private static $db_version_key = 'ccp_db_version';

    /**
     * Resetea la versión de la base de datos.
     * Útil para desarrollo cuando se cambian estructuras de tablas.
     */
    public static function reset_version() {
        delete_option(self::$db_version_key);
        error_log('CCP: Database version reset to force table recreation');
    }

    /**
     * Verifica si las tablas existen y están correctamente creadas.
     * Útil para debugging.
     */
    public static function check_tables_status() {
        global $wpdb;

        $tables = [
            $wpdb->prefix . 'pecan_projects' => 'Proyectos',
            $wpdb->prefix . 'pecan_campaigns' => 'Campañas',
            $wpdb->prefix . 'pecan_montes' => 'Montes',
            $wpdb->prefix . 'pecan_annual_records' => 'Registros Anuales'
        ];

        $status = [];
        foreach ($tables as $table_name => $table_label) {
            $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name));
            $status[$table_label] = $exists ? 'EXISTS' : 'MISSING';
        }

        $version = get_option(self::$db_version_key, 'NOT SET');

        error_log('CCP Database Status:');
        error_log('Version: ' . $version);
        foreach ($status as $table => $state) {
            error_log("$table: $state");
        }

        return [
            'version' => $version,
            'tables' => $status
        ];
    }

    /**
     * Crea las tablas de la base de datos del plugin.
     * Se ejecuta en la activación del plugin.
     */
    public static function create_tables() {
        global $wpdb;
        error_log('CCP DB: Starting create_tables');
        $installed_version = get_option(self::$db_version_key);
        error_log('CCP DB: Installed version: ' . $installed_version . ', Current version: ' . self::$db_version);

        // Verificar si las tablas existen
        $table_name_annual_records = $wpdb->prefix . 'pecan_annual_records';
        $table_name_project_data = $wpdb->prefix . 'pecan_project_data';
        $annual_records_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name_annual_records));
        $project_data_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name_project_data));
        error_log('CCP DB: annual_records exists: ' . ($annual_records_exists ? 'yes' : 'no'));
        error_log('CCP DB: project_data exists: ' . ($project_data_exists ? 'yes' : 'no'));

        // Crear tablas si no existen o si la versión ha cambiado
        if (!$annual_records_exists || $installed_version != self::$db_version) {
            error_log('CCP DB: Creating tables');
            require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
            $charset_collate = $wpdb->get_charset_collate();

            // Para cambios mayores de esquema (versión 4.0), renombrar tabla project_data a annual_records
            if (version_compare($installed_version, '4.0', '<') && $project_data_exists && !$annual_records_exists) {
                $wpdb->query("RENAME TABLE $table_name_project_data TO $table_name_annual_records");
            } elseif (version_compare($installed_version, '3.0', '<')) {
                // Para versiones anteriores, crear tabla
                $table_name_data = $wpdb->prefix . 'pecan_annual_records';
                $wpdb->query("DROP TABLE IF EXISTS $table_name_data");
            }

            // Tabla de Proyectos
            error_log('CCP DB: Creating projects table');
            $table_name_projects = $wpdb->prefix . 'pecan_projects';
            $sql_projects = "CREATE TABLE $table_name_projects (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                user_id BIGINT UNSIGNED NOT NULL,
                project_name VARCHAR(255) NOT NULL,
                description TEXT NULL,

                status ENUM('active', 'archived') DEFAULT 'active',

                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                last_sync DATETIME NULL,

                INDEX idx_user_id (user_id),
                INDEX idx_user_status (user_id, status),

                FOREIGN KEY (user_id) REFERENCES {$wpdb->prefix}users(ID) ON DELETE CASCADE
            ) $charset_collate;";
            dbDelta($sql_projects);
            error_log('CCP DB: Projects table created');

            // Tabla de Campañas
            error_log('CCP DB: Creating campaigns table');
            $table_name_campaigns = $wpdb->prefix . 'pecan_campaigns';
            $sql_campaigns = "CREATE TABLE $table_name_campaigns (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                project_id BIGINT UNSIGNED NOT NULL,

                campaign_name VARCHAR(100) NOT NULL,
                year INT NOT NULL,

                start_date DATE NOT NULL,
                end_date DATE NULL,

                status ENUM('open', 'closed', 'archived') DEFAULT 'open',
                is_current TINYINT(1) DEFAULT 0,

                notes TEXT NULL,

                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                INDEX idx_project_id (project_id),
                INDEX idx_project_year (project_id, year),
                INDEX idx_project_status (project_id, status),

                UNIQUE KEY unique_project_year (project_id, year),
                FOREIGN KEY (project_id) REFERENCES $table_name_projects(id) ON DELETE CASCADE
            ) $charset_collate;";
            dbDelta($sql_campaigns);
            error_log('CCP DB: Campaigns table created');

            // Tabla de Montes
            error_log('CCP DB: Creating montes table');
            $table_name_montes = $wpdb->prefix . 'pecan_montes';
            $wpdb->query("DROP TABLE IF EXISTS $table_name_montes");
            $sql_montes = "CREATE TABLE $table_name_montes (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                project_id BIGINT UNSIGNED NOT NULL,
                campaign_created_id BIGINT UNSIGNED NULL,
                monte_name VARCHAR(255) NOT NULL,
                area_hectareas DECIMAL(10,2) NOT NULL,
                plantas_por_hectarea INT NOT NULL,
                fecha_plantacion DATE NULL,
                variedad VARCHAR(255) NULL,

                status ENUM('active', 'retired') DEFAULT 'active',
                campaign_retired_id BIGINT UNSIGNED NULL,

                notes TEXT NULL,

                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                INDEX idx_project_id (project_id),
                INDEX idx_campaign_created (campaign_created_id),
                INDEX idx_project_status (project_id, status),

                FOREIGN KEY (project_id) REFERENCES $table_name_projects(id) ON DELETE CASCADE,
                FOREIGN KEY (campaign_created_id) REFERENCES $table_name_campaigns(id) ON DELETE SET NULL,
                FOREIGN KEY (campaign_retired_id) REFERENCES $table_name_campaigns(id) ON DELETE SET NULL
            ) $charset_collate;";
            dbDelta($sql_montes);
            error_log('CCP DB: Montes table created');

            // Tabla de Registros Anuales (Nueva estructura híbrida)
            error_log('CCP DB: Creating annual_records table');
            $table_name_annual_records = $wpdb->prefix . 'pecan_annual_records';
            $sql_data = "CREATE TABLE $table_name_annual_records (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                project_id BIGINT UNSIGNED NOT NULL,
                campaign_id BIGINT UNSIGNED NULL,
                monte_id BIGINT UNSIGNED NULL,

                type ENUM('production', 'investment', 'cost', 'global_config') NOT NULL,
                category VARCHAR(100) NOT NULL,

                total_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,

                details LONGTEXT NULL,

                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                INDEX idx_project_id (project_id),
                INDEX idx_campaign_id (campaign_id),
                INDEX idx_monte_id (monte_id),
                INDEX idx_project_campaign (project_id, campaign_id),
                INDEX idx_type (type),
                INDEX idx_category (category),
                INDEX idx_type_category (type, category),

                FOREIGN KEY (project_id) REFERENCES $table_name_projects(id) ON DELETE CASCADE,
                FOREIGN KEY (campaign_id) REFERENCES $table_name_campaigns(id) ON DELETE CASCADE,
                FOREIGN KEY (monte_id) REFERENCES $table_name_montes(id) ON DELETE CASCADE
            ) $charset_collate;";
            dbDelta($sql_data);
            error_log('CCP DB: Annual_records table created');

            // Migrar datos existentes si es necesario
            error_log('CCP DB: Starting migration');
            self::migrate_existing_data();
            error_log('CCP DB: Migration completed');

            // Actualizar la versión de la BD en la base de datos.
            update_option(self::$db_version_key, self::$db_version);
            error_log('CCP DB: Database version updated to ' . self::$db_version);
        } else {
            error_log('CCP DB: Tables already exist and version is current, skipping creation');
        }
        error_log('CCP DB: create_tables completed');
    }

    /**
     * Migrar datos existentes de la estructura antigua a la nueva.
     * Se ejecuta solo cuando se actualiza la versión de la BD.
     */
    private static function migrate_existing_data() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'pecan_project_data';

        // Verificar si hay datos en la estructura antigua
        $existing_data = $wpdb->get_results("SELECT * FROM $table_name WHERE data_type IN ('productividad', 'inversiones', 'costos')");

        if (empty($existing_data)) {
            return; // No hay datos para migrar
        }

        $migration_log = [];

        foreach ($existing_data as $row) {
            $type_map = [
                'productividad' => 'production',
                'inversiones' => 'investment',
                'costos' => 'cost'
            ];

            $new_type = $type_map[$row->data_type] ?? 'global_config';
            $category = $row->data_key;
            $details = $row->data_value;

            // Intentar calcular total_value desde el JSON
            $total_value = 0.00;
            $data_obj = json_decode($row->data_value, true);
            if (is_array($data_obj)) {
                // Para costos, sumar valores
                if ($new_type === 'cost' && isset($data_obj['total'])) {
                    $total_value = floatval($data_obj['total']);
                } elseif ($new_type === 'production' && isset($data_obj['total_produccion'])) {
                    $total_value = floatval($data_obj['total_produccion']);
                } elseif ($new_type === 'investment' && isset($data_obj['total_inversion'])) {
                    $total_value = floatval($data_obj['total_inversion']);
                }
            }

            // Insertar en la nueva estructura
            $result = $wpdb->insert(
                $table_name_annual_records,
                [
                    'project_id' => $row->project_id,
                    'campaign_id' => $row->campaign_id ?? 1, // Default campaign if null
                    'type' => $new_type,
                    'category' => $category,
                    'total_value' => $total_value,
                    'details' => $details,
                    'updated_at' => $row->updated_at
                ],
                ['%d', '%d', '%s', '%s', '%f', '%s', '%s']
            );

            if ($result) {
                $migration_log[] = "Migrated: {$row->data_type} -> {$new_type}, category: {$category}";
            } else {
                $migration_log[] = "Failed to migrate: {$row->data_type}, category: {$category}";
            }
        }

        // Log de migración
        error_log('CCP Database Migration Log:');
        foreach ($migration_log as $log) {
            error_log($log);
        }

        // Opcional: Marcar que la migración se completó
        update_option('ccp_migration_completed', '4.0');
    }
}
