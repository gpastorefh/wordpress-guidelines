# 24. Convenzioni e strumenti di qualità

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `package.json` · `eslint.config.ts` · `.oxlintrc.json` · `.prettierrc.json` · `.husky/` · `includes/Support/Html.php` · `CLAUDE.md` · `.claude/`

## Frontend

- **Yarn 4** è l'unico package manager (`yarn.lock` è la fonte di verità; niente `npm`/`npx`/altri lockfile);
- **lint**: `oxlint` (veloce) + `eslint` (regole Vue/TS), con `yarn lint` / `yarn lint:check`;
- **formattazione**: Prettier con plugin Tailwind (ordina le classi);
- **type check**: `vue-tsc` (`yarn type-check`, incluso in `yarn build`);
- **pre-commit**: Husky + lint-staged eseguono eslint e prettier sui file modificati;
- **mai** risolvere un errore di lint con `eslint-disable`;
- un solo attributo `:class` per elemento (array per mescolare classi statiche e dinamiche), mai `class` + `:class`;
- spaziature sempre con la scala Tailwind (`p-5`), mai valori in pixel (`p-[20px]`).

## PHP / WordPress

- ogni file inizia con `defined('ABSPATH') or die;` (impedisce l'esecuzione diretta del file fuori da WordPress);
- `final class`, tipi dichiarati, un file per classe, namespace `WpxStarter\`;
- nei template, sintassi con graffe `if () { … }`, non la sintassi alternativa `if: … endif;`;
- [**escape sempre in output**](23-basi-wordpress.md#escape): `esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`, oppure gli helper di `Support/Html` (`inlineKses`, `brKses` per textarea con `<br>`, `attributes`, `relForTarget` per i link `_blank`);
- campi ACF letti solo tramite `Support\Acf`;
- ogni **ID letto da un campo o da un'opzione** passa da `Wpml::translateObjectId(s)` prima dell'uso ([sezione 18](18-traduzioni.md));
- stringhe in inglese, con [text domain](23-basi-wordpress.md#gettext) `wpx-starter`.

## Claude Code

Il repository contiene configurazione per Claude Code: `CLAUDE.md` e `MEMORY.md` (convenzioni), subagent specializzati in `.claude/agents/` (`VUE`, `PHP`, `ACF`) e skill in `.claude/skills/` (tra cui `translator`).

---

← [23. WordPress in pratica: le API usate nel tema](23-basi-wordpress.md) · [Indice](README.md) · [25. Glossario WordPress minimo](25-glossario.md) →
