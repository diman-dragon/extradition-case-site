import { store } from '../store.js';
import { escapeHtml, safeUrl } from '../security.js';

function navLink(detail, label) {
  return `<a href="javascript:void(0)" onclick="document.querySelector('site-header').dispatchEvent(new CustomEvent('navigate', { detail: '${escapeHtml(detail)}', bubbles: true, composed: true }))" class="secondary" style="text-decoration: none;">${escapeHtml(label)} →</a>`;
}

export async function renderMainPage(container) {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/home/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/home/ru.json`);
  const t = await response.json();

  container.innerHTML = `
    <page-grid>
      <section slot="main">
        <ui-card id="main-anatomy"></ui-card>
        <section style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
          <ui-card id="card-legal"></ui-card>
          <ui-card id="card-international"></ui-card>
          <ui-card id="card-actors"></ui-card>
          <ui-card id="card-archive"></ui-card>
        </section>
      </section>
      <aside slot="sidebar" class="ui-card">
        <h3>${escapeHtml(t.sidebar.title)}</h3>
        ${t.sidebar.news.map(n => {
          const logoSrc  = safeUrl(n.logo_url);
          const newsHref = safeUrl(n.link);
          return `
          <div style="margin-bottom: 25px;">
            <small>${escapeHtml(n.date)}</small>
            ${logoSrc !== '#'
              ? `<div style="margin: 4px 0 6px;"><img src="${logoSrc}" alt="${escapeHtml(n.logo_alt || n.source)}" style="height:18px;max-width:90px;object-fit:contain;opacity:0.85;filter:var(--logo-filter,none);" onerror="this.style.display='none'"></div>`
              : `<div style="font-size:0.75rem;font-weight:600;color:var(--text-muted);margin:4px 0 6px;">${escapeHtml(n.source)}</div>`}
            <h4><a href="${newsHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(n.title)}</a></h4>
            <p style="font-size: 0.9em;">${escapeHtml(n.desc)}</p>
          </div>`;
        }).join('')}
        <div style="background: var(--surface-strong); padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
          <p style="margin: 0; font-weight: bold;">${escapeHtml(t.sidebar.subscribe.title)}</p>
          <p style="font-size: 0.8em; margin: 5px 0 0 0;">${escapeHtml(t.sidebar.subscribe.text)}</p>
        </div>
        <p style="margin-top: 20px;"><a href="/archive">${escapeHtml(t.sidebar.archive_link)} →</a></p>
      </aside>
    </page-grid>
  `;

  // Fix: use container.querySelector instead of document.getElementById
  // so the function works regardless of where container lives in the DOM.
  container.querySelector('#main-anatomy').setContent({
    title: t.main.anatomy.title,
    text: `<strong>${escapeHtml(t.main.anatomy.subtitle)}</strong><br><br>${escapeHtml(t.main.anatomy.text)}${t.main.anatomy.manifesto ? `<blockquote style="margin:1.5rem 0 0;padding:1rem 1.25rem;border-left:4px solid var(--accent);background:var(--surface-strong);font-style:italic;line-height:1.7;">${escapeHtml(t.main.anatomy.manifesto)}</blockquote>` : ''}`
  }, lang);

  container.querySelector('#card-legal').setContent({
    type: t.main.cards.legal.title,
    title: t.main.cards.legal.question,
    text: `${escapeHtml(t.main.cards.legal.text)}<br><br>${navLink('legal', t.main.cards.legal.link)}`
  }, lang);

  container.querySelector('#card-international').setContent({
    type: t.main.cards.international.title,
    text: `${escapeHtml(t.main.cards.international.text)}<br><br>${navLink('intl', t.main.cards.international.link)}`
  }, lang);

  container.querySelector('#card-actors').setContent({
    type: t.main.cards.actors.title,
    text: `${escapeHtml(t.main.cards.actors.text)}<br><br>${navLink('persons', t.main.cards.actors.link)}`
  }, lang);

  container.querySelector('#card-archive').setContent({
    type: t.main.cards.archive.title,
    text: `${escapeHtml(t.main.cards.archive.text)}<ul>${t.main.cards.archive.list.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
  }, lang);
}
