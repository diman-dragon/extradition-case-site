import { store } from '../store.js';
import { pick } from '../utils/i18n.js';

const template = document.createElement('template');
template.innerHTML = `
<footer class="site-footer">
  <div class="site-footer__inner">
    <div class="site-footer__top">
      <div>
        <h2 class="site-footer__title"></h2>
        <p class="site-footer__text"></p>
      </div>
      <div>
        <p class="site-footer__contact"></p>
      </div>
    </div>
    <p class="site-footer__copyright"></p>
  </div>
</footer>
`;

class SiteFooter extends HTMLElement {
  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.titleEl = this.querySelector('.site-footer__title');
    this.textEl = this.querySelector('.site-footer__text');
    this.contactEl = this.querySelector('.site-footer__contact');
    this.copyrightEl = this.querySelector('.site-footer__copyright');
    this.ui = null;
  }

  connectedCallback() {
    this.loadUi();
    store.subscribe((state) => {
      this.update(state);
    });
  }

  async loadUi() {
    const response = await fetch('./scripts/data/ui.json');
    this.ui = await response.json();
    this.update(store.state);
  }

  update(state) {
    if (!this.ui) return;
    this.titleEl.textContent = pick(this.ui.footer.title, state.lang);
    this.textEl.textContent = pick(this.ui.footer.description, state.lang);
    this.contactEl.innerHTML = `${pick(this.ui.footer.contactLabel, state.lang)}: <a href="mailto:info@example.com">info@example.com</a>`;
    this.copyrightEl.textContent = pick(this.ui.footer.copy, state.lang);
  }
}

customElements.define('site-footer', SiteFooter);
