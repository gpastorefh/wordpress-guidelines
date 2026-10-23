# 6. ACF ed Extended ACF: i campi personalizzati in codice

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `includes/AcfFields/Bootstrap.php` · `includes/AcfFields/Partials/` · `includes/Support/Acf.php`

## ACF

WordPress, di base, offre per ogni contenuto solo titolo, testo, immagine in evidenza, riassunto. **ACF (Advanced Custom Fields)** è il plugin standard de facto per aggiungere campi strutturati: testi, immagini, link, relazioni con altri contenuti, ripetitori, e il **Flexible Content** su cui si basa il Post Builder.

ACF permette di creare i campi da un'interfaccia grafica in bacheca, salvandoli nel database. **Qui questa possibilità è volutamente disattivata**:

```php
// includes/AcfFields/Bootstrap.php
add_filter('acf/settings/enable_post_types', '__return_false');
add_filter('acf/settings/enable_options_pages_ui', '__return_false');
```

Tutti i campi, le options page, i post type e le tassonomie sono definiti **in codice**.

## Extended ACF

Il pacchetto [`vinkla/extended-acf`](https://github.com/vinkla/extended-acf) fornisce un'API PHP fluente al posto dei grandi array associativi di ACF:

```php
// ACF "nativo"
[
  'key' => 'field_5f3a...', 'label' => 'Text', 'name' => 'text',
  'type' => 'wysiwyg', 'required' => 1, 'tabs' => 'all', 'media_upload' => 0,
]

// Extended ACF
WYSIWYGEditor::make(__('Text', 'wpx-starter'), 'text')
    ->required()
    ->tabs('all')
    ->disableMediaUpload()
```

**Perché campi in codice e non da interfaccia:**

- **versionamento**: i campi stanno in Git insieme ai template che li leggono; una modifica ai campi e la modifica al template corrispondente arrivano nello stesso commit;
- **nessuna sincronizzazione tra ambienti**: non serve esportare/importare JSON tra locale, staging e produzione;
- **riuso**: un gruppo di campi è una funzione PHP, quindi si può comporre (vedi `ContainerTabFields` sotto);
- **chiavi generate automaticamente**: Extended ACF genera le `key` univoche, niente `field_5f3a...` da gestire a mano;
- **autocompletamento IDE** su metodi e opzioni.

## Organizzazione

- `AcfFields/Bootstrap.php` è l'orchestratore: registra le **options page** e chiama `::register()` di ogni gruppo di campi;
- ogni gruppo ha una classe propria (`ThemeSettings`, `EventFields`, `PersonFields`…) con un metodo statico `register()` che chiama `register_extended_field_group([...])`;
- `AcfFields/Partials/` contiene **pezzi riutilizzabili**:

```php
// AcfFields/Partials/ContainerTabFields.php — la scheda "Contenitore" di quasi tutti i blocchi
public static function fields(): array
{
    return [
        Tab::make(__('Container', 'wpx-starter'), 'tab_container'),
        Select::make(__('Theme', 'wpx-starter'), 'theme')->choices([...])->default('dark'),
        TrueFalse::make(__('Show pattern', 'wpx-starter'), 'show_pattern'),
        Select::make(__('Pattern variant', 'wpx-starter'), 'pattern_variant')
            ->conditionalLogic([ConditionalLogic::where('show_pattern', '==', 1)]),
    ];
}

// e nei blocchi:
->fields([
    /* campi specifici */,
    ...ContainerTabFields::fields(),
])
```

## Convenzioni sui campi

- **nome macchina (slug) in inglese**, snake_case: `event_start_date`, non `data_inizio_evento`;
- **etichette in inglese** dentro [`__()`](23-basi-wordpress.md#gettext): vengono poi tradotte via `.po` (vedi [sezione 18](18-traduzioni.md));
- **ogni campo dichiara il suo comportamento multilingua** con una macro: `->wpmlTranslate()` o `->wpmlCopy()` (vedi [sezione 18](18-traduzioni.md)).

## Lettura dei campi: mai `get_field()` diretto

Nei template non si usa `get_field()` di ACF, ma il singleton `WpxStarter\Support\Acf`:

```php
use WpxStarter\Support\Acf;

$acf = Acf::getInstance();

$acf->getOption('logo_alt', '');            // campo di una options page
$acf->getField('event_start_date', null, $id); // campo di un post
$acf->getSubField('title', '');             // dentro un loop di ripetitore/flexible
$acf->haveRows('addresses', 'option');      // ci sono righe?
```

**Perché un wrapper?**

1. **Se ACF è disattivato il sito non va in errore fatale**: il wrapper controlla `function_exists('get_field')` e restituisce il default.
2. **Default uniformi**: `get_field()` restituisce `false`, `null`, `''` o `[]` a seconda dei casi; il wrapper restituisce sempre il default passato quando il valore è vuoto.
3. **Un unico punto** dove intervenire se un giorno cambia la logica di lettura.

### Scegliere il default

Il default è il valore usato quando il redattore lascia il campo vuoto. La domanda da farsi è: **"se il campo è vuoto, cosa deve succedere sul sito?"**

**Caso 1 — l'elemento va semplicemente nascosto.** È il caso più comune per i contenuti editoriali (un sottotitolo, una CTA, un'immagine facoltativa). Il default è "vuoto" e il template/componente non stampa nulla:

```php
$subtitle = $block->getSubField('subtitle', '');   // testo  → ''
$cta      = $block->getSubField('link', null);     // link / immagine → null
$items    = $block->getSubField('items', []);      // ripetitore → []
```

```vue
<p v-if="subtitle">{{ subtitle }}</p>
```

Qui non va messo un testo di comodo (ad esempio il vecchio testo statico del mockup): finirebbe in produzione su ogni pagina in cui il redattore non ha compilato il campo, e nessuno se ne accorgerebbe.

**Caso 2 — esiste un valore ragionevole che il redattore può personalizzare.** Alcuni elementi devono comparire comunque, e il campo serve solo a cambiarne il valore. Allora il default è quel valore:

```php
// opzioni di presentazione: un valore sensato è sempre necessario
$theme = $block->getSubField('theme', 'dark');
$perPage = (int) $block->getSubField('items_per_page', 9);

// etichette di interfaccia sovrascrivibili: default come stringa traducibile
$searchLabel = $block->getSubField('filters_search_label', __('Search content', 'wpx-starter'));

$relatedTitle = Acf::getInstance()->getOption(
    'related_' . str_replace('-', '_', $postType) . '_title',
    __('Related content', 'wpx-starter')
);
```

Quando il default è un testo visibile, va scritto **in inglese dentro `__()`**: così viene tradotto nella lingua del sito come ogni altra stringa del tema ([sezione 18](18-traduzioni.md)), e il sito resta corretto anche se in una lingua il campo non è stato compilato.

In sintesi: un default deve essere un valore **valido in produzione**, mai un segnaposto. Se un valore valido non esiste, il default è vuoto e l'elemento non si mostra.

---

← [5. Composer e autoload PSR-4 delle classi del tema](05-composer-autoload.md) · [Indice](README.md) · [7. Il Post Builder: pagine a blocchi con Flexible Content](07-post-builder.md) →
