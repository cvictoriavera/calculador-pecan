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
    private static $db_version = '1.5.2';

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
        // error_log('CCP: Database version reset to force table recreation'); // Commented out to prevent activation output
    }

    /**
     * Borra todas las tablas del plugin.
     * Útil para desarrollo o cuando se necesita reinstalar completamente.
     */
    public static function drop_all_tables() {
        global $wpdb;

        $tables = [
            $wpdb->prefix . 'pecan_costs',
            $wpdb->prefix . 'pecan_investments',
            $wpdb->prefix . 'pecan_annual_records',
            $wpdb->prefix . 'pecan_montes',
            $wpdb->prefix . 'pecan_productions',
            $wpdb->prefix . 'pecan_campaigns',
            $wpdb->prefix . 'pecan_projects',
            $wpdb->prefix . 'pecan_yield_models'
        ];

        foreach ($tables as $table) {
            $wpdb->query("DROP TABLE IF EXISTS $table");
            // error_log("CCP: Dropped table $table"); // Commented out to prevent activation output
        }

        // También resetear la versión para forzar recreación
        self::reset_version();
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
            $wpdb->prefix . 'pecan_productions' => 'Producciones',
            $wpdb->prefix . 'pecan_annual_records' => 'Registros Anuales',
            $wpdb->prefix . 'pecan_investments' => 'Inversiones',
            $wpdb->prefix . 'pecan_costs' => 'Costos',
            $wpdb->prefix . 'pecan_yield_models' => 'Modelos de Rendimiento'
        ];

        $status = [];
        foreach ($tables as $table_name => $table_label) {
            $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name));
            $status[$table_label] = $exists ? 'EXISTS' : 'MISSING';
        }

        $version = get_option(self::$db_version_key, 'NOT SET');

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

        $installed_version = get_option(self::$db_version_key);

        // Verificar si TODAS las tablas existen
        $tables_to_check = [
            $wpdb->prefix . 'pecan_projects',
            $wpdb->prefix . 'pecan_campaigns',
            $wpdb->prefix . 'pecan_montes',
            $wpdb->prefix . 'pecan_productions',
            $wpdb->prefix . 'pecan_annual_records',
            $wpdb->prefix . 'pecan_investments',
            $wpdb->prefix . 'pecan_costs',
            $wpdb->prefix . 'pecan_yield_models'
        ];

        $all_tables_exist = true;
        foreach ($tables_to_check as $table_name) {
            $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name));
            if (!$exists) {
                $all_tables_exist = false;
                break;
            }
        }

        // Crear tablas faltantes individualmente o si la versión ha cambiado
        if (!$all_tables_exist || $installed_version != self::$db_version) {
           
            require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
            $charset_collate = $wpdb->get_charset_collate();

            // Definir nombres de tablas para referencias de foreign keys
            $table_name_projects = $wpdb->prefix . 'pecan_projects';
            $table_name_campaigns = $wpdb->prefix . 'pecan_campaigns';
            $table_name_montes = $wpdb->prefix . 'pecan_montes';

            // Crear tablas faltantes individualmente
            $tables_created = [];

            // Tabla de Proyectos - solo si no existe
            if (!$wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name_projects))) {
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
                $tables_created[] = 'projects';
            }

            // Tabla de Campañas - solo si no existe
            if (!$wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name_campaigns))) {
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
                    average_price DECIMAL(10,2) DEFAULT 0.00,
                    total_production DECIMAL(15,2) DEFAULT 0.00,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_project_id (project_id),
                    INDEX idx_project_year (project_id, year),
                    INDEX idx_project_status (project_id, status),
                    UNIQUE KEY unique_project_year (project_id, year),
                    FOREIGN KEY (project_id) REFERENCES $table_name_projects(id) ON DELETE CASCADE
                ) $charset_collate;";
                dbDelta($sql_campaigns);
                $tables_created[] = 'campaigns';
            }

            // Tabla de Montes - solo si no existe
            if (!$wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name_montes))) {
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
                $tables_created[] = 'montes';
            }

            $table_name_productions = $wpdb->prefix . 'pecan_productions';

            if (!$wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name_productions))) {
                $sql_productions = "CREATE TABLE $table_name_productions (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    project_id BIGINT UNSIGNED NOT NULL,
                    campaign_id BIGINT UNSIGNED NOT NULL, 
                    monte_id BIGINT UNSIGNED NOT NULL, 
                    
                    entry_group_id CHAR(36) NOT NULL, 
                    
                    input_type ENUM('total', 'detail') DEFAULT 'total',

                    quantity_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    
                    is_estimated TINYINT(1) DEFAULT 0, 

                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                    INDEX idx_entry_group (entry_group_id),
                    INDEX idx_project_campaign (project_id, campaign_id),
                    
                    FOREIGN KEY (project_id) REFERENCES $table_name_projects(id) ON DELETE CASCADE,
                    FOREIGN KEY (campaign_id) REFERENCES $table_name_campaigns(id) ON DELETE CASCADE,
                    
                    FOREIGN KEY (monte_id) REFERENCES $table_name_montes(id) ON DELETE CASCADE
                ) $charset_collate;";
                
                dbDelta($sql_productions);
            }

            // Tabla de Registros Anuales - solo si no existe
            $table_name_annual_records = $wpdb->prefix . 'pecan_annual_records';
            if (!$wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name_annual_records))) {
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
                $tables_created[] = 'annual_records';
            }

            // Tabla de Inversiones - solo si no existe
            $table_name_investments = $wpdb->prefix . 'pecan_investments';
            if (!$wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name_investments))) {
                $sql_investments = "CREATE TABLE $table_name_investments (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    project_id BIGINT UNSIGNED NOT NULL,
                    campaign_id BIGINT UNSIGNED NULL,
                    category VARCHAR(100) NOT NULL,
                    description TEXT NOT NULL,
                    total_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
                    details LONGTEXT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_project_id (project_id),
                    INDEX idx_campaign_id (campaign_id),
                    INDEX idx_category (category),
                    FOREIGN KEY (project_id) REFERENCES $table_name_projects(id) ON DELETE CASCADE,
                    FOREIGN KEY (campaign_id) REFERENCES $table_name_campaigns(id) ON DELETE CASCADE
                ) $charset_collate;";
                dbDelta($sql_investments);
                $tables_created[] = 'investments';
            }

            // Tabla de Costos - solo si no existe
            $table_name_costs = $wpdb->prefix . 'pecan_costs';
            if (!$wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name_costs))) {
                $sql_costs = "CREATE TABLE $table_name_costs (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    project_id BIGINT UNSIGNED NOT NULL,
                    campaign_id BIGINT UNSIGNED NOT NULL,
                    category VARCHAR(50) NOT NULL COMMENT 'Categoría principal: combustible, cosecha, insumos, mano-obra, mantenimientos, costos-oportunidad, energia, gastos-admin',
                    cost_data LONGTEXT NULL COMMENT 'Datos JSON que contienen los detalles específicos del costo del formulario',
                    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Monto total calculado del costo',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_project_id (project_id),
                    INDEX idx_campaign_id (campaign_id),
                    INDEX idx_category (category),
                    INDEX idx_project_campaign (project_id, campaign_id),
                    FOREIGN KEY (project_id) REFERENCES $table_name_projects(id) ON DELETE CASCADE,
                    FOREIGN KEY (campaign_id) REFERENCES $table_name_campaigns(id) ON DELETE CASCADE
                ) $charset_collate;";
                dbDelta($sql_costs);
                $tables_created[] = 'costs';
            }

            // Tabla de Modelos de Rendimiento - solo si no existe
            $table_name_yield_models = $wpdb->prefix . 'pecan_yield_models';
            if (!$wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name_yield_models))) {
                $sql_yield_models = "CREATE TABLE $table_name_yield_models (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    project_id BIGINT UNSIGNED NOT NULL,
                    variety VARCHAR(50) DEFAULT 'general',
                    model_name VARCHAR(100) NOT NULL,
                    yield_data LONGTEXT NOT NULL,
                    is_active TINYINT(1) DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_project_variety (project_id, variety),
                    UNIQUE KEY unique_model (project_id, variety, model_name),
                    FOREIGN KEY (project_id) REFERENCES $table_name_projects(id) ON DELETE CASCADE
                ) $charset_collate;";
                dbDelta($sql_yield_models);
                $tables_created[] = 'yield_models';
            }

            // Ejecutar migraciones específicas de versión
             if ($installed_version != self::$db_version) {
                 // Migración a 1.5.1: añadir columna pais
                 if (version_compare($installed_version, '1.5.1', '<')) {
                     self::migrate_to_1_5_1();
                 }
                 // Migración a 1.5.2: añadir provincia, departamento, municipio y zona
                 if (version_compare($installed_version, '1.5.2', '<')) {
                     self::migrate_to_1_5_2();
                 }
             }

            // Actualizar la versión de la BD si se crearon tablas o cambió la versión
            if (!empty($tables_created) || $installed_version != self::$db_version) {
                update_option(self::$db_version_key, self::$db_version);
            }

            // Log de qué tablas se crearon
            if (!empty($tables_created)) {
                error_log('CCP DB: Created tables: ' . implode(', ', $tables_created));
            }
        }
        // error_log('CCP DB: create_tables completed'); // Commented out to prevent activation output
    }


    public static function migrate_production_json_to_table() {
        global $wpdb;

        $table_campaigns = $wpdb->prefix . 'pecan_campaigns';
        $table_production = $wpdb->prefix . 'pecan_productions'; // Asegúrate que coincida con tu create_tables

        // 1. Buscar campañas que tengan datos JSON
        $campaigns = $wpdb->get_results("
            SELECT id, project_id, montes_production, start_date, end_date 
            FROM $table_campaigns 
            WHERE montes_production IS NOT NULL 
            AND montes_production != '' 
            AND montes_production != '{}'
        ");

        if (empty($campaigns)) {
            return ['status' => 'error', 'message' => 'No se encontraron campañas con datos JSON para migrar.'];
        }

        $count_success = 0;
        $count_skipped = 0;
        $errors = [];

        foreach ($campaigns as $campaign) {
            // ID Único Determinista: PROD-P{proyecto}-C{campaña}
            $entry_group_id = sprintf('PROD-P%d-C%d', $campaign->project_id, $campaign->id);

            // 2. Verificar si ya existe para evitar duplicados
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $table_production WHERE entry_group_id = %s", 
                $entry_group_id
            ));

            if ($exists > 0) {
                $count_skipped++;
                continue; // Ya migrada, pasamos a la siguiente
            }

            // 3. Decodificar JSON
            // Estructura esperada: { "metodo": "total/detallado", "distribucion": { "id_monte": cantidad } }
            $data = json_decode($campaign->montes_production, true);

            if (json_last_error() !== JSON_ERROR_NONE || empty($data['distribucion'])) {
                $errors[] = "JSON corrupto en campaña ID {$campaign->id}";
                continue;
            }

            // 4. Preparar datos
            // Determinar input_type basado en el método
            $input_type = (isset($data['metodo']) && $data['metodo'] === 'detallado') ? 'detail' : 'total';

            // Si el método era 'total', marcamos is_estimated = 1
            $is_estimated = (isset($data['metodo']) && $data['metodo'] === 'total') ? 1 : 0;

            // Fecha de registro (usamos fin de campaña o inicio como fallback)
            $date = !empty($campaign->end_date) ? $campaign->end_date : $campaign->start_date;

            // 5. Insertar filas
            $wpdb->query('START TRANSACTION');
            try {
                foreach ($data['distribucion'] as $monte_id => $quantity) {
                    if ($quantity > 0) {
                        $wpdb->insert(
                            $table_production,
                            [
                                'project_id'     => $campaign->project_id,
                                'campaign_id'    => $campaign->id,
                                'monte_id'       => intval($monte_id),
                                'entry_group_id' => $entry_group_id,
                                'input_type'     => $input_type,
                                'quantity_kg'    => floatval($quantity),
                                'is_estimated'   => $is_estimated,
                                'created_at'     => current_time('mysql')
                            ],
                            ['%d', '%d', '%d', '%s', '%s', '%f', '%d', '%s']
                        );
                    }
                }
                $wpdb->query('COMMIT');
                $count_success++;

            } catch (Exception $e) {
                $wpdb->query('ROLLBACK');
                $errors[] = "Error SQL en campaña {$campaign->id}: " . $e->getMessage();
            }
        }

        return [
            'status'  => 'success',
            'message' => "Migración finalizada. Migrados: $count_success. Omitidos (ya existían): $count_skipped.",
            'errors'  => $errors
        ];
    }

    /**
     * Migra la base de datos a la versión 1.5.1
     * Añade columna pais a la tabla pecan_projects
     */
    public static function migrate_to_1_5_1() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'pecan_projects';

        // Verificar si la tabla existe
        if (!$wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name))) {
            return ['status' => 'error', 'message' => 'Tabla pecan_projects no existe.'];
        }

        $columns_added = [];

        // Verificar y añadir columna 'pais'
        $pais_exists = $wpdb->get_results("DESCRIBE $table_name pais");
        if (empty($pais_exists)) {
            $wpdb->query("ALTER TABLE $table_name ADD COLUMN pais VARCHAR(100) NULL AFTER description");
            $columns_added[] = 'pais';
        }

        if (!empty($columns_added)) {
            return [
                'status' => 'success',
                'message' => 'Columnas añadidas: ' . implode(', ', $columns_added)
            ];
        } else {
            return [
                'status' => 'info',
                'message' => 'Todas las columnas ya existen.'
            ];
        }
     }

     /**
      * Migra la base de datos a la versión 1.5.2
      * Añade 'provincia', 'departamento', 'municipio' y 'zona' en la tabla pecan_projects
      */
     public static function migrate_to_1_5_2() {
         global $wpdb;

         $table_name = $wpdb->prefix . 'pecan_projects';

         // Verificar si la tabla existe
         if (!$wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name))) {
             return ['status' => 'error', 'message' => 'Tabla pecan_projects no existe.'];
         }

         $columns_added = [];

         // Verificar y gestionar columna 'provincia'
         $region_exists = $wpdb->get_results("DESCRIBE $table_name region");
         $provincia_exists = $wpdb->get_results("DESCRIBE $table_name provincia");

         if (!empty($region_exists) && empty($provincia_exists)) {
             // Renombrar columna 'region' a 'provincia'
             $wpdb->query("ALTER TABLE $table_name CHANGE region provincia VARCHAR(255) NULL");
             $columns_added[] = 'region -> provincia';
         } elseif (empty($region_exists) && empty($provincia_exists)) {
             // Si no existe ninguna, añadir 'provincia'
             $wpdb->query("ALTER TABLE $table_name ADD COLUMN provincia VARCHAR(255) NULL AFTER pais");
             $columns_added[] = 'provincia añadida';
         }

         // Verificar y añadir columna 'departamento'
         $departamento_exists = $wpdb->get_results("DESCRIBE $table_name departamento");
         if (empty($departamento_exists)) {
             $wpdb->query("ALTER TABLE $table_name ADD COLUMN departamento VARCHAR(255) NULL AFTER provincia");
             $columns_added[] = 'departamento añadido';
         }

         // Verificar y añadir columna 'municipio'
         $municipio_exists = $wpdb->get_results("DESCRIBE $table_name municipio");
         if (empty($municipio_exists)) {
             $wpdb->query("ALTER TABLE $table_name ADD COLUMN municipio VARCHAR(255) NULL AFTER departamento");
             $columns_added[] = 'municipio añadido';
         }

         // Verificar y añadir columna 'zona'
         $zona_exists = $wpdb->get_results("DESCRIBE $table_name zona");
         if (empty($zona_exists)) {
             $wpdb->query("ALTER TABLE $table_name ADD COLUMN zona VARCHAR(255) NULL AFTER municipio");
             $columns_added[] = 'zona añadido';
         }

         // Verificar y añadir columna 'allow_benchmarking'
         $allow_benchmarking_exists = $wpdb->get_results("DESCRIBE $table_name allow_benchmarking");
         if (empty($allow_benchmarking_exists)) {
             $wpdb->query("ALTER TABLE $table_name ADD COLUMN allow_benchmarking TINYINT(1) NOT NULL DEFAULT 0 AFTER zona");
             $columns_added[] = 'allow_benchmarking añadido';
         }

         if (!empty($columns_added)) {
             return [
                 'status' => 'success',
                 'message' => 'Cambios realizados: ' . implode(', ', $columns_added)
             ];
         } else {
             return [
                 'status' => 'info',
                 'message' => 'Todas las columnas ya existen.'
             ];
         }
     }

 }
