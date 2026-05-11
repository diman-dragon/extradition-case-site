import { store } from '../store.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
  .site-footer { padding: 1.5rem 0 0.5rem; border-top: 1px solid var(--border); background: var(--surface); }
  .footer-inner { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 1rem; }
  h4 { margin: 0 0 0.5rem; font-size: 0.9rem; }
  p, li { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem; }
  .disclaimer { font-size: 0.65rem; margin-top: 0.5rem; }
  .nav-list { list-style: none; padding: 0; }
  .nav-list li { cursor: pointer; }
  .nav-list li:hover { color: var(--accent); }
  .bottom-bar { text-align: center; font-size: 0.7rem; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 0.5rem; }
</style>
<footer class="site-footer">
  <div class="footer-inner container">
    <section>
      <h4 id="about-title"></h4>
      <p id="about-text"></p>
      <p class="disclaimer" id="about-disclaimer"></p>
    </section>
    <section>
      <h4 id="nav-title"></h4>
      <ul class="nav-list" id="nav-list"></ul>
    </section>
    <section>
      <h4 id="contact-title"></h4>
      <p id="contact-press"></p>
      <p id="contact-email"></p>
      <p id="contact-legal"></p>
      <p id="contact-email-legal"></p>
    </section>
  </div>
  <div class="bottom-bar">
    <p id="copy-text"></p>
    <p id="copy-loc"></p>
  </div>
</footer>
`;

class SiteFooter extends HTMLElement {
  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.update(store.state);
    let _prevLang = store.state.lang;
    this._unsubscribe = store.subscribe((state) => {
      if (state.lang !== _prevLang) {
        _prevLang = state.lang;
        this.update(state);
      }
    });
  }

  disconnectedCallback() {
    if (this._unsubscribe) this._unsubscribe();
  }

  async update(state) {
    const response = await fetch(`./scripts/data/i18n/footer/${state.lang}.json`);
    const t = await response.json();
    
    this.querySelector('#about-title').textContent = t.about.title;
    this.querySelector('#about-text').textContent = t.about.text;
    this.querySelector('#about-disclaimer').textContent = t.about.disclaimer;
    
    this.querySelector('#nav-title').textContent = t.nav.title;
    const navResponse = await fetch(`./scripts/data/i18n/nav/${state.lang}.json`);
    const navT = await navResponse.json();
    const navList = this.querySelector('#nav-list');
    navList.innerHTML = `
        <li data-id="home">${navT.home}</li>
        <li data-id="timeline">${navT.timeline}</li>
        <li data-id="legal">${navT.legal}</li>
        <li data-id="persons">${navT.persons}</li>
        <li data-id="docs">${navT.docs}</li>
        <li data-id="intl">${navT.intl}</li>
        <li data-id="media">${navT.media}</li>
    `;
    navList.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', () => {
            document.querySelector('site-header').dispatchEvent(new CustomEvent('navigate', { 
                detail: li.dataset.id, 
                bubbles: true, 
                composed: true 
            }));
        });
    });

    this.querySelector('#contact-title').textContent = t.contact.title;
    this.querySelector('#contact-press').textContent = t.contact.press;
    this.querySelector('#contact-email').innerHTML = `<a href="mailto:${t.contact.email}">${t.contact.email}</a>`;
    this.querySelector('#contact-legal').textContent = t.contact.legal;
    this.querySelector('#contact-email-legal').innerHTML = `${t.contact.phone}<br><a href="${t.contact.telegram_link}" target="_blank">${t.contact.telegram}</a>`;
    
    this.querySelector('#copy-text').textContent = t.copyright.text;
    this.querySelector('#copy-loc').textContent = t.copyright.location;
  }
}

customElements.define('site-footer', SiteFooter);
