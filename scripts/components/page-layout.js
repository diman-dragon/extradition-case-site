const template = document.createElement('template');
template.innerHTML = `
  <link rel="stylesheet" href="./styles/components/win11/ui.css">
  <style>
    :host { display: block; min-height: 100vh; display: flex; flex-direction: column; }
    main { flex: 1; width: 100%; max-width: var(--max-width); margin: 0 auto; padding: var(--space); }
  </style>
  <site-header></site-header>
  <main>
    <slot></slot>
  </main>
  <site-footer></site-footer>
`;

class PageLayout extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }
}

customElements.define('page-layout', PageLayout);
