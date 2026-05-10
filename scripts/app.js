import './components/site-header.js';
import './components/site-footer.js';
import './components/ui-card.js';
import './components/page-grid.js';
import { store } from './store.js';

const container = document.getElementById('app-container');

export async function renderMainPage() {
  const lang = store.state.lang;
  console.log(`Fetching translations for: ${lang}`);
  
  let response = await fetch(`./scripts/data/i18n/home/${lang}.json`);
  
  if (!response.ok) {
    console.warn(`Translation for ${lang} not found, falling back to ru.`);
    response = await fetch(`./scripts/data/i18n/home/ru.json`);
  }

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

  // Заполняем данные в компоненты
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

function applyTheme(theme, lang) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.lang = lang;
  renderMainPage();
}

store.subscribe((state) => {
  applyTheme(state.theme, state.lang);
});

renderMainPage();

