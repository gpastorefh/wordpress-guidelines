# Architettura del tema WordPress + Vue — guida per sviluppatori

Questa guida spiega **come è costruito** un progetto basato su questo starter (WordPress come CMS, Vue 3 come livello di presentazione) e **perché** sono state fatte certe scelte.

È pensata per chi conosce poco WordPress e poco PHP: ogni concetto WordPress viene introdotto prima di mostrare come lo usiamo. Gli esempi di codice sono presi dal progetto reale, ma vanno letti come esempi del *pattern*, non come documentazione dei contenuti specifici del sito. Lo stesso vale per gli screenshot della bacheca (cartella `images/`).

## Versione HTML

I file `.md` di questa cartella sono l'unica fonte. La versione HTML navigabile (barra laterale, ricerca, tema chiaro/scuro) è generata da [VitePress](https://vitepress.dev) e non va modificata a mano:

```bash
yarn install     # la prima volta
yarn dev         # server locale con aggiornamento automatico mentre si scrive
yarn build       # genera il sito statico in .vitepress/dist/
yarn preview     # serve la build appena generata
```

Per aggiungere una sezione basta creare un file `NN-nome.md` che inizi con `# NN. Titolo`: compare da solo nella barra laterale, nel gruppo che corrisponde al suo numero (i gruppi sono definiti in `.vitepress/config.ts`).

## Indice

1. [Visione d'insieme](01-visione-insieme.md)
2. [Struttura del progetto: dove sta cosa](02-struttura-progetto.md)
3. [Ambiente di sviluppo: Docker e Makefile](03-ambiente-sviluppo.md)
4. [Il tema WordPress: struttura e bootstrap](04-tema-wordpress.md)
5. [Composer e autoload PSR-4 delle classi del tema](05-composer-autoload.md)
6. [ACF ed Extended ACF: i campi personalizzati in codice](06-acf.md)
7. [Il Post Builder: pagine a blocchi con Flexible Content](07-post-builder.md)
8. [Ricetta: creare un nuovo blocco dall'inizio alla fine](08-ricetta-nuovo-blocco.md)
9. [Blocchi riutilizzabili](09-blocchi-riutilizzabili.md)
10. [Icone selezionabili dai redattori](10-icone.md)
11. [Ricerca interna e contenuti del Post Builder](11-ricerca.md)
12. [Custom post type e tassonomie](12-post-type-tassonomie.md)
13. [Hub di contenuti e template singoli](13-hub-template-singoli.md)
14. [Loop di contenuti e template delle card](14-loop-card.md)
15. [Opzioni tema, header e footer](15-opzioni-header-footer.md)
16. [Menu di navigazione](16-menu.md)
17. [La pagina 404](17-pagina-404.md)
18. [Traduzioni: stringhe del tema e contenuti](18-traduzioni.md)
19. [Frontend: come Vue prende il controllo dell'HTML di WordPress](19-frontend-dom.md)
20. [Frontend: il componente proxy e il registry](20-frontend-proxy.md)
21. [Frontend: componenti globali, auto-import, Storybook](21-frontend-componenti.md)
22. [Asset: dev server, build e manifest](22-asset-build.md)
23. [Convenzioni e strumenti di qualità](23-convenzioni.md)
24. [Glossario WordPress minimo](24-glossario.md)
