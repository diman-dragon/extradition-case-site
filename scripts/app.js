import './components/site-header.js';
import './components/site-footer.js';
import './components/ui-card.js';
import './components/page-grid.js';
import { store } from './store.js';
import { buildSearchIndex, searchInIndex } from './search.js';
import { renderMainPage }          from './pages/home.js';
import { renderTimelinePage }      from './pages/timeline.js';
import { renderLegalPage }         from './pages/legal.js';
import { renderPersonsPage }       from './pages/persons.js';
import { renderDocumentsPage }     from './pages/docs.js';
import { renderInternationalPage } from './pages/intl.js';
import { renderMediaPage }         from './pages/media.js';

const container = document.getElementById('app-container');

const PAGE_TITLES_I18N = {
  ru: { home: 'Главная', timeline: 'Хронология', legal: 'Правовая оценка', persons: 'Действующие лица', docs: 'Документы', intl: 'Международный контур', media: 'Медиа-архив' },
  en: { home: 'Overview', timeline: 'Timeline', legal: 'Legal Analysis', persons: 'Who\'s Who', docs: 'Documents', intl: 'International Proceedings', media: 'Press Coverage' },
  sr: { home: 'Pregled', timeline: 'Hronologija', legal: 'Pravna analiza', persons: 'Učesnici', docs: 'Dokumenti', intl: 'Međunarodni okvir', media: 'Medijska arhiva' },
};

const SITE_NAME = 'Extradition Case';

function setDocumentTitle(page) {
  const lang = store.state.lang;
  const titles = PAGE_TITLES_I18N[lang] || PAGE_TITLES_I18N.en;
  const label = titles[page] || page;
  document.title = `${label} — ${SITE_NAME}`;
}

// ---------- Highlight helpers ----------

function highlightTextInElement(element, term) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node;
  const nodes = [];
  while (node = walker.nextNode()) nodes.push(node);

  nodes.forEach(node => {
    const parent = node.parentNode;
    if (parent.nodeName === 'MARK') return;
    const text = node.textContent;
    if (text.toLowerCase().includes(term.toLowerCase())) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
      const fragment = document.createDocumentFragment();
      parts.forEach(part => {
        if (part.toLowerCase() === term.toLowerCase()) {
          const mark = document.createElement('mark');
          mark.textContent = part;
          mark.style.backgroundColor = 'var(--accent)';
          mark.style.color = 'var(--accent-soft)';
          fragment.appendChild(mark);
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      parent.replaceChild(fragment, node);
    }
  });
}

function clearHighlights(element) {
  const marks = element.querySelectorAll('mark');
  marks.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

// ---------- Global search ----------

let searchIndex = null;

async function getSearchIndex() {
  if (!searchIndex) {
    searchIndex = await buildSearchIndex(store.state.lang);
  }
  return searchIndex;
}

function highlightSnippet(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark style="background:var(--accent);color:var(--accent-soft)">$1</mark>');
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function renderSearchResults(term) {
  const lang = store.state.lang;
  const i18n = {
    ru: { title: 'Поиск', found: (n) => `Найдено на ${n} ${n === 1 ? 'странице' : 'страницах'}`, none: 'Ничего не найдено.', go: 'Перейти' },
    en: { title: 'Search', found: (n) => `Found on ${n} ${n === 1 ? 'page' : 'pages'}`, none: 'Nothing found.', go: 'Go to' },
    sr: { title: 'Pretraga', found: (n) => `Pronađeno na ${n} ${n === 1 ? 'stranici' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'stranice' : 'stranica'}`, none: 'Ništa nije pronađeno.', go: 'Idi na' },
  };
  const s = i18n[lang] || i18n.en;
  document.title = `${s.title}: «${term}» — ${SITE_NAME}`;
  const index = await getSearchIndex();
  const results = searchInIndex(index, term);

  container.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'page';

  if (results.length === 0) {
    page.innerHTML = `
      <h2>${s.title}: «${escapeHtml(term)}»</h2>
      <p style="color: var(--text-muted); margin-top: 1rem;">${s.none}</p>
    `;
  } else {
    page.innerHTML = `
      <h2>${s.title}: «${escapeHtml(term)}»</h2>
      <p style="color: var(--text-muted); margin-top: 0.25rem; margin-bottom: 1.5rem;">
        ${s.found(results.length)}
      </p>
      <div id="search-results-list" style="display:flex;flex-direction:column;gap:1.5rem;"></div>
    `;

    const list = page.querySelector('#search-results-list');
    results.forEach(({ page: pageId, pageTitle, snippets }) => {
      const card = document.createElement('div');
      card.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1.25rem;';
      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">
          <strong style="font-size:var(--text-base);">${escapeHtml(pageTitle)}</strong>
          <a href="javascript:void(0)"
             data-page="${escapeHtml(pageId)}"
             style="font-size:var(--text-sm);color:var(--accent);text-decoration:none;"
             class="go-to-page">${s.go} →</a>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
          ${snippets.map(snip => `
            <div style="font-size:var(--text-sm);padding:0.5rem 0.75rem;background:var(--surface-strong);border-left:3px solid var(--accent);border-radius:0 4px 4px 0;line-height:1.5;">
              ${highlightSnippet(escapeHtml(snip), term)}
            </div>
          `).join('')}
        </div>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.go-to-page').forEach(link => {
      link.addEventListener('click', () => {
        store.setState({ activePage: link.dataset.page });
        renderActivePage();
      });
    });
  }

  container.appendChild(page);
}

// ---------- Page routing ----------

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('site-header');
  let searchTimeout = null;

  header.addEventListener('search', (e) => {
    const term = e.detail.trim();
    clearTimeout(searchTimeout);
    if (term === '') {
      renderActivePage();
    } else {
      searchTimeout = setTimeout(() => renderSearchResults(term), 250);
    }
  });

  header.addEventListener('navigate', (e) => {
    store.setState({ activePage: e.detail });
    renderActivePage();
  });

  window.addEventListener('popstate', () => {
    store.syncFromUrl();
    renderActivePage();
  });
});

export function renderActivePage() {
  clearHighlights(container);

  const page = store.state.activePage;
  setDocumentTitle(page);

  if (page === 'media')    return renderMediaPage(container);
  if (page === 'intl')     return renderInternationalPage(container);
  if (page === 'timeline') return renderTimelinePage(container);
  if (page === 'legal')    return renderLegalPage(container);
  if (page === 'persons')  return renderPersonsPage(container);
  if (page === 'docs')     return renderDocumentsPage(container);
  return renderMainPage(container);
}

// ---------- Init ----------

document.documentElement.dataset.theme = store.state.theme;
document.documentElement.lang = store.state.lang;

let _prevLang = store.state.lang;

store.subscribe((state) => {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.lang = state.lang;
  if (state.lang !== _prevLang) {
    _prevLang = state.lang;
    searchIndex = null; // invalidate index on lang change
    renderActivePage();
  }
});

renderActivePage();
