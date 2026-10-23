# 8. Ricetta: creare un nuovo blocco dall'inizio alla fine

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `src/components/QuoteModuleCmp/` · `src/helpers/componentRegistry.ts` · `includes/PostBuilder/Blocks/Quote.php` · `parts/post-builder/quote.php` · `includes/Search/LayoutSelectors.php` · `languages/`

Il flusso tocca quattro punti. Esempio: un blocco "Citazione".

## Passo 1 — Il componente Vue (`src/components/QuoteModuleCmp/`)

Si parte dal design. Il componente:

- riceve i **dati semplici** come props (stringhe, booleani, link, opzioni di layout);
- riceve i **contenuti HTML** (testi formattati, immagini) come **slot**;
- non sa nulla di WordPress.

```vue
<template>
  <WrapperCmp class="QuoteModuleCmp" v-bind="wrapperProps" with-container>
    <blockquote>
      <rte-cmp v-if="!!slots.quote"><slot name="quote" /></rte-cmp>
      <footer v-if="author">{{ author }}</footer>
    </blockquote>
  </WrapperCmp>
</template>

<script setup lang="ts">
import type { WrapperCmpProps } from '@/components/WrapperCmp/WrapperCmp.vue';

export interface QuoteModuleCmpProps {
  wrapperProps?: WrapperCmpProps;
  author?: string;
}
defineProps<QuoteModuleCmpProps>();

const slots = defineSlots<{ quote(): never }>();
</script>
```

Accanto si scrive la **story** `QuoteModuleCmp.stories.ts` e si sviluppa il componente in Storybook, senza WordPress.

> **Props o slot?** Regola pratica: se il contenuto è HTML prodotto da WordPress (WYSIWYG, `<img>` con `srcset` generati da WP, titoli con tag variabile) → **slot**. Se è un dato da usare nella logica o negli attributi (URL, etichette, varianti, numeri) → **prop**. Gli slot hanno anche un vantaggio SEO: quel contenuto è presente come HTML vero nella risposta del server.

## Passo 2 — Registrare il componente nel registry (`src/helpers/componentRegistry.ts`)

```ts
import QuoteModuleCmp from '@/components/QuoteModuleCmp/QuoteModuleCmp.vue';

const registry: Record<string, Component> = {
  // ...
  QuoteModuleCmp,
};
```

Solo i componenti presenti qui possono essere istanziati da un template PHP (vedi [sezione 20](20-frontend-proxy.md)).

## Passo 3 — La classe del blocco con i campi ACF (`includes/PostBuilder/Blocks/Quote.php`)

```php
namespace WpxStarter\PostBuilder\Blocks;

final class Quote extends AbstractBlock
{
    public static function layoutName(): string
    {
        return 'quote';
    }

    public static function acfLayout(): Layout
    {
        return Layout::make(__('Quote', 'wpx-starter'), static::layoutName())
            ->layout('block')
            ->fields([
                Tab::make(__('Settings', 'wpx-starter'), 'tab_settings'),
                WYSIWYGEditor::make(__('Quote', 'wpx-starter'), 'quote')->required()->wpmlTranslate(),
                Text::make(__('Author', 'wpx-starter'), 'author')->wpmlTranslate(),
                ...ContainerTabFields::fields(),
            ]);
    }
}
```

Poi:

- rigenerare l'autoload (`composer dump-autoload --optimize`);
- per il `PostBuilder` non serve registrarlo: lo trova da solo. Aggiungerlo a `ORDER` per posizionarlo nel menu "Aggiungi blocco";
- se deve essere disponibile anche nel dettaglio dei contenuti, aggiungerlo alla whitelist di `SinglePostBuilder`.

## Passo 4 — Il template PHP con il componente proxy (`parts/post-builder/quote.php`)

```php
<?php

use WpxStarter\PostBuilder\Blocks\Quote;
use WpxStarter\Support\Html;

defined('ABSPATH') or die;

/** @var array{block: Quote} $args */
$block = $args['block'];

$quote = $block->getSubField('quote', '');

$config = [
    'author' => $block->getSubField('author', ''),
    'wrapperProps' => [
        'theme' => $block->getSubField('theme', 'dark'),
        'showPattern' => (bool) $block->getSubField('show_pattern', false),
        'patternVariant' => $block->getSubField('pattern_variant', '1'),
    ],
];
?>
<wp-proxy-cmp data-component="QuoteModuleCmp" <?php echo Html::attributes(['data-config' => $config]); ?>>
    <?php if (!empty($quote)) { ?>
    <div data-v-slot="quote"><?php echo wp_kses_post($quote); ?></div>
    <?php } ?>
</wp-proxy-cmp>
```

Il template:

1. **legge** i campi;
2. **adatta** i dati alla forma che si aspetta il componente (camelCase, booleani veri, default);
3. **serializza** le props in `data-config` con `Html::attributes()` (che fa il JSON e l'escape corretto);
4. **emette** gli slot come elementi con `data-v-slot="nome"`, **sanitizzando** ogni HTML (`wp_kses_post`, `esc_html`, `Html::inlineKses`…);
5. facoltativamente, stampa un **markup di fallback** (HTML semplice, senza `data-v-slot`) con i contenuti passati come prop, ad esempio un link. Vue lo ignora, ma rende l'HTML del server completo ([sezione 20](20-frontend-proxy.md)).

## Passo 5 — Ricerca interna

Se il blocco contiene testo che deve essere trovato dalla ricerca del sito, va aggiunto a `includes/Search/LayoutSelectors.php` (vedi [sezione 11](11-ricerca.md)):

```php
'quote' => [
    ['type' => 'scalar', 'selector' => 'quote'],
    ['type' => 'scalar', 'selector' => 'author'],
],
```

Se lo si dimentica il blocco funziona lo stesso, ma il suo testo non verrà trovato dalla ricerca.

## Passo 6 — Traduzioni

Le nuove etichette (`'Quote'`, `'Author'`) vanno aggiunte a `.pot`/`.po` con la skill `translator` (vedi [sezione 18](18-traduzioni.md)).

## Riepilogo del flusso

```
Redattore compila i campi ──► ACF salva i dati (post meta)
                                      │
page.php ──► PostBuilder::render() ──► Quote::render()
                                      │
           parts/post-builder/quote.php
           <wp-proxy-cmp data-component="QuoteModuleCmp" data-config='{"author":"…"}'>
             <div data-v-slot="quote"><p>…</p></div>
           </wp-proxy-cmp>
                                      │ (browser)
           main.ts ──► <template v-slot:quote> ──► WpProxyCmp ──► registry ──► QuoteModuleCmp
```

---

← [7. Il Post Builder: pagine a blocchi con Flexible Content](07-post-builder.md) · [Indice](README.md) · [9. Blocchi riutilizzabili](09-blocchi-riutilizzabili.md) →
