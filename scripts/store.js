// Read persisted preferences on first load
const storedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
const storedLang  = typeof localStorage !== 'undefined' ? localStorage.getItem('lang')  : null;

const VALID_PAGES = ['home', 'timeline', 'legal', 'persons', 'docs', 'intl', 'media'];
const VALID_LANGS  = ['ru', 'sr', 'en'];
const VALID_THEMES = ['dark', 'light'];

// Read initial page from URL hash, e.g. #timeline → 'timeline'
function getPageFromUrl() {
  const hash = window.location.hash.replace('#', '').trim();
  return VALID_PAGES.includes(hash) ? hash : 'home';
}

const state = {
  lang:       VALID_LANGS.includes(storedLang)   ? storedLang  : 'ru',
  theme:      VALID_THEMES.includes(storedTheme) ? storedTheme : 'dark',
  searchTerm: '',
  activePage: getPageFromUrl(),
};
const subscribers = new Set();

function notify() {
  for (const fn of subscribers) {
    fn({ ...state });
  }
}

export const store = {
  get state() {
    return { ...state };
  },
  setState(patch) {
    // Validate each field before applying — prevents prototype pollution
    // and rejects invalid values from untrusted dispatch events.
    if (patch.lang !== undefined) {
      if (VALID_LANGS.includes(patch.lang)) {
        state.lang = patch.lang;
        localStorage.setItem('lang', state.lang);
      }
    }
    if (patch.theme !== undefined) {
      if (VALID_THEMES.includes(patch.theme)) {
        state.theme = patch.theme;
        localStorage.setItem('theme', state.theme);
      }
    }
    if (patch.activePage !== undefined) {
      if (VALID_PAGES.includes(patch.activePage)) {
        state.activePage = patch.activePage;
        // Push new history entry so browser back/forward works
        const hash = patch.activePage === 'home' ? '' : patch.activePage;
        const newUrl = hash ? `#${hash}` : window.location.pathname + window.location.search;
        if (window.location.hash.replace('#', '') !== hash) {
          history.pushState({ activePage: patch.activePage }, '', newUrl);
        }
      }
    }
    if (patch.searchTerm !== undefined) {
      // Limit search term length
      state.searchTerm = String(patch.searchTerm).slice(0, 100);
    }
    notify();
  },
  subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },
  // Called on popstate — update state from URL without pushing new history
  syncFromUrl() {
    const page = getPageFromUrl();
    state.activePage = page;
    notify();
  },
};
