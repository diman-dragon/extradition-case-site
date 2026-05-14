// Read persisted preferences on first load
const storedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
const storedLang  = typeof localStorage !== 'undefined' ? localStorage.getItem('lang')  : null;

// Read initial page from URL hash, e.g. #timeline → 'timeline'
function getPageFromUrl() {
  const hash = window.location.hash.replace('#', '').trim();
  const valid = ['home', 'timeline', 'legal', 'persons', 'docs', 'intl', 'media'];
  return valid.includes(hash) ? hash : 'home';
}

const VALID_LANGS = ['ru', 'sr', 'en'];

const state = {
  lang:       VALID_LANGS.includes(storedLang) ? storedLang : 'ru',
  theme:      storedTheme === 'light' ? 'light' : 'dark',
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
    Object.assign(state, patch);
    if (patch.theme) {
      localStorage.setItem('theme', state.theme);
    }
    if (patch.lang) {
      localStorage.setItem('lang', state.lang);
    }
    if (patch.activePage) {
      // Push new history entry so browser back/forward works
      const hash = patch.activePage === 'home' ? '' : patch.activePage;
      const newUrl = hash ? `#${hash}` : window.location.pathname + window.location.search;
      if (window.location.hash.replace('#', '') !== hash) {
        history.pushState({ activePage: patch.activePage }, '', newUrl);
      }
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
