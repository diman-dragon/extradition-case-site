import { store } from '../store.js';
import { escapeHtml } from '../security.js';

export async function renderPersonsPage(container) {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/persons/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/persons/ru.json`);
  const t = await response.json();

  container.innerHTML = `
    <div class="page">
      <h2>${escapeHtml(t.title)}</h2>
      <p style="font-size: var(--text-lg);"><strong>${escapeHtml(t.subtitle)}</strong></p>
      <p style="font-size: var(--text-lg);">${escapeHtml(t.intro)}</p>
      <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
      <h3>${escapeHtml(t.layers.network.title)}</h3>
      <div id="persons-network" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 3rem;"></div>
      <h3>${escapeHtml(t.layers.analysis.title)}</h3>
      <div id="persons-analysis" style="display: flex; flex-direction: column; gap: 2rem;"></div>
      <section class="ui-card" style="margin-top: 3rem; background: var(--surface-strong); padding: 1.5rem; border-radius: 8px;">
        <p style="margin: 0;"><em>${escapeHtml(t.summary)}</em></p>
      </section>
    </div>
  `;

  const networkList = container.querySelector('#persons-network');
  t.layers.network.items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'ui-card';
    div.innerHTML = `<strong>${escapeHtml(item.category)}:</strong> ${item.desc}`;
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
        title: item.name,
        text: `<strong>${escapeHtml(t.labels?.role ?? 'Role')}:</strong> ${escapeHtml(item.role)}<br><br><strong>${escapeHtml(t.labels?.doc ?? 'Document')}:</strong> ${escapeHtml(item.doc)}<br><br><strong>${escapeHtml(t.labels?.action ?? 'Action')}:</strong> <span style="color: var(--accent); font-weight: bold;">${escapeHtml(item.action)}</span>`
      }, lang);
    }
  });
}
