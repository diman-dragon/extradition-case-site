import { store } from '../store.js';

const TMPL = `
  <style>
    :host {
      display: none;
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
      background: var(--surface, #0e1c2f);
      border-top: 1px solid var(--border, rgba(255,255,255,.12));
      padding: 1rem 1.5rem;
      font-family: inherit; font-size: 0.85rem;
      color: var(--text-muted, #aaa);
      flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem;
    }
    :host(.visible) { display: flex; }
    .cookie-text { flex:1; min-width:220px; }
    .cookie-actions { display:flex; gap:0.5rem; flex-shrink:0; }
    .btn-accept {
      background:var(--accent,#2563eb); color:#fff; border:none;
      border-radius:6px; padding:0.4rem 1rem; font:inherit; font-size:0.82rem;
      font-weight:600; cursor:pointer;
    }
    .btn-decline {
      background:transparent; color:var(--text-muted,#aaa);
      border:1px solid var(--border,rgba(255,255,255,.2));
      border-radius:6px; padding:0.4rem 0.8rem; font:inherit; font-size:0.82rem;
      cursor:pointer;
    }
  </style>
  <span class="cookie-text" id="text"></span>
  <div class="cookie-actions">
    <button type="button" class="btn-accept" id="accept"></button>
    <button type="button" class="btn-decline" id="decline"></button>
  </div>
`;

class CookieBanner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Only show on production hosts
    const isProd = location.hostname.includes('github.io') || location.hostname.includes('lagovskiy');
    if (!isProd) return;

    const COOKIE_KEY = 'analytics_consent';
    const consent = localStorage.getItem(COOKIE_KEY);
    if (consent) {
      if (consent === 'declined') this._disableGA();
      return;
    }

    this.shadowRoot.innerHTML = TMPL;
    this._textEl = this.shadowRoot.getElementById('text');
    this._acceptBtn = this.shadowRoot.getElementById('accept');
    this._declineBtn = this.shadowRoot.getElementById('decline');

    this._render();
    
    this._acceptBtn.addEventListener('click', () => {
      localStorage.setItem(COOKIE_KEY, 'accepted');
      this.classList.remove('visible');
      if (typeof window._grantAnalyticsConsent === 'function') {
        window._grantAnalyticsConsent();
      }
    });

    this._declineBtn.addEventListener('click', () => {
      localStorage.setItem(COOKIE_KEY, 'declined');
      this._disableGA();
      this.classList.remove('visible');
    });

    // Show banner after short delay
    setTimeout(() => this.classList.add('visible'), 1000);
  }

  _disableGA() {
    window['ga-disable-G-G79NDD1DWN'] = true;
  }

  _render() {
    const lang = store.state.lang || 'ru';
    const texts = {
      ru: {
        msg: 'Сайт использует Google Analytics для анонимной статистики посещений и скачиваний. Данные не передаются третьим лицам.',
        accept: 'Принять',
        decline: 'Отклонить',
      },
      en: {
        msg: 'This site uses Google Analytics to collect anonymous visit and download statistics. No data is shared with third parties.',
        accept: 'Accept',
        decline: 'Decline',
      },
      sr: {
        msg: 'Sajt koristi Google Analytics za anonimnu statistiku poseta i preuzimanja. Podaci se ne dele s trećim stranama.',
        accept: 'Prihvati',
        decline: 'Odbij',
      },
    };
    const t = texts[lang] || texts.ru;
    this._textEl.textContent = t.msg;
    this._acceptBtn.textContent = t.accept;
    this._declineBtn.textContent = t.decline;
  }
}

customElements.define('cookie-banner', CookieBanner);
