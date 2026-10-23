# 2. Struttura del progetto: dove sta cosa

Il codice vive in **due mondi** dentro lo stesso repository: il frontend Vue nella root (`src/`, configurazione di Vite e Storybook) e il tema WordPress molto più in profondità (`wp/wp-content/themes/wpx-starter/`). Questa pagina è la mappa per orientarsi. Ogni voce rimanda alla sezione che spiega quella parte.

I nomi dei file sono quelli dello starter. Dove compare un tipo di contenuto (`project`, `event`…) è solo un esempio: ogni progetto ha i propri.

## Il repository

```
progetto-di-esempio/
├── Makefile                  # comandi make (dup, dup-fe, dup-be, release…)            → 3
├── infra/dev/                # Docker Compose, Dockerfile, configurazione PHP          → 3
├── .env.template             # variabili per WordPress/Vite (copiate in .env)          → 3
├── .env.docker.template      # variabili per Docker Compose (copiate in .env.docker)   → 3
├── dump/                     # dump del database (make dump-db / restore-db)           → 3
│
├── package.json, yarn.lock   # dipendenze frontend (Yarn 4)                            → 24
├── vite.config.ts            # build, alias Vue con compilatore, file hot, auto-import → 19, 21, 22
├── vite/lucide-resolver.ts   # auto-import delle icone Lucide                          → 21
├── .storybook/               # configurazione di Storybook                             → 21
├── tsconfig*.json, eslint.config.ts, .oxlintrc.json, .prettierrc.json, .husky/         → 24
├── src/                      # tutto il frontend Vue (dettaglio sotto)                 → 19–22
│
├── CLAUDE.md, MEMORY.md      # convenzioni per Claude Code                             → 24
├── .claude/                  # subagent e skill (tra cui translator)                   → 18, 24
│
└── wp/                       # installazione WordPress completa, montata nel container
    └── wp-content/
        ├── plugins/          # ACF PRO, WPML, ACFML e gli altri plugin                 → 6, 18
        └── themes/
            └── wpx-starter/  # il tema (dettaglio sotto)                               → 4
```

Il numero a destra è la sezione della guida.

## Il frontend: `src/`

```
src/
├── main.ts                   # entry: trasforma il DOM e monta Vue su #app       → 19
├── globals/
│   └── WpProxyCmp.vue        # il ponte tra HTML di WordPress e componenti Vue   → 20
├── helpers/
│   ├── componentRegistry.ts  # whitelist dei componenti usabili da PHP           → 20
│   ├── vueDomTransforms.ts   # da data-v-slot a <template v-slot>, v-cloak…      → 19
│   └── …                     # scrollToHash, validatori, utilità
├── components/
│   └── NomeCmp/              # una cartella per componente                       → 21
│       ├── NomeCmp.vue
│       └── NomeCmp.stories.ts
├── components.d.ts           # tipi degli auto-import (generato, non modificare) → 21
├── composables/              # useDataConfig, breakpoint…                        → 20
├── styles/
│   ├── main.css              # Tailwind (con @source sui PHP del tema)           → 21
│   ├── critical.css          # CSS inline nell'<head> (font, v-cloak)            → 22
│   └── editor.css            # CSS dentro il WYSIWYG della bacheca               → 22
├── fixtures/, storybook/     # dati finti e helper per le story                  → 21
└── types/
```

## Il tema: `wp/wp-content/themes/wpx-starter/`

