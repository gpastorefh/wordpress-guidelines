import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, type DefaultTheme } from 'vitepress';

const docsDir = fileURLToPath(new URL('..', import.meta.url));

// Sidebar groups by section number: a new `NN-*.md` file is picked up automatically
// and lands in the group whose range contains its number.
const groups: Array<{ text: string; from: number; to: number }> = [
  { text: 'Introduzione', from: 1, to: 3 },
  { text: 'Tema WordPress', from: 4, to: 6 },
  { text: 'Post Builder', from: 7, to: 11 },
  { text: 'Contenuti e struttura', from: 12, to: 17 },
  { text: 'Traduzioni', from: 18, to: 18 },
  { text: 'Frontend', from: 19, to: 22 },
  { text: 'Riferimenti', from: 23, to: 99 },
];

interface Section {
  number: number;
  title: string;
  link: string;
}

function readSections(): Section[] {
  return fs
    .readdirSync(docsDir)
    .filter((file) => /^\d{2}-.+\.md$/.test(file))
    .sort()
    .map((file) => {
      const firstLine = fs.readFileSync(path.join(docsDir, file), 'utf8').split('\n', 1)[0] ?? '';
      const title = firstLine.replace(/^#\s+/, '');

      return {
        number: Number.parseInt(file.slice(0, 2), 10),
        title,
        link: `/${file.replace(/\.md$/, '')}`,
      };
    });
}

function buildSidebar(sections: Section[]): DefaultTheme.SidebarItem[] {
  return groups
    .map((group) => ({
      text: group.text,
      collapsed: false,
      items: sections
        .filter((section) => section.number >= group.from && section.number <= group.to)
        .map((section) => ({ text: section.title, link: section.link })),
    }))
    .filter((group) => group.items.length > 0);
}

const sections = readSections();

export default defineConfig({
  lang: 'it-IT',
  title: 'Guida sviluppatori',
  description: 'Architettura del tema WordPress + Vue: scelte, pattern e ricette.',
  // Published on GitHub Pages under https://gpastorefh.github.io/wordpress-guidelines/.
  base: '/wordpress-guidelines/',
  cleanUrls: true,
  // The dev-environment section links to local Docker services (localhost:8000, ...).
  ignoreDeadLinks: 'localhostLinks',

  // README.md is the index on Git hosts; in the HTML version it becomes the home page.
  rewrites: { 'README.md': 'index.md' },

  markdown: {
    lineNumbers: false,
    config(md) {
      // Every .md file ends with a "← previous · Index · next →" paragraph for reading
      // on Git hosts. VitePress has its own prev/next footer, so drop it (and the <hr>
      // before it) from the rendered HTML only.
      md.core.ruler.push('strip-md-nav-footer', (state) => {
        const tokens = state.tokens;
        const index = tokens.findIndex(
          (token) => token.type === 'inline' && token.content.includes('[Indice](README.md)'),
        );

        if (index === -1 || tokens[index - 1]?.type !== 'paragraph_open') {
          return;
        }

        const start = tokens[index - 2]?.type === 'hr' ? index - 2 : index - 1;
        tokens.splice(start, index + 2 - start);
      });
    },
  },

  transformPageData(pageData) {
    if (pageData.relativePath !== 'index.md') {
      return;
    }

    pageData.title = 'Guida sviluppatori';
    pageData.frontmatter.layout = 'home';
    pageData.frontmatter.hero = {
      name: 'WordPress + Vue',
      text: 'Guida per sviluppatori',
      tagline:
        'Come è costruito il tema, quali scelte sono state fatte e perché: dal Post Builder ACF ai componenti Vue.',
      actions: [
        { theme: 'brand', text: 'Inizia a leggere', link: sections[0]?.link ?? '/' },
        { theme: 'alt', text: 'Ricetta: nuovo blocco', link: '/08-ricetta-nuovo-blocco' },
      ],
    };
    pageData.frontmatter.features = groups
      .map((group) => {
        const groupSections = sections.filter(
          (section) => section.number >= group.from && section.number <= group.to,
        );
        const first = groupSections[0];

        if (!first) {
          return null;
        }

        return {
          title: group.text,
          details: groupSections
            .map((section) => section.title.replace(/^\d+\.\s*/, ''))
            .join(' · '),
          link: first.link,
          linkText: 'Apri',
        };
      })
      .filter((feature) => feature !== null);
  },

  themeConfig: {
    siteTitle: 'Guida sviluppatori',
    nav: [
      { text: 'Inizia', link: sections[0]?.link ?? '/' },
      { text: 'Post Builder', link: '/07-post-builder' },
      { text: 'Frontend', link: '/19-frontend-dom' },
      { text: 'Glossario', link: '/24-glossario' },
    ],
    sidebar: buildSidebar(sections),
    outline: { level: [2, 3], label: 'In questa pagina' },
    docFooter: { prev: 'Precedente', next: 'Successivo' },
    darkModeSwitchLabel: 'Tema',
    lightModeSwitchTitle: 'Passa al tema chiaro',
    darkModeSwitchTitle: 'Passa al tema scuro',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Torna su',
    langMenuLabel: 'Lingua',
    notFound: {
      title: 'PAGINA NON TROVATA',
      quote: 'La pagina che cerchi non esiste o è stata spostata.',
      linkText: 'Torna all’indice',
    },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: 'Cerca', buttonAriaLabel: 'Cerca nella guida' },
          modal: {
            displayDetails: 'Mostra dettagli',
            resetButtonTitle: 'Cancella la ricerca',
            backButtonTitle: 'Chiudi la ricerca',
            noResultsText: 'Nessun risultato per',
            footer: {
              selectText: 'per selezionare',
              navigateText: 'per navigare',
              closeText: 'per chiudere',
            },
          },
        },
      },
    },
  },
});
