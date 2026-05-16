import './components/site-header.js';
import './components/site-footer.js';
import './components/ui-card.js';
import './components/page-grid.js';
import { store } from './store.js';
import { invalidateSearchIndex, renderSearchResults as _renderSearchResults } from './search-ui.js';
import { highlightTextInElement, clearHighlights } from './highlight.js';
import { renderDocumentsPage as _renderDocumentsPageFromModule } from './pages/docs.js';
import { renderMediaPage as _renderMediaPageFromModule } from './pages/media.js';
import { renderMainPage as _renderMainPageFromModule } from './pages/home.js';
import { renderInternationalPage as _renderIntlFromModule } from './pages/intl.js';
import { renderTimelinePage as _renderTimelineFromModule } from './pages/timeline.js';
import { renderLegalPage as _renderLegalFromModule } from './pages/legal.js';
import { renderPersonsPage as _renderPersonsFromModule } from './pages/persons.js';

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
      searchTimeout = setTimeout(() => {
        clearHighlights(container);
        _renderSearchResults(container, term, (pageId) => {
          store.setState({ activePage: pageId });
          renderActivePage();
        });
      }, 250);
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

  if (page === 'media')    return _renderMediaPageFromModule(container);
  if (page === 'intl')     return _renderIntlFromModule(container);
  if (page === 'timeline') return _renderTimelineFromModule(container);
  if (page === 'legal')    return _renderLegalFromModule(container);
  if (page === 'persons')  return _renderPersonsFromModule(container);
  if (page === 'docs')     return _renderDocumentsPageFromModule(container);
  return _renderMainPageFromModule(container);
}

// ---------- Re-exports for external use ----------

export function renderDocumentsPage() {
  return _renderDocumentsPageFromModule(container);
}

// Apply initial settings synchronously before first render
document.documentElement.dataset.theme = store.state.theme;
document.documentElement.lang = store.state.lang;

let _prevLang = store.state.lang;

store.subscribe((state) => {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.lang = state.lang;
  if (state.lang !== _prevLang) {
    _prevLang = state.lang;
    invalidateSearchIndex();
    renderActivePage();
  }
});

renderActivePage();
