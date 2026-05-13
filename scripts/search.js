import { store } from './store.js';

const pages = ['home', 'timeline', 'legal', 'persons', 'docs', 'intl', 'media'];

const MAX_TERM_LENGTH = 100;
const MAX_SNIPPETS_PER_PAGE = 5;

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
    // Guard against prototype pollution via JSON keys like __proto__
    Object.keys(obj).forEach(k => {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') return;
      results.push(...extractStrings(obj[k], k));
    });
  }
  return results;
}

/**
 * Build a flat search index from all page JSON files.
 * Returns array of { page, pageTitle, strings: [{text, context}] }
 */
export async function buildSearchIndex(lang) {
  // Load nav labels for the current language to use as page titles in results
  let navTitles = {};
  try {
    let navResp = await fetch(`./scripts/data/i18n/nav/${lang}.json`);
    if (!navResp.ok) navResp = await fetch(`./scripts/data/i18n/nav/ru.json`);
    if (navResp.ok) {
      navTitles = await navResp.json();
    }
  } catch (e) {}

  const index = [];
  for (const page of pages) {
    try {
      let response = await fetch(`./scripts/data/i18n/${page}/${lang}.json`);
      if (!response.ok) response = await fetch(`./scripts/data/i18n/${page}/ru.json`);
      if (!response.ok) continue;
      const data = await response.json();
      index.push({
        page,
        pageTitle: navTitles[page] || page,
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

  // Enforce max length to prevent catastrophic backtracking on long inputs
  const safeTerm = term.slice(0, MAX_TERM_LENGTH).toLowerCase().trim();
  if (safeTerm.length === 0) return [];

  const results = [];

  index.forEach(({ page, pageTitle, strings }) => {
    const snippets = [];
    strings.forEach(({ text }) => {
      if (snippets.length >= MAX_SNIPPETS_PER_PAGE) return;
      const lower = text.toLowerCase();
      if (lower.includes(safeTerm)) {
        const idx = lower.indexOf(safeTerm);
        const start = Math.max(0, idx - 50);
        const end = Math.min(text.length, idx + safeTerm.length + 70);
        let snippet = text.slice(start, end).trim();
        if (start > 0) snippet = '\u2026' + snippet;
        if (end < text.length) snippet = snippet + '\u2026';
        if (!snippets.some(s => s.includes(snippet.slice(1, 30)))) {
          snippets.push(snippet);
        }
      }
    });
    if (snippets.length > 0) {
      results.push({ page, pageTitle, snippets });
    }
  });

  return results;
}
