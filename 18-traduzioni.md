# 18. Traduzioni: stringhe del tema e contenuti

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `languages/` · `includes/Setup/ThemeSetup.php` · `includes/AcfFields/Bootstrap.php` · `includes/Support/Wpml.php` · `wpml-config.xml` · `.claude/skills/translator/SKILL.md`

Ci sono **due livelli di traduzione** distinti, da non confondere.

## Livello 1 — Le stringhe del codice (gettext)

Sono i testi scritti nel codice: etichette dei campi in bacheca, nomi dei blocchi, testi di interfaccia ("Pagina 1 di 3", "Mostra filtri"…).

Regole:

- si scrivono **sempre in inglese**, dentro le [funzioni di traduzione](23-basi-wordpress.md#gettext) con il text domain del tema:

  ```php
  __('Add block', 'wpx-starter')           // restituisce la stringa tradotta
  esc_html__('Search', 'wpx-starter')      // tradotta + escape HTML
  _n('%s result', '%s results', $n, 'wpx-starter') // plurali
  ```

- il tema carica le traduzioni da `languages/` (`load_theme_textdomain` in `ThemeSetup`).

I file in `languages/`:

| File              | Cos'è                                                                             |
|-------------------|-----------------------------------------------------------------------------------|
| `wpx-starter.pot` | **Template**: l'elenco di tutte le stringhe estratte dal codice, senza traduzioni |
| `it_IT.po`        | Le traduzioni italiane, file di testo editabile                                   |
| `it_IT.mo`        | Versione compilata (binaria) del `.po`: è quella che WordPress legge davvero      |

Il ciclo è: **codice → estrazione nel `.pot` → merge nei `.po` → traduzione → compilazione `.mo`**.

**Perché sorgente in inglese anche se il sito è italiano?** Perché è lo standard WordPress: il tema funziona in qualsiasi lingua, aggiungere una lingua significa solo aggiungere un `.po`, e le stringhe sono riconoscibili da qualunque sviluppatore.

## La skill `translator` di Claude Code

Il ciclo sopra è meccanico ma noioso. Il progetto include una skill per Claude Code (`.claude/skills/translator/SKILL.md`) già configurata con percorsi, text domain e container. Basta chiedere, ad esempio:

> /translator aggiorna le traduzioni

e la skill:

1. rigenera il `.pot` con `wp i18n make-pot` nel container;
2. fa il merge in ogni `.po` esistente con `msgmerge`;
3. **traduce le sole voci mancanti o "fuzzy"**, preservando placeholder (`%s`, `{page}`) e HTML;
4. ricompila i `.mo` con `msgfmt`.

Può anche **aggiungere una nuova lingua** (crea il `.po` con `msginit` e lo traduce interamente). Conviene lanciarla dopo ogni modifica che aggiunge stringhe (nuovo blocco, nuovi campi, nuovi testi di interfaccia) e rivedere il diff del `.po` prima del commit.

## Livello 2 — I contenuti (WPML + ACFML)

I contenuti inseriti dai redattori (pagine, eventi, valori dei campi ACF, opzioni tema) sono tradotti con **WPML**. Ogni contenuto esiste in una versione per lingua, collegata alle altre.

WPML da solo però non sa nulla dei campi ACF: un Flexible Content, per esempio, è salvato come decine di post meta con nomi generati (`post_builder_0_text`, `post_builder_1_slides_0_title`…). Il ponte è **ACFML** (*Advanced Custom Fields Multilingual*), l'add-on ufficiale di WPML per ACF. ACFML legge, per ogni campo ACF, una **preferenza di traduzione** e la applica a tutti i meta che quel campo genera.

### Le preferenze di traduzione

| Preferenza    | Comportamento                                                                                              | Quando usarla                                                           |
|---------------|------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| **Translate** | valore **indipendente per lingua**; il campo compare nell'editor di traduzione di WPML                      | testi, titoli, WYSIWYG, link con testo visibile, etichette             |
| **Copy**      | valore **unico**: modificato nella lingua originale, viene ricopiato nelle traduzioni (che non possono cambiarlo) | select di stile, toggle, numeri, date, immagini, relazioni, link tecnici |
| **Copy once** | copiato **solo alla creazione** della traduzione, poi indipendente                                         | valori iniziali che in alcune lingue potrebbero divergere              |
| **Ignore**    | WPML non tocca il campo: la traduzione nasce senza quel valore                                             | dati tecnici non legati alla lingua, o che vanno ricompilati a mano     |

La scelta ha conseguenze visibili per i redattori: un campo in *Copy* modificato nella versione italiana cambia anche in quella inglese. È voluto, ma va spiegato: la guida per i redattori marca ogni campo con 🔤 (tradotto) o 🔗 (condiviso) proprio per questo.

### Come si dichiara in codice: le macro

ACFML legge la preferenza dall'impostazione `wpml_cf_preferences` della definizione del campo. Con ACF da interfaccia grafica la si sceglie da un menu; qui i campi sono in codice, quindi va scritta nella definizione.

Per non ripetere ovunque l'array di impostazioni, il tema aggiunge **quattro macro** a tutti i campi di Extended ACF (`AcfFields/Bootstrap.php`):

```php
use Extended\ACF\Fields\Field;
use WpxStarter\Support\AcfMultilingual;

Field::macro('wpmlTranslate', fn (Field $field): static => $field->withSettings(AcfMultilingual::translate()));
Field::macro('wpmlCopy',      fn (Field $field): static => $field->withSettings(AcfMultilingual::copy()));
Field::macro('wpmlCopyOnce',  fn (Field $field): static => $field->withSettings(AcfMultilingual::copyOnce()));
Field::macro('wpmlIgnore',    fn (Field $field): static => $field->withSettings(AcfMultilingual::ignore()));
```

`withSettings()` è il metodo di Extended ACF per aggiungere impostazioni "grezze" non coperte dall'API fluente. `AcfMultilingual` restituisce il valore corretto, usando le costanti di WPML se il plugin è attivo e un valore numerico equivalente altrimenti, così il tema funziona anche con WPML disattivato:

```php
// Support/AcfMultilingual.php
public static function translate(): array
{
    return ['wpml_cf_preferences' => defined('WPML_TRANSLATE_CUSTOM_FIELD') ? WPML_TRANSLATE_CUSTOM_FIELD : 2];
}

public static function copy(): array
{
    return ['wpml_cf_preferences' => defined('WPML_COPY_CUSTOM_FIELD') ? WPML_COPY_CUSTOM_FIELD : 1];
}
```

Nei campi diventa una sola chiamata in coda alla definizione:

```php
Text::make(__('Author', 'wpx-starter'), 'author')
    ->wpmlTranslate(),

Select::make(__('Theme', 'wpx-starter'), 'theme')
    ->choices(['light' => __('Light', 'wpx-starter'), 'dark' => __('Dark', 'wpx-starter')])
    ->default('dark')
    ->wpmlCopy(),

Image::make(__('Image', 'wpx-starter'), 'image')
    ->format('array')
    ->wpmlCopy(),
```

**Convenzione: ogni campo dichiara esplicitamente la sua preferenza**, anche quando sembra ovvia. Così la scelta è visibile nel codice, rivedibile in code review, e non dipende da default del plugin o da impostazioni salvate nel database.

### Campi contenitore: Flexible Content, ripetitori, gruppi

Per i campi che contengono altri campi, la preferenza del contenitore riguarda la **struttura**, quella dei sotto-campi riguarda i **valori**:

```php
FlexibleContent::make(__('Blocks', 'wpx-starter'), 'post_builder')
    ->layouts($layouts)
    ->wpmlCopy(),                 // stessi blocchi, nello stesso ordine, in tutte le lingue

Repeater::make(__('Addresses', 'wpx-starter'), 'addresses')
    ->fields([
        Text::make(__('Address', 'wpx-starter'), 'address')->wpmlTranslate(), // ma testi tradotti
    ])
    ->wpmlCopy(),
```

Il risultato è che la versione inglese di una pagina ha **gli stessi blocchi** di quella italiana, mentre i testi all'interno di ogni blocco si traducono campo per campo, e le opzioni grafiche (`theme`, `show_pattern`…) restano allineate.

Il riquadro **"ACFML Sincronizza le traduzioni"** che si vede nelle schermate di modifica (vedi gli screenshot delle sezioni [13](13-hub-template-singoli.md) e [17](17-pagina-404.md)) è un'opzione di ACFML. Mantiene i sotto-campi di ripetitori e Flexible Content nello stesso ordine della lingua predefinita quando il redattore riordina i blocchi nell'originale.

### Tutto il resto: `wpml-config.xml`

Le preferenze ACFML valgono solo per i campi ACF. Per il resto, il tema dichiara la configurazione WPML nel file `wpml-config.xml`, nella sua root. WPML lo legge automaticamente e blocca le relative impostazioni nell'interfaccia, quindi la configurazione è versionata e non va rifatta a mano in ogni ambiente.

```xml
<wpml-config>
    <!-- post type da tradurre -->
    <custom-types>
        <custom-type translate="1">event</custom-type>
        <custom-type translate="1">reusable_block</custom-type>
        <!-- ... -->
    </custom-types>

    <!-- tassonomie da tradurre (i termini esistono per lingua) -->
    <taxonomies>
        <taxonomy translate="1">topic</taxonomy>
        <!-- ... -->
    </taxonomies>

    <!-- post meta non ACF -->
    <custom-fields>
        <custom-field action="ignore">_wpx_search_index</custom-field>
        <custom-field action="ignore">_wpx_search_index_hash</custom-field>
    </custom-fields>
</wpml-config>
```

- **nuovo custom post type o tassonomia** → va aggiunto qui, altrimenti WPML lo tratta come non traducibile (o lascia la scelta all'interfaccia);
- **meta scritti dal codice e non da ACF** (come l'indice di ricerca della [sezione 11](11-ricerca.md)) → di solito `ignore`: ogni lingua calcola il proprio, e copiarli sovrascriverebbe l'indice della traduzione con il testo dell'originale.

### ID salvati nei campi: tradurli sempre al momento dell'uso

Questa è la regola che evita il bug multilingua più frequente: **un contenuto in inglese che mostra pagine, persone o link della versione italiana.**

**Regola: ogni ID letto da un campo ACF o da un'opzione va convertito nella lingua corrente prima di usarlo.** Vale per i campi Relationship, Post Object, Page Link, Taxonomy, le pagine scelte nelle Opzioni tema, gli ID in un ripetitore. Vale anche quando "dovrebbe" essere già giusto.

#### Perché arrivano gli ID della lingua principale

Un ID identifica **un post preciso in una lingua precisa**: la pagina "Chi siamo" italiana e la sua traduzione inglese "About us" sono due post con ID diversi. WPML le collega, ma un ID salvato in un campo punta sempre a una sola delle due.

I casi in cui un campo contiene l'ID "sbagliato" sono più comuni di quanto sembri:

- **campi in Copy**: il valore viene ricopiato dalla lingua originale. ACFML prova a convertire gli ID dei campi relazionali durante la copia, ma solo se la traduzione del contenuto collegato **esisteva già** in quel momento. Se la pagina inglese "Members" viene creata dopo, la traduzione continua a puntare all'ID italiano finché qualcuno non risalva l'originale;
- **opzioni tema**: le pagine hub, la pagina di login e simili sono scelte una volta, di solito nella lingua principale;
- **import, duplicazioni, contenuti creati prima delle traduzioni**, oppure redattori che compilano un campo nella lingua sbagliata.

E le funzioni di WordPress **non correggono da sole**: `get_permalink($id)`, `get_the_title($id)`, `get_post($id)` restituiscono esattamente quel post, in qualunque lingua sia. Con `WP_Query` e `post__in` il comportamento dipende dalle impostazioni di WPML: gli ID dell'altra lingua possono sparire dal risultato, oppure comparire in italiano. In entrambi i casi è un errore difficile da notare, perché nella lingua principale tutto funziona.

#### Come si fa

Il tema ha due metodi in `Support/Wpml` che incapsulano il filtro `wpml_object_id` di WPML:

```php
use WpxStarter\Support\Acf;
use WpxStarter\Support\Wpml;

// un singolo ID (es. pagina scelta nelle Opzioni tema)
$loginPageId = Wpml::getInstance()->translateObjectId(
    (int) Acf::getInstance()->getOption('login_page'),
    'page'
);

if ($loginPageId !== null) {
    $loginUrl = get_permalink($loginPageId);
}

// una lista di ID (es. campo Relationship)
$partnerIds = Wpml::getInstance()->translateObjectIds(
    $block->getSubField('partners', []),
    'partner'
);

$query = new WP_Query([
    'post_type' => 'partner',
    'post__in'  => $partnerIds ?: [0],   // [0]: nessun risultato invece di "tutti i post"
    'orderby'   => 'post__in',           // mantiene l'ordine scelto dal redattore
]);
```

- `translateObjectId($id, $type)` restituisce l'ID della traduzione nella lingua corrente, oppure **`null` se la traduzione non esiste**;
- `translateObjectIds($ids, $type)` traduce una lista e **scarta** gli ID senza traduzione (e i duplicati). Se la lista mescola post type diversi, si passa `null` come tipo e lo ricava per ogni ID;
- entrambi accettano anche un codice lingua esplicito, utile fuori dal contesto di una richiesta (cron, CLI): è ciò che fa l'indicizzatore della ricerca.

Per i **termini di tassonomia** il secondo argomento è il nome della tassonomia invece del post type:

```php
$termId = Wpml::getInstance()->translateObjectId($termId, 'topic');
```

#### Traduzione mancante: nascondere, non mostrare l'originale

I metodi del tema chiamano `wpml_object_id` con `$return_original_if_missing = false`. Se un contenuto collegato non è tradotto, **non viene mostrato**, invece di comparire in italiano dentro una pagina inglese.

È una scelta: per un sito in cui le traduzioni sono parziali e si preferisce mostrare il contenuto originale piuttosto che niente, si può usare il filtro con `true`, consapevolmente e caso per caso:

```php
$id = apply_filters('wpml_object_id', $id, 'page', true); // fallback sull'originale
```

#### Quando non serve

- i campi del **post corrente** letti con `getField()` / `getSubField()`: ogni traduzione ha i suoi meta, quindi i *valori* sono già quelli della lingua giusta (sono gli *ID* contenuti nei valori a dover essere tradotti);
- gli ID restituiti da una `WP_Query` "normale" (senza `post__in`): WPML filtra già la query sulla lingua corrente;
- `get_the_ID()` dentro il loop.

In caso di dubbio conviene tradurre lo stesso: se l'ID è già nella lingua corrente, `translateObjectId()` restituisce lo stesso ID e il costo è trascurabile, perché WPML mette in cache le relazioni tra traduzioni.

### Checklist per un nuovo campo

1. è un testo che il lettore vede? → `->wpmlTranslate()`;
2. è un'opzione, un media, una relazione, un dato tecnico? → `->wpmlCopy()`;
3. è un contenitore (Flexible, Repeater, Group)? → di solito `->wpmlCopy()` sul contenitore e la preferenza giusta su ogni sotto-campo;
4. salva un ID? → `->wpmlCopy()` e, nel template, **sempre** `Wpml::translateObjectId(s)` prima di usarlo;
5. aggiornare la legenda 🔤/🔗 nella guida per i redattori.

---

← [17. La pagina 404](17-pagina-404.md) · [Indice](README.md) · [19. Frontend: come Vue prende il controllo dell'HTML di WordPress](19-frontend-dom.md) →
