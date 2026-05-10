const storedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
const storedPage = typeof localStorage !== 'undefined' ? localStorage.getItem('activePage') : null;

const state = {
  lang: 'ru',
  theme: storedTheme === 'light' ? 'light' : 'dark',
  searchTerm: '',
  activePage: storedPage || 'home',
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
    if (patch.activePage) {
      localStorage.setItem('activePage', state.activePage);
    }
    notify();
  },
  subscribe(fn) {
    fn({ ...state });
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },
};
