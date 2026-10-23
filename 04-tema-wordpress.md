# 4. Il tema WordPress: struttura e bootstrap

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `functions.php` · `includes/`

## Cos'è un tema (in breve)

Un tema WordPress è una cartella in `wp-content/themes/` che contiene file PHP con nomi convenzionali. WordPress, per ogni richiesta, sceglie **quale file eseguire** in base alla [gerarchia dei template](https://developer.wordpress.org/themes/basics/template-hierarchy/): ad esempio per un contenuto di tipo `project` cerca `single-project.php`, poi `single.php`, poi `index.php`. Il file `functions.php` viene invece caricato **sempre**, prima di qualsiasi template: è il punto d'ingresso del codice del tema.

## Struttura

```
wpx-starter/
├── functions.php            # bootstrap: istanzia tutte le classi
├── composer.json            # dipendenze PHP + autoload PSR-4
├── header.php / footer.php  # inizio/fine di ogni pagina (Header e Footer Vue)
├── page.php                 # pagine: renderizza il Post Builder
├── single-{post-type}.php   # dettaglio di ogni custom post type
├── taxonomy-{taxonomy}.php  # archivio di una tassonomia pubblica
├── 404.php, search.php, index.php
├── templates/               # page template selezionabili dal redattore (login, area riservata…)
├── parts/
│   ├── post-builder/        # un template PHP per ogni blocco del Post Builder
│   ├── single-template/     # pezzi comuni dei template singoli (hero, correlati…)
│   ├── card-{post-type}.php # una card per ogni tipo di contenuto, usata nei loop
│   └── icons/               # SVG selezionabili dai redattori
├── includes/                # TUTTE le classi PHP (namespace WpxStarter\)
├── languages/               # .pot / .po / .mo
└── .build/                  # output di Vite (gitignored)
```

## Le cartelle di `includes/`

| Cartella                          | Contenuto                                                                                     |
|-----------------------------------|-----------------------------------------------------------------------------------------------|
| `PostTypes/`                      | Una classe per custom post type (`register_post_type`)                                        |
| `Taxonomies/`                     | Una classe per tassonomia (`register_taxonomy`)                                               |
| `AcfFields/`                      | Gruppi di campi ACF (opzioni tema, campi dei CPT, utenti…) + `Partials/` riutilizzabili       |
| `PostBuilder/`                    | Builder a blocchi: classi astratte, builder concreti, `Blocks/` (un file per blocco)          |
| `Setup/`                          | Infrastruttura: asset, menu, supporti del tema, MIME, meta tag, REST, paginazione hub…        |
| `Cleanup/`                        | Rimozione di funzioni WordPress inutili (emoji, commenti, autosave, CSS dei blocchi…)         |
| `Admin/`                          | Personalizzazioni del back-office (colonne, filtri, ordine menu, TinyMCE)                     |
| `Support/`                        | Helper riutilizzabili (singleton o metodi statici): `Acf`, `Html`, `Menu`, `HubPage`, `Wpml`… |
| `Auth/`, `Search/`, `Migrations/` | Moduli funzionali specifici                                                                   |

## Il bootstrap: `functions.php`

`functions.php` fa due sole cose: carica l'autoloader di Composer e **istanzia le classi**.

```php
require_once __DIR__ . '/vendor/autoload.php';

use WpxStarter\PostTypes\ProjectPostType;
use WpxStarter\Setup\Assets;
// ...

new ProjectPostType();
new Assets();
// ...
```

Ogni classe, nel costruttore, si **aggancia agli hook** di WordPress:

```php
final class ProjectPostType
{
    public function __construct()
    {
        add_action('init', [$this, 'register']);
    }

    public function register(): void
    {
        register_post_type('project', [ /* ... */ ]);
    }
}
```

> **Hook in 30 secondi.** WordPress, durante il caricamento, "annuncia" dei momenti (`init`, `wp_head`, `acf/include_fields`…) e dei punti in cui un valore può essere modificato (`request`, `wp_mail_from`…). `add_action('init', $callback)` significa "quando arrivi a `init`, esegui questa funzione". `add_filter('x', $callback)` significa "prima di usare il valore `x`, passalo da questa funzione e usa quello che restituisce".

**Perché una classe per responsabilità invece del classico `functions.php` da 2000 righe?**

- ogni funzionalità è in un file con un nome che dice cosa fa: si trova subito;
- disattivare una funzionalità = commentare una riga in `functions.php` (succede davvero: un post type non più usato può restare nel codice senza essere istanziato);
- niente funzioni globali con prefissi per evitare collisioni: c'è il namespace;
- `final class` + tipi stretti rendono il codice più prevedibile e analizzabile dall'IDE.

---

← [3. Ambiente di sviluppo: Docker e Makefile](03-ambiente-sviluppo.md) · [Indice](README.md) · [5. Composer e autoload PSR-4 delle classi del tema](05-composer-autoload.md) →
