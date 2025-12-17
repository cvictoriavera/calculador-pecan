1. La Estrategia: "Modelo como Documento"
En lugar de que tu base de datos sea una hoja de cálculo gigante con miles de filas para cada año de cada árbol, trataremos cada "Curva de Productividad" como un Documento Único.

Hoy (MVP): El proyecto tendrá 1 fila llamada "Modelo General".

Futuro (Update): El proyecto tendrá N filas: una fila para "Modelo Mahan", otra fila para "Modelo Western", etc.

2. Estructura SQL (wp_pecan_yield_models)
Aquí tienes la definición de la tabla preparada para el futuro. La clave es la columna variety y la columna yield_data (JSON).

$table_name_models = $wpdb->prefix . 'pecan_yield_models';

$sql_models = "CREATE TABLE $table_name_models (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    project_id BIGINT UNSIGNED NOT NULL,
    
    -- PREPARADO PARA EL FUTURO:
    -- Hoy guardarás 'general' o NULL aquí. 
    -- Mañana guardarás 'mahan', 'pawnee', etc.
    variety VARCHAR(50) DEFAULT 'general', 
    
    -- Nombre amigable para mostrar en el selector (ej: 'Estándar INTA 2024')
    model_name VARCHAR(100) NOT NULL,
    
    -- EL CORAZÓN DE LA TABLA (JSON):
    -- Aquí guardas el array completo de los 20 o 30 años.
    -- Evita tener que hacer 30 inserts/updates.
    yield_data LONGTEXT NOT NULL, 
    
    is_active TINYINT(1) DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_project_variety (project_id, variety),
    
    -- Regla: No puedes tener dos modelos con el mismo nombre para la misma variedad en un proyecto
    UNIQUE KEY unique_model (project_id, variety, model_name),
    
    FOREIGN KEY (project_id) REFERENCES $table_name_projects(id) ON DELETE CASCADE
) $charset_collate;";

dbDelta($sql_models);


3. Estructura del JSON (yield_data)
Dentro de la columna yield_data, guardarás la curva completa. Esto es lo que tu Frontend (Zustand) enviará y recibirá.

Formato del JSON:

[
  { "year": 1, "kg": 0 },
  { "year": 2, "kg": 0 },
  { "year": 3, "kg": 0.5 },
  { "year": 4, "kg": 1.2 },
  { "year": 5, "kg": 3.0 },
  ...
  { "year": 20, "kg": 26.4 }
]