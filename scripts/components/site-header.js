import { store } from '../store.js';
import './win11/ui-controls.js';
import './site-nav.js';
import './site-search.js';

/* ── Localised aria-labels ─────────────────────────────────── */
const I18N = {
  ru: { brand: 'На главную', menu: 'Меню', mobnav: 'Мобильная навигация' },
  en: { brand: 'Go to home', menu: 'Menu',  mobnav: 'Mobile navigation' },
  sr: { brand: 'Na početnu', menu: 'Meni',  mobnav: 'Mobilna navigacija' },
};

/* ── Template (light DOM — no attachShadow) ─────────────────── */
const TMPL = `
<div class="hdr-bar">
  <div class="hdr-brand" role="link" tabindex="0" aria-label="">
    <img src="./logo.png" alt="">
  </div>

  <div class="hdr-center">
    <site-nav data-slot="nav-desk"></site-nav>
    <site-search data-slot="search-desk"></site-search>
  </div>

  <div class="hdr-right">
    <ui-controls data-slot="ctrl-desk"></ui-controls>
  </div>

  <button class="hdr-hamburger" aria-label="" aria-expanded="false" aria-controls="hdr-drawer">
    <span></span><span></span><span></span>
  </button>
</div>

<div class="hdr-drawer" id="hdr-drawer" role="navigation" aria-label="">
  <site-nav data-slot="nav-mob"></site-nav>
  <div class="hdr-drawer__search">
    <site-search data-slot="search-mob"></site-search>
  </div>
  <div class="hdr-drawer__controls">
    <ui-controls data-slot="ctrl-mob"></ui-controls>
  </div>
</div>
`;

class SiteHeader extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    this.innerHTML = TMPL;

    this._drawer   = this.querySelector('.hdr-drawer');
    this._burger   = this.querySelector('.hdr-hamburger');
    this._menuOpen = false;

    /* brand → home */
    const brand = this.querySelector('.hdr-brand');
    const goHome = () => { import('../app.js').then(m => m.renderMainPage()); this._close(); };
    brand.addEventListener('click', goHome);
    brand.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') goHome(); });

    /* hamburger */
    this._burger.addEventListener('click', () => this._toggle());

    /* close on outside click */
    this._outside = e => { if (this._menuOpen && !this.contains(e.target)) this._close(); };

    /* wire both navs */
    this.querySelectorAll('site-nav').forEach(nav => {
      nav.addEventListener('navigate', e => {
        this.dispatchEvent(new CustomEvent('navigate', { detail: e.detail, bubbles: true, composed: true }));
        this._close();
      });
    });

    /* wire both searches */
    this.querySelectorAll('site-search').forEach(s => {
      s.addEventListener('search', e => {
        this.dispatchEvent(new CustomEvent('search', { detail: e.detail, bubbles: true, composed: true }));
      });
    });

    this._loadI18n();
    let _prevLang = store.state.lang;
    this._unsub = store.subscribe(state => {
      if (state.lang !== _prevLang) { _prevLang = state.lang; this._loadI18n(); }
    });
  }

  disconnectedCallback() {
    if (this._unsub) this._unsub();
    document.removeEventListener('click', this._outside);
  }

  _toggle() { this._menuOpen ? this._close() : this._open(); }

  _open() {
    this._menuOpen = true;
    this._drawer.classList.add('open');
    this._burger.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', this._outside, { passive: true });
  }

  _close() {
    this._menuOpen = false;
    this._drawer.classList.remove('open');
    this._burger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', this._outside);
  }

  async _loadI18n() {
    const lang = store.state.lang;
    const labels = I18N[lang] || I18N.en;

    /* Update aria-labels */
    const brand = this.querySelector('.hdr-brand');
    if (brand) {
      brand.setAttribute('aria-label', labels.brand);
      const img = brand.querySelector('img');
      if (img) img.alt = labels.brand;
    }
    if (this._burger) this._burger.setAttribute('aria-label', labels.menu);
    if (this._drawer) this._drawer.setAttribute('aria-label', labels.mobnav);

    /* Update search placeholders */
    try {
      let r = await fetch(`./scripts/data/i18n/header/${lang}.json`);
      if (!r.ok) r = await fetch('./scripts/data/i18n/header/ru.json');
      const t = await r.json();
      this.querySelectorAll('site-search').forEach(s => s.setAttribute('placeholder', t.search_placeholder || ''));
    } catch(e) {}
  }
}

customElements.define('site-header', SiteHeader);
