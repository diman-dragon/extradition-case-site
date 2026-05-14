import { store } from '../store.js';
import { escapeHtml } from '../security.js';

export async function renderTimelinePage(container) {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/timeline/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/timeline/ru.json`);
  const t = await response.json();

  container.innerHTML = `
    <div class="page">
      <h2>${escapeHtml(t.title)}</h2>
      <p style="font-size: var(--text-lg);"><strong>${escapeHtml(t.subtitle)}</strong></p>
      <p style="font-size: var(--text-lg);">${escapeHtml(t.intro)}</p>
      <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
      <div id="timeline-list" style="display: flex; flex-direction: column; gap: 2rem;"></div>
      <section class="ui-card" style="margin-top: 3rem; background: var(--surface-strong); padding: 1.5rem; border-radius: 8px;">
        <p style="margin: 0;"><em>${escapeHtml(t.summary)}</em></p>
      </section>
    </div>
  `;

  const list = container.querySelector('#timeline-list');
  t.events.forEach((event, index) => {
    const row = document.createElement('div');
    row.className = 'split-row';
    row.innerHTML = `
      <div class="split-row__label">
        <small style="color: var(--accent); font-weight: bold; display: block; margin-bottom: 0.5rem;">${escapeHtml(event.date)}</small>
      </div>
      <ui-card id="timeline-card-${index}"></ui-card>
    `;
    list.appendChild(row);
    const card = row.querySelector(`#timeline-card-${index}`);
    if (card && typeof card.setContent === 'function') {
      card.setContent({ title: event.title, text: escapeHtml(event.text) }, lang);
    }
  });
}
