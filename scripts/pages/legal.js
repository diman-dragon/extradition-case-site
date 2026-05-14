import { store } from '../store.js';
import { escapeHtml } from '../security.js';

export async function renderLegalPage(container) {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/legal/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/legal/ru.json`);
  const t = await response.json();

  container.innerHTML = `
    <div class="page">
      <h2>${escapeHtml(t.title)}</h2>
      <p style="font-size: var(--text-lg);"><strong>${escapeHtml(t.subtitle)}</strong></p>
      <p style="font-size: var(--text-lg);">${escapeHtml(t.intro)}</p>
      <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
      <div id="legal-list" style="display: flex; flex-direction: column; gap: 2rem;"></div>
      <section class="ui-card" style="margin-top: 3rem; background: var(--surface-strong); padding: 1.5rem; border-radius: 8px;">
        <p style="margin: 0;"><em>${escapeHtml(t.summary)}</em></p>
      </section>
    </div>
  `;

  const list = container.querySelector('#legal-list');

  t.sections.forEach((section, index) => {
    const row = document.createElement('div');
    row.innerHTML = `<ui-card id="legal-card-${index}"></ui-card>`;
    list.appendChild(row);
    const card = row.querySelector(`#legal-card-${index}`);
    if (card && typeof card.setContent === 'function') {
      let episodesHtml = '';
      if (section.highlight && section.episodes?.length) {
        const contentLabel = escapeHtml(t.labels?.content ?? 'Content');
        const summaryLabel = escapeHtml(t.labels?.summary ?? 'Summary');
        episodesHtml = `<div style="display:flex;flex-direction:column;gap:1.25rem;margin-top:1rem;">` +
          section.episodes.map(ep => `
            <div style="border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;">
              <div style="background:var(--accent);color:var(--accent-soft);padding:0.5rem 0.75rem;font-weight:600;font-size:0.88rem;">${escapeHtml(ep.label)}</div>
              <div style="padding:0.75rem;display:flex;flex-direction:column;gap:0.75rem;">
                <div><strong style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);">${contentLabel}:</strong><br>${escapeHtml(ep.what_protocol_says)}</div>
                <div style="background:var(--surface-strong);padding:0.6rem 0.75rem;border-left:3px solid var(--accent);"><strong style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);">${summaryLabel}:</strong><br>${escapeHtml(ep.what_it_actually_means)}</div>
                ${ep.source ? `<div style="font-size:0.78rem;color:var(--text-muted);">📎 ${escapeHtml(ep.source)}</div>` : ''}
              </div>
            </div>`).join('') +
          `</div>`;
      }
      card.setContent({
        title: section.title,
        text: `<strong>${escapeHtml(t.labels?.content ?? 'Content')}:</strong> ${escapeHtml(section.content)}<br><br>${episodesHtml}<div style="background: var(--surface-strong); padding: 10px; border-left: 3px solid var(--accent); font-size: 0.9em;${episodesHtml ? 'margin-top:1rem;' : ''}"><strong>${escapeHtml(t.labels?.summary ?? 'Summary')}:</strong> ${escapeHtml(section.summary)}</div>`
      }, lang);
    }
  });

  if (t.theses?.length) {
    const thesesHeader = document.createElement('h3');
    thesesHeader.style.cssText = 'margin: 2.5rem 0 1rem; font-size: var(--text-lg);';
    thesesHeader.textContent = t.theses_title || (lang === 'ru' ? 'Ключевые правовые тезисы' : lang === 'sr' ? 'Ključne pravne teze' : 'Key Legal Arguments');
    list.appendChild(thesesHeader);

    t.theses.forEach((thesis, index) => {
      const row = document.createElement('div');
      row.innerHTML = `<ui-card id="thesis-card-${index}"></ui-card>`;
      list.appendChild(row);
      const card = row.querySelector(`#thesis-card-${index}`);
      if (card && typeof card.setContent === 'function') {
        card.setContent({
          title: thesis.title,
          text: `${thesis.tag ? `<span style="display:inline-block;margin-bottom:0.75rem;font-size:0.8rem;background:var(--accent);color:var(--accent-soft);padding:0.2rem 0.6rem;border-radius:999px;">${escapeHtml(thesis.tag)}</span><br>` : ''}${escapeHtml(thesis.text)}${thesis.source ? `<div style="margin-top:1rem;font-size:0.82rem;color:var(--text-muted);border-top:1px solid var(--border);padding-top:0.6rem;">📎 ${escapeHtml(thesis.source)}</div>` : ''}`
        }, lang);
      }
    });
  }
}
