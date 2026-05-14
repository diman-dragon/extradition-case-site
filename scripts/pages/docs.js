import { store } from '../store.js';
import { escapeHtml } from '../security.js';

export async function renderDocumentsPage(container) {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/docs/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/docs/ru.json`);
  const t = await response.json();

  let navResp = await fetch(`./scripts/data/i18n/nav/${lang}.json`);
  if (!navResp.ok) navResp = await fetch('./scripts/data/i18n/nav/ru.json');
  const nav = await navResp.json();

  const viewLabel   = { ru: 'Просмотр', en: 'View', sr: 'Pregled' }[lang] || 'View';
  const filterLabel = { ru: 'Фильтр и поиск', en: 'Filter & Search', sr: 'Filter i pretraga' }[lang] || 'Filter';
  const noneLabel   = { ru: 'Ничего не найдено', en: 'No results found', sr: 'Nema rezultata' }[lang] || 'No results';

  container.innerHTML = `
    <div class="page">
      <h2>${escapeHtml(t.title)}</h2>
      <p>${escapeHtml(t.subtitle)}</p>
      <ui-card id="doc-controls" style="margin-bottom: 2rem;"></ui-card>
      <div id="docs-list" class="ui-card" style="padding: 1rem;"></div>
    </div>
  `;

  const controls = container.querySelector('#doc-controls');
  controls.setContent({
    title: filterLabel,
    text: `
      <div style="display: flex; gap: 1rem; align-items: center;">
        <site-search id="doc-search-comp" placeholder="${escapeHtml(nav.search || '')}" style="flex-grow: 1;"></site-search>
        <select id="doc-filter" style="padding: 0.5rem; background: var(--surface); border: 1px solid var(--border); color: var(--text);">
          ${Object.entries(t.categories).map(([id, label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`).join('')}
        </select>
      </div>
    `
  }, lang);

  const list = container.querySelector('#docs-list');

  const renderList = (filter = 'all', search = '') => {
    const filtered = t.documents.filter(d =>
      (filter === 'all' || d.category === filter) &&
      (d.title.toLowerCase().includes(search.toLowerCase()) ||
       (d.desc || '').toLowerCase().includes(search.toLowerCase()))
    );

    if (filtered.length === 0) {
      list.innerHTML = `<p style="color:var(--text-muted);padding:0.5rem;">${escapeHtml(noneLabel)}</p>`;
      return;
    }

    list.innerHTML = filtered.map(d => `
      <div style="padding: 0.75rem 0.5rem; border-bottom: 1px solid var(--border);">
        ${d.highlight ? `<span style="font-size:0.75rem;background:var(--accent);color:var(--accent-soft);padding:0.15rem 0.5rem;border-radius:999px;margin-right:0.5rem;">${escapeHtml(d.highlight_label)}</span>` : ''}
        <span style="color:var(--text-muted);font-size:0.85rem;">${escapeHtml(d.date)}</span>
        <div style="margin-top:0.25rem;display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
          <div>
            <strong>${escapeHtml(d.title)}</strong>
            ${d.desc ? `<p style="margin:0.25rem 0 0;font-size:0.88rem;color:var(--text-muted);">${escapeHtml(d.desc)}</p>` : ''}
          </div>
          <a href="/files/${escapeHtml(d.file)}" target="_blank" rel="noopener noreferrer" style="white-space:nowrap;font-size:0.85rem;">${escapeHtml(viewLabel)}</a>
        </div>
      </div>`).join('');
  };

  container.querySelector('#doc-search-comp').addEventListener('search', (e) => {
    renderList(container.querySelector('#doc-filter').value, e.detail);
  });

  container.querySelector('#doc-filter').addEventListener('change', (e) => {
    const searchVal = container.querySelector('#doc-search-comp')?.shadowRoot?.querySelector('input')?.value ?? '';
    renderList(e.target.value, searchVal);
  });

  renderList();
}
