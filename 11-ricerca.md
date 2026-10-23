# 11. Ricerca interna e contenuti del Post Builder

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `includes/Search/` · `search.php` · `parts/card-search-result.php`

## Il problema

La ricerca nativa di WordPress (`?s=parola`) cerca solo in tre colonne della tabella dei post: **titolo**, **riassunto** e **contenuto** (`post_content`, cioè l'editor classico/Gutenberg).

Con il Post Builder il contenuto delle pagine **non è in `post_content`**: l'editor è nascosto e tutti i testi stanno nei campi ACF, salvati come [*post meta*](23-basi-wordpress.md#dati). Inoltre il Flexible Content salva ogni sotto-campo come una riga di meta separata, con chiavi del tipo:

```
post_builder_0_text
post_builder_1_slides_0_title
post_builder_1_slides_1_title
post_builder_3_items_2_cards_0_description
```

Risultato: senza interventi, la ricerca troverebbe una pagina solo per parole nel titolo o nel riassunto.

## Alternative scartate

| Alternativa                                      | Perché no                                                                                                          |
|--------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| Cercare con `LIKE` su tutti i post meta          | Lento (la tabella dei meta è enorme) e impreciso: troverebbe anche valori tecnici (`dark`, ID, URL, nomi di icone) |
| Plugin di ricerca (Relevanssi, SearchWP…)        | Dipendenza esterna, configurazione in database, va istruito comunque su quali campi ACF indicizzare                |
| Servizio esterno (Algolia, Elasticsearch…)       | Sproporzionato per le dimensioni di un sito istituzionale; costi e infrastruttura in più                           |
| Copiare i testi in `post_content` al salvataggio | Sporca un campo che WordPress e i plugin usano per altro (revisioni, export, WPML)                                 |

## La soluzione: un indice testuale per ogni contenuto

Il modulo `includes/Search/` mantiene, per ogni contenuto, **un unico post meta** (`_wpx_search_index`) che contiene tutto il testo "cercabile" dei suoi blocchi, in testo semplice. La ricerca poi interroga anche quel meta.

```
┌───────────── al salvataggio / via cron ─────────────┐
│ campi ACF del Post Builder                          │
│        │                                            │
│        ▼  Indexer + LayoutSelectors                 │
│ "Chi siamo\nSiamo un team…\nI nostri servizi…"      │
│        │                                            │
│        ▼                                            │
│ post meta _wpx_search_index                         │
└─────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────── alla ricerca ────────────────────┐
│ search.php                                          │
│   WP_Query(['s' => …, 'wpx_search_index' => true])  │
│        │                                            │
│        ▼  SearchQuery                               │
│ titolo OR riassunto OR contenuto                    │
│ OR _wpx_search_index                                │
└─────────────────────────────────────────────────────┘
```

Le classi coinvolte:

| Classe               | Ruolo                                                                                            |
|----------------------|--------------------------------------------------------------------------------------------------|
| `LayoutSelectors`    | Mappa **quali** sotto-campi di **quale** blocco contengono testo da indicizzare                  |
| `Indexer`            | Legge i blocchi di un contenuto, estrae i testi secondo la mappa, li normalizza e salva l'indice |
| `SaveHook`           | Reindicizza un contenuto quando viene salvato                                                    |
| `Cron`               | Riallinea periodicamente tutti gli indici, a piccoli lotti                                       |
| `IndexablePostTypes` | Elenco unico dei post type da indicizzare                                                        |
| `SearchQuery`        | Estende la query di ricerca di WordPress per cercare anche nell'indice                           |

## 1. Quali campi indicizzare: `LayoutSelectors`

Non tutto il contenuto di un blocco va indicizzato: tema chiaro/scuro, ID di immagini, URL, nomi di icone sono "rumore". La mappa elenca esplicitamente, per ogni `layoutName()`, i campi testuali:

```php
return [
    'text_and_image' => [
        ['type' => 'scalar', 'selector' => 'text'],
    ],
    'hero' => [
        // ripetitore: per ogni slide, i campi indicati
        ['type' => 'repeater', 'selector' => 'slides', 'fields' => ['label', 'title', 'text']],
        ['type' => 'scalar', 'selector' => 'slider_label'],
    ],
    'contact_form' => [
        // gruppo: un oggetto con sotto-campi
        ['type' => 'group', 'selector' => 'recipient_info', 'fields' => ['name', 'role']],
    ],
    'fees_accordion' => [
        // ripetitore annidato in un ripetitore
        [
            'type' => 'repeater', 'selector' => 'items', 'fields' => ['title'],
            'nested' => ['type' => 'repeater', 'selector' => 'cards', 'fields' => ['title', 'subtitle', 'description']],
        ],
    ],
    'reusable_block' => [
        // segue il riferimento e indicizza i blocchi del blocco riutilizzabile
        ['type' => 'expand_reusable_block', 'selector' => 'selected_reusable_block'],
    ],
];
```

I tipi supportati sono quindi `scalar`, `group`, `repeater` (con eventuale `nested`) e `expand_reusable_block`. I blocchi che non compaiono nella mappa (es. `content_hub`, che mostra *altri* contenuti) semplicemente non contribuiscono all'indice.

**Perché una mappa esplicita e non "tutti i campi di tipo testo"?** Perché è una scelta editoriale: un'etichetta di accessibilità o il titolo di un elenco di download possono esserci o no, e la mappa lo rende visibile e modificabile in un solo punto. Il prezzo è ricordarsi di aggiornarla quando si crea un blocco (passo 5 della [ricetta](08-ricetta-nuovo-blocco.md)).

## 2. Costruire l'indice: `Indexer`

`Indexer::reindex($postId)`:

1. legge le righe del `PostBuilder` **e** del `SinglePostBuilder` del contenuto, come array annidati (`get_field()`);
2. per ogni riga, prende la mappa del suo layout (`acf_fc_layout`) ed estrae le stringhe;
3. **normalizza** ogni stringa: rimuove shortcode e tag HTML, decodifica le entità, comprime gli spazi;
4. unisce tutto con un a capo e salva in `_wpx_search_index`.

```php
private static function normalize(string $value): string
{
    $value = strip_shortcodes($value);
    $value = wp_strip_all_tags($value, true);
    $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');
    $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

    return trim($value);
}
```

Due dettagli importanti:

- **hash per evitare scritture inutili**: insieme all'indice si salva il suo `md5` (`_wpx_search_index_hash`). Se il testo ricalcolato ha lo stesso hash, non si scrive nulla: per un contenuto invariato il costo è una sola lettura di un meta piccolo;
- **blocchi riutilizzabili nella lingua giusta**: il riferimento viene tradotto nella **lingua del contenuto che si sta indicizzando**, non in quella del visitatore (che durante un cron non esiste). L'elenco degli ID già visitati evita cicli infiniti, come nel rendering.

## 3. Quando indicizzare: `SaveHook` e `Cron`

**Al salvataggio.** `SaveHook` si aggancia a `acf/save_post` con priorità 20, cioè **dopo** che ACF ha finito di scrivere i sotto-campi:

```php
add_action('acf/save_post', [$this, 'maybeReindex'], 20);
```

e reindicizza solo i post type presenti in `IndexablePostTypes`.

**Periodicamente.** Alcune modifiche non passano da `acf/save_post`:

- un **blocco riutilizzabile** modificato: cambia il testo di tutte le pagine che lo includono, ma nessuna di queste viene salvata;
- la **sincronizzazione delle traduzioni** di WPML;
- importazioni dirette nel database.

`Cron` scorre tutti i contenuti indicizzabili **a lotti di 100**, ricordando a che punto è arrivato (`wpx_search_index_cron_offset`):

- un evento **giornaliero** avvia un nuovo giro;
- un evento **orario** continua il giro solo se è già in corso (offset > 0), così un giro completo dura ore e non giorni, ma tra un giro e l'altro non gira a vuoto ogni ora;
- un **lock** (transient con scadenza di 5 minuti) evita che i due eventi si sovrappongano.

Grazie all'hash, i contenuti invariati vengono saltati quasi a costo zero.

> ℹ️ [WP-Cron](23-basi-wordpress.md#altre-api) non è un vero cron di sistema: parte quando qualcuno visita il sito. In produzione conviene disattivarlo (`DISABLE_WP_CRON`) e chiamare `wp-cron.php` da un cron di sistema, così gli eventi girano a orari regolari anche con poco traffico.

## 4. Cercare nell'indice: `SearchQuery`

`SearchQuery` modifica la query SQL di [`WP_Query`](23-basi-wordpress.md#wp-query) tramite due [filtri](23-basi-wordpress.md#hook), **solo** per le query che lo chiedono esplicitamente con la query var `wpx_search_index`:

```php
// search.php
$query = new WP_Query([
    's' => $searchQuery,
    'post_type' => 'any',
    'post_status' => 'publish',
    'wpx_search_index' => true,   // ← attiva la ricerca anche nell'indice
]);
```

- `posts_join` aggiunge un `LEFT JOIN` sul meta `_wpx_search_index`. È `LEFT` e non `INNER` perché i contenuti senza indice (nessun blocco con testo) devono restare trovabili per titolo;
- `posts_search` ricostruisce la condizione di ricerca con la stessa logica di WordPress (**tutte** le parole devono comparire, ognuna in **almeno una** colonna), aggiungendo l'indice come quarta colonna:

```sql
AND ( (post_title LIKE '%mobilità%') OR (post_excerpt LIKE '%mobilità%') OR (post_content LIKE '%mobilità%') OR (wpx_si.meta_value LIKE '%mobilità%') )
AND ( (post_title LIKE '%urbana%') OR … OR (wpx_si.meta_value LIKE '%urbana%') )
```

I valori passano da `$wpdb->esc_like()` e `$wpdb->prepare()`, quindi sono al sicuro da SQL injection.

**Perché opt-in?** Altre query con `s` (il campo di ricerca del blocco Hub contenuti, la ricerca nei selettori della bacheca, le ricerche di plugin) restano invariate e non pagano il costo del join. Per attivare la ricerca nell'indice in un'altra query basta aggiungere `'wpx_search_index' => true`.

## Riepilogo operativo

- **nuovo blocco con testo** → aggiungerlo a `LayoutSelectors`;
- **nuovo post type da cercare** → aggiungerlo a `IndexablePostTypes` (e farlo non escluso dalla ricerca con `exclude_from_search => false`);
- **indice da ricostruire subito** (es. dopo un import o dopo aver modificato la mappa) → risalvare i contenuti, oppure lanciare l'evento del cron fino alla fine del giro:

  ```bash
  docker exec "$WEB_CONTAINER" wp cron event run wpx_search_index_reconcile --allow-root
  ```

---

← [10. Icone selezionabili dai redattori](10-icone.md) · [Indice](README.md) · [12. Custom post type e tassonomie](12-post-type-tassonomie.md) →
