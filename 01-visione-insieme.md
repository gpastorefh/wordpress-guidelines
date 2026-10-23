# 1. Visione d'insieme

Il progetto è un **ibrido**: WordPress genera l'HTML lato server, Vue 3 lo "prende in carico" nel browser e lo rende interattivo.

```
┌──────────────────────────── server ────────────────────────────┐
│ WordPress                                                      │
│  ├─ campi ACF definiti in PHP   → dati inseriti dai redattori  │
│  ├─ template PHP                → leggono i dati e producono   │
│  │                                 HTML con tag <wp-proxy-cmp> │
│  └─ Vite manifest               → sa quali JS/CSS includere    │
└────────────────────────────────────────────────────────────────┘
                              │ HTML
                              ▼
┌──────────────────────────── browser ───────────────────────────┐
│ main.ts                                                        │
│  ├─ trasforma l'HTML (data-v-slot → <template v-slot>)         │
│  ├─ monta Vue su #app usando l'HTML stesso come template       │
│  └─ ogni <wp-proxy-cmp data-component="X"> diventa il          │
│     componente Vue X (props da data-config, slot dall'HTML)    │
└────────────────────────────────────────────────────────────────┘
```

Il principio guida è una **separazione netta delle responsabilità**:

| Livello              | Si occupa di                                               | Non si occupa di                      |
|----------------------|------------------------------------------------------------|---------------------------------------|
| WordPress / PHP      | dati, query, permessi, URL, traduzioni, sanitizzazione     | aspetto grafico, interazioni          |
| Template PHP         | "impacchettare" i dati per un componente Vue               | stili, logica di UI                   |
| Componenti Vue       | markup finale, stile (Tailwind), interattività, a11y       | da dove arrivano i dati               |

**Perché questo approccio e non un tema WordPress "classico"?** In un tema classico markup, stile e logica vivono negli stessi file PHP; ogni componente grafico va riscritto ovunque serva e non si può sviluppare in isolamento. Qui invece i componenti Vue sono sviluppati e testati visivamente in **Storybook** senza WordPress, e il PHP si limita a fornire i dati.

**Perché non un frontend "headless" (WordPress solo come API)?** Perché si perderebbero gratis: rendering lato server (SEO, primo caricamento), anteprime, routing e permalink di WordPress, compatibilità con plugin come WPML. L'approccio ibrido mantiene WordPress responsabile delle pagine e usa Vue come "motore di componenti".

---

[Indice](README.md) · [2. Struttura del progetto: dove sta cosa](02-struttura-progetto.md) →
