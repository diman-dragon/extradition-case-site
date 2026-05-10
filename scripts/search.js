import { store } from './store.js';

const pages = ['home', 'timeline', 'legal', 'persons', 'docs', 'intl', 'media'];

// Map page ids to human-readable titles
const PAGE_TITLES = {
  home: 'Главная',
  timeline: 'Хронология',
  legal: 'Правовая оценка',
  persons: 'Действующие лица',
  docs: 'Документы',
  intl: 'Адвокация',
  media: 'Медиа',
};

/**
 * Recursively extract all string values from a JSON object.
 */
function extractStrings(obj, parentKey = '') {
  const results = [];
  if (typeof obj === 'string') {
    if (obj.trim().length > 3) results.push({ text: obj, context: parentKey });
  } else if (Array.isArray(obj)) {
    obj.forEach(item => results.push(...extractStrings(item, parentKey)));
  } else if (obj && typeof obj === 'object') {
    Object.entries(obj).forEach(([k, v]) => results.push(...extractStrings(v, k)));
  }
  return results;
}

/**
 * Build a flat search index from all page JSON files.
 * Returns array of { page, pageTitle, strings: [{text, context}] }
 */
export async function buildSearchIndex(lang) {
  const index = [];
  for (const page of pages) {
    try {
      let response = await fetch(`./scripts/data/i18n/${page}/${lang}.json`);
      if (!response.ok) response = await fetch(`./scripts/data/i18n/${page}/ru.json`);
      if (!response.ok) continue;
      const data = await response.json();
      index.push({
        page,
        pageTitle: PAGE_TITLES[page] || page,
        strings: extractStrings(data),
      });
    } catch (e) {
      console.error(`Error loading ${page} for search index:`, e);
    }
  }
  return index;
}

/**
 * Search the index for a term.
 * Returns array of { page, pageTitle, snippets: string[] }
 */
export function searchInIndex(index, term) {
  if (!term || term.trim().length === 0) return [];
  const termLower = term.toLowerCase().trim();
  const results = [];

  index.forEach(({ page, pageTitle, strings }) => {
    const snippets = [];
    strings.forEach(({ text }) => {
      const lower = text.toLowerCase();
      if (lower.includes(termLower)) {
        const idx = lower.indexOf(termLower);
        const start = Math.max(0, idx - 50);
        const end = Math.min(text.length, idx + termLower.length + 70);
        let snippet = text.slice(start, end).trim();
        if (start > 0) snippet = '\u2026' + snippet;
        if (end < text.length) snippet = snippet + '\u2026';
        if (!snippets.some(s => s.includes(snippet.slice(1, 30)))) {
          snippets.push(snippet);
        }
      }
    });
    if (snippets.length > 0) {
      results.push({ page, pageTitle, snippets: snippets.slice(0, 5) });
    }
  });

  return results;
}
