# 21. Frontend: componenti globali, auto-import, Storybook

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `src/main.ts` · `src/components/` · `src/components.d.ts` · `vite.config.ts` · `vite/lucide-resolver.ts` · `.storybook/main.ts`

## Tre modi in cui un componente è "disponibile"

| Meccanismo                              | Componenti                                             | Dove si usano             | Perché                                                                                                                                                     |
|-----------------------------------------|--------------------------------------------------------|---------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `app.component()` in `main.ts`          | solo `WpProxyCmp`                                      | nell'HTML generato da PHP | l'HTML del server è un template compilato a runtime: non può contenere `import`, quindi l'unico modo per far riconoscere un tag è la registrazione globale |
| Registry (`componentRegistry.ts`)       | moduli, card, header, footer                           | tramite `data-component`  | vedi [sezione 20](20-frontend-proxy.md)                                                                                          |
| Auto-import (`unplugin-vue-components`) | tutti i componenti in `src/components/` + icone Lucide | nei template `.vue`       | nessun `import` manuale tra componenti                                                                                                                     |

## Auto-import dei componenti

In `vite.config.ts` (e uguale in `.storybook/main.ts`):

```ts
Components({
  dirs: ['src/components'],
  resolvers: [LucideResolver()],
  dts: 'src/components.d.ts',
}),
```

Il plugin analizza i template `.vue` e, quando trova `<WrapperCmp>` o `<rte-cmp>`, aggiunge **in fase di build** l'import del componente corrispondente. Per questo in `TxtAndImgModuleCmp.vue` si usano `WrapperCmp`, `CtaCmp`, `HexagonIconCmp` senza importarli.

Non è una registrazione globale a runtime: ogni componente importa solo ciò che usa, quindi il tree-shaking funziona. Il file `src/components.d.ts` (generato, non va modificato a mano) dà a TypeScript e all'IDE i tipi di tutti i componenti.

Il `LucideResolver` (`vite/lucide-resolver.ts`) fa lo stesso per le icone: `<LucideArrowRight />` viene importato automaticamente da `@lucide/vue`.

## Convenzioni dei componenti

- una cartella per componente: `src/components/NomeCmp/NomeCmp.vue` + `NomeCmp.stories.ts`;
- suffisso `Cmp` su tutti i componenti; suffisso `ModuleCmp` per i componenti "a tutta larghezza" usati dai blocchi del Post Builder;
- `WrapperCmp` è il contenitore comune dei moduli: gestisce sfondo chiaro/scuro, pattern decorativo e container. I blocchi PHP gli passano sempre un oggetto `wrapperProps` costruito dalla scheda "Contenitore";
- `RteCmp` applica la tipografia ai contenuti HTML provenienti dai WYSIWYG.

## Storybook

Storybook 10 (`@storybook/vue3-vite`) permette di sviluppare ogni componente **in isolamento**, con dati finti, senza WordPress né database (`make dup-fe`). Le story replicano la struttura usata da PHP: props come `args`, contenuti HTML passati come slot.

Il flusso consigliato per un nuovo blocco è quindi **design → componente + story → blocco PHP**: il componente è "finito" prima ancora che esistano i campi ACF.

`make release` genera anche la versione statica di Storybook (`storybook-static/`), pubblicabile come catalogo dei componenti.

## Altre librerie frontend

| Libreria       | Uso                                                                                                    |
|----------------|--------------------------------------------------------------------------------------------------------|
| Tailwind CSS 4 | stile (con `@source` anche sui file PHP del tema, così le classi usate nei template PHP sono generate) |
| Reka UI        | primitive accessibili headless (dialog, select, accordion…)                                            |
| VueUse         | composable di utilità (breakpoint, eventi…)                                                            |
| Swiper         | slider                                                                                                 |
| Chart.js       | grafici                                                                                                |
| Vuelidate      | validazione dei form                                                                                   |

---

← [20. Frontend: il componente proxy e il registry](20-frontend-proxy.md) · [Indice](README.md) · [22. Asset: dev server, build e manifest](22-asset-build.md) →
