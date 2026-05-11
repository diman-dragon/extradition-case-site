import './components/site-header.js';
import './components/site-footer.js';
import './components/ui-card.js';
import './components/page-grid.js';
import { store } from './store.js';
import { buildSearchIndex, searchInIndex } from './search.js';

const container = document.getElementById('app-container');

// ---------- Page titles ----------

const PAGE_TITLES = {
  home: 'Анатомия преследования',
  timeline: 'Хронология',
  legal: 'Правовая оценка',
  persons: 'Действующие лица',
  docs: 'Документы',
  intl: 'Адвокация',
  media: 'Медиа',
};

const SITE_NAME = 'Extradition Case';

function setDocumentTitle(page) {
  const label = PAGE_TITLES[page] || page;
  document.title = page === 'home'
    ? `${label} — ${SITE_NAME}`
    : `${label} — ${SITE_NAME}`;
}

// ---------- Highlight helpers ----------

function highlightTextInElement(element, term) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node;
  const nodes = [];
  while (node = walker.nextNode()) nodes.push(node);

  nodes.forEach(node => {
    const parent = node.parentNode;
    if (parent.nodeName === 'MARK') return;
    const text = node.textContent;
    if (text.toLowerCase().includes(term.toLowerCase())) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
      const fragment = document.createDocumentFragment();
      parts.forEach(part => {
        if (part.toLowerCase() === term.toLowerCase()) {
          const mark = document.createElement('mark');
          mark.textContent = part;
          mark.style.backgroundColor = 'var(--accent)';
          mark.style.color = 'var(--accent-soft)';
          fragment.appendChild(mark);
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      parent.replaceChild(fragment, node);
    }
  });
}

function clearHighlights(element) {
  const marks = element.querySelectorAll('mark');
  marks.forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

// ---------- Global search ----------

let searchIndex = null;

store.subscribe(() => { searchIndex = null; }); // invalidate on lang change

async function getSearchIndex() {
  if (!searchIndex) {
    searchIndex = await buildSearchIndex(store.state.lang);
  }
  return searchIndex;
}

function highlightSnippet(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark style="background:var(--accent);color:var(--accent-soft)">$1</mark>');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function renderSearchResults(term) {
  document.title = `Поиск: «${term}» — ${SITE_NAME}`;
  const index = await getSearchIndex();
  const results = searchInIndex(index, term);

  container.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'page';

  if (results.length === 0) {
    page.innerHTML = `
      <h2>Поиск: «${term}»</h2>
      <p style="color: var(--text-muted); margin-top: 1rem;">Ничего не найдено.</p>
    `;
  } else {
    page.innerHTML = `
      <h2>Результаты поиска: «${term}»</h2>
      <p style="color: var(--text-muted); margin-top: 0.25rem; margin-bottom: 1.5rem;">
        Найдено на ${results.length} ${results.length === 1 ? 'странице' : 'страницах'}
      </p>
      <div id="search-results-list" style="display:flex;flex-direction:column;gap:1.5rem;"></div>
    `;

    const list = page.querySelector('#search-results-list');
    results.forEach(({ page: pageId, pageTitle, snippets }) => {
      const card = document.createElement('div');
      card.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1.25rem;';
      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">
          <strong style="font-size:1rem;">${pageTitle}</strong>
          <a href="javascript:void(0)"
             data-page="${pageId}"
             style="font-size:0.85rem;color:var(--accent);text-decoration:none;"
             class="go-to-page">Перейти →</a>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
          ${snippets.map(s => `
            <div style="font-size:0.9rem;padding:0.5rem 0.75rem;background:var(--surface-strong);border-left:3px solid var(--accent);border-radius:0 4px 4px 0;line-height:1.5;">
              ${highlightSnippet(escapeHtml(s), term)}
            </div>
          `).join('')}
        </div>
      `;
      list.appendChild(card);
    });

    list.querySelectorAll('.go-to-page').forEach(link => {
      link.addEventListener('click', () => {
        store.setState({ activePage: link.dataset.page });
        renderActivePage();
      });
    });
  }

  container.appendChild(page);
}

// ---------- Page routing ----------

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('site-header');
  let searchTimeout = null;

  header.addEventListener('search', (e) => {
    const term = e.detail.trim();
    clearTimeout(searchTimeout);
    if (term === '') {
      renderActivePage();
    } else {
      searchTimeout = setTimeout(() => renderSearchResults(term), 250);
    }
  });

  header.addEventListener('navigate', (e) => {
    store.setState({ activePage: e.detail });
    renderActivePage();
  });

  // Browser back / forward buttons
  window.addEventListener('popstate', (e) => {
    store.syncFromUrl();
    renderActivePage();
  });
});

export function renderActivePage() {
  clearHighlights(container);

  const page = store.state.activePage;
  setDocumentTitle(page);

  if (page === 'media') return renderMediaPage();
  if (page === 'intl') return renderInternationalPage();
  if (page === 'timeline') return renderTimelinePage();
  if (page === 'legal') return renderLegalPage();
  if (page === 'persons') return renderPersonsPage();
  if (page === 'docs') return renderDocumentsPage();
  return renderMainPage();
}

// ---------- Page renderers ----------

export async function renderDocumentsPage() {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/docs/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/docs/ru.json`);
  const t = await response.json();

  let navResp = await fetch(`./scripts/data/i18n/nav/${lang}.json`);
  if (!navResp.ok) navResp = await fetch('./scripts/data/i18n/nav/ru.json');
  const nav = await navResp.json();

  // "View" label per language
  const viewLabel = { ru: 'Просмотр', en: 'View', sr: 'Pregled' }[lang] || 'View';
  const filterLabel = { ru: 'Фильтр и поиск', en: 'Filter & Search', sr: 'Filter i pretraga' }[lang] || 'Filter';

  container.innerHTML = `
    <div class="page">
      <h2>${t.title}</h2>
      <p>${t.subtitle}</p>
      <ui-card id="doc-controls" style="margin-bottom: 2rem;"></ui-card>
      <div id="docs-list" class="ui-card" style="padding: 1rem;"></div>
    </div>
  `;

  const controls = container.querySelector('#doc-controls');
  controls.setContent({
    title: { ru: filterLabel },
    text: { ru: `
      <div style="display: flex; gap: 1rem; align-items: center;">
        <site-search id="doc-search-comp" placeholder="${nav.search || ''}" style="flex-grow: 1;"></site-search>
        <select id="doc-filter" style="padding: 0.5rem; background: var(--surface); border: 1px solid var(--border); color: var(--text);">
          ${Object.entries(t.categories).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}
        </select>
      </div>
    ` }
  });

  const list = container.querySelector('#docs-list');
  const renderList = (filter = 'all', search = '') => {
    const filtered = t.documents.filter(d =>
      (filter === 'all' || d.category === filter) &&
      (d.title.toLowerCase().includes(search.toLowerCase()) ||
       (d.desc || '').toLowerCase().includes(search.toLowerCase()))
    );
    if (filtered.length === 0) {
      list.innerHTML = `<p style="color:var(--text-muted);padding:0.5rem;">${
        { ru: 'Ничего не найдено', en: 'No results found', sr: 'Nema rezultata' }[lang] || 'No results'
      }</p>`;
      return;
    }
    list.innerHTML = filtered.map(d => `
      <div style="padding: 0.75rem 0.5rem; border-bottom: 1px solid var(--border);">
        ${d.highlight ? `<span style="font-size:0.75rem;background:var(--accent);color:var(--accent-soft);padding:0.15rem 0.5rem;border-radius:999px;margin-right:0.5rem;">${d.highlight_label}</span>` : ''}
        <span style="color:var(--text-muted);font-size:0.85rem;">${d.date}</span>
        <div style="margin-top:0.25rem;display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
          <div>
            <strong>${d.title}</strong>
            ${d.desc ? `<p style="margin:0.25rem 0 0;font-size:0.88rem;color:var(--text-muted);">${d.desc}</p>` : ''}
          </div>
          <a href="/files/${d.file}" target="_blank" style="white-space:nowrap;font-size:0.85rem;">${viewLabel}</a>
        </div>
      </div>`).join('');
  };

  // Set placeholder after site-search is in DOM
  requestAnimationFrame(() => {
    const searchComp = container.querySelector('#doc-search-comp');
    if (searchComp) searchComp.setAttribute('placeholder', nav.search || '');
  });

  container.querySelector('#doc-search-comp').addEventListener('search', (e) => renderList(container.querySelector('#doc-filter').value, e.detail));
  container.querySelector('#doc-filter').addEventListener('change', (e) => renderList(e.target.value, container.querySelector('#doc-search-comp').shadowRoot.querySelector('input').value));
  renderList();
}

export async function renderPersonsPage() {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/persons/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/persons/ru.json`);
  const t = await response.json();

  container.innerHTML = `
    <div class="page">
      <h2>${t.title}</h2>
      <p style="font-size: 1.2rem;"><strong>${t.subtitle}</strong></p>
      <p style="font-size: 1.2rem;">${t.intro}</p>
      <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
      <h3>${t.layers.network.title}</h3>
      <div id="persons-network" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 3rem;"></div>
      <h3>${t.layers.analysis.title}</h3>
      <div id="persons-analysis" style="display: flex; flex-direction: column; gap: 2rem;"></div>
      <section class="ui-card" style="margin-top: 3rem; background: var(--surface-strong); padding: 1.5rem; border-radius: 8px;">
        <p style="margin: 0;"><em>${t.summary}</em></p>
      </section>
    </div>
  `;

  const networkList = container.querySelector('#persons-network');
  t.layers.network.items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'ui-card';
    div.innerHTML = `<strong>${item.category}:</strong> ${item.desc}`;
    networkList.appendChild(div);
  });

  const analysisList = container.querySelector('#persons-analysis');
  t.layers.analysis.items.forEach((item, index) => {
    const row = document.createElement('div');
    row.innerHTML = `<ui-card id="person-card-${index}"></ui-card>`;
    analysisList.appendChild(row);
    const card = row.querySelector(`#person-card-${index}`);
    if (card && typeof card.setContent === 'function') {
      card.setContent({
        title: { ru: item.name },
        text: { ru: `<strong>Роль:</strong> ${item.role}<br><br><strong>Документ:</strong> ${item.doc}<br><br><strong>Действие:</strong> <span style="color: var(--accent); font-weight: bold;">${item.action}</span>` }
      });
    }
  });
}

export async function renderLegalPage() {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/legal/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/legal/ru.json`);
  const t = await response.json();

  container.innerHTML = `
    <div class="page">
      <h2>${t.title}</h2>
      <p style="font-size: 1.2rem;"><strong>${t.subtitle}</strong></p>
      <p style="font-size: 1.2rem;">${t.intro}</p>
      <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
      <div id="legal-list" style="display: flex; flex-direction: column; gap: 2rem;"></div>
      <section class="ui-card" style="margin-top: 3rem; background: var(--surface-strong); padding: 1.5rem; border-radius: 8px;">
        <p style="margin: 0;"><em>${t.summary}</em></p>
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
      card.setContent({
        title: { ru: section.title },
        text: { ru: `<strong>Содержание:</strong> ${section.content}<br><br><div style="background: var(--surface-strong); padding: 10px; border-left: 3px solid var(--accent); font-size: 0.9em;"><strong>Суть:</strong> ${section.summary}</div>` }
      });
    }
  });
}

