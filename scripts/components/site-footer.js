import { store } from '../store.js';
import { escapeHtml, safeUrl, safeTelegramUrl, safeEmail } from '../security.js';

const STYLE = `
<style>
  footer {
    padding: var(--space) var(--space) 0.5rem;
    border-top: 1px solid var(--border);
    background: var(--surface);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-lg);
    margin-bottom: var(--space);
  }

  h4 { margin: 0 0 0.5em; font-size: var(--text-sm); }

  p, li {
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin-bottom: 0.2em;
    line-height: 1.5;
  }

  .disc { font-size: 0.62rem; margin-top: 0.4em; }

  .nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .nav-list li {
    cursor: pointer;
    font-size: var(--text-xs);
    color: var(--text-muted);
    min-height: 36px;
    display: flex;
    align-items: center;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: color 0.15s;
  }

  .nav-list li:hover { color: var(--accent); }

  a { color: var(--accent); }

  .bottom {
    text-align: center;
    font-size: var(--text-xs);
    color: var(--text-muted);
    border-top: 1px solid var(--border);
    padding-top: 0.5rem;
  }

  /* Mobile */
  @media (max-width: 640px) {
    .grid {
      grid-template-columns: 1fr;
      gap: var(--space);
    }

    section { text-align: center; }

    .nav-list {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.1rem 0.75rem;
    }

    .nav-list li { min-height: auto; }
  }
</style>
`;

class SiteFooter extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;
    this.innerHTML = STYLE + `
<footer>
  <div class="grid container">
    <section>
      <h4 id="at"></h4>
      <p  id="ax"></p>
      <p class="disc" id="ad"></p>
    </section>
    <section>
      <h4 id="nt"></h4>
      <ul class="nav-list" id="nl"></ul>
    </section>
    <section>
      <h4 id="ct"></h4>
      <p id="cp"></p>
      <p id="ce"></p>
      <p id="cl"></p>
      <p id="cph"></p>
    </section>
  </div>
  <div class="bottom">
    <p id="cy"></p>
    <p id="cloc"></p>
  </div>
</footer>`;

    this.update(store.state);
    let _pl = store.state.lang;
    this._unsub = store.subscribe(s => {
      if (s.lang !== _pl) { _pl = s.lang; this.update(s); }
    });
  }

  disconnectedCallback() { if (this._unsub) this._unsub(); }

  async update(state) {
    try {
      let fr = await fetch(`./scripts/data/i18n/footer/${state.lang}.json`);
      if (!fr.ok) fr = await fetch('./scripts/data/i18n/footer/ru.json');
      let nr = await fetch(`./scripts/data/i18n/nav/${state.lang}.json`);
      if (!nr.ok) nr = await fetch('./scripts/data/i18n/nav/ru.json');
      const t = await fr.json();
      const n = await nr.json();

      this.querySelector('#at').textContent = t.about.title;
      this.querySelector('#ax').textContent = t.about.text;
      this.querySelector('#ad').textContent = t.about.disclaimer;
      this.querySelector('#nt').textContent = t.nav.title;

      const nl = this.querySelector('#nl');
      nl.innerHTML = ['home','timeline','legal','persons','docs','intl','media']
        .map(id => `<li data-id="${escapeHtml(id)}">${escapeHtml(n[id] || id)}</li>`).join('');
      nl.querySelectorAll('li').forEach(li =>
        li.addEventListener('click', () =>
          document.querySelector('site-header').dispatchEvent(
            new CustomEvent('navigate', { detail: li.dataset.id, bubbles: true, composed: true })
          )
        )
      );

      this.querySelector('#ct').textContent = t.contact.title;
      this.querySelector('#cp').textContent = t.contact.press;
      this.querySelector('#cl').textContent = t.contact.legal;

      // Safe email link — escape both href and display text
      const emailEl = this.querySelector('#ce');
      const safeMailHref = safeEmail(t.contact.email);
      if (safeMailHref) {
        const a = document.createElement('a');
        a.href = `mailto:${safeMailHref}`;
        a.textContent = t.contact.email;
        emailEl.innerHTML = '';
        emailEl.appendChild(a);
      } else {
        emailEl.textContent = t.contact.email || '';
      }

      // Safe telegram link — use safeTelegramUrl, escape display text
      const phoneEl = this.querySelector('#cph');
      phoneEl.innerHTML = '';
      const phoneTxt = document.createTextNode(t.contact.phone || '');
      phoneEl.appendChild(phoneTxt);
      const br = document.createElement('br');
      phoneEl.appendChild(br);
      const tgHref = safeTelegramUrl(t.contact.telegram_link);
      if (tgHref !== '#') {
        const tgA = document.createElement('a');
        tgA.href = tgHref;
        tgA.target = '_blank';
        tgA.rel = 'noopener noreferrer';
        tgA.textContent = t.contact.telegram || '';
        phoneEl.appendChild(tgA);
      } else {
        phoneEl.appendChild(document.createTextNode(t.contact.telegram || ''));
      }

      this.querySelector('#cy').textContent   = t.copyright.text;
      this.querySelector('#cloc').textContent = t.copyright.location;
    } catch(e) {
      console.error('Footer update failed:', e);
    }
  }
}

customElements.define('site-footer', SiteFooter);
