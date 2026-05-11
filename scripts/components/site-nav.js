import { store } from '../store.js';

/* Shadow DOM so mobile/desktop styles don't bleed */
const STYLE = `
<style>
  :host {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    justify-content: center;
  }

  button {
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.3em 0.7em;
    border-radius: 999px;
    font: inherit;
    font-size: var(--text-sm, 0.875rem);
    min-height: var(--touch-min, 44px);
    white-space: nowrap;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: color 0.15s, background 0.15s, border-color 0.15s;
  }

  button:hover {
    color: var(--text);
    border-color: var(--border);
    background: var(--surface-strong);
  }

  button.active {
    color: var(--accent);
    border-color: var(--accent);
    background: var(--surface-strong);
    font-weight: 600;
  }

  /* ── Inside mobile drawer: full-width stacked rows ── */
  :host([mobile]) {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 0;
  }

  :host([mobile]) button {
    width: 100%;
    text-align: left;
    border-radius: 0;
    border: none;
    border-bottom: 1px solid var(--border);
    padding: 0.85em 1rem;
    font-size: var(--text-base, 1rem);
  }

  :host([mobile]) button.active {
    border-bottom-color: var(--border);
    border-left: 3px solid var(--accent);
    background: var(--surface-strong);
  }

  :host([mobile]) button:hover {
    background: var(--surface-strong);
    border-color: var(--border);
    border-left-color: var(--border);
  }
</style>
`;

const PAGE_IDS = ['home','timeline','legal','persons','docs','intl','media'];

class SiteNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._pages = PAGE_IDS.map(id => ({ id, label: '…' }));
  }

  connectedCallback() {
    /* Mark drawer nav so it gets mobile styles */
    const slot = this.dataset.slot || '';
    if (slot.includes('mob')) this.setAttribute('mobile', '');

    this._render();
    this._loadLabels();

    let _prevLang = store.state.lang;
    this._unsub = store.subscribe(state => {
      if (state.lang !== _prevLang) { _prevLang = state.lang; this._loadLabels(); }
      else { this._render(); }
    });
    this._pop = () => this._render();
    window.addEventListener('popstate', this._pop);
  }

  disconnectedCallback() {
    if (this._unsub) this._unsub();
    window.removeEventListener('popstate', this._pop);
  }

  async _loadLabels() {
    try {
      let r = await fetch(`./scripts/data/i18n/nav/${store.state.lang}.json`);
      if (!r.ok) r = await fetch('./scripts/data/i18n/nav/ru.json');
      const t = await r.json();
      this._pages = PAGE_IDS.map(id => ({ id, label: t[id] || id }));
      this._render();
    } catch(e) {}
  }

  _render() {
    const hash = window.location.hash.replace('#', '').trim();
    const active = PAGE_IDS.includes(hash) ? hash : 'home';

    const nav = document.createElement('nav');
    nav.setAttribute('role', 'list');
    this._pages.forEach(p => {
      const btn = document.createElement('button');
      btn.textContent = p.label;
      btn.className = p.id === active ? 'active' : '';
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-current', p.id === active ? 'page' : 'false');
      btn.addEventListener('click', () =>
        this.dispatchEvent(new CustomEvent('navigate', { detail: p.id, bubbles: true, composed: true }))
      );
      nav.appendChild(btn);
    });

    this.shadowRoot.innerHTML = STYLE;
    this.shadowRoot.appendChild(nav);
  }
}

customElements.define('site-nav', SiteNav);
