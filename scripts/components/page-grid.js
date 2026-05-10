const template = document.createElement('template');
template.innerHTML = `
<style>
  :host { display: block; }
  .grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }
  @media (max-width: 768px) {
    .grid { grid-template-columns: 1fr; }
  }
  .main-content { display: flex; flex-direction: column; gap: 1rem; }
  .sidebar { display: flex; flex-direction: column; gap: 1rem; }
</style>
<div class="grid">
  <section class="main-content">
    <slot name="main"></slot>
  </section>
  <aside class="sidebar">
    <slot name="sidebar"></slot>
  </aside>
</div>
`;

class PageGrid extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('page-grid', PageGrid);