export async function renderTimelinePage() {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/timeline/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/timeline/ru.json`);
  const t = await response.json();

  container.innerHTML = `
    <div class="page">
      <h2>${t.title}</h2>
      <p style="font-size: 1.2rem;"><strong>${t.subtitle}</strong></p>
      <p style="font-size: 1.2rem;">${t.intro}</p>
      <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
      <div id="timeline-list" style="display: flex; flex-direction: column; gap: 2rem;"></div>
      <section class="ui-card" style="margin-top: 3rem; background: var(--surface-strong); padding: 1.5rem; border-radius: 8px;">
        <p style="margin: 0;"><em>${t.summary}</em></p>
      </section>
    </div>
  `;

  const list = container.querySelector('#timeline-list');
  t.events.forEach((event, index) => {
    const row = document.createElement('div');
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '200px 1fr';
    row.style.gap = '2rem';
    row.style.alignItems = 'start';
    row.innerHTML = `
      <div style="position: sticky; top: 20px;">
        <small style="color: var(--accent); font-weight: bold; display: block; margin-bottom: 0.5rem;">${event.date}</small>
      </div>
      <ui-card id="timeline-card-${index}"></ui-card>
    `;
    list.appendChild(row);
    const card = row.querySelector(`#timeline-card-${index}`);
    if (card && typeof card.setContent === 'function') {
      card.setContent({ title: { ru: event.title }, text: { ru: event.text } });
    }
  });
}

