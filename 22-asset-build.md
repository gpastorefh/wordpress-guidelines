# 22. Asset: dev server, build e manifest

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `includes/Setup/Assets.php` · `vite.config.ts` · `src/styles/critical.css` · `src/styles/editor.css` · `.build/` (generata)

WordPress deve includere nella pagina il JavaScript e il CSS prodotti da Vite. Lo fa `Setup/Assets.php`, con due modalità decise dall'esistenza di un file.

## Sviluppo: il file `hot`

Quando parte `yarn dev`, un piccolo plugin in `vite.config.ts` scrive il file `.build/hot` nel tema con l'URL del dev server (es. `http://localhost:5173`) e lo cancella allo spegnimento.

Se `Assets.php` trova quel file, stampa nell'`<head>` i tag che puntano **direttamente al dev server**:

```html
<link rel="stylesheet" href="http://localhost:5173/src/styles/critical.css" />
<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/src/main.ts"></script>
```

Risultato: si naviga il sito WordPress su `localhost:8000` con **hot reload** dei componenti Vue. I tag sono stampati a mano e non con [`wp_enqueue_script`](23-basi-wordpress.md#enqueue) perché WordPress aggiungerebbe `?ver=…` agli URL, cosa che rompe il dev server.

## Produzione: il manifest

`yarn build` compila in `wp/wp-content/themes/wpx-starter/.build/` file con nomi contenenti un hash (`main-a1b2c3.js`) per il cache busting, più un **manifest** (`.vite/manifest.json`) che mappa sorgenti → file compilati.

Senza file `hot`, `Assets.php`:

- legge il manifest;
- accoda il JS principale come **modulo** (`wp_enqueue_script_module`);
- raccoglie **ricorsivamente** il CSS dell'entry e dei chunk importati (es. il chunk `vendor`) e lo accoda;
- stampa **inline** nell'`<head>` il CSS critico (`src/styles/critical.css`: font, regola `v-cloak`…), così è applicato prima di qualsiasi download.

Gli entry di build sono tre: `main` (app), `critical` (CSS inline) ed `editor` (CSS caricato dentro l'editor WYSIWYG della bacheca, così il testo appare come sul sito). Le dipendenze di `node_modules` finiscono in un chunk `vendor` separato, che cambia raramente e resta in cache.

---

← [21. Frontend: componenti globali, auto-import, Storybook](21-frontend-componenti.md) · [Indice](README.md) · [23. WordPress in pratica: le API usate nel tema](23-basi-wordpress.md) →
