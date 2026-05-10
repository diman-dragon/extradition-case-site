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
  return renderMainPage();
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
        text: { ru: `${item.summary}<br><br><div style="background: var(--surface-strong); padding: 10px; border-left: 3px solid var(--accent); font-size: 0.9em;"><strong>Ключевой фокус:</strong> ${item.focus}</div><br><a href='${item.link}' class='secondary' style='text-decoration: none;'>Перейти к материалу →</a>` }
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
            <h4><a href="#">${n.title}</a></h4>
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
    text: { ru: `${t.main.cards.legal.text} <br><br> <a href='/docs-arbitration' class='secondary' style='text-decoration: none;'>${t.main.cards.legal.link} →</a>` }
  });
  
  document.getElementById('card-international').setContent({
    type: t.main.cards.international.title,
    text: { ru: `${t.main.cards.international.text} <br><br> <a href='/international-context' class='secondary' style='text-decoration: none;'>${t.main.cards.international.link} →</a>` }
  });
  
  document.getElementById('card-actors').setContent({
    type: t.main.cards.actors.title,
    text: { ru: `${t.main.cards.actors.text} <br><br> <a href='/persons' class='secondary' style='text-decoration: none;'>${t.main.cards.actors.link} →</a>` }
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
