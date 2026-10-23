# 12. Custom post type e tassonomie

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `includes/PostTypes/` · `includes/Taxonomies/` · `functions.php` · `includes/Setup/ThemeSetup.php` · `taxonomy-{taxonomy}.php`

## Concetti

- **Post type**: un "tipo di contenuto". WordPress ha già `post` (articoli) e `page` (pagine). Un **custom post type (CPT)** aggiunge tipi propri: Eventi, Progetti, Persone… ciascuno con la sua voce in bacheca, i suoi URL e i suoi template.
- **Tassonomia**: un sistema di classificazione dei contenuti (WordPress ha già "Categorie" e "Tag"). Una **custom taxonomy** aggiunge classificazioni proprie, collegabili a uno o più post type.

## Come sono registrati

Una classe per CPT in `includes/PostTypes/`, una per tassonomia in `includes/Taxonomies/`, istanziate in `functions.php`. Struttura tipica di un CPT:

```php
register_post_type('project', [
    'labels'             => $this->getLabels(),      // tutte le etichette, in inglese con __()
    'public'             => true,
    'publicly_queryable' => true,
    'show_ui'            => true,
    'show_in_rest'       => true,
    'has_archive'        => false,                    // ← vedi "hub" più sotto
    'exclude_from_search'=> false,
    'rewrite'            => ['slug' => 'projects', 'with_front' => false],
    'supports'           => ['title', 'thumbnail', 'excerpt'],
    'menu_icon'          => 'dashicons-lightbulb',
]);
```

Scelte ricorrenti:

- **`supports`** minimale (`title`, `thumbnail`, `excerpt`): il corpo del contenuto non è l'editor di WordPress ma il `SinglePostBuilder`;
- **`has_archive => false`**: nessun archivio automatico, l'elenco è una pagina "hub" gestita dai redattori ([sezione 13](13-hub-template-singoli.md));
- l'immagine in evidenza va abilitata anche in `ThemeSetup` (`add_theme_support('post-thumbnails', [...])`).

**CPT non pubblici.** Un post type può servire solo come "contenitore" in bacheca, senza URL pubblico. Esempio: i **Blocchi riutilizzabili** (`reusable_block`) hanno `public => false`, `rewrite => false`: esistono solo per essere inclusi in altre pagine tramite un blocco del Post Builder (vedi [sezione 9](09-blocchi-riutilizzabili.md)).

> ⚠️ Dopo aver aggiunto un CPT o cambiato il suo `rewrite.slug`, i permalink vanno rigenerati: in bacheca *Impostazioni → Permalink → Salva*, oppure `wp rewrite flush` nel container.

## Tassonomia pubblica o privata?

È la scelta più importante quando si crea una tassonomia. La domanda da farsi è: **"una pagina che elenca tutti i contenuti di questo termine ha senso come pagina del sito?"**

|                 | Tassonomia **privata**                                                                                                | Tassonomia **pubblica**                                                                     |
|-----------------|-----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| Impostazioni    | `public => false`, `publicly_queryable => false`, `rewrite => false`, `query_var => false`                            | `public => true`, `rewrite => ['slug' => ...]`                                              |
| URL di archivio | nessuno                                                                                                               | `/slug-tassonomia/termine/`                                                                 |
| Template        | non serve                                                                                                             | `taxonomy-{nome}.php`                                                                       |
| A cosa serve    | correlare contenuti, filtrare liste, organizzare la bacheca                                                           | navigazione pubblica per categoria                                                          |
| Esempio         | **Temi** (`topic`): collega contenuti di tipo diverso sullo stesso argomento; usata nei filtri degli hub e nelle card | **Categorie contenuti riservati**: ogni categoria ha una pagina propria nell'area riservata |

**Default consigliato: privata.** Una tassonomia pubblica crea automaticamente URL che vanno disegnati, mantenuti e indicizzati; se nessuno li ha progettati diventano pagine "vuote" o duplicate che peggiorano la SEO. Si rende pubblica solo quando esiste un design per la pagina di archivio.

Esempio di tassonomia **privata** usata solo per classificare e filtrare (`includes/Taxonomies/RegionTaxonomy.php`):

```php
namespace WpxStarter\Taxonomies;

defined('ABSPATH') or die;

final class RegionTaxonomy
{
    public function __construct()
    {
        add_action('init', [$this, 'register']);
    }

    public function register(): void
    {
        register_taxonomy('region', ['event', 'project'], [
            'labels'             => [
                'name'          => __('Regions', 'wpx-starter'),
                'singular_name' => __('Region', 'wpx-starter'),
                'menu_name'     => __('Regions', 'wpx-starter'),
            ],
            'public'             => false,  // nessun URL pubblico
            'publicly_queryable' => false,
            'show_ui'            => true,   // ma gestibile in bacheca
            'show_admin_column'  => true,
            'hierarchical'       => true,
            'rewrite'            => false,
            'query_var'          => false,
            'show_in_nav_menus'  => false,
        ]);
    }
}
```

poi `new RegionTaxonomy();` in `functions.php` e `composer dump-autoload --optimize`. Per renderla **pubblica** basterebbe `public => true`, `publicly_queryable => true`, un `rewrite => ['slug' => 'regions', 'with_front' => false]` e un template `taxonomy-region.php`.

Usarla in una query (ad esempio dentro un blocco hub):

```php
$query = new WP_Query([
    'post_type' => 'event',
    'tax_query' => [
        ['taxonomy' => 'region', 'field' => 'term_id', 'terms' => [12, 15]],
    ],
]);
```

Altre impostazioni utili:

- `hierarchical => true` → interfaccia a checkbox con termini padre/figlio (come le Categorie); `false` → interfaccia a tag liberi;
- `show_admin_column => true` → colonna nell'elenco dei contenuti in bacheca;
- `show_in_nav_menus` → se i termini si possono inserire nei menu (solo per le pubbliche).

---

← [11. Ricerca interna e contenuti del Post Builder](11-ricerca.md) · [Indice](README.md) · [13. Hub di contenuti e template singoli](13-hub-template-singoli.md) →
