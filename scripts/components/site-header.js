import { store } from '../store.js';
import './win11/ui-controls.js';
import './site-nav.js';
import './site-search.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host { display: block; height: 100px; }
  .site-header { padding: 0.25rem 0; border-bottom: 1px solid var(--border); height: 100px; box-sizing: border-box; overflow: hidden; }
  .site-header__inner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; height: 100%; }
  .site-header__brand { cursor: pointer; flex: 0 0 160px; display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden; padding: 5px 0 5px 10px; }
  .brand-logo { height: 80px; width: auto; object-fit: contain; }

  .site-header__center { display: flex; flex-direction: column; gap: 0.1rem; flex-grow: 1; align-items: center; justify-content: center; overflow: hidden; }
</style>
<header class="site-header">
  <div class="site-header__inner container">
    <div class="site-header__brand">
      <img src="./logo.png" class="brand-logo" alt="Logo">
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
    this.brandEl = this.querySelector('.site-header__brand');
    this.brandEl.addEventListener('click', () => {
        import('../app.js').then(m => m.renderMainPage());
    });
    
    this.querySelector('#nav').addEventListener('navigate', (e) => {
        this.dispatchEvent(new CustomEvent('navigate', { 
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    });

    this.querySelector('site-search').addEventListener('search', (e) => {
        this.dispatchEvent(new CustomEvent('search', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    });
  }

  async loadI18n() {
    try {
      let response = await fetch(`./scripts/data/i18n/header/${store.state.lang}.json`);
      if (!response.ok) response = await fetch('./scripts/data/i18n/header/ru.json');
      const langData = await response.json();
      this.querySelector('site-search').setAttribute('placeholder', langData.search_placeholder);
    } catch(e) {}
  }

  connectedCallback() {
    this.loadI18n();
    let _prevLang = store.state.lang;
    this._unsubscribe = store.subscribe((state) => {
      if (state.lang !== _prevLang) {
        _prevLang = state.lang;
        this.loadI18n();
      }
    });
  }

  disconnectedCallback() {
    if (this._unsubscribe) this._unsubscribe();
  }
}

customElements.define('site-header', SiteHeader);
