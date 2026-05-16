import { store } from '../store.js';
import { escapeHtml, safeUrl } from '../security.js';
import { getPublicationLogos, publicationLogoHtml, sortByDateDesc } from '../utils/publication.js';

export async function renderMainPage(container) {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/home/${lang}.json`);
  if (!response.ok) response = await fetch('./scripts/data/i18n/home/ru.json');
  const t = await response.json();
  const logos = await getPublicationLogos();
  const news = sortByDateDesc(t.sidebar.news || []);

  const newsHtml = news.map(n => {
    let href = safeUrl(n.link);
    let titleInner;
    if (n.link === '#docs' || n.link?.startsWith('#')) {
      const page = (n.link || '#docs').replace('#', '') || 'docs';
      titleInner = `<a href="javascript:void(0)" class="text-link" data-nav-page="${escapeHtml(page)}">${escapeHtml(n.title)}</a>`;
    } else if (href !== '#') {
      titleInner = `<a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(n.title)}</a>`;
    } else {
      titleInner = escapeHtml(n.title);
    }
    return `
      <article class="news-feed__item">
        <time class="news-feed__date" datetime="${escapeHtml(n.sort || '')}">${escapeHtml(n.date)}</time>
        ${publicationLogoHtml(n, logos)}
        <h4 class="news-feed__title">${titleInner}</h4>
        <p class="news-feed__desc">${escapeHtml(n.desc)}</p>
      </article>`;
  }).join('');

  container.innerHTML = `
    <page-grid>
      <section slot="main">
        <ui-card id="main-anatomy"></ui-card>
        <section class="home-cards">
          <ui-card id="card-legal"></ui-card>
          <ui-card id="card-international"></ui-card>
          <ui-card id="card-actors"></ui-card>
          <ui-card id="card-archive"></ui-card>
        </section>
      </section>
      <aside slot="sidebar" class="ui-card home-sidebar">
        <h3 class="home-sidebar__title">${escapeHtml(t.sidebar.title)}</h3>
        ${t.sidebar.note ? `<p class="home-sidebar__note">${escapeHtml(t.sidebar.note)}</p>` : ''}
        <div class="news-feed">${newsHtml}</div>
        <div class="home-sidebar__cta">
          <p class="home-sidebar__cta-title">${escapeHtml(t.sidebar.subscribe.title)}</p>
          <p class="home-sidebar__cta-text">${escapeHtml(t.sidebar.subscribe.text)}</p>
        </div>
        <p style="margin-top:var(--space);">
          <a href="javascript:void(0)" class="text-link" data-nav-page="docs">
            ${escapeHtml(t.sidebar.archive_link)} →
          </a>
        </p>
      </aside>
    </page-grid>
  `;

  // Wire all nav links via data attribute — avoids broken href injection
  container.querySelectorAll('[data-nav-page]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector('site-header').dispatchEvent(
        new CustomEvent('navigate', { detail: el.dataset.navPage, bubbles: true, composed: true })
      );
    });
  });

  const manifesto = t.main.anatomy.manifesto
    ? `<blockquote class="prose-quote">${escapeHtml(t.main.anatomy.manifesto)}</blockquote>`
    : '';

  document.getElementById('main-anatomy').setContent({
    title: t.main.anatomy.title,
    text: `<strong>${escapeHtml(t.main.anatomy.subtitle)}</strong><br><br>${escapeHtml(t.main.anatomy.text)}${manifesto}`
  }, lang);

  function makeNavLink(page, label) {
    return `<a href="javascript:void(0)" class="text-link" data-nav-page="${escapeHtml(page)}">${escapeHtml(label)} →</a>`;
  }

  document.getElementById('card-legal').setContent({
    type: t.main.cards.legal.title,
    title: t.main.cards.legal.question,
    text: `${escapeHtml(t.main.cards.legal.text)}<br><br>${makeNavLink('legal', t.main.cards.legal.link)}`
  }, lang);

  document.getElementById('card-international').setContent({
    type: t.main.cards.international.title,
    text: `${escapeHtml(t.main.cards.international.text)}<br><br>${makeNavLink('intl', t.main.cards.international.link)}`
  }, lang);

  document.getElementById('card-actors').setContent({
    type: t.main.cards.actors.title,
    text: `${escapeHtml(t.main.cards.actors.text)}<br><br>${makeNavLink('persons', t.main.cards.actors.link)}`
  }, lang);

  document.getElementById('card-archive').setContent({
    type: t.main.cards.archive.title,
    text: `${escapeHtml(t.main.cards.archive.text)}<ul>${t.main.cards.archive.list.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul><br>${makeNavLink('docs', t.sidebar.archive_link)}`
  }, lang);

  // Wire cards' nav links after setContent renders them
  container.querySelectorAll('[data-nav-page]').forEach(el => {
    if (el._navWired) return;
    el._navWired = true;
    el.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector('site-header').dispatchEvent(
        new CustomEvent('navigate', { detail: el.dataset.navPage, bubbles: true, composed: true })
      );
    });
  });
}
