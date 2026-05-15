import { store } from '../store.js';
import { escapeHtml } from '../security.js';

export async function renderInternationalPage(container) {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/international/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/international/ru.json`);
  const t = await response.json();

  container.innerHTML = `
    <div class="page">
      <h2>${escapeHtml(t.title)}</h2>
      <p style="font-size: var(--text-lg);"><strong>${escapeHtml(t.subtitle)}</strong></p>
      <p style="font-size: var(--text-lg);">${escapeHtml(t.intro)}</p>
      <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
      <div id="intl-list" style="display: flex; flex-direction: column; gap: 2rem;"></div>
      <section class="ui-card" style="margin-top: 3rem;">
        <p><em>${escapeHtml(t.summary)}</em></p>
      </section>
    </div>
  `;

  const list = container.querySelector('#intl-list');
  t.items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'split-row';
    row.innerHTML = `
      <div class="split-row__label">
        <small style="color: var(--accent); font-weight: bold; display: block; margin-bottom: 0.5rem;">${escapeHtml(item.org)}</small>
        <div style="font-weight: 600; color: var(--text);">${escapeHtml(item.status)}</div>
      </div>
      <ui-card id="intl-card-${index}"></ui-card>
    `;
    list.appendChild(row);
    const card = row.querySelector(`#intl-card-${index}`);
    if (card && typeof card.setContent === 'function') {
      const focusLabel  = escapeHtml(t.labels?.focus ?? 'Key focus');
      const noticeLabel = escapeHtml(item.notice_label || (lang === 'ru' ? 'Официальное уведомление' : lang === 'sr' ? 'Zvanično obaveštenje' : 'Official Notice'));
      const docLabel    = lang === 'ru' ? 'Документ' : lang === 'sr' ? 'Dokument' : 'Document';
      card.setContent({
        text: `${escapeHtml(item.text)}<br><br>
          <div style="background: var(--surface-strong); padding: 10px; border-left: 3px solid var(--accent); font-size: 0.9em;">
            <strong>${focusLabel}:</strong> ${escapeHtml(item.focus)}
          </div>
          ${item.doc ? `
          <div style="margin-top:1rem;padding:0.6rem 0.75rem;border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;gap:0.75rem;">
            <span style="font-size:1.25rem;">📎</span>
            <div>
              <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.15rem;">${escapeHtml(docLabel)} · ${escapeHtml(item.doc.ref)}</div>
              <a href="./files/${escapeHtml(item.doc.file)}" target="_blank" rel="noopener noreferrer" style="font-weight:600;font-size:0.9rem;">${escapeHtml(item.doc.title)}</a>
            </div>
          </div>` : ''}
          ${item.notice ? `
          <blockquote style="margin:1.25rem 0 0;padding:1rem 1.25rem;border-left:4px solid #c0392b;background:var(--surface-strong);font-style:italic;line-height:1.7;">
            <strong style="display:block;margin-bottom:0.5rem;font-style:normal;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:#c0392b;">${noticeLabel}</strong>
            ${escapeHtml(item.notice)}
          </blockquote>` : ''}`
      }, lang);
    }
  });
}
