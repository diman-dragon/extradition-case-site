class PageGrid extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    // Guard: only attach shadow once. attachShadow throws if called twice on
    // the same element, which can happen if the element is moved in the DOM.
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.shadowRoot.innerHTML = `
<style>
  :host { display: block; }

  .grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--space-lg, 2rem);
  }

  .main { display: flex; flex-direction: column; gap: var(--space, 1rem); }
  .side { display: flex; flex-direction: column; gap: var(--space, 1rem); }

  @media (max-width: 900px) {
    .grid { grid-template-columns: 3fr 2fr; gap: var(--space, 1.25rem); }
  }

  @media (max-width: 600px) {
    .grid { grid-template-columns: 1fr; }
  }
</style>
<div class="grid">
  <section class="main"><slot name="main"></slot></section>
  <aside   class="side"><slot name="sidebar"></slot></aside>
</div>`;
  }
}

customElements.define('page-grid', PageGrid);
