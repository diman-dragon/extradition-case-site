import { store } from '../store.js';

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

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Validate that a URL is https/http or a telegram link. */
function safeTelegramUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const t = url.trim();
  if (/^https?:\/\//i.test(t) || /^tg:/i.test(t)) return t;
  return '#';
}

/** Validate an email address (basic check). */
function safeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const t = email.trim();
  // Simple email pattern — prevents javascript: injection
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t) ? t : '';
}

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
      const [fr, nr] = await Promise.all([
        fetch(`./scripts/data/i18n/footer/${state.lang}.json`),
        fetch(`./scripts/data/i18n/nav/${state.lang}.json`)
      ]);

      // Guard against failed fetches
      if (!fr.ok || !nr.ok) return;

      const t = await fr.json();
      const n = await nr.json();

      // Use textContent for plain text fields — safest approach
      this.querySelector('#at').textContent  = t.about.title;
      this.querySelector('#ax').textContent  = t.about.text;
      this.querySelector('#ad').textContent  = t.about.disclaimer;
      this.querySelector('#nt').textContent  = t.nav.title;

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

      // Validate email before placing in href
      const email = safeEmail(t.contact.email);
      const ceEl = this.querySelector('#ce');
      if (email) {
        const a = document.createElement('a');
        a.href = `mailto:${email}`;
        a.textContent = email;
        ceEl.innerHTML = '';
        ceEl.appendChild(a);
      } else {
        ceEl.textContent = '';
      }

      // Validate Telegram URL
      const tgUrl = safeTelegramUrl(t.contact.telegram_link);
      const cphEl = this.querySelector('#cph');
      cphEl.textContent = t.contact.phone;
      if (tgUrl !== '#') {
        const tgA = document.createElement('a');
        tgA.href = tgUrl;
        tgA.target = '_blank';
        tgA.rel = 'noopener noreferrer';
        tgA.textContent = t.contact.telegram;
        cphEl.appendChild(document.createElement('br'));
        cphEl.appendChild(tgA);
      }

      this.querySelector('#cy').textContent   = t.copyright.text;
      this.querySelector('#cloc').textContent = t.copyright.location;
    } catch(e) {}
  }
}

customElements.define('site-footer', SiteFooter);