export async function renderInternationalPage() {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/international/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/international/ru.json`);
  const t = await response.json();

  container.innerHTML = `
    <div class="page">
      <h2>${t.title}</h2>
      <p style="font-size: 1.2rem;"><strong>${t.subtitle}</strong></p>
      <p style="font-size: 1.2rem;">${t.intro}</p>
      <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
      <div id="intl-list" style="display: flex; flex-direction: column; gap: 2rem;"></div>
      <section class="ui-card" style="margin-top: 3rem;">
        <p><em>${t.summary}</em></p>
      </section>
    </div>
  `;

  const list = container.querySelector('#intl-list');
  t.items.forEach((item, index) => {
    const row = document.createElement('div');
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '200px 1fr';
    row.style.gap = '2rem';
    row.style.alignItems = 'start';
    row.style.marginBottom = '2rem';
    row.innerHTML = `
      <div style="position: sticky; top: 20px;">
        <small style="color: var(--accent); font-weight: bold; display: block; margin-bottom: 0.5rem;">${item.org}</small>
        <div style="font-weight: 600; color: var(--text);">${item.status}</div>
      </div>
      <ui-card id="intl-card-${index}"></ui-card>
    `;
    list.appendChild(row);
    const card = row.querySelector(`#intl-card-${index}`);
    if (card && typeof card.setContent === 'function') {
      card.setContent({
        text: { ru: `${item.text}<br><br><div style="background: var(--surface-strong); padding: 10px; border-left: 3px solid var(--accent); font-size: 0.9em;"><strong>Суть:</strong> ${item.focus}</div>` }
      });
    }
  });
}

