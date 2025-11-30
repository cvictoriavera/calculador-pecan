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

// Encolar los assets de React
wp_enqueue_script('calculador-pecan-js', plugin_dir_url(__FILE__) . '../dist/assets/index-D5wpJy8s.js', [], '1.0.0', true);
wp_enqueue_style('calculador-pecan-css', plugin_dir_url(__FILE__) . '../dist/assets/index-407422Hf.css', [], '1.0.0');

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