# Plugins

Los plugins o complementos son paquetes de código que amplían la funcionalidad principal de

WordPress. Los plugins de WordPress están formados por código PHP y otros activos como

imágenes, CSS y JavaScript.

El archivo PHP principal del plugin debe incluir un comentario de encabezado que le dice a

WordPress que un archivo es un complemento y proporciona información sobre el

complemento.

```php
<?php
/**
* Plugin Name: My Basics Plugin
* Plugin URI: https://example.com/plugins/the-basics/
* Description: Handle the basics with this plugin.
* Version: 1.10.3
* Requires at least: 5.2
* Requires PHP: 7.2
* Author: John Smith
* Author URI: https://author.example.com/
* License: GPL v2 or later
* License URI: https://www.gnu.org/licenses/gpl-2.0.html
* Text Domain: my-basics-plugin
* Domain Path: /languages
*/
```

### Activadores

```php
function res_install(){
//Acción a ejecutar
	require_once 'activador.php';
}
register_activation_hook(__FILE__, 'res_install');
	function res_desactivacion(){
	//Acción a ejecutar
	flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'res_desactivacion');
```

### En activador.php

```php
global $wpdb;
$charset = $wpdb->get_charset_collate();
$tabla = $wpdb->prefix . "mitabla";
$wpdb->query( "CREATE TABLE IF NOT EXISTS $tabla (
id mediumint(9) NOT NULL AUTO_INCREMENT,
nombre varchar(70) NOT NULL,
PRIMARY KEY(id)) $charset; ");
require_once ( ABSPATH . 'wp-admin/includes/upgrade.php');
```

### Mejores prácticas para definir nuestras variables

```php
// Variables
if( !isset( $mivariable ) ){
	$mivariable = 'nuevo valor';
}

// Funciones
if ( !function_exists( 'res_install' ) ){
	function res_install(){
	//escribimos nuestra función
	}
}

// Clases
if ( !class_exists( 'Res_Mi_Class' ) ){
class Res_Mi_Class {
//escribimos el código a ejecutar
}
}

// Constante
if( !defined( 'WP_UNINSTALL_PLUGIN' ) ){
	exit();
}

```

### Capacidades de usuario:

Las capacidades de usuario son las funciones que se pueden realizar dependiendo del rol que

tenga la persona dentro de la web, los roles que puede desempeñar una persona dentro de un

proyecto web son:

- Super Admin, Administrator, Editor, Author, Contributor, Subscriber

Existen varios métodos de validación de datos en wordpress, entre las más utilizadas podemos

encontrar las siguientes:

- is_email()
- term_exists()
- username_exists()
- validate_file()

Otras funciones de PHP para validar datos serian:

```php
isset() - empty()
mb_strlen() - strlen()
preg_match, strpos()
count()
in_array()
```

### Métodos de desinfección para la entrada de datos:

- sanitize_email()
- sanitize_file_name()
- sanitize_html_class()
- sanitize_key()
- sanitize_meta()
- sanitize_mime_type()
- sanitize_option()
- sanitize_sql_orderby()
- sanitize_text_field()
- sanitize_title()
- sanitize_title_for_query()
- sanitize_title_with_dashes()
- sanitize_user()
- esc_url_raw()
- wp_filter_post_kses()
- wp_filter_nohtml_kses()

### Nonces

El término «nonce» es la abreviación en inglés de «number used once», o número usado una

vez. En WordPress los nonces son cadenas de texto que parecen ser cadenas aleatorias, pero

en realidad no lo son ya que son generadas a través de funciones hash

```php
$url = wp_nonce_url( $url, 'ejemplo-nonce', 'nonce');

//Usando AJAX
wp_localize_script('dcms_miscript','dcms_vars',[ 'ajaxurl' => admin_url('admin-ajax.php'),
'nonce' => wp_create_nonce('ejemplo-nonce')]
);

// Para verificar la validez del nonce
if ( ! wp_verify_nonce( $_REQUEST['nonce'], 'ejemplo-nonce' ) ) {
	wp_die("Error - Verificación nonce no válida");
}
```

Los Nonces cambian cada 12 horas y es válido por 24 horas (es decir, el nonce actual tiene un

periodo de expiración de 24 horas, pero ese código generado se repetirá solo por 12 horas, y

luego cambiará por otro, siendo válidos los 2 en su periodo de tiempo).

### Crear un Menú en WordPress

Si quieres poder personalizar o tener tus propias páginas de configuración para vuestro plugin o vuestro tema esta es la mejor solución

```php
add_menu_page (
$page_title,
$menu_title,
$capability,
$menu_slug,
$function = '',
$icon_url = '',
$position = null
);
```

### Creando la función callback del menú

```html
if( !function_exists( 'res_options_page_display' ) ){
function res_options_page_display(){
<!--html-->
	<div class="wrap">
		<form action="" method="post">
			<input type="text" placeholder="Texto" name="" id="">
			<?php submit_button( 'Enviar' ); ?>
		</form>
	</div>
<?php
}
}
```

### Para remover menú

```php
remove_menu_page( 'res_pruebas_nonce' );
```

### Submenús

Los submenús son páginas de opciones adicionales que van dentro del menú que hemos

