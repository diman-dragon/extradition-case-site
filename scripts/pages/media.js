import { store } from '../store.js';
import { escapeHtml, safeUrl } from '../security.js';
import { getPublicationLogos, publicationLogoHtml } from '../utils/publication.js';

export async function renderMediaPage(container) {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/media/${lang}.json`);
  if (!response.ok) response = await fetch('./scripts/data/i18n/media/ru.json');
  const t = await response.json();
  const logos = await getPublicationLogos();

  container.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'page media-page';
  page.innerHTML = `
    <h2>${escapeHtml(t.title ?? 'Media')}</h2>
    <p class="page__lead"><em>${escapeHtml(t.manifesto)}</em></p>
    <div id="media-list"></div>
    <section id="press-call" class="ui-card" style="margin-top:var(--space-lg);"></section>
  `;
  container.appendChild(page);

  const list = page.querySelector('#media-list');
  t.items.forEach((item, index) => {
    const articleHref = safeUrl(item.link);
    const hasLink = articleHref && articleHref !== '#';
    const openLabel = escapeHtml(t.labels?.open_link ?? 'Open');
    const focusLabel = escapeHtml(t.labels?.focus ?? 'Focus');

    const row = document.createElement('article');
    row.className = 'media-item';
    row.innerHTML = `
      <aside class="media-item__aside">
        <time class="media-item__date" datetime="${escapeHtml(item.sort || '')}">${escapeHtml(item.date)}</time>
        ${publicationLogoHtml(item, logos)}
      </aside>
      <div class="media-item__card">
        <ui-card id="media-card-${index}"></ui-card>
      </div>
    `;
    list.appendChild(row);

    const card = row.querySelector(`#media-card-${index}`);
    if (card?.setContent) {
      card.setContent({
        title: item.title,
        text: `${escapeHtml(item.summary)}<br><br>
          <div class="prose-quote" style="font-style:normal;border-left-width:3px;padding:0.75rem 1rem;">
            <strong style="font-style:normal;text-transform:none;letter-spacing:0;color:var(--text);">${focusLabel}</strong><br>
            ${escapeHtml(item.focus)}
          </div>
          ${hasLink ? `<br><a href="${articleHref}" target="_blank" rel="noopener noreferrer" class="text-link">${openLabel} →</a>` : ''}`
      }, lang);
    }
  });

  const pressSection = page.querySelector('#press-call');
  const thesisLabel = escapeHtml(
    t.press_call.thesis_label ||
    (lang === 'ru' ? 'Позиция для СМИ' : lang === 'sr' ? 'Stav za medije' : 'Press statement')
  );
  pressSection.innerHTML = `
    <h3>${escapeHtml(t.press_call.title)}</h3>
    <p>${escapeHtml(t.press_call.text)}</p>
    ${t.press_call.thesis ? `
    <blockquote class="prose-quote">
      <strong>${thesisLabel}</strong>
      ${escapeHtml(t.press_call.thesis)}
    </blockquote>` : ''}
  `;
}
