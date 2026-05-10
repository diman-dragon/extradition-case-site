import { store } from '../store.js';

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
        <button id="home-btn" class="secondary">На главную</button>
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
    this.homeBtn = this.querySelector('#home-btn');
    this.homeBtn.addEventListener('click', () => {
        import('../app.js').then(module => module.renderMainPage());
    });
  }

  connectedCallback() {
    store.subscribe((state) => this.update(state));
    this.update(store.state);
  }

  async update(state) {
    const response = await fetch(`./scripts/data/i18n/footer/${state.lang}.json`);
    const langData = await response.json();
    this.titleEl.textContent = langData.title;
    this.textEl.textContent = langData.description;
    this.contactEl.innerHTML = `${langData.contactLabel}: <a href="mailto:info@example.com">info@example.com</a>`;
    this.copyrightEl.textContent = langData.copy;
    this.homeBtn.textContent = langData.homeBtn;
  }
}

customElements.define('site-footer', SiteFooter);
