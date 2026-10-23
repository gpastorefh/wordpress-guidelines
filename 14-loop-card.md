# 14. Loop di contenuti e template delle card

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `parts/card-{post-type}.php` · `src/components/Card*Cmp/` · `src/components/GridModuleCmp/`

## Il "Loop" di WordPress

Il pattern standard per ciclare su un elenco di contenuti è:

```php
$query = new WP_Query(['post_type' => 'project', 'posts_per_page' => 12]);

while ($query->have_posts()) {
    $query->the_post();         // imposta il "post corrente" globale
    // qui funzionano get_the_title(), get_permalink(), get_the_ID()...
}
wp_reset_postdata();            // ripristina il post corrente originale
```

## Le card come template del loop

Ogni post type ha una card in `parts/card-{post-type}.php`. Il contratto è:

1. **viene inclusa dentro un loop**: legge il post corrente con le funzioni di WordPress (`get_the_title()`, `get_permalink()`, `has_post_thumbnail()`…), non riceve il post come argomento;
2. riceve solo **opzioni di presentazione** in `$args` (tema chiaro/scuro, tag dei titoli, `hideDate`…), con default sensati;
3. produce un `<wp-proxy-cmp>` verso un componente card Vue (`CardContentCmp`, `CardEventCmp`, `CardProfileCmp`…).

```php
// parts/card-project.php (semplificato)
$theme    = $args['theme'] ?? 'dark';
$titleTag = $args['titleTag'] ?? 'h3';

$config = [
    'link' => ['title' => __('Read', 'wpx-starter'), 'url' => get_permalink()],
    'theme' => $theme,
    'titleTag' => $titleTag,
];
?>
<wp-proxy-cmp data-component="CardContentCmp" <?php echo Html::attributes(['data-config' => $config]); ?>>
    <?php if (has_post_thumbnail()) { ?>
    <div data-v-slot="image"><?php echo get_the_post_thumbnail(null, 'large'); ?></div>
    <?php } ?>
    <?php printf('<%1$s data-v-slot="title">%2$s</%1$s>', $titleTag, esc_html(get_the_title())); ?>
</wp-proxy-cmp>
```

## Chi usa le card

Grazie alla convenzione sul nome del file, chiunque può renderizzare un elenco di qualsiasi tipo senza conoscerne la card:

```php
get_template_part('parts/card-' . $postType, null, ['theme' => 'light']);
```

Lo fanno: il blocco **Hub contenuti**, lo **Slider di contenuti**, la sezione **correlati** dei singoli, i **risultati di ricerca**, l'archivio della tassonomia pubblica.

**Perché questo approccio?** Una card è definita **una volta sola** per tipo di contenuto. Se cambia il design della card degli eventi, cambia ovunque compaia un evento. E aggiungere un nuovo CPT agli hub richiede solo di scrivere la sua `card-{post-type}.php`.

## Card dentro una griglia Vue

Il componente griglia (`GridModuleCmp`) riceve le card come slot numerati `item-1`, `item-2`… e li ordina numericamente:

```php
<wp-proxy-cmp data-component="GridModuleCmp" <?php echo Html::attributes(['data-config' => $config]); ?>>
    <?php while ($query->have_posts()) { $query->the_post(); $index++; ?>
        <div data-v-slot="item-<?php echo $index; ?>">
            <?php get_template_part('parts/card-' . $postType, null, [...]); ?>
        </div>
    <?php } wp_reset_postdata(); ?>
</wp-proxy-cmp>
```

Così un componente Vue contiene altri componenti Vue, tutti generati dal server.

---

← [13. Hub di contenuti e template singoli](13-hub-template-singoli.md) · [Indice](README.md) · [15. Opzioni tema, header e footer](15-opzioni-header-footer.md) →
