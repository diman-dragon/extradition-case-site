import { store } from '../store.js';
import './win11/ui-controls.js';
import './site-nav.js';
import './site-search.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
  .site-header { padding: 0.25rem 0; border-bottom: 1px solid var(--border); }
  .site-header__inner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .site-header__brand { cursor: pointer; flex: 0 0 160px; display: flex; flex-direction: column; justify-content: center; }
  .brand-title { color: var(--text); font-size: 1.25rem; line-height: 1.2; }
  .brand-subtitle { color: var(--text-muted); font-size: 0.65rem; }

  .site-header__center { display: flex; flex-direction: column; gap: 0.1rem; flex-grow: 1; align-items: center; }
</style>
<header class="site-header">
  <div class="site-header__inner container">
    <div class="site-header__brand">
      <strong class="brand-title"></strong>
      <span class="brand-subtitle"></span>
    </div>
    <div class="site-header__center">
      <site-nav id="nav"></site-nav>
      <site-search></site-search>
    </div>
    <div class="site-header__controls">
      <ui-controls></ui-controls>
    </div>
  </div>
</header>
`;

class SiteHeader extends HTMLElement {
  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.titleEl = this.querySelector('.brand-title');
    this.titleEl.addEventListener('click', () => {
        const nav = this.querySelector('#nav');
        import('../app.js').then(m => m.renderMainPage());
    });
    this.subtitleEl = this.querySelector('.brand-subtitle');
    
    this.querySelector('#nav').addEventListener('navigate', (e) => {
        if (e.detail === 'home') import('../app.js').then(m => m.renderMainPage());
    });
  }

  connectedCallback() {
    store.subscribe((state) => this.update(state));
    this.update(store.state);
  }

  async update(state) {
    const response = await fetch(`./scripts/data/i18n/header/${state.lang}.json`);
    const langData = await response.json();
    this.titleEl.textContent = langData.brand;
    this.subtitleEl.textContent = langData.tagline;
  }
}

customElements.define('site-header', SiteHeader);
