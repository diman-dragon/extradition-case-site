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
      { id: 'home', label: 'Главная' },
      { id: 'timeline', label: 'Хронология' },
      { id: 'legal', label: 'Правовая оценка' },
      { id: 'persons', label: 'Действующие лица' },
      { id: 'docs', label: 'Документы' },
      { id: 'intl', label: 'Адвокация' },
      { id: 'media', label: 'Медиа' }
    ];
    this.render();
  }

  connectedCallback() {
    this.render();
    this.loadLabels();
    this.unsubscribe = store.subscribe(() => this.loadLabels());
  }

  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
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
    this.nav.innerHTML = '';
    this.pages.forEach(page => {
      const btn = document.createElement('button');
      btn.className = `nav-link ${store.state.activePage === page.id ? 'active' : ''}`;
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
