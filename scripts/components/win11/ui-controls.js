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
    <span class="label">Язык</span>
    <div class="pills" id="lang-pills">
      <button class="pill" data-lang="ru">RU</button>
      <button class="pill" data-lang="sr">SR</button>
      <button class="pill" data-lang="en">EN</button>
    </div>
  </div>
  <div class="group">
    <span class="label">Тема</span>
    <div class="pills" id="theme-pills">
      <button class="pill" data-theme="dark">Тёмная</button>
      <button class="pill" data-theme="light">Светлая</button>
    </div>
  </div>
`;

class UiControls extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.initPills('lang', (val) => store.setState({ lang: val }));
    this.initPills('theme', (val) => store.setState({ theme: val }));
    
    store.subscribe((state) => {
      this.updateActive('lang', state.lang);
      this.updateActive('theme', state.theme);
    });
    
    this.updateActive('lang', store.state.lang);
    this.updateActive('theme', store.state.theme);
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
