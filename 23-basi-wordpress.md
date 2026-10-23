# 23. WordPress in pratica: le API usate nel tema

Questa sezione è un'infarinatura delle funzioni e dei meccanismi di WordPress che si incontrano leggendo il codice del tema. Non sostituisce la documentazione ufficiale ([Code Reference](https://developer.wordpress.org/reference/), [Theme Handbook](https://developer.wordpress.org/themes/), [Plugin Handbook](https://developer.wordpress.org/plugins/)), ma spiega quanto basta per orientarsi. Per ogni argomento c'è un rimando a dove lo si vede usato nel progetto di esempio.

<a id="ciclo-richiesta"></a>

## Il ciclo di una richiesta

Per capire *quando* scatta un hook o *perché* una funzione non restituisce ancora nulla, aiuta avere in mente cosa fa WordPress a ogni richiesta:

```
richiesta HTTP
   │
   ▼
caricamento: wp-config.php, plugin, functions.php del tema
   │  after_setup_theme   supporti del tema, menu, text domain
   │  init                post type, tassonomie, cron
   │  rest_api_init       solo per le richieste alla REST API
   ▼
analisi dell'URL e query principale
   │  request             correggere le variabili ricavate dall'URL
   │  pre_get_posts       modificare la query principale prima che parta
   │  template_redirect   ultimo momento per un redirect o una risposta custom
   ▼
scelta del template (gerarchia), es. single-project.php
   │  get_header()  → header.php → wp_head()      (qui scatta wp_enqueue_scripts)
   │  corpo della pagina: loop, template part, Post Builder
   │  get_footer()  → footer.php → wp_footer()
   ▼
risposta HTML
```

Conseguenze pratiche:

- i post type si registrano su `init`: prima non esistono, e una `WP_Query` su quel tipo lanciata direttamente in `functions.php` non troverebbe nulla;
- funzioni come `is_singular()` o `get_queried_object()` hanno senso solo **dopo** che la query principale è stata eseguita (da `template_redirect` in poi);
- i CSS e i JS vanno accodati prima che `wp_head()` li stampi.

<a id="hook"></a>

## Hook: actions e filtri

Il meccanismo è introdotto nella [sezione 4](04-tema-wordpress.md). In breve: un'**action** è un momento in cui eseguire codice, un **filtro** è un valore che si può modificare restituendone uno nuovo.

```php
// action: nessun valore di ritorno
add_action('init', [$this, 'register']);

// filtro: riceve il valore, restituisce il valore (modificato o no)
add_filter('upload_mimes', function (array $mimes): array {
    $mimes['svg'] = 'image/svg+xml';
    return $mimes;
});
```

Due parametri opzionali contano spesso:

```php
add_filter('posts_search', [$this, 'search'], 10, 2);
//                                            │   └── quanti argomenti passare alla callback (default 1)
//                                            └────── priorità: numeri bassi prima (default 10)
```

- **priorità**: serve per eseguire la propria callback prima o dopo quella di un plugin o del core;
- **argomenti**: molti hook passano più di un valore (`posts_search` passa la stringa SQL e la `WP_Query`), ma la callback li riceve solo se lo si chiede.

