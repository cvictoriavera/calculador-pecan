<?php
/**
 * Template Name: Calculador Pecan Dashboard
 * Description: Plantilla full-width para el dashboard del plugin Calculador Pecan
 */

// Verificar si el usuario está logueado
if (!is_user_logged_in()) {
    wp_redirect(wp_login_url(get_permalink()));
    exit;
}

// Detectar modo: si existe manifest, usar producción; sino, desarrollo
$manifest_path = CALCULADOR_PECAN_PLUGIN_DIR . 'dist/.vite/manifest.json';

if (file_exists($manifest_path)) {
    // --- MODO PRODUCCIÓN ---
    $manifest = json_decode(file_get_contents($manifest_path), true);
    
    if ($manifest && isset($manifest['index.html'])) {
        $entry = $manifest['index.html'];
        
        // 1. Array para guardar las dependencias (scripts vendor)
        $dependencies = [];

        // 2. Verificar si hay "imports" (chunks separados como el vendor)
        if (!empty($entry['imports']) && is_array($entry['imports'])) {
            foreach ($entry['imports'] as $import_key) {
                // Buscamos el archivo en el manifiesto usando la llave (ej: "_vendor.js")
                if (isset($manifest[$import_key])) {
                    $import_chunk = $manifest[$import_key];
                    $vendor_handle = 'calculador-pecan-' . md5($import_key); // Nombre único
                    
                    wp_enqueue_script(
                        $vendor_handle, 
                        plugin_dir_url(__FILE__) . '../dist/' . $import_chunk['file'], 
                        [], 
                        null, 
                        true
                    );
                    
                    // Agregamos este vendor a las dependencias del script principal
                    $dependencies[] = $vendor_handle;
                }
            }
        }

        // 3. Cargar el script principal (dependiendo de los vendors si existen)
        $js_file = $entry['file'];
        wp_enqueue_script(
            'calculador-pecan-js', 
            plugin_dir_url(__FILE__) . '../dist/' . $js_file, 
            $dependencies, // Aquí pasamos las dependencias
            '1.0.0', 
            true
        );

        // 4. Cargar CSS
        if (isset($entry['css']) && is_array($entry['css'])) {
            foreach ($entry['css'] as $css_file) {
                wp_enqueue_style(
                    'calculador-pecan-css-' . basename($css_file), 
                    plugin_dir_url(__FILE__) . '../dist/' . $css_file, 
                    [], 
                    '1.0.0'
                );
            }
        }
    }
} else {
    // --- MODO DESARROLLO ---
    wp_enqueue_script('vite-client', 'http://localhost:5173/@vite/client', [], null, true);
    wp_enqueue_script('calculador-pecan-main', 'http://localhost:5173/src/main.tsx', ['vite-client'], null, true);
}

// Salida minimalista sin header/footer de WordPress
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php wp_title('|', true, 'right'); ?></title>
    <?php wp_head(); ?>
</head>
<body>
    <div id="root"></div>
    <?php wp_footer(); ?>
</body>
</html>
<?php
// Evitar que WordPress agregue más contenido
exit;

