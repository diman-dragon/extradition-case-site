import './components/site-header.js';
import './components/site-footer.js';
import './components/ui-card.js';
import { store } from './store.js';

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = store.state.lang;
}

store.subscribe((state) => {
  applyTheme(state.theme);
});
