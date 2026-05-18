/**
 * visitor-counter.js
 * Отображает публичный счётчик посетителей через Umami Analytics API.
 * Использование: <visitor-counter></visitor-counter>
 *
 * Настройка: задайте UMAMI_SITE_ID и UMAMI_API_BASE ниже.
 */

// ─── НАСТРОЙКИ ────────────────────────────────────────────────────────────────
const UMAMI_API_BASE = 'https://api.umami.is'; // Замените на URL вашего self-hosted экземпляра
const UMAMI_SITE_ID  = '407eaa2d-47b6-46de-8051-d2d1717dea04';               // Вставьте Website ID из панели Umami
const UMAMI_TOKEN    = 'api_qtryt7hC7kqVEiwcU4PkF4dSE4AEaaA0';                            // Опционально: Bearer-токен для приватного API
// ──────────────────────────────────────────────────────────────────────────────

class VisitorCounter extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;
    this._render('…');
    this._load();
  }

  async _load() {
    try {
      const now   = Date.now();
      const start = new Date();
      start.setDate(1); start.setHours(0, 0, 0, 0); // начало текущего месяца

      const params = new URLSearchParams({
        startAt: start.getTime(),
        endAt:   now,
        unit:    'month',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });

      const headers = { 'Content-Type': 'application/json' };
      if (UMAMI_TOKEN) headers['Authorization'] = `Bearer ${UMAMI_TOKEN}`;

      const res = await fetch(
        `${UMAMI_API_BASE}/api/websites/${UMAMI_SITE_ID}/stats?${params}`,
        { headers }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const visits   = data?.visits?.value   ?? data?.pageviews?.value ?? 0;
      const visitors = data?.visitors?.value ?? 0;
      this._render(visits, visitors);
    } catch (err) {
      console.warn('[visitor-counter] не удалось загрузить статистику:', err);
      this._render(null);
    }
  }

  _render(visits, visitors) {
    const loading = visits === '…';
    const failed  = visits === null;

    this.innerHTML = `
      <span class="visitor-counter" aria-label="Статистика посещений">
        ${loading ? `<span class="visitor-counter__dot visitor-counter__dot--pulse"></span>` : ''}
        ${failed  ? `<span class="visitor-counter__value visitor-counter__value--muted">—</span>` : ''}
        ${(!loading && !failed) ? `
          <span class="visitor-counter__dot visitor-counter__dot--live"></span>
          <span class="visitor-counter__value">${Number(visits).toLocaleString('ru')}</span>
          <span class="visitor-counter__label">просмотров</span>
          ${visitors ? `
            <span class="visitor-counter__sep">·</span>
            <span class="visitor-counter__value">${Number(visitors).toLocaleString('ru')}</span>
            <span class="visitor-counter__label">уникальных</span>
          ` : ''}
        ` : ''}
      </span>
    `;
  }
}

customElements.define('visitor-counter', VisitorCounter);
