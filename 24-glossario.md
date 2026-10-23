# 24. Glossario WordPress minimo

| Termine                  | Significato                                                                                   |
|--------------------------|-----------------------------------------------------------------------------------------------|
| **Hook**                 | Punto di aggancio: `add_action` esegue codice in un momento, `add_filter` modifica un valore  |
| **Template hierarchy**   | Regole con cui WordPress sceglie quale file PHP usare per una richiesta                       |
| **Template part**        | Pezzo di template incluso con `get_template_part('parts/x', null, $args)`                     |
| **The Loop**             | Ciclo `have_posts()` / `the_post()` che imposta il "post corrente"                            |
| **`WP_Query`**           | Classe per interrogare i contenuti con criteri (tipo, tassonomia, meta, date…)                |
| **Post meta**            | Dati aggiuntivi di un contenuto; è dove ACF salva i valori dei campi                          |
| **CPT**                  | Custom post type: un tipo di contenuto personalizzato                                         |
| **Tassonomia / termine** | Sistema di classificazione / singola voce (es. tassonomia "Temi", termine "Mobilità")         |
| **Rewrite / permalink**  | Regole che trasformano URL leggibili in query; vanno rigenerate se cambiano gli slug          |
| **Options page**         | Pagina di impostazioni ACF con valori globali, letti con `getOption()`                        |
| **Flexible Content**     | Campo ACF che contiene una lista ordinata di layout diversi (i blocchi)                       |
| **Text domain**          | Identificativo delle traduzioni del tema (`wpx-starter`)                                      |
| **WPML**                 | Plugin multilingua: collega le versioni di un contenuto nelle diverse lingue                  |
| **Escape / kses**        | Pulizia dell'output per evitare XSS: `esc_*` per testo/attributi, `wp_kses*` per HTML ammesso |

---

← [23. Convenzioni e strumenti di qualità](23-convenzioni.md) · [Indice](README.md)
