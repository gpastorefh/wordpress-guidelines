# 3. Ambiente di sviluppo: Docker e Makefile

> 📁 **File coinvolti** ([mappa del progetto](02-struttura-progetto.md)): `Makefile` · `infra/dev/docker-compose.yml` · `infra/dev/Dockerfile` · `infra/dev/Dockerfile.frontend` · `.env.template` · `.env.docker.template`

Tutto l'ambiente gira in **Docker Compose** (`infra/dev/docker-compose.yml`). L'host deve avere solo Docker, Make e (per comodità) Node/Yarn: **PHP e Composer non sono installati sull'host**, vivono nel container.

## Servizi

| Servizio          | Cosa fa                                                                     | URL locale            |
|-------------------|-----------------------------------------------------------------------------|-----------------------|
| `webdev`          | WordPress + PHP + Apache + Composer + WP-CLI. Monta la cartella `wp/`       | http://localhost:8000 |
| `mysql`           | Database MySQL 8.4                                                          | —                     |
| `webdbadmin`      | phpMyAdmin                                                                  | http://localhost:8080 |
| `mailpit`         | Intercetta tutte le email inviate da WordPress (nessuna email esce davvero) | http://localhost:8025 |
| `yarn-install`    | One-shot: esegue `yarn install` ed esce                                     | —                     |
| `frontend`        | Dev server Vite (hot reload)                                                | http://localhost:5173 |
| `storybook`       | Storybook dev server                                                        | http://localhost:6006 |
| `frontend-build`  | One-shot (profili `release` / `backend-build`): `yarn build`                | —                     |
| `storybook-build` | One-shot (profilo `release`): `yarn build-storybook`                        | —                     |

**Perché `yarn-install` è un servizio separato?** `frontend` e `storybook` condividono la stessa cartella `node_modules` (bind mount). Se entrambi eseguissero `yarn install` all'avvio andrebbero in conflitto sugli stessi file. Così l'install avviene una volta sola e gli altri due attendono (`depends_on: condition: service_completed_successfully`).

## Comandi Make

```bash
make check-env        # crea .env e .env.docker dai template (chiede nome progetto/DB, genera segreti casuali)
make dbuild           # build delle immagini
make dup              # tutto lo stack (WordPress + frontend + storybook)
make dup-fe           # solo Storybook: sviluppo componenti senza DB né WordPress
make dup-be           # solo backend (WordPress, MySQL, phpMyAdmin, Mailpit) + una build frontend one-shot
make release          # build di produzione del frontend (.build/) e di Storybook (storybook-static/)
make ddown            # ferma i container
make ddestroy         # rimuove container, volumi e immagini (chiede conferma)
make dump-db          # esporta il DB in dump/dump.sql
make restore-db       # importa dump/dump.sql
make create-superuser # crea/aggiorna un utente amministratore
```

Le tre modalità di avvio coprono tre profili di lavoro:

- **solo componenti** (`dup-fe`): si lavora su Vue + Storybook, avvio rapidissimo;
- **solo backend** (`dup-be`): si lavora su PHP/ACF con asset già compilati, senza dev server;
- **tutto** (`dup`): integrazione completa con hot reload anche dentro le pagine WordPress.

## Eseguire PHP, Composer e WP-CLI

Sempre dentro il container `webdev`:

```bash
WEB_CONTAINER="${COMPOSE_PROJECT_NAME:-wpx-starter-dev}-webdev-1"
THEME=/var/www/html/wp-content/themes/wpx-starter

docker exec -w "$THEME" "$WEB_CONTAINER" composer dump-autoload --optimize
docker exec "$WEB_CONTAINER" php -l "$THEME/includes/Setup/Assets.php"
docker exec "$WEB_CONTAINER" wp option get siteurl --allow-root
```

---

← [2. Struttura del progetto: dove sta cosa](02-struttura-progetto.md) · [Indice](README.md) · [4. Il tema WordPress: struttura e bootstrap](04-tema-wordpress.md) →