```
wpx-starter/
├── functions.php             # bootstrap: autoload + istanza di tutte le classi    → 4
├── composer.json             # dipendenze PHP + autoload PSR-4                     → 5
├── style.css                 # intestazione del tema (richiesta da WordPress)
├── header.php, footer.php    # apertura/chiusura di #app, HeaderCmp e FooterCmp    → 15
├── page.php                  # pagine: renderizza il PostBuilder                   → 7
├── single-{post-type}.php    # dettaglio di ogni CPT (es. single-project.php)      → 13
├── taxonomy-{taxonomy}.php   # archivio di una tassonomia pubblica                 → 12
├── 404.php                   # 404 costruita col Post Builder                      → 17
├── search.php, index.php     # risultati di ricerca, fallback                      → 11
├── wpml-config.xml           # configurazione WPML versionata                      → 18
├── templates/                # page template scelti dal redattore (login…)
├── parts/
│   ├── post-builder/         # un template per blocco (text-and-image.php…)        → 7, 8
│   ├── single-template/      # hero e correlati comuni ai singoli                  → 13
│   ├── card-{post-type}.php  # card di ogni tipo di contenuto, usata nei loop      → 14
│   ├── breadcrumb.php
│   └── icons/*.svg           # icone selezionabili dai redattori                   → 10
├── assets/admin/             # JS/CSS della bacheca (anteprima icone)              → 10
├── includes/                 # tutte le classi PHP, namespace WpxStarter\          → 4, 5
│   ├── PostTypes/            # una classe per custom post type                     → 12
│   ├── Taxonomies/           # una classe per tassonomia                           → 12
│   ├── AcfFields/            # Bootstrap, options page, gruppi di campi, Partials/ → 6, 15
│   ├── PostBuilder/          # builder astratti e concreti                         → 7
│   │   └── Blocks/           # una classe per blocco                               → 7, 8
│   ├── Search/               # indice testuale dei blocchi                         → 11
│   ├── Setup/                # asset, menu, supporti del tema, paginazione hub…    → 13, 16, 22
│   ├── Support/              # helper: Acf, Html, Menu, HubPage, Wpml…             → 6, 13, 16, 18
│   ├── Cleanup/              # rimozione di funzioni WordPress non usate           → 4
│   ├── Admin/                # personalizzazioni della bacheca                     → 4
│   └── Auth/, Migrations/    # moduli funzionali specifici                         → 4
├── languages/                # .pot, .po, .mo                                      → 18
├── vendor/                   # dipendenze Composer (gitignored)                    → 5
└── .build/                   # output di Vite + file hot (gitignored)              → 22
```

## Dove si mette mano, caso per caso

| Voglio…                                    | File coinvolti                                                                                                                                  | Sezione                                                       |
|--------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| creare un nuovo blocco del Post Builder    | `src/components/XModuleCmp/`, `src/helpers/componentRegistry.ts`, `includes/PostBuilder/Blocks/X.php`, `parts/post-builder/x.php`, `includes/Search/LayoutSelectors.php`, `languages/` | [8](08-ricetta-nuovo-blocco.md)                               |
| aggiungere un tipo di contenuto            | `includes/PostTypes/XPostType.php`, `functions.php`, `includes/AcfFields/` (campi), `single-x.php`, `parts/card-x.php`, scheda "Pagine Hub" in `AcfFields/ThemeSettings.php` | [12](12-post-type-tassonomie.md), [13](13-hub-template-singoli.md), [14](14-loop-card.md) |
| aggiungere una tassonomia                  | `includes/Taxonomies/XTaxonomy.php`, `functions.php` (+ `taxonomy-x.php` se pubblica)                                                           | [12](12-post-type-tassonomie.md)                              |
| aggiungere un campo alle opzioni del sito  | `includes/AcfFields/ThemeSettings.php`, `header.php` / `footer.php`, `src/components/HeaderCmp/` o `FooterCmp/`                                 | [15](15-opzioni-header-footer.md)                             |
| aggiungere un'icona                        | `parts/icons/nome.svg` (nient'altro)                                                                                                           | [10](10-icone.md)                                             |
| tradurre una nuova stringa                 | `languages/wpx-starter.pot`, `languages/it_IT.po` / `.mo` (con la skill `translator`)                                                           | [18](18-traduzioni.md)                                        |
| cambiare l'aspetto di una card             | `src/components/Card*Cmp/` (e, se cambiano i dati, `parts/card-{post-type}.php`)                                                                | [14](14-loop-card.md), [21](21-frontend-componenti.md)        |
| capire perché un blocco "non compare"      | console del browser (`[ProxyCmp]…`), `src/helpers/componentRegistry.ts`, `data-component` nel template PHP                                      | [20](20-frontend-proxy.md)                                    |
| cambiare come sono inclusi JS e CSS        | `vite.config.ts`, `includes/Setup/Assets.php`                                                                                                   | [22](22-asset-build.md)                                       |

I percorsi senza prefisso (`includes/…`, `parts/…`, `functions.php`) sono relativi alla cartella del tema; quelli che iniziano con `src/` o `vite` alla root del repository.

---

← [1. Visione d'insieme](01-visione-insieme.md) · [Indice](README.md) · [3. Ambiente di sviluppo: Docker e Makefile](03-ambiente-sviluppo.md) →