`remove_action()` / `remove_filter()` staccano una callback già agganciata, con **gli stessi** nome, callback e priorità usati per agganciarla. È così che lavora `Cleanup/` (ad esempio `HeadCleanup` toglie dall'`<head>` i tag che WordPress aggiunge di default).

**Filtri usati come API.** Alcuni plugin espongono le loro funzioni come filtri, così il codice non va in errore se il plugin è disattivato. WPML è il caso tipico: `apply_filters('wpml_object_id', $id, 'page', false)` restituisce l'ID tradotto se WPML è attivo, altrimenti il filtro non ha callback e restituisce l'ID originale. Il tema incapsula queste chiamate in `Support/Wpml` ([sezione 18](18-traduzioni.md)).

Hook che si incontrano più spesso nel tema:

| Hook                         | Tipo   | Usato per                                                       | Dove                                   |
|------------------------------|--------|-----------------------------------------------------------------|----------------------------------------|
| `after_setup_theme`          | action | supporti del tema, posizioni dei menu, text domain              | `Setup/ThemeSetup`                     |
| `init`                       | action | registrare post type, tassonomie, eventi cron                   | `PostTypes/`, `Taxonomies/`, `Search/` |
| `acf/include_fields`         | action | registrare i gruppi di campi ACF                                | `AcfFields/Bootstrap`                  |
| `wp_enqueue_scripts`         | action | accodare CSS e JS del sito                                      | `Setup/Assets`                         |
| `admin_enqueue_scripts`      | action | accodare CSS e JS della bacheca                                 | `Cleanup/Autosave`                     |
| `wp_head`                    | action | stampare qualcosa nell'`<head>` (CSS critico, meta tag)         | `Setup/Assets`, `Setup/MetaTags`       |
| `request`                    | filtro | correggere le variabili della richiesta (paginazione degli hub) | `Setup/HubPagePagination`              |
| `pre_get_posts`              | action | modificare la query principale                                  | `Setup/`, `Admin/`                     |
| `posts_join`, `posts_search` | filtro | modificare l'SQL di una `WP_Query`                              | `Search/SearchQuery`                   |
| `template_redirect`          | action | redirect, risposte che non sono una pagina                      | `Setup/ProtectedAttachments`           |
| `acf/save_post`              | action | reagire al salvataggio di un contenuto                          | `Search/SaveHook`                      |
| `rest_api_init`              | action | registrare endpoint REST                                        | `Setup/RestApi`                        |
| `admin_post_{azione}`        | action | gestire l'invio di un form                                      | `Auth/`                                |

<a id="loop"></a>

## Il Loop e il "post corrente"

WordPress ha un **post corrente** globale. Le funzioni dei template (`get_the_title()`, `get_permalink()`, `get_the_ID()`…) leggono quello, senza bisogno di passare un ID. Il ciclo che lo imposta è il **Loop**:

```php
while (have_posts()) {    // ci sono altri risultati nella query?
    the_post();           // passa al successivo e lo rende "corrente"
    echo esc_html(get_the_title());
}
```

Nei template singoli (`single-*.php`, `page.php`) il risultato è uno solo, quindi basta un `the_post()` all'inizio, senza ciclo.

**`the_*` o `get_the_*`?** Quasi ogni funzione esiste in due versioni: `the_title()` **stampa**, `get_the_title()` **restituisce**. Nel tema si usano sempre le versioni `get_*`, perché il valore va passato a un componente (nel `data-config`) o va fatto passare da un escape scelto da noi.

Funzioni del post corrente usate di frequente:

| Funzione                                | Restituisce                                              |
|-----------------------------------------|----------------------------------------------------------|
| `get_the_ID()`                          | l'ID                                                     |
| `get_the_title()`                       | il titolo                                                |
| `get_permalink()`                       | l'URL pubblico                                           |
| `get_the_excerpt()`                     | il riassunto                                             |
| `get_post_type()`                       | il tipo (`page`, `project`…)                             |
| `has_post_thumbnail()`                  | se ha un'immagine in evidenza                            |
| `get_the_post_thumbnail(null, 'large')` | il tag `<img>` completo di `srcset`                      |
| `wp_get_attachment_image($id, 'large')` | lo stesso, per un'immagine qualsiasi (ad esempio da ACF) |
| `get_the_terms(get_the_ID(), 'topic')`  | i termini di una tassonomia                              |

Tutte accettano anche un ID o un post esplicito come argomento, per lavorare su un contenuto che non è quello corrente.

<a id="wp-query"></a>

## `WP_Query`: interrogare i contenuti

`WP_Query` è la classe con cui si chiede a WordPress un elenco di contenuti. Si usa insieme al Loop, chiamando i metodi sull'oggetto invece delle funzioni globali:

```php
$query = new WP_Query([
    'post_type'      => 'project',
    'posts_per_page' => 12,
    'paged'          => max(1, (int) get_query_var('paged')),
    'orderby'        => 'date',
    'order'          => 'DESC',
    'tax_query'      => [
        ['taxonomy' => 'topic', 'field' => 'term_id', 'terms' => [12]],
    ],
]);

while ($query->have_posts()) {
    $query->the_post();
    get_template_part('parts/card-project');
}
wp_reset_postdata(); // ripristina il post corrente della pagina
```

Gli argomenti più usati:

| Argomento                  | A cosa serve                                                                          |
|----------------------------|---------------------------------------------------------------------------------------|
| `post_type`                | tipo (o array di tipi) da cercare                                                     |
| `posts_per_page`, `paged`  | quanti risultati per pagina e quale pagina (`-1` = tutti)                             |
| `post__in`, `post__not_in` | includere o escludere ID precisi (con `orderby => 'post__in'` mantiene l'ordine dato) |
| `orderby`, `order`         | ordinamento (`date`, `title`, `menu_order`, `meta_value`…)                            |
| `tax_query`                | filtrare per termini di tassonomia                                                    |
| `meta_query`               | filtrare per valori di campi (post meta, quindi anche campi ACF)                      |
| `s`                        | ricerca testuale                                                                      |
| `no_found_rows => true`    | salta il conteggio totale: più veloce quando non serve la paginazione                 |
| `fields => 'ids'`          | restituisce solo gli ID                                                               |

Dopo l'esecuzione, `$query->found_posts` è il numero totale di risultati e `$query->max_num_pages` il numero di pagine: è quello che gli hub passano a Vue per la paginazione ([sezione 13](13-hub-template-singoli.md)).

> ⚠️ **`wp_reset_postdata()` dopo ogni loop secondario.** `the_post()` sovrascrive il post corrente globale: senza il reset, tutto ciò che viene dopo il loop (correlati, breadcrumb, footer) leggerebbe l'ultimo progetto dell'elenco invece della pagina.

**`get_posts()`** è una scorciatoia che restituisce direttamente un array di oggetti `WP_Post`, senza Loop. Va bene quando servono solo i dati (ID, titoli) e non i template.

<a id="pre-get-posts"></a>

### La query principale e `pre_get_posts`

Per ogni richiesta WordPress esegue da solo una **query principale**, ricavata dall'URL (la pagina, il singolo progetto, l'archivio di una tassonomia…). Per modificarla non si crea una nuova `WP_Query` nel template, che significherebbe fare la query due volte: si interviene prima che parta, con `pre_get_posts`:

```php
add_action('pre_get_posts', function (WP_Query $query): void {
    // solo il frontend, solo la query principale, solo l'archivio che interessa
    if (is_admin() || !$query->is_main_query() || !$query->is_tax('region')) {
        return;
    }

    $query->set('posts_per_page', 9);
});
```

Il controllo iniziale è indispensabile: `pre_get_posts` scatta per **tutte** le query, comprese quelle della bacheca, dei menu e dei blocchi. È lo schema usato da `Setup/ReservedContentCategoryPagination`.

<a id="template"></a>

## Template e template part

| Funzione                                               | Cosa fa                                                      |
|--------------------------------------------------------|--------------------------------------------------------------|
| `get_header()` / `get_footer()`                        | include `header.php` / `footer.php`                          |
| `get_template_part('parts/card-project', null, $args)` | include `parts/card-project.php`, passandogli `$args`        |
| `get_template_directory()`                             | percorso su disco della cartella del tema (per leggere file) |
| `get_template_directory_uri()`                         | URL pubblico della cartella del tema (per `src` e `href`)    |

`get_template_part()` non restituisce nulla e non segnala errori: se il file non esiste, semplicemente non stampa niente. Dentro il file incluso i dati passati sono nell'array `$args`.

Il tema non è un *child theme*, quindi si usano le funzioni `get_template_*`. In un child theme le equivalenti per la cartella del tema figlio sono `get_stylesheet_directory()` e `get_stylesheet_directory_uri()`.

**Conditional tag.** Funzioni che dicono che tipo di pagina si sta servendo: `is_front_page()`, `is_page()`, `is_singular('project')`, `is_tax('region')`, `is_search()`, `is_404()`, `is_admin()` (siamo in bacheca?). `get_queried_object()` restituisce l'oggetto richiesto dall'URL: il post, il termine della tassonomia, ecc.

**Le funzioni obbligatorie di `header.php` e `footer.php`.** Plugin e core contano sulla loro presenza per aggiungere i propri tag:

```php
<html <?php language_attributes(); ?>>   // lang="it-IT"
<head>
    <?php wp_head(); ?>                    // CSS, JS, meta, SEO…
</head>
<body <?php body_class(); ?>>             // classi sul tipo di pagina
<?php wp_body_open(); ?>                   // inizio del body (tag manager, ecc.)
…
<?php wp_footer(); ?>                      // JS in fondo, barra di amministrazione
</body>
```

<a id="enqueue"></a>

## CSS e JS: `wp_enqueue_*`

In WordPress non si scrivono a mano i tag `<script>` e `<link>`: si **accodano** e WordPress li stampa al momento giusto (`wp_head()` o `wp_footer()`), una sola volta e nell'ordine richiesto dalle dipendenze.

```php
add_action('wp_enqueue_scripts', function (): void {
    $jsPath = get_template_directory() . '/assets/slider.js';
    $cssPath = get_template_directory() . '/assets/slider.css';

    wp_enqueue_script(
        'wpx-slider',                                         // handle: nome univoco
        get_template_directory_uri() . '/assets/slider.js',   // URL
        ['jquery'],                                           // dipendenze (altri handle)
        (string) filemtime($jsPath),                          // versione: aggiunta come ?ver=…
        true                                                  // true = in fondo alla pagina
    );

    wp_enqueue_style(
        'wpx-slider',
        get_template_directory_uri() . '/assets/slider.css',
        [],
        (string) filemtime($cssPath)
    );
});
```

- **handle**: identifica la risorsa. Se due codici accodano lo stesso handle, viene incluso una volta sola; un plugin può anche toglierlo con `wp_dequeue_script()`;
- **versione**: finisce nell'URL come `?ver=…` e serve a invalidare la cache del browser. Usare `filemtime()` del file fa cambiare la versione a ogni modifica;
- **hook giusto**: `wp_enqueue_scripts` per il sito, `admin_enqueue_scripts` per la bacheca (ACF ha anche `acf/input/admin_enqueue_scripts`, che scatta solo nelle schermate con campi ACF).

**Passare dati al JS.** `wp_localize_script('wpx-slider', 'wpxSlider', ['url' => …])` crea un oggetto globale `window.wpxSlider` prima dello script. Lo usa `Setup/AcfIconSelectAssets` per dire al JS dove sono le icone ([sezione 10](10-icone.md)). L'alternativa più generica è `wp_add_inline_script()`.

**Moduli ES.** Lo script principale di Vite è un modulo JavaScript, quindi `Setup/Assets` usa `wp_enqueue_script_module()` (disponibile da WordPress 6.5), che stampa `<script type="module">`. Il caso del dev server, dove i tag sono stampati a mano, è spiegato nella [sezione 22](22-asset-build.md).

<a id="gettext"></a>

## Traduzioni: le funzioni gettext

Ogni stringa visibile scritta nel codice passa da una funzione di traduzione, con il **text domain** del tema come ultimo argomento:

| Funzione                                           | Cosa fa                                                        |
|----------------------------------------------------|----------------------------------------------------------------|
| `__('Read more', 'wpx-starter')`                   | restituisce la stringa tradotta                                |
| `_e('Read more', 'wpx-starter')`                   | la stampa (senza escape)                                       |
| `esc_html__()`, `esc_attr__()`                     | restituisce tradotta **ed escapata** per testo o attributo     |
| `esc_html_e()`, `esc_attr_e()`                     | come sopra, ma stampa                                          |
| `_x('Post', 'verb', 'wpx-starter')`                | con un **contesto**, per parole uguali con significati diversi |
| `_n('%s result', '%s results', $n, 'wpx-starter')` | singolare o plurale in base a `$n`                             |

Con valori variabili si usa un segnaposto e `sprintf()`, mai la concatenazione: chi traduce deve poter spostare il valore nella frase.

```php
// sbagliato: "results" non è traducibile da solo e l'ordine è fisso
echo $count . ' ' . __('results', 'wpx-starter');

// giusto
printf(
    /* translators: %s: number of results */
    esc_html(_n('%s result', '%s results', $count, 'wpx-starter')),
    number_format_i18n($count)
);
```

Il text domain va scritto **come stringa letterale**, non in una variabile o costante: gli strumenti che estraggono le stringhe nel `.pot` leggono il codice senza eseguirlo. Per le date localizzate (nomi di giorni e mesi nella lingua del sito) si usano `date_i18n()` o `wp_date()`. Il flusso completo dei file `.pot`/`.po`/`.mo` è nella [sezione 18](18-traduzioni.md).

<a id="escape"></a>

## Sanitizzare l'input, fare l'escape dell'output

Sono due operazioni diverse, in due momenti diversi:

- **sanitizzare** = pulire un dato quando **entra** (da un form, dall'URL, da una richiesta REST), prima di usarlo o salvarlo;
- **escape** = rendere sicuro un dato quando **esce** verso l'HTML, il più tardi possibile e in base a dove finisce.

| Entrata (sanitizzare)                                | Uscita (escape)                                                |
|------------------------------------------------------|----------------------------------------------------------------|
| `sanitize_text_field()` — testo su una riga          | `esc_html()` — testo dentro un tag                             |
| `sanitize_textarea_field()` — testo multiriga        | `esc_attr()` — valore di un attributo                          |
| `sanitize_email()`                                   | `esc_url()` — URL in `href`/`src`                              |
| `absint()` — intero positivo (ID)                    | `wp_kses_post()` — HTML con i soli tag ammessi nei contenuti   |
| `wp_unslash()` — da usare prima, su `$_POST`/`$_GET` | `wp_kses($html, $tagAmmessi)` — HTML con una whitelist propria |

L'escape si fa **anche sui dati che "vengono da noi"** (titoli, campi ACF, opzioni): un redattore o un plugin compromesso possono inserirci qualsiasi cosa. Le regole del tema e gli helper di `Support/Html` sono nella [sezione 24](24-convenzioni.md).

<a id="form-nonce"></a>

## Form: `admin-post.php` e nonce

Un form del frontend che deve eseguire codice PHP (login, registrazione) punta a `admin-post.php` con un campo `action`. WordPress esegue l'action `admin_post_{action}` per gli utenti collegati e `admin_post_nopriv_{action}` per i visitatori:

```php
<form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
    <input type="hidden" name="action" value="wpx_starter_newsletter">
    <?php wp_nonce_field('wpx_starter_newsletter', 'wpx_starter_newsletter_nonce'); ?>
    <input type="email" name="email">
</form>
```

```php
add_action('admin_post_wpx_starter_newsletter', [$this, 'handle']);
add_action('admin_post_nopriv_wpx_starter_newsletter', [$this, 'handle']);

public function handle(): void
{
    check_admin_referer('wpx_starter_newsletter', 'wpx_starter_newsletter_nonce'); // altrimenti si ferma

    $email = sanitize_email(wp_unslash($_POST['email'] ?? ''));
    // …

    wp_safe_redirect(add_query_arg(['newsletter' => 'ok'], wp_get_referer() ?: home_url('/')));
    exit;
}
```

- il **nonce** ("number used once") è un token legato all'utente e all'azione: garantisce che la richiesta parta da un form del sito e non da una pagina esterna (CSRF). `wp_nonce_field()` lo stampa, `check_admin_referer()` o `wp_verify_nonce()` lo verificano;
- `wp_safe_redirect()` accetta solo URL del sito, quindi un parametro manipolato non può mandare l'utente altrove. Va sempre seguito da `exit`.

È lo schema delle classi in `Auth/`. Per le richieste fatte da JavaScript il tema usa invece la **REST API**: `register_rest_route()` su `rest_api_init`, con `permission_callback` per il controllo d'accesso e `sanitize_callback` per ogni parametro (`Setup/RestApi`).

<a id="dati"></a>

## Dati: opzioni, meta e transient

| API                                      | Dove salva                 | Uso tipico                                                                       |
|------------------------------------------|----------------------------|----------------------------------------------------------------------------------|
| `get_option()` / `update_option()`       | tabella `wp_options`       | impostazioni globali, stato interno (ad esempio l'offset del cron della ricerca) |
| `get_post_meta()` / `update_post_meta()` | tabella `wp_postmeta`      | dati legati a un contenuto (è dove ACF salva i campi)                            |
| `get_term_meta()`, `get_user_meta()`     | meta di termini e utenti   | come sopra, per termini e utenti                                                 |
| `set_transient()` / `get_transient()`    | `wp_options`, con scadenza | cache temporanea, messaggi da mostrare una volta sola                            |

I campi ACF si leggono sempre con il wrapper `Support\Acf`, non con `get_post_meta()` ([sezione 6](06-acf.md)): ACF salva valori grezzi (ad esempio solo l'ID di un'immagine) che `get_field()` trasforma nel formato configurato. Un transient è un'opzione che scade da sola: `Admin/AdminGlideCachePurge` lo usa per mostrare l'avviso "cache svuotata" al caricamento successivo della pagina.

<a id="altre-api"></a>

## Altre API utili

| Argomento         | Funzioni                                                                                              | Note                                                                                           |
|-------------------|-------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| URL               | `home_url('/')`, `admin_url('admin-post.php')`, `rest_url()`, `get_permalink($id)`, `add_query_arg()` | non scrivere mai il dominio a mano: cambia tra ambienti e lingue                               |
| Utenti e permessi | `is_user_logged_in()`, `current_user_can('edit_posts')`, `wp_get_current_user()`                      | i permessi si controllano per *capability*, non per ruolo                                      |
| Errori            | `WP_Error`, `is_wp_error($result)`                                                                    | molte funzioni restituiscono un `WP_Error` invece di lanciare eccezioni: va sempre controllato |
| Cron              | `wp_schedule_event()`, `wp_next_scheduled()`                                                          | eventi periodici; vedi i limiti di WP-Cron nella [sezione 11](11-ricerca.md)                   |
| Email             | `wp_mail()`                                                                                           | in locale le intercetta Mailpit ([sezione 3](03-ambiente-sviluppo.md))                         |
| Rewrite           | `flush_rewrite_rules()`, `wp rewrite flush`                                                           | da rigenerare dopo aver cambiato slug o post type, mai a ogni richiesta                        |
| Debug             | `WP_DEBUG`, `WP_DEBUG_LOG` in `wp-config.php`, `error_log()`                                          | con `WP_DEBUG_LOG` gli errori finiscono in `wp-content/debug.log`                              |

---

← [22. Asset: dev server, build e manifest](22-asset-build.md) · [Indice](README.md) · [24. Convenzioni e strumenti di qualità](24-convenzioni.md) →
