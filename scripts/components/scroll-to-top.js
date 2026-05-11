const template = document.createElement('template');
template.innerHTML = `
<style>
  :host { display: none; position: fixed; bottom: 20px; right: 20px; z-index: 1000; }
  .scroll-to-top { 
    background: var(--accent); color: white; border: none; border-radius: 50%; width: 50px; height: 50px; 
    cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; 
    box-shadow: var(--shadow); transition: all 0.3s ease; 
  }
  .scroll-to-top:hover { transform: scale(1.1); }

  @media (max-width: 768px) {
    :host { display: block; }
  }
</style>
<button class="scroll-to-top" title="Наверх">↑</button>
`;

class ScrollToTop extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.button = this.shadowRoot.querySelector('.scroll-to-top');
    this.button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

customElements.define('scroll-to-top', ScrollToTop);