# Themes

Libro de Wordpress Themes

## 1: Theme Basics

## Archivos

home.php—used to display the home page

single.php—used to display a single post

page.php—used to display a single page

category.php—used to display a category archive

author.php—used to display an author archive

date.php—used to display a date- or time-based archive

archive.php—used to display a generic archive if category.php, author.php,

or date.php are not present

search.php—used to display search results

404.php—used when no results match a query

## Special WordPress functions:

header.php—get_header()

footer.php—get_footer()

sidebar.php—get_sidebar()

comments.php—comment_form()

A child theme is a theme that has a unique stylesheet but inherits the template files from a parent theme.

In addition, a child theme can selectively override certain template files.

## Hooks

There are three WordPress hooks that you need to add to almost every custom theme.

They are:

wp_head

wp_footer

comment_form

Plugins use these hooks to add to or modify the rendered output of a theme's template files.

Often the modification includes linking to or outputting JavaScript, CSS, or HTML code

The include function does exactly what you would think it does: it includes the contents of the separate file wherever you use it.

TEMPLATEPATH is a constant defined by WordPress that holds the directory path to the

directory that contains the template used to render output for the theme.

### 2: Navigation

```php
<?php wp_list_pages(); ?> generate a linked list of all your pages.

<?php wp_list_categories(); 

wp_list_categories(array('parameter_name' => 'parameter_value')) can be

//modified by passing parameters to the function

wp_tag_cloud(array( //generate a linked list of all of your tags

'format' => 'list',

'unit' => ''

));
?>
```

Search form: Of particular note in this recipe is the use of two WordPress functions. The first is get_search_query. This function retrieves the search query text that a user submitted, so that the user can see what they searched for. In addition, the site_url function is used to output the home page

for the blog

### 3: The Loop

The Loop is the basic building block of WordPress template files. You'll use The Loop when displaying posts and pages. both when you're showing multiple items or a single one.

```php
<?php

if( have_posts() ) {

while( have_posts() ) {
	
	the_post();
	
	?>
	
	<h2><?php the_title(); ?></h2>
	
	<?php
	
	}

}

?>
```

First, you should recognize that this is just a standard while loop with a surrounding if conditional.

The next thing to understand about this generic loop is that it depends directly on the global $wp_query object. $wp_query is created when the request is parsed.

$wp_query is an instance of the WP_Query object, and the have_posts and the_post functions delegate to methods on that object.

The $wp_query object holds information about the posts to be displayed and the type of

page being displayed. It determines whether any posts matched the request that was made, and if so, whether there are any posts that haven't been iterated over.

Displaying only posts of certain category:

```php
<?php

$cat_name = 'My Category Name';

query_posts(array('category_name'=>$cat_name));

if(have_posts() ) {

	while(have_posts() ) {
	
	the_post();

	}

}

?>
```

### 4. Template Tags

```php
<?php

if(have_posts()) {

while(have_posts()) {

	// Display content here
	
	<?php
	
	> the_ID
	> the_title
	> the_title_attribute
	> the_content
	> the_excerpt
	> the_category
	> the_tags
	> next_post_link
	> next_posts_linK
	> previous_post_link
	> previous_posts_link
	
	?>
	
	}

}
```

The is_page function utilizes the global $wp_query variable and its data to verify that a

page is being viewed and that the page being viewed matches the conditions specified by

the function's parameter

```php
<?php the_time( 'F j, Y' ); ?>

<?php wp_loginout(); ?>

<?php

if ( ! is_user_logged_in() ) {

$link = '<a href="' . wp_login_url() . '">' . __('Log in text') .

'</a>';

} else {

$link = '<a href="' . wp_logout_url() . '">' . __('Log out text') .

'</a>';

}

print $link;

?>

<?php 
//The next_posts_link and previous_posts_link functions each print a link that allows users to navigate through the archives of a site

edit_post_link('Edit this entry','','.'); ?>

<?php
//Detects the currently logged in user's role and capabilities. If the user is logged in and he or she has the ability to modify the post that is currently being displayed, then the Edit link appears.
echo get_post_meta(get_the_ID(), 'meta_name', true); //Displaying custom fields

?>
```

### 5. Comments

```php
?php comments_template(); ? in the single.php or page.php

<ol class="commentlist">

<?php wp_list_comments(); ?>

</ol>
```

### 6.Sidebars

Can be created to display various data, including posts, comments, or links. Anything that isn't a main piece of content, but that you want to show to your site's visitors, is a great item to put in a sidebar.

```php
**<?php get_sidebar(); ?>**
```

### 7. Custom Page Templates

allows web developers and designers to display different content in a myriad of different ways.

wp_get_archives

wp_list_categories

wp_tag_cloud to display items from any taxonomy, by passing a taxonomy name in as a parameter

get_users_of_blog

the_author_meta

global $wp_query;

$id = $wp_query->get_queried_object_id();

$author = new WP_User($id);

$num_posts = get_usernumposts($id);

7. Author Information

You can use $authordata and get_userdata to customize your theme in many ways

get_the_author_meta. We can get:

user_login

user_pass

user_nicename

user_email

user_url

user_registere

user_activation

user_status

display_name

nickname

first_name

etc

### 7. Adding JavaScript

```jsx
//wp_enqueue_script para encolar archivos js
	
	jQuery(document).ready(function() {
	
	jQuery('.widget h2.widgettitle').click(function(event) {
	
	event.preventDefault();
	
	jQuery(this).siblings('div:first').toggle();
	
	});

});
```

Using JavaScript to create fancy animations and add unnecessary but interesting interaction

is great. However, the real boon comes when you use it to provide users with something that

helps them to use your site, and that emphasizes your content.