# 25. Glossario WordPress minimo

Definizioni in una riga. Per una spiegazione con esempi delle API corrispondenti vedi la [sezione 23](23-basi-wordpress.md).

| Termine                                            | Significato                                                                                   |
|----------------------------------------------------|-----------------------------------------------------------------------------------------------|
| **[Hook](23-basi-wordpress.md#hook)**              | Punto di aggancio: `add_action` esegue codice in un momento, `add_filter` modifica un valore  |
| **Template hierarchy**                             | Regole con cui WordPress sceglie quale file PHP usare per una richiesta                       |
| **[Template part](23-basi-wordpress.md#template)** | Pezzo di template incluso con `get_template_part('parts/x', null, $args)`                     |
| **[The Loop](23-basi-wordpress.md#loop)**          | Ciclo `have_posts()` / `the_post()` che imposta il "post corrente"                            |
| **[`WP_Query`](23-basi-wordpress.md#wp-query)**    | Classe per interrogare i contenuti con criteri (tipo, tassonomia, meta, date…)                |
| **[Post meta](23-basi-wordpress.md#dati)**         | Dati aggiuntivi di un contenuto; è dove ACF salva i valori dei campi                          |
| **CPT**                                            | Custom post type: un tipo di contenuto personalizzato                                         |
| **Tassonomia / termine**                           | Sistema di classificazione / singola voce (es. tassonomia "Temi", termine "Mobilità")         |
| **Rewrite / permalink**                            | Regole che trasformano URL leggibili in query; vanno rigenerate se cambiano gli slug          |
| **Options page**                                   | Pagina di impostazioni ACF con valori globali, letti con `getOption()`                        |
| **Flexible Content**                               | Campo ACF che contiene una lista ordinata di layout diversi (i blocchi)                       |
| **[Text domain](23-basi-wordpress.md#gettext)**    | Identificativo delle traduzioni del tema (`wpx-starter`)                                      |
| **WPML**                                           | Plugin multilingua: collega le versioni di un contenuto nelle diverse lingue                  |
| **[Escape / kses](23-basi-wordpress.md#escape)**   | Pulizia dell'output per evitare XSS: `esc_*` per testo/attributi, `wp_kses*` per HTML ammesso |

---

← [24. Convenzioni e strumenti di qualità](24-convenzioni.md) · [Indice](README.md)
