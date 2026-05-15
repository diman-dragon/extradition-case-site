import { store } from '../store.js';
import { escapeHtml, safeUrl } from '../security.js';

export async function renderMediaPage(container) {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/media/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/media/ru.json`);
  const t = await response.json();

  container.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'page';
  page.innerHTML = `
    <h2>${escapeHtml(t.title ?? 'Media')}</h2>
    <p><em>${escapeHtml(t.manifesto)}</em></p>
    <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
    <div id="media-list" style="display: flex; flex-direction: column; gap: 2rem;"></div>
    <section id="press-call" class="ui-card" style="margin-top: 3rem;"></section>
  `;
  container.appendChild(page);

  const list = page.querySelector('#media-list');
  t.items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'split-row';

    const logoSrc     = safeUrl(item.logo_url);
    const articleHref = safeUrl(item.link);
    const logoAlt     = escapeHtml(item.logo_alt || item.source);
    const sourceName  = escapeHtml(item.source);

    row.innerHTML = `
      <div class="split-row__label">
        <small style="color: var(--accent); font-weight: bold; display: block; margin-bottom: 0.5rem;">${escapeHtml(item.date)}</small>
        ${logoSrc !== '#'
          ? `<img src="${logoSrc}" alt="${logoAlt}" style="height:20px;max-width:110px;object-fit:contain;opacity:0.85;filter:var(--logo-filter,none);display:block;margin-bottom:4px;" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><div style="display:none;font-weight:600;color:var(--text);">${sourceName}</div>`
          : `<div style="font-weight: 600; color: var(--text);">${sourceName}</div>`}
      </div>
      <ui-card id="media-card-${index}"></ui-card>
    `;
    list.appendChild(row);

    const card = row.querySelector(`#media-card-${index}`);
    if (card && typeof card.setContent === 'function') {
      const openLabel  = escapeHtml(t.labels?.open_link ?? 'Open publication');
      const focusLabel = escapeHtml(t.labels?.focus ?? 'Key focus');
      const hasLink    = articleHref && articleHref !== '#';
      card.setContent({
        title: item.title,
        text: `${escapeHtml(item.summary)}<br><br>
          <div style="background: var(--surface-strong); padding: 10px; border-left: 3px solid var(--accent); font-size: 0.9em;">
            <strong>${focusLabel}:</strong> ${escapeHtml(item.focus)}
          </div>
          ${hasLink ? `<br><a href="${articleHref}" target="_blank" rel="noopener noreferrer" class="secondary" style="text-decoration: none;">${openLabel} →</a>` : ''}`
      }, lang);
    }
  });

  const pressSection = page.querySelector('#press-call');
  const pressThesisLabel = escapeHtml(t.press_call.thesis_label || (lang === 'ru' ? 'Позиция для СМИ' : lang === 'sr' ? 'Pozicija za medije' : 'Press Statement'));
  pressSection.innerHTML = `
    <h3>${escapeHtml(t.press_call.title)}</h3>
    <p>${escapeHtml(t.press_call.text)}</p>
    ${t.press_call.thesis ? `
    <blockquote style="margin:1.25rem 0 0;padding:1rem 1.25rem;border-left:4px solid var(--accent);background:var(--surface-strong);font-style:italic;line-height:1.7;">
      <strong style="display:block;margin-bottom:0.5rem;font-style:normal;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;">${pressThesisLabel}</strong>
      ${escapeHtml(t.press_call.thesis)}
    </blockquote>` : ''}
  `;
}
