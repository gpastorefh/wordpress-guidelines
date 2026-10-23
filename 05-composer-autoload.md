# 5. Composer e autoload PSR-4 delle classi del tema

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `composer.json` · `composer.lock` · `vendor/` (generata)

**Composer** è il gestore di pacchetti di PHP (l'equivalente di Yarn/npm). Nel tema viene usato per due scopi.

## 1. Dipendenze esterne

```json
"require": {
  "vinkla/extended-acf": "^15.0.0",
  "league/glide": "^4.1",
  "enshrined/svg-sanitize": "^0.22.0"
}
```

- **Extended ACF** — definizione dei campi ACF in PHP con API fluente (vedi [sezione 6](06-acf.md));
- **Glide** — ridimensionamento/ottimizzazione immagini on-demand con cache;
- **svg-sanitize** — pulizia degli SVG caricati in Libreria Media (un SVG può contenere script).

Le dipendenze sono nel tema (non in un plugin) perché il tema le usa direttamente: tema e dipendenze si versionano e deployano insieme.

## 2. Autoload delle classi del tema

```json
"autoload": {
  "psr-4": { "WpxStarter\\": "includes/" }
}
```

Questa riga dice: "una classe `WpxStarter\X\Y` si trova nel file `includes/X/Y.php`". Esempi:

| Classe                                       | File                                           |
|----------------------------------------------|------------------------------------------------|
| `WpxStarter\Setup\Assets`                    | `includes/Setup/Assets.php`                    |
| `WpxStarter\PostBuilder\Blocks\TextAndImage` | `includes/PostBuilder/Blocks/TextAndImage.php` |

Quando il codice usa una classe per la prima volta, l'autoloader include automaticamente il file giusto. **Non c'è nessun `require` manuale** nel tema, a parte quello di `vendor/autoload.php`.

**Perché?** Nei temi classici ogni file va incluso a mano con `require_once`, in un ordine preciso, e i nomi delle funzioni vanno prefissati per non collidere con plugin e core. Con namespace + autoload:

- nessun conflitto di nomi (il namespace `WpxStarter\` isola tutto);
- la struttura delle cartelle *è* la struttura del codice;
- le classi si caricano solo se usate.

> ⚠️ Con `optimize-autoloader` attivo Composer genera una mappa statica delle classi. **Dopo aver aggiunto, rinominato o eliminato una classe** va rigenerata, altrimenti PHP non la trova:
>
> ```bash
> docker exec -w /var/www/html/wp-content/themes/wpx-starter "$WEB_CONTAINER" composer dump-autoload --optimize
> ```

---

← [4. Il tema WordPress: struttura e bootstrap](04-tema-wordpress.md) · [Indice](README.md) · [6. ACF ed Extended ACF: i campi personalizzati in codice](06-acf.md) →
