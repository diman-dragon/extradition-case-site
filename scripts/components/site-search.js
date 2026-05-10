const template = document.createElement('template');
template.innerHTML = `
<style>
  input { 
    padding: 0.3rem 0.8rem; border-radius: 999px; border: 1px solid var(--border); 
    background: var(--surface-strong); color: var(--text); width: 100%; max-width: 200px; font-size: 0.85rem;
    transition: all 0.2s ease;
  }
  input:focus { outline: none; border-color: var(--accent); }
</style>
<input type="search" placeholder="Поиск...">
`;

class SiteSearch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    
    this.shadowRoot.querySelector('input').addEventListener('input', (e) => {
      this.dispatchEvent(new CustomEvent('search', { 
        detail: e.target.value,
        bubbles: true,
        composed: true
      }));
    });
  }
}
customElements.define('site-search', SiteSearch);
