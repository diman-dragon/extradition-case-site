import { store } from '../../store.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host { 
      display: inline-flex; 
      flex-direction: column; 
      gap: 4px; 
      background: var(--surface-strong); 
      border: 1px solid var(--border); 
      border-radius: 8px; 
      padding: 6px; 
    }
    .group { display: flex; align-items: center; gap: 8px; }
    .label { font-size: 0.7rem; color: var(--text-muted); min-width: 32px; text-transform: uppercase; }
    .pills { display: flex; gap: 2px; }
    .pill {
      background: transparent;
      border: none;
      color: var(--text);
      padding: 2px 6px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s ease;
    }
    .pill[aria-pressed="true"] { background: var(--accent); color: var(--accent-soft); font-weight: 600; }
    .pill:hover:not([aria-pressed="true"]) { background: var(--border); }
  </style>
  <div class="group">
    <span class="label" id="lang-label"></span>
    <div class="pills" id="lang-pills">
      <button class="pill" data-lang="ru">RU</button>
      <button class="pill" data-lang="sr">SR</button>
      <button class="pill" data-lang="en">EN</button>
    </div>
  </div>
  <div class="group">
    <span class="label" id="theme-label"></span>
    <div class="pills" id="theme-pills">
      <button class="pill" data-theme="dark" id="theme-dark"></button>
      <button class="pill" data-theme="light" id="theme-light"></button>
    </div>
  </div>
`;

class UiControls extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  async connectedCallback() {
    this.renderLabels();
    this.updateActive('lang', store.state.lang);
    this.updateActive('theme', store.state.theme);

    let _prevLang = store.state.lang;
    this.unsubscribe = store.subscribe((state) => {
      this.updateActive('lang', state.lang);
      this.updateActive('theme', state.theme);
      if (state.lang !== _prevLang) {
        _prevLang = state.lang;
        this.renderLabels();
      }
    });

    this.initPills('lang', (val) => store.setState({ lang: val }));
    this.initPills('theme', (val) => store.setState({ theme: val }));
  }

  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
  }

  async renderLabels() {
    const response = await fetch(`./scripts/data/i18n/controls/${store.state.lang}.json`);
    const t = await response.json();
    this.shadowRoot.querySelector('#lang-label').textContent = t.lang_label;
    this.shadowRoot.querySelector('#theme-label').textContent = t.theme_label;
    this.shadowRoot.querySelector('#theme-dark').textContent = t.theme_dark;
    this.shadowRoot.querySelector('#theme-light').textContent = t.theme_light;
  }

  initPills(type, callback) {
    this.shadowRoot.querySelectorAll(`[data-${type}]`).forEach(btn => {
      btn.addEventListener('click', () => callback(btn.dataset[type]));
    });
  }

  updateActive(type, value) {
    this.shadowRoot.querySelectorAll(`[data-${type}]`).forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset[type] === value);
    });
  }
}

customElements.define('ui-controls', UiControls);
