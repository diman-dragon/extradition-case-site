import { store } from '../store.js';

const API_URL = './api/visits';
const VISITOR_ID_KEY = 'extradition-case:visitor-id';
const VISIT_SENT_KEY = 'extradition-case:visit-sent';

const LABELS = {
  ru: {
    aria: 'Статистика посещений',
    visits: 'визитов',
    unique: 'уникальных',
  },
  en: {
    aria: 'Visit statistics',
    visits: 'visits',
    unique: 'unique',
  },
  sr: {
    aria: 'Statistika poseta',
    visits: 'poseta',
    unique: 'jedinstvenih',
  },
};

function getLabels(lang) {
  return LABELS[lang] || LABELS.en;
}

function getVisitorId() {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (visitorId) return visitorId;

  visitorId = typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

  localStorage.setItem(VISITOR_ID_KEY, visitorId);
  return visitorId;
}

class VisitorCounter extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;
    this._stats = null;
    this._render('loading');

    let prevLang = store.state.lang;
    this._unsub = store.subscribe((state) => {
      if (state.lang !== prevLang) {
        prevLang = state.lang;
        this._render(this._stats ? 'ready' : 'loading');
      }
    });

    this._boot();
  }

  disconnectedCallback() {
    if (this._unsub) this._unsub();
  }

  async _boot() {
    try {
      const stats = await this._registerOrLoad();
      this._stats = stats;
      this._render('ready');
    } catch (error) {
      console.warn('[visitor-counter] failed to load visit stats:', error);
      this._render('failed');
    }
  }

  async _registerOrLoad() {
    const alreadySent = sessionStorage.getItem(VISIT_SENT_KEY) === '1';
    if (!alreadySent) {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: getVisitorId(),
          path: `${location.pathname}${location.hash || ''}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`POST ${response.status}`);
      }

      sessionStorage.setItem(VISIT_SENT_KEY, '1');
      return response.json();
    }

    const response = await fetch(API_URL, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`GET ${response.status}`);
    }
    return response.json();
  }

  _render(state) {
    const lang = store.state.lang;
    const labels = getLabels(lang);
    const stats = this._stats;

    if (state === 'loading') {
      this.innerHTML = `
        <span class="visitor-counter" aria-label="${labels.aria}">
          <span class="visitor-counter__dot visitor-counter__dot--pulse"></span>
          <span class="visitor-counter__value visitor-counter__value--muted">…</span>
        </span>
      `;
      return;
    }

    if (state === 'failed' || !stats) {
      this.innerHTML = `
        <span class="visitor-counter" aria-label="${labels.aria}">
          <span class="visitor-counter__value visitor-counter__value--muted">—</span>
        </span>
      `;
      return;
    }

    this.innerHTML = `
      <span class="visitor-counter" aria-label="${labels.aria}">
        <span class="visitor-counter__dot visitor-counter__dot--live"></span>
        <span class="visitor-counter__value">${Number(stats.visits || 0).toLocaleString(lang)}</span>
        <span class="visitor-counter__label">${labels.visits}</span>
        <span class="visitor-counter__sep">·</span>
        <span class="visitor-counter__value">${Number(stats.visitors || 0).toLocaleString(lang)}</span>
        <span class="visitor-counter__label">${labels.unique}</span>
      </span>
    `;
  }
}

customElements.define('visitor-counter', VisitorCounter);
