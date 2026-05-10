import { store } from './store.js';

const pages = ['home', 'timeline', 'legal', 'persons', 'docs', 'intl', 'media'];

export async function buildSearchIndex(lang) {
  const index = [];
  for (const page of pages) {
    try {
      const response = await fetch(`./scripts/data/i18n/${page}/${lang}.json`);
      if (!response.ok) continue;
      const data = await response.json();
      index.push({ page, data });
    } catch (e) {
      console.error(`Error loading ${page} for search index:`, e);
    }
  }
  return index;
}

export function searchInIndex(index, term) {
  const results = [];
  const termLower = term.toLowerCase();
  
  index.forEach(item => {
    const textContent = JSON.stringify(item.data).toLowerCase();
    if (textContent.includes(termLower)) {
      results.push(item.page);
    }
  });
  return [...new Set(results)];
}