creado, para crear un submenú del menú RES Opciones de Página debemos de tener en cuenta

el slug que es res_options_page y escribimos lo siguiente:

```php
add_submenu_page(
'res_options_page',
'Submenu 1',
'Submenu 1',
'manage_options',
'res_submenu1_pruebas',
'res_submenu1_pruebas_display'
);
```

# Ganchos y Hooks

WordPress, a diferencia de otros gestores de contenido, utiliza una arquitectura basada en
eventos y procedimientos. Si quieres desarrollar tanto temas como plugins en este CMS, es
esencial que aprendas a utilizar el sistema de hooks o ganchos.

Los ganchos o hooks en WordPress son puntos concretos y estratégicos dentro del core de
WordPress que permiten añadir funcionalidades o modificar un comportamiento. Cuando la
secuencia de carga llegue a ese punto concreto, se ejecuta la función que has “enganchado”.

### Action Hook

```php
add_action (
 $tag,
 $function_to_add,
 $priority = 10,
 $accepted_args = 1
);
```

Las acciones o action hooks ejecutan una función propia en un lugar preciso en un momento
determinado de la línea de ejecución de WordPress.
Cuando llega a un punto concreto, realiza la acción que quieras además de las que ya se van a
ejecutar por defecto. En resumen, los action hooks añaden código adicional a tu WordPress.

La función do_action() crea un punto con el que puedas trabajar con el gancho wp_head.
Si abres el archivo header.php de tu theme principal, verás que entre las etiquetas <head></head> se llama a la función wp_head().

Pero la función do_action(); no solo se utiliza en el core de WordPress y esto es MUY
INTERESANTE.

En el siguiente enlace veras los distintos ganchos paracada widget:
[https://codex.wordpress.org/Function_Reference/unregister_widget](https://codex.wordpress.org/Function_Reference/unregister_widget)

Para ver todos los action hooks y saber en qué orden cargan podemos ir a la web de
wordpress:

[https://codex.wordpress.org/Plugin_API/Action_Reference/](https://codex.wordpress.org/Plugin_API/Action_Reference/)

### Filter Hooks

Los filtros o filter hooks de WordPress manipulan la información en un punto concreto de la
ejecución antes de que se muestre en la pantalla o se almacene en la base de datos

Por ejemplo, puedes cambiar el título de una página antes de que salga en la pantalla del
usuario, añadir más contenido al título de un post, cambiar el texto de un botón, etc…

```php
add_filter (
 $tag,
 $function_to_add,
 $priority = 10,
 $accepted_args = 1
);
```

Los filter hooks reciben un parámetro de entrada que tú vas a modificar y devolver al
hook correspondiente.
• No se llaman con la función do_action(), como en el caso de los action hooks, se utiliza
apply_filters(); por lo que tendrás que localizar en el código de WordPress los puntos
en los que puedes engancharte al hook con esta función.
• No se referencia con add_action(); sino que se usa add_filter();

```php
function atr_modificar_texto($texto){
 //El texto de Read More… se va a sustituir por la cadena que devuelva
s en esta función
 $texto="...";
 return $texto;
}
add_filter('excerpt_more','atr_modificar_texto');
```

Si quieres ver todos los filter hooks que existen y aprender a utilizarlos correctamente, te
recomiendo que visites la documentación oficial de WordPress:
[https://codex.wordpress.org/Plugin_API/Filter_Reference](https://codex.wordpress.org/Plugin_API/Filter_Reference)

### Ganchos personalizados

Los ganchos personalizados sirven para que otros desarrolladores puedan extender nuestros
plugins.
Para crear un gancho de acción personalizado, debemos utilizar la función do_action() y como
parámetro le pasaremos el nombre personalizado que queremos darle a nuestro nuevo
gancho de acción.

```php
// Crear gancho de acción
<?php do_action( 'res_extend_form' ); ?>

function res_añadir_campos_nuevos(){
	 ?>
	 <input type="text" placeholder="Apellidos" name="" id="">
	 <?php
}
add_action( 'res_extend_form', 'res_añadir_campos_nuevos' );
```

Asi mostraremos un campo nuevo de Apellidos en nuestro formulario del menú-admin

### Shortcodes

```php
function res_primer_shortcode( $atts, $content = null ){
 return '<h3 class="title">' . $content . '</h3>';
}
add_shortcode( 'res_texto', 'res_primer_shortcode' );
```

Observemos que en la funcion estamos pasando dos variables una es $atts con la cual
podemos crear un array de objetos para pasar distintos valores y otra es una variable $content
con un valor nulo o vacío lista para recibir lo que nosotros le pasemos.
El gancho de acción para el shortcode será add_shortcode() y el primer parámetro será el
nombre que le daremos a nuestro shortcode.

Ahora añadiremos un bloque widget y dentro veremos la opción shortcode hacemos click y
escribiremos lo siguiente para ver el shorcode desde nuestro frontend:
[res_texto] Mi primer shortcode [/res_texto]

Podremos ver información más detallada a cerca de la Api shortcode en el codex de
wordpress:
[https://codex.wordpress.org/Shortcode_API](https://codex.wordpress.org/Shortcode_API)