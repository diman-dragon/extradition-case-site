const storedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
const state = {
  lang: 'ru',
  theme: storedTheme === 'light' ? 'light' : 'dark',
  searchTerm: '',
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
    notify();
  },
  subscribe(fn) {
    fn({ ...state });
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },
};