export async function renderMediaPage() {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/media/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/media/ru.json`);
  const t = await response.json();

  container.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'page';
  page.innerHTML = `
    <h2>Медиа-архив</h2>
    <p><em>${t.manifesto}</em></p>
    <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
    <div id="media-list" style="display: flex; flex-direction: column; gap: 2rem;"></div>
    <section id="press-call" class="ui-card" style="margin-top: 3rem;"></section>
  `;
  container.appendChild(page);

  const list = page.querySelector('#media-list');
  t.items.forEach((item, index) => {
    const row = document.createElement('div');
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '200px 1fr';
    row.style.gap = '2rem';
    row.style.alignItems = 'start';
    row.style.marginBottom = '2rem';
    row.innerHTML = `
      <div style="position: sticky; top: 20px;">
        <small style="color: var(--accent); font-weight: bold; display: block; margin-bottom: 0.5rem;">${item.date}</small>
        <div style="font-weight: 600; color: var(--text);">${item.source}</div>
      </div>
      <ui-card id="media-card-${index}"></ui-card>
    `;
    list.appendChild(row);
    const card = row.querySelector(`#media-card-${index}`);
    if (card && typeof card.setContent === 'function') {
      card.setContent({
        title: { ru: item.title },
        text: { ru: `${item.summary}<br><br><div style="background: var(--surface-strong); padding: 10px; border-left: 3px solid var(--accent); font-size: 0.9em;"><strong>Ключевой фокус:</strong> ${item.focus}</div><br><a href='${item.link}' target='_blank' rel='noopener noreferrer' class='secondary' style='text-decoration: none;'>Открыть публикацию →</a>` }
      });
    }
  });

  const pressSection = page.querySelector('#press-call');
  pressSection.innerHTML = `<h3>${t.press_call.title}</h3><p>${t.press_call.text}</p>`;
}

