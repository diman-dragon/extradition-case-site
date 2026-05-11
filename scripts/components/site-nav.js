import { store } from '../store.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host { display: flex; gap: 0.25rem; }
  button { 
    background: transparent; border: 1px solid transparent; color: var(--text-muted); cursor: pointer; 
    padding: 0.25rem 0.75rem; border-radius: 999px; transition: all 0.2s ease; font-size: 0.85rem;
  }
  button:hover { color: var(--text); border-color: var(--border); background: var(--surface-strong); }
  button.active { color: var(--accent); border-color: var(--accent); background: var(--surface-strong); font-weight: 600; }
</style>
<nav id="nav"></nav>
`;

class SiteNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.nav = this.shadowRoot.querySelector('#nav');
    this.pages = [
      { id: 'home', label: '…' },
      { id: 'timeline', label: '…' },
      { id: 'legal', label: '…' },
      { id: 'persons', label: '…' },
      { id: 'docs', label: '…' },
      { id: 'intl', label: '…' },
      { id: 'media', label: '…' }
    ];
    this.render();
  }

  connectedCallback() {
    this.render();
    this.loadLabels();
    let _prevLang = store.state.lang;
    this.unsubscribe = store.subscribe((state) => {
      if (state.lang !== _prevLang) {
        _prevLang = state.lang;
        this.loadLabels();
      } else {
        this.render(); // re-render active state on page change
      }
    });
    this._onPopstate = () => this.render();
    window.addEventListener('popstate', this._onPopstate);
  }

  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
    window.removeEventListener('popstate', this._onPopstate);
  }

  async loadLabels() {
    let response = await fetch(`./scripts/data/i18n/nav/${store.state.lang}.json`);
    if (!response.ok) {
        response = await fetch(`./scripts/data/i18n/nav/ru.json`);
    }
    const t = await response.json();
    this.pages = [
      { id: 'home', label: t.home },
      { id: 'timeline', label: t.timeline },
      { id: 'legal', label: t.legal },
      { id: 'persons', label: t.persons },
      { id: 'docs', label: t.docs },
      { id: 'intl', label: t.intl },
      { id: 'media', label: t.media }
    ];
    this.render();
  }

  render() {
    if (!this.nav) return;
    // Determine active page from URL hash (source of truth)
    const hash = window.location.hash.replace('#', '').trim();
    const valid = ['home', 'timeline', 'legal', 'persons', 'docs', 'intl', 'media'];
    const activePage = valid.includes(hash) ? hash : 'home';

    this.nav.innerHTML = '';
    this.pages.forEach(page => {
      const btn = document.createElement('button');
      btn.className = `nav-link ${activePage === page.id ? 'active' : ''}`;
      btn.textContent = page.label;
      btn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('navigate', { 
          detail: page.id,
          bubbles: true, 
          composed: true 
        }));
      });
      this.nav.appendChild(btn);
    });
  }
}
customElements.define('site-nav', SiteNav);
