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

// Leer el manifest de Vite para obtener los assets correctos
$manifest_path = CALCULADOR_PECAN_PLUGIN_DIR . 'dist/.vite/manifest.json';
if (file_exists($manifest_path)) {
    $manifest = json_decode(file_get_contents($manifest_path), true);
    if ($manifest && isset($manifest['index.html'])) {
        $entry = $manifest['index.html'];
        $js_file = $entry['file'];
        wp_enqueue_script('calculador-pecan-js', plugin_dir_url(__FILE__) . '../dist/' . $js_file, [], '1.0.0', true);
        if (isset($entry['css']) && is_array($entry['css'])) {
            foreach ($entry['css'] as $css_file) {
                wp_enqueue_style('calculador-pecan-css-' . basename($css_file), plugin_dir_url(__FILE__) . '../dist/' . $css_file, [], '1.0.0');
            }
        }
    }
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
    <div id="calculador-pecan-root"></div>
    <?php wp_footer(); ?>
</body>
</html>
<?php
// Evitar que WordPress agregue más contenido
exit;