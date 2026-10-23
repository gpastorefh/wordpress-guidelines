# 20. Frontend: il componente proxy e il registry

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `src/globals/WpProxyCmp.vue` · `src/helpers/componentRegistry.ts` · `src/composables/useDataConfig.ts` · `includes/Support/Html.php`

## `WpProxyCmp` (`src/globals/WpProxyCmp.vue`)

È il ponte tra l'HTML di WordPress e i componenti Vue. Riceve due attributi:

- `data-component` → nome del componente da renderizzare;
- `data-config` → JSON con le props.

```vue
<template>
  <component v-if="resolvedComponent" :is="resolvedComponent" v-bind="config">
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps" />
    </template>
  </component>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ dataComponent: string; dataConfig?: string }>(), {
  dataConfig: '{}',
});

const { config } = useDataConfig<Record<string, unknown>>(props);   // JSON.parse
const resolvedComponent = computed(() => resolveComponentByName(props.dataComponent));
</script>
```

Fa tre cose:

1. **risolve** il componente reale cercandolo nel registry;
2. **passa** il JSON di `data-config` come props (`v-bind="config"`);
3. **inoltra tutti gli slot** ricevuti al componente reale, così il `<template v-slot:text>` generato da PHP arriva allo slot `text` di `TxtAndImgModuleCmp`.

Se il nome non è nel registry, scrive un warning in console (`[ProxyCmp] No component registered for …`) e non renderizza nulla: è il primo posto da guardare quando un blocco "non compare".

**Perché un proxy invece di scrivere direttamente `<txt-and-img-module-cmp>` in PHP?**

- **un solo componente globale**: l'app root conosce solo `WpProxyCmp`, quindi non serve registrare globalmente decine di componenti;
- **props con tipi veri**: gli attributi HTML sono sempre stringhe; passando un unico JSON si ottengono numeri, booleani, array e oggetti annidati senza conversioni;
- **un'unica convenzione** nei template PHP, facile da riconoscere e da cercare (`data-component="…"`).

Lato PHP la serializzazione è sempre fatta con `Html::attributes(['data-config' => $config])`, che produce il JSON (decodificando le entità HTML che WordPress mette nei testi) e lo escapa per l'attributo.

## Markup di fallback: HTML "pieno" che Vue poi ignora

In molti template PHP, dentro un `<wp-proxy-cmp>`, viene stampato HTML che **non è** in uno slot nominato (`data-v-slot`) e che contiene dati **già passati al componente come prop**. Esempio dalla card di un contenuto:

```php
$link = ['title' => __('Read', 'wpx-starter'), 'url' => get_permalink()];
$config = ['link' => $link, /* ... */];   // ← il link arriva al componente come prop
?>
<wp-proxy-cmp data-component="CardContentCmp" <?php echo Html::attributes(['data-config' => $config]); ?>>
    <?php printf('<h3 data-v-slot="title">%s</h3>', esc_html(get_the_title())); ?>

    <!-- stesso link, stampato di nuovo come HTML semplice -->
    <a href="<?php echo esc_url($link['url']); ?>"><?php echo esc_html($link['title']); ?></a>
</wp-proxy-cmp>
```

Lo stesso avviene, in forma più estesa, in `header.php` e `footer.php`: menu, lingue alternative, CTA e social sono passati come JSON nel `data-config` e **anche** stampati come `<nav><ul><li><a>…` dentro il proxy.

**Cosa succede al rendering.** Tutto ciò che sta dentro `<wp-proxy-cmp>` senza `data-v-slot` finisce nello **slot di default** del proxy, che lo inoltra al componente reale insieme agli altri slot. Ma i componenti di primo livello (card, moduli, header, footer) **non dichiarano uno slot di default**: Vue quindi non lo renderizza da nessuna parte. Il componente costruisce il link, il menu o i bottoni a partire dalle props, e quell'HTML viene semplicemente scartato.

**A cosa serve allora.** Serve a fare in modo che l'HTML inviato dal server sia **coerente e completo anche senza Vue**:

- **SEO e crawler**: un motore di ricerca che legge il sorgente trova link `<a href>` veri, testi e struttura (`<nav>`, `<ul>`, `<header>`, `<footer>`), invece di un JSON dentro un attributo;
- **robustezza**: se JavaScript non si carica o va in errore, il sorgente contiene comunque i link essenziali (navigazione, "leggi", contatti);
- **leggibilità**: aprendo il sorgente della pagina (o il template PHP) si capisce cosa conterrà ogni componente senza decodificare il JSON.

Gli utenti non vedono mai questo HTML "grezzo": `#app` resta nascosto da `v-cloak` finché Vue non ha montato ([sezione 19](19-frontend-dom.md)).

**Regole pratiche:**

- il markup di fallback è **semplice e semantico**: niente classi, niente stili, solo i tag giusti e il contenuto (link, titoli, testi);
- deve rispettare le stesse regole di **escape** del resto del template (`esc_url`, `esc_html`…): è comunque HTML che arriva al browser;
- vale la pena quando la prop contiene **contenuto significativo** (link, testi, elenchi). Per le opzioni di presentazione (`theme`, `columns`, varianti) non serve;
- **attenzione allo slot di default**: il fallback viene scartato solo perché il componente non ha un `<slot />` senza nome. Se un componente lo dichiara, quell'HTML viene **renderizzato davvero**. Succede per esempio con `CardGridCmp`, che usa lo slot di default proprio per ricevere le card: lì tutto il contenuto senza `data-v-slot` è contenuto reale, e non va messo markup di fallback.

## Il registry (`src/helpers/componentRegistry.ts`)

È una **mappa esplicita** nome → componente:

```ts
const registry: Record<string, Component> = {
  HeaderCmp,
  FooterCmp,
  TxtAndImgModuleCmp,
  CardContentCmp,
  // ...
};
```

**Perché una whitelist scritta a mano e non `import.meta.glob` su tutta la cartella?**

- **superficie controllata**: solo i componenti pensati per essere usati da WordPress (moduli, card, header/footer) sono istanziabili dall'HTML; i componenti interni (bottoni, icone, campi di form) no;
- **bundle prevedibile**: si sa esattamente cosa viene incluso nel bundle principale; un glob includerebbe tutto, anche componenti usati solo in Storybook;
- **errori evidenti**: se un template PHP usa un nome sbagliato, il warning in console lo dice subito.

Il prezzo è una riga da aggiungere per ogni nuovo componente "di primo livello" (passo 2 della ricetta).

---

← [19. Frontend: come Vue prende il controllo dell'HTML di WordPress](19-frontend-dom.md) · [Indice](README.md) · [21. Frontend: componenti globali, auto-import, Storybook](21-frontend-componenti.md) →