export async function renderMainPage() {
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
        <h3>${t.sidebar.title}</h3>
        ${t.sidebar.news.map(n => `
          <div style="margin-bottom: 25px;">
            <small>${n.date}</small>
            <h4><a href="${n.link || '#'}" target="_blank" rel="noopener noreferrer">${n.title}</a></h4>
            <p style="font-size: 0.9em;">${n.desc}</p>
          </div>
        `).join('')}
        <div style="background: var(--surface-strong); padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
          <p style="margin: 0; font-weight: bold;">${t.sidebar.subscribe.title}</p>
          <p style="font-size: 0.8em; margin: 5px 0 0 0;">${t.sidebar.subscribe.text}</p>
        </div>
        <p style="margin-top: 20px;"><a href="/archive">${t.sidebar.archive_link} →</a></p>
      </aside>
    </page-grid>
  `;

  document.getElementById('main-anatomy').setContent({
    title: { ru: t.main.anatomy.title },
    text: { ru: `<strong>${t.main.anatomy.subtitle}</strong><br><br>${t.main.anatomy.text}` }
  });

  document.getElementById('card-legal').setContent({
    type: t.main.cards.legal.title,
    title: { ru: t.main.cards.legal.question },
    text: { ru: `${t.main.cards.legal.text} <br><br> <a href='javascript:void(0)' onclick="document.querySelector('site-header').dispatchEvent(new CustomEvent('navigate', { detail: 'legal', bubbles: true, composed: true }))" class='secondary' style='text-decoration: none;'>${t.main.cards.legal.link} →</a>` }
  });

  document.getElementById('card-international').setContent({
    type: t.main.cards.international.title,
    text: { ru: `${t.main.cards.international.text} <br><br> <a href='javascript:void(0)' onclick="document.querySelector('site-header').dispatchEvent(new CustomEvent('navigate', { detail: 'intl', bubbles: true, composed: true }))" class='secondary' style='text-decoration: none;'>${t.main.cards.international.link} →</a>` }
  });

  document.getElementById('card-actors').setContent({
    type: t.main.cards.actors.title,
    text: { ru: `${t.main.cards.actors.text} <br><br> <a href='javascript:void(0)' onclick="document.querySelector('site-header').dispatchEvent(new CustomEvent('navigate', { detail: 'persons', bubbles: true, composed: true }))" class='secondary' style='text-decoration: none;'>${t.main.cards.actors.link} →</a>` }
  });

  document.getElementById('card-archive').setContent({
    type: t.main.cards.archive.title,
    text: { ru: `${t.main.cards.archive.text} <ul>${t.main.cards.archive.list.map(item => `<li>${item}</li>`).join('')}</ul>` }
  });
}

function applySettings(theme, lang) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = lang;
  renderActivePage();
}

store.subscribe((state) => {
  applySettings(state.theme, state.lang);
});

renderActivePage();
