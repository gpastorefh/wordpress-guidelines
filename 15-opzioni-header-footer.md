# 15. Opzioni tema, header e footer

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `includes/AcfFields/Bootstrap.php` · `includes/AcfFields/ThemeSettings.php` · `header.php` · `footer.php` · `src/components/HeaderCmp/` · `src/components/FooterCmp/`

## Options page

Alcuni dati non appartengono a nessuna pagina ma al sito intero: testi dell'header, link social, indirizzi nel footer, pagine hub. ACF li gestisce con le **options page**: pagine di impostazioni in bacheca i cui valori si leggono con `getOption()`.

Sono registrate in `AcfFields/Bootstrap.php`:

```php
acf_add_options_page([
    'page_title' => __('Theme Settings', 'wpx-starter'),
    'menu_slug'  => 'theme-settings',
    // ...
]);
```

e i campi sono in `AcfFields/ThemeSettings.php`, organizzati in **schede** (Tab): Header, Footer, Pagine Hub, Titoli contenuti correlati, Area riservata.

Esempio: aggiungere un link "Newsletter" nel footer.

```php
// 1. AcfFields/ThemeSettings.php — nella scheda Footer
Link::make(__('Newsletter link', 'wpx-starter'), 'newsletter_link')->wpmlTranslate(),
```

```php
// 2. footer.php — aggiungerlo al config passato al componente
$footerConfig = [
    // ...
    'newsletterLink' => $acf->getOption('newsletter_link', null), // null: link non impostato
];
```

```ts
// 3. FooterCmp.vue — nuova prop opzionale
newsletterLink?: WordpressLink;
```

```vue
<a v-if="newsletterLink" :href="newsletterLink.url" :target="newsletterLink.target">
  {{ newsletterLink.title }}
</a>
```

Infine la nuova etichetta (`'Newsletter link'`) va tradotta con la skill `translator`.

## Header e footer

`header.php` e `footer.php` sono inclusi da ogni template con `get_header()` / `get_footer()`. Entrambi:

1. raccolgono in un array `$headerConfig` / `$footerConfig` i dati dalle opzioni, dai menu e da WPML (lingue alternative);
2. renderizzano un `<wp-proxy-cmp data-component="HeaderCmp">` / `FooterCmp`;
3. **dentro** il proxy stampano un **markup di fallback** semplice (logo, `<nav>` con `<ul>` di link) generato in PHP.

```php
<div id="app" data-v-cloak>
    <wp-proxy-cmp data-component="HeaderCmp" <?php echo Html::attributes(['data-config' => $headerConfig]); ?>>
        <header>…link del menu in HTML semplice…</header>
    </wp-proxy-cmp>
    <div id="site-main-content" class="main-content">
        <!-- qui il contenuto della pagina -->
```

**Perché il fallback?** Il componente Vue `HeaderCmp` riceve il menu come dato JSON in `data-config`, che non è HTML navigabile. Il fallback garantisce che **nel sorgente HTML ci siano link veri** al menu (crawler, utenti senza JavaScript). Quando Vue monta, il proxy sostituisce il suo contenuto con il componente reale e il fallback viene ignorato. È un pattern usato in tutto il progetto, descritto nella [sezione 20](20-frontend-proxy.md).

Nota: l'apertura di `#app` avviene in `header.php` e la chiusura in `footer.php`: **tutto il contenuto della pagina vive dentro la root Vue**.

---

← [14. Loop di contenuti e template delle card](14-loop-card.md) · [Indice](README.md) · [16. Menu di navigazione](16-menu.md) →
