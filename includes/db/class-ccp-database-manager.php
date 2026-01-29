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
     * Incrementada para forzar actualización en esta limpieza.
     * @var string
     */
    private static $db_version = '1.5.4'; 

    private static $db_version_key = 'ccp_db_version';

    /**
     * Resetea la versión de la base de datos.
     */
    public static function reset_version() {
        delete_option(self::$db_version_key);
    }

    /**
     * Crea las tablas de la base de datos del plugin.
     * Se ejecuta en la activación del plugin.
     */
    public static function create_tables() {
        global $wpdb;
        $installed_version = get_option(self::$db_version_key);

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        // Forzamos InnoDB para asegurar integridad referencial
        $charset_collate = $wpdb->get_charset_collate();
        if (stripos($charset_collate, 'ENGINE') === false) {
            $charset_collate .= " ENGINE=InnoDB"; 
        }

        // Definir nombres de tablas
        $table_name_projects = $wpdb->prefix . 'pecan_projects';
        $table_name_campaigns = $wpdb->prefix . 'pecan_campaigns';
        $table_name_montes = $wpdb->prefix . 'pecan_montes';
        $table_name_productions = $wpdb->prefix . 'pecan_productions';
        $table_name_annual_records = $wpdb->prefix . 'pecan_annual_records';
        $table_name_investments = $wpdb->prefix . 'pecan_investments';
        $table_name_costs = $wpdb->prefix . 'pecan_costs';
        $table_name_yield_models = $wpdb->prefix . 'pecan_yield_models';

        $tables_created = [];

        // 1. Tabla de Proyectos (Actualizada con columnas geo y bench)
        $sql_projects = "CREATE TABLE $table_name_projects (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT UNSIGNED NOT NULL,
            project_name VARCHAR(255) NOT NULL,
            description TEXT NULL,
            
            -- Nuevas columnas integradas directamente
            pais VARCHAR(100) NULL,
            provincia VARCHAR(255) NULL,
            departamento VARCHAR(255) NULL,
            municipio VARCHAR(255) NULL,
            zona VARCHAR(255) NULL,
            allow_benchmarking TINYINT(1) NOT NULL DEFAULT 0,

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

        // 2. Tabla de Campañas (Actualizada con montes_*, y fechas VARCHAR)
        $sql_campaigns = "CREATE TABLE $table_name_campaigns (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            project_id BIGINT UNSIGNED NOT NULL,
            campaign_name VARCHAR(100) NOT NULL,
            year INT NOT NULL,
            
            -- Fechas actualizadas a VARCHAR(50) según migración 1.5.3
            start_date VARCHAR(50) NOT NULL,
            end_date VARCHAR(50) NULL,
            
            status ENUM('open', 'closed', 'archived') DEFAULT 'open',
            is_current TINYINT(1) DEFAULT 0,
            notes TEXT NULL,
            average_price DECIMAL(10,2) DEFAULT 0.00,
            total_production DECIMAL(15,2) DEFAULT 0.00,

            -- Columnas JSON legacy/actuales integradas
            montes_contribuyentes TEXT NULL,
            montes_production LONGTEXT NULL,

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

        // 3. Tabla de Montes
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

        // 4. Tabla de Producciones
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
        $tables_created[] = 'productions';

        // 5. Tabla de Registros Anuales
        $sql_annual = "CREATE TABLE $table_name_annual_records (
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
        dbDelta($sql_annual);
        $tables_created[] = 'annual_records';

        // 6. Tabla de Inversiones
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

        // 7. Tabla de Costos
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

        // 8. Tabla de Modelos
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

        // Log de creación
        if (!empty($tables_created)) {
            error_log('CCP DB: Created/Updated tables: ' . implode(', ', $tables_created));
        }

        // --- IMPORTANTE: FORZAR CLAVES FORÁNEAS MANUALMENTE ---
        // dbDelta suele borrar los ON DELETE CASCADE, así que los reaplicamos siempre
        self::enforce_foreign_keys();

        // Actualizar versión
        update_option(self::$db_version_key, self::$db_version);
    }

    /**
     * FUERZA las relaciones (Foreign Keys) manualmente.
     * Soluciona el problema de que dbDelta elimina los ON DELETE CASCADE y crea tablas huerfanas.
     */
    public static function enforce_foreign_keys() {
        global $wpdb;

        $t_projects    = $wpdb->prefix . 'pecan_projects';
        $t_campaigns   = $wpdb->prefix . 'pecan_campaigns';
        $t_montes      = $wpdb->prefix . 'pecan_montes';
        $t_prod        = $wpdb->prefix . 'pecan_productions';
        $t_annual      = $wpdb->prefix . 'pecan_annual_records';
        $t_invest      = $wpdb->prefix . 'pecan_investments';
        $t_costs       = $wpdb->prefix . 'pecan_costs';
        $t_models      = $wpdb->prefix . 'pecan_yield_models';

        $queries = [
            // Campañas -> Proyectos
            "ALTER TABLE $t_campaigns ADD CONSTRAINT fk_ccp_camp_proj FOREIGN KEY (project_id) REFERENCES $t_projects(id) ON DELETE CASCADE",
            // Montes -> Proyectos
            "ALTER TABLE $t_montes ADD CONSTRAINT fk_ccp_monte_proj FOREIGN KEY (project_id) REFERENCES $t_projects(id) ON DELETE CASCADE",
            // Producciones -> Varios
            "ALTER TABLE $t_prod ADD CONSTRAINT fk_ccp_prod_proj FOREIGN KEY (project_id) REFERENCES $t_projects(id) ON DELETE CASCADE",
            "ALTER TABLE $t_prod ADD CONSTRAINT fk_ccp_prod_camp FOREIGN KEY (campaign_id) REFERENCES $t_campaigns(id) ON DELETE CASCADE",
            "ALTER TABLE $t_prod ADD CONSTRAINT fk_ccp_prod_monte FOREIGN KEY (monte_id) REFERENCES $t_montes(id) ON DELETE CASCADE",
            // Registros Anuales
            "ALTER TABLE $t_annual ADD CONSTRAINT fk_ccp_ann_proj FOREIGN KEY (project_id) REFERENCES $t_projects(id) ON DELETE CASCADE",
            // Inversiones
            "ALTER TABLE $t_invest ADD CONSTRAINT fk_ccp_inv_proj FOREIGN KEY (project_id) REFERENCES $t_projects(id) ON DELETE CASCADE",
            // Costos
            "ALTER TABLE $t_costs ADD CONSTRAINT fk_ccp_cost_proj FOREIGN KEY (project_id) REFERENCES $t_projects(id) ON DELETE CASCADE",
            // Modelos
            "ALTER TABLE $t_models ADD CONSTRAINT fk_ccp_model_proj FOREIGN KEY (project_id) REFERENCES $t_projects(id) ON DELETE CASCADE"
        ];

        foreach ($queries as $query) {
            $wpdb->suppress_errors(); // Evitar error si la key ya existe
            $wpdb->query($query);
            $wpdb->suppress_errors(false);
        }
        error_log('CCP DB: Foreign Keys enforced manually.');
    }
}