# 19. Frontend: come Vue prende il controllo dell'HTML di WordPress

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `src/main.ts` · `src/helpers/vueDomTransforms.ts` · `src/helpers/scrollToHash.ts` · `src/styles/critical.css` · `vite.config.ts`

## L'idea chiave: l'HTML della pagina è il template di Vue

Normalmente un'app Vue ha componenti con template propri e monta su un `<div>` vuoto. Qui invece l'app root **non ha template**: Vue usa come template **il contenuto HTML già presente dentro `#app`**, cioè quello generato da WordPress.

```ts
// src/main.ts
const root = prepareVueRootById('app');

if (root) {
  removeTemplateSideEffectTags(root);
  transformDataVCloakToVCloak(root);

  const app = createApp({});                 // nessun template: usa l'HTML di #app
  app.component('WpProxyCmp', WpProxyCmp);    // l'unico componente registrato globalmente
  app.mount(root);
}
```

Questo richiede la build di Vue **con il compilatore di template incluso** (alias in `vite.config.ts`):

```ts
resolve: { alias: { vue: 'vue/dist/vue.esm-bundler.js' } }
```

perché il template (l'HTML di WordPress) è noto solo a runtime e va compilato nel browser.

Conseguenza pratica: nell'HTML generato da PHP i componenti si scrivono in **kebab-case** (`<wp-proxy-cmp>`), perché l'HTML è case-insensitive e il browser trasformerebbe `<WpProxyCmp>` in `<wpproxycmp>`.

## Le trasformazioni preliminari (`src/helpers/vueDomTransforms.ts`)

Prima del mount, `main.ts` modifica il DOM in tre passaggi.

### 1. `prepareVueRootById` — da `data-v-slot` a `<template v-slot>`

PHP produce:

```html
<wp-proxy-cmp data-component="TxtAndImgModuleCmp" data-config='{"…"}'>
  <div data-v-slot="text"><h2>Titolo</h2><p>…</p></div>
</wp-proxy-cmp>
```

lo script lo trasforma in:

```html
<wp-proxy-cmp data-component="TxtAndImgModuleCmp" data-config='{"…"}'>
  <template v-slot:text><h2>Titolo</h2><p>…</p></template>
</wp-proxy-cmp>
```

cioè nella sintassi degli slot di Vue.

**Perché non scrivere direttamente `<template v-slot:text>` in PHP?**

- il contenuto di un `<template>` HTML è **inerte e invisibile**: prima che Vue monti (o se JavaScript fallisce) quel testo non esisterebbe nella pagina renderizzata; con un `<div>` il contenuto è HTML reale;
- attributi come `v-slot:text` o `#text` non sono HTML valido e possono essere alterati da sanitizzatori, plugin o editor; `data-*` è HTML standard e sicuro;
- i template PHP restano leggibili da chi non conosce Vue.

Lo script ordina i nodi **dai più interni ai più esterni** prima di sostituirli: con slot annidati (una card dentro uno slot della griglia) la sostituzione dell'esterno copierebbe un `innerHTML` ancora non trasformato.

### 2. `removeTemplateSideEffectTags` — rimozione di `<script>` e `<style>`

Il compilatore di Vue non accetta tag `<script>` e `<style>` dentro un template (li ignora con un warning). Ma dentro `#app` possono finirci, ad esempio da un embed di terze parti o da un plugin. Vengono rimossi prima del mount: a quel punto **sono già stati eseguiti** dal browser durante il parsing della pagina (lo script di Vue è un modulo, quindi parte dopo), quindi rimuoverli non ne annulla l'effetto.

### 3. `transformDataVCloakToVCloak` — evitare il "flash" di contenuto

`#app` nasce con `data-v-cloak`, che il CSS critico (inline nell'`<head>`) nasconde:

```css
[v-cloak], [data-v-cloak] { display: none; }
```

Lo script lo converte in `v-cloak`, la direttiva che Vue rimuove automaticamente al termine del mount. Risultato: l'utente non vede l'HTML "grezzo" (fallback di header, slot non stilizzati) per un istante prima che Vue lo sostituisca. Il contenuto resta comunque nel **sorgente HTML** per i motori di ricerca.

### Dopo il mount

`scrollToHash()` viene richiamato al `nextTick`: alcuni `id` (es. l'ancora `#content-hub` usata dalla paginazione) vengono assegnati dai componenti Vue tramite props e non esistono al caricamento, quindi lo scroll nativo del browser all'hash non li troverebbe.

---

← [18. Traduzioni: stringhe del tema e contenuti](18-traduzioni.md) · [Indice](README.md) · [20. Frontend: il componente proxy e il registry](20-frontend-proxy.md) →
