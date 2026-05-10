import { store } from '../store.js';
import { pick } from '../utils/i18n.js';

const template = document.createElement('template');
template.innerHTML = `
<header class="site-header">
  <div class="site-header__inner container">
    <div class="site-header__brand">
      <strong class="brand-title"></strong>
      <span class="brand-subtitle"></span>
    </div>
    <div class="site-header__controls">
      <label class="control-item">
        <span class="lang-label"></span>
        <select class="lang-switch">
          <option value="ru">RU</option>
          <option value="sr">SR</option>
          <option value="en">EN</option>
        </select>
      </label>
      <button class="theme-toggle" type="button"></button>
    </div>
  </div>
</header>
`;

class SiteHeader extends HTMLElement {
  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.titleEl = this.querySelector('.brand-title');
    this.subtitleEl = this.querySelector('.brand-subtitle');
    this.langLabel = this.querySelector('.lang-label');
    this.langSwitch = this.querySelector('.lang-switch');
    this.themeButton = this.querySelector('.theme-toggle');
    this.ui = null;
    this.onLangChange = this.onLangChange.bind(this);
    this.onThemeClick = this.onThemeClick.bind(this);
  }

  connectedCallback() {
    this.langSwitch.addEventListener('change', this.onLangChange);
    this.themeButton.addEventListener('click', this.onThemeClick);
    this.loadUi();
    store.subscribe((state) => {
      this.update(state);
    });
  }

  disconnectedCallback() {
    this.langSwitch.removeEventListener('change', this.onLangChange);
    this.themeButton.removeEventListener('click', this.onThemeClick);
  }

  async loadUi() {
    const response = await fetch('./scripts/data/ui.json');
    this.ui = await response.json();
    this.update(store.state);
  }

  update(state) {
    if (!this.ui) return;

    this.titleEl.textContent = pick(this.ui.header.brand, state.lang);
    this.subtitleEl.textContent = pick(this.ui.header.tagline, state.lang);
    this.langLabel.textContent = pick(this.ui.header.langLabel, state.lang) + ':';
    this.langSwitch.value = state.lang;
    this.themeButton.textContent = state.theme === 'dark'
      ? pick(this.ui.header.themeDark, state.lang)
      : pick(this.ui.header.themeLight, state.lang);
  }

  onLangChange(event) {
    store.setState({ lang: event.target.value });
  }

  onThemeClick() {
    store.setState({ theme: store.state.theme === 'dark' ? 'light' : 'dark' });
  }
}

customElements.define('site-header', SiteHeader);
