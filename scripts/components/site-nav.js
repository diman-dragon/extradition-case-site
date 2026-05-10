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
      { id: 'media', label: 'Медиа' }
    ];
    this.render();
  }

  render() {
    this.nav.innerHTML = '';
    this.pages.forEach(page => {
      const btn = document.createElement('button');
      btn.className = `nav-link ${page.id === 'home' ? 'active' : ''}`;
      btn.textContent = page.label;
      btn.addEventListener('click', () => {
        this.shadowRoot.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
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
