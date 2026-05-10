import './components/site-header.js';
import './components/site-footer.js';
import './components/ui-card.js';
import './components/page-grid.js';
import { store } from './store.js';

const container = document.getElementById('app-container');

function filterAndHighlight(term) {
  const cards = container.querySelectorAll('ui-card');
  const termLower = term.toLowerCase();

  cards.forEach(card => {
    const cardText = card.textContent.toLowerCase();
    
    if (term && !cardText.includes(termLower)) {
      card.style.display = 'none';
    } else {
      card.style.display = 'block';
      if (term) highlightTextInElement(card, termLower);
    }
  });
}

function highlightTextInElement(element, term) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node;
  const nodes = [];
  while (node = walker.nextNode()) nodes.push(node);

  nodes.forEach(node => {
    const parent = node.parentNode;
    if (parent.nodeName === 'MARK') return;
    const text = node.textContent;
    if (text.toLowerCase().includes(term)) {
      const parts = text.split(new RegExp(`(${term})`, 'gi'));
      const fragment = document.createDocumentFragment();
      parts.forEach(part => {
        if (part.toLowerCase() === term) {
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
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('site-header');
  
  header.addEventListener('search', (e) => {
    if (e.detail === '') {
      renderActivePage();
    } else {
      renderActivePage().then(() => filterAndHighlight(e.detail));
    }
  });

  header.addEventListener('navigate', (e) => {
    store.setState({ activePage: e.detail });
    renderActivePage();
  });
});

function renderActivePage() {
  const page = store.state.activePage;
  if (page === 'media') return renderMediaPage();
  if (page === 'intl') return renderInternationalPage();
  if (page === 'timeline') return renderTimelinePage();
  if (page === 'legal') return renderLegalPage();
  if (page === 'persons') return renderPersonsPage();
  if (page === 'docs') return renderDocumentsPage();
  return renderMainPage();
}

export async function renderDocumentsPage() {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/docs/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/docs/ru.json`);
  const t = await response.json();

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
    title: { ru: "Фильтр и поиск" },
    text: { ru: `
      <div style="display: flex; gap: 1rem; align-items: center;">
        <site-search id="doc-search-comp" style="flex-grow: 1;"></site-search>
        <select id="doc-filter" style="padding: 0.5rem; background: var(--surface); border: 1px solid var(--border); color: var(--text);">
          ${Object.entries(t.categories).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}
        </select>
      </div>
    ` }
  });

  const list = container.querySelector('#docs-list');
  const renderList = (filter = 'all', search = '') => {
    list.innerHTML = t.documents
      .filter(d => (filter === 'all' || d.category === filter) && d.title.toLowerCase().includes(search.toLowerCase()))
      .map(d => `<div style="padding: 0.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between;">
        <span>${d.date} — <strong>${d.title}</strong></span>
        <a href="/files/${d.file}" target="_blank">Просмотр</a>
      </div>`).join('');
  };

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
      <p><strong>${t.subtitle}</strong></p>
      <p>${t.intro}</p>
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
      <p><strong>${t.subtitle}</strong></p>
      <p>${t.intro}</p>
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
    row.innerHTML = `
      <ui-card id="legal-card-${index}"></ui-card>
    `;
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
      <p><strong>${t.subtitle}</strong></p>
      <p>${t.intro}</p>
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
      card.setContent({
        title: { ru: event.title },
        text: { ru: event.text }
      });
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
      <p><strong>${t.subtitle}</strong></p>
      <p>${t.intro}</p>
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
    row.style.marginBottom = '2rem'; // Обеспечиваем отступ между карточками
    
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
      });    }
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
