import './components/site-header.js';
import './components/site-footer.js';
import './components/ui-card.js';
import './components/page-grid.js';
import { store } from './store.js';
import { buildSearchIndex, searchInIndex } from './search.js';

const container = document.getElementById('app-container');

// Page titles are loaded from nav i18n — see setDocumentTitle below
const PAGE_TITLES_I18N = {
  ru: { home: 'Анатомия преследования', timeline: 'Хронология', legal: 'Правовая оценка', persons: 'Действующие лица', docs: 'Документы', intl: 'Адвокация', media: 'Медиа-архив' },
  en: { home: 'Anatomy of Persecution', timeline: 'Timeline', legal: 'Legal Assessment', persons: 'Key Figures', docs: 'Documents', intl: 'Advocacy', media: 'Media' },
  sr: { home: 'Anatomija progona', timeline: 'Hronologija', legal: 'Pravna procena', persons: 'Akteri', docs: 'Dokumenti', intl: 'Advokatska podrška', media: 'Mediji' },
};

const SITE_NAME = 'Extradition Case';

function setDocumentTitle(page) {
  const lang = store.state.lang;
  const titles = PAGE_TITLES_I18N[lang] || PAGE_TITLES_I18N.en;
  const label = titles[page] || page;
  document.title = `${label} — ${SITE_NAME}`;
}

// ---------- Security helpers ----------

/**
 * Escape a string for safe insertion into HTML text content.
 * Use this before placing any untrusted string into innerHTML.
 */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validate that a URL is http/https only (no javascript:, data:, etc.).
 * Returns the URL if safe, '#' otherwise.
 */
function safeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Allow relative paths starting with / or ./
  if (/^\.?\//.test(trimmed)) return trimmed;
  return '#';
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

async function getSearchIndex() {
  if (!searchIndex) {
    searchIndex = await buildSearchIndex(store.state.lang);
  }
  return searchIndex;
}

/**
 * Highlight a search term inside an already-escaped snippet string.
 * The input `text` must be HTML-escaped BEFORE calling this function.
 */
function highlightSnippet(escapedText, term) {
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedTermHtml = escapeHtml(term);
  return escapedText.replace(
    new RegExp(`(${escapedTermHtml.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
    '<mark style="background:var(--accent);color:var(--accent-soft)">$1</mark>'
  );
}

async function renderSearchResults(term) {
  // Limit search term length to avoid DoS / runaway regex
  const safeTerm = term.slice(0, 100);
  const lang = store.state.lang;
  const i18n = {
    ru: { title: 'Поиск', found: (n) => `Найдено на ${n} ${n === 1 ? 'странице' : 'страницах'}`, none: 'Ничего не найдено.', go: 'Перейти' },
    en: { title: 'Search', found: (n) => `Found on ${n} ${n === 1 ? 'page' : 'pages'}`, none: 'Nothing found.', go: 'Go to' },
    sr: { title: 'Pretraga', found: (n) => `Pronađeno na ${n} ${n === 1 ? 'stranici' : 'stranica'}`, none: 'Ništa nije pronađeno.', go: 'Idi na' },
  };
  const s = i18n[lang] || i18n.en;
  // Escape term for use in page title (text context — safe via textContent below)
  document.title = `${s.title}: «${safeTerm}» — ${SITE_NAME}`;
  const index = await getSearchIndex();
  const results = searchInIndex(index, safeTerm);

  container.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'page';

  const escapedTerm = escapeHtml(safeTerm);

  if (results.length === 0) {
    const h2 = document.createElement('h2');
    h2.textContent = `${s.title}: «${safeTerm}»`;
    const p = document.createElement('p');
    p.style.cssText = 'color: var(--text-muted); margin-top: 1rem;';
    p.textContent = s.none;
    page.appendChild(h2);
    page.appendChild(p);
  } else {
    const h2 = document.createElement('h2');
    h2.textContent = `${s.title}: «${safeTerm}»`;
    const summary = document.createElement('p');
    summary.style.cssText = 'color: var(--text-muted); margin-top: 0.25rem; margin-bottom: 1.5rem;';
    summary.textContent = s.found(results.length);
    page.appendChild(h2);
    page.appendChild(summary);

    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:1.5rem;';
    page.appendChild(list);

    results.forEach(({ page: pageId, pageTitle, snippets }) => {
      const card = document.createElement('div');
      card.style.cssText = 'background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1.25rem;';

      const header = document.createElement('div');
      header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;';

      const strong = document.createElement('strong');
      strong.style.fontSize = '1rem';
      strong.textContent = pageTitle;   // safe: textContent

      const link = document.createElement('a');
      link.href = 'javascript:void(0)';
      link.dataset.page = pageId;
      link.style.cssText = 'font-size:0.85rem;color:var(--accent);text-decoration:none;';
      link.textContent = `${s.go} →`;  // safe: textContent
      link.addEventListener('click', () => {
        store.setState({ activePage: link.dataset.page });
        renderActivePage();
      });

      header.appendChild(strong);
      header.appendChild(link);
      card.appendChild(header);

      const snippetContainer = document.createElement('div');
      snippetContainer.style.cssText = 'display:flex;flex-direction:column;gap:0.5rem;';

      snippets.forEach(snippet => {
        const div = document.createElement('div');
        div.style.cssText = 'font-size:0.9rem;padding:0.5rem 0.75rem;background:var(--surface-strong);border-left:3px solid var(--accent);border-radius:0 4px 4px 0;line-height:1.5;';
        // Escape the snippet text first, then highlight the (also escaped) term
        div.innerHTML = highlightSnippet(escapeHtml(snippet), safeTerm);
        snippetContainer.appendChild(div);
      });

      card.appendChild(snippetContainer);
      list.appendChild(card);
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

  const viewLabel   = { ru: 'Просмотр', en: 'View', sr: 'Pregled' }[lang] || 'View';
  const filterLabel = { ru: 'Фильтр и поиск', en: 'Filter & Search', sr: 'Filter i pretraga' }[lang] || 'Filter';

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
      list.innerHTML = `<p style="color:var(--text-muted);padding:0.5rem;">${
        escapeHtml({ ru: 'Ничего не найдено', en: 'No results found', sr: 'Nema rezultata' }[lang] || 'No results')
      }</p>`;
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

  requestAnimationFrame(() => {
    const searchComp = container.querySelector('#doc-search-comp');
    if (searchComp) searchComp.setAttribute('placeholder', nav.search || '');
  });

  container.querySelector('#doc-search-comp').addEventListener('search', (e) => renderList(container.querySelector('#doc-filter').value, e.detail));
  container.querySelector('#doc-filter').addEventListener('change', (e) => {
    const searchComp = container.querySelector('#doc-search-comp');
    const searchVal = searchComp?.shadowRoot?.querySelector('input')?.value ?? '';
    renderList(e.target.value, searchVal);
  });
  renderList();
}

export async function renderPersonsPage() {
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
    // Safe: use textContent for user-data portions
    div.innerHTML = `<strong>${escapeHtml(item.category)}:</strong> ${escapeHtml(item.desc)}`;
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

export async function renderLegalPage() {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/legal/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/legal/ru.json`);
  const t = await response.json();

  container.innerHTML = `
    <div class="page">
      <h2>${escapeHtml(t.title)}</h2>
      <p style="font-size: var(--text-lg);"><strong>${escapeHtml(t.subtitle)}</strong></p>
      <p style="font-size: var(--text-lg);">${escapeHtml(t.intro)}</p>
      <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
      <div id="legal-list" style="display: flex; flex-direction: column; gap: 2rem;"></div>
      <section class="ui-card" style="margin-top: 3rem; background: var(--surface-strong); padding: 1.5rem; border-radius: 8px;">
        <p style="margin: 0;"><em>${escapeHtml(t.summary)}</em></p>
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
        title: section.title,
        text: `<strong>${escapeHtml(t.labels?.content ?? 'Content')}:</strong> ${escapeHtml(section.content)}<br><br><div style="background: var(--surface-strong); padding: 10px; border-left: 3px solid var(--accent); font-size: 0.9em;"><strong>${escapeHtml(t.labels?.summary ?? 'Summary')}:</strong> ${escapeHtml(section.summary)}</div>`
      }, lang);
    }
  });

  if (t.theses && t.theses.length) {
    const thesesHeader = document.createElement('h3');
    thesesHeader.style.cssText = 'margin: 2.5rem 0 1rem; font-size: var(--text-lg);';
    thesesHeader.textContent = t.theses_title || (lang === 'ru' ? 'Ключевые правовые тезисы' : lang === 'sr' ? 'Ključne pravne teze' : 'Key Legal Arguments');
    list.appendChild(thesesHeader);

    t.theses.forEach((thesis, index) => {
      const row = document.createElement('div');
      row.innerHTML = `<ui-card id="thesis-card-${index}"></ui-card>`;
      list.appendChild(row);
      const card = row.querySelector(`#thesis-card-${index}`);
      if (card && typeof card.setContent === 'function') {
        card.setContent({
          title: thesis.title,
          text: `${thesis.tag ? `<span style="display:inline-block;margin-bottom:0.75rem;font-size:0.8rem;background:var(--accent);color:var(--accent-soft);padding:0.2rem 0.6rem;border-radius:999px;">${escapeHtml(thesis.tag)}</span><br>` : ''}${escapeHtml(thesis.text)}${thesis.source ? `<div style="margin-top:1rem;font-size:0.82rem;color:var(--text-muted);border-top:1px solid var(--border);padding-top:0.6rem;">📎 ${escapeHtml(thesis.source)}</div>` : ''}`
        }, lang);
      }
    });
  }
}

export async function renderTimelinePage() {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/timeline/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/timeline/ru.json`);
  const t = await response.json();

  container.innerHTML = `
    <div class="page">
      <h2>${escapeHtml(t.title)}</h2>
      <p style="font-size: var(--text-lg);"><strong>${escapeHtml(t.subtitle)}</strong></p>
      <p style="font-size: var(--text-lg);">${escapeHtml(t.intro)}</p>
      <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
      <div id="timeline-list" style="display: flex; flex-direction: column; gap: 2rem;"></div>
      <section class="ui-card" style="margin-top: 3rem; background: var(--surface-strong); padding: 1.5rem; border-radius: 8px;">
        <p style="margin: 0;"><em>${escapeHtml(t.summary)}</em></p>
      </section>
    </div>
  `;

  const list = container.querySelector('#timeline-list');
  t.events.forEach((event, index) => {
    const row = document.createElement('div');
    row.className = 'split-row';
    row.innerHTML = `
      <div class="split-row__label">
        <small style="color: var(--accent); font-weight: bold; display: block; margin-bottom: 0.5rem;">${escapeHtml(event.date)}</small>
      </div>
      <ui-card id="timeline-card-${index}"></ui-card>
    `;
    list.appendChild(row);
    const card = row.querySelector(`#timeline-card-${index}`);
    if (card && typeof card.setContent === 'function') {
      card.setContent({ title: event.title, text: escapeHtml(event.text) }, lang);
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
      <h2>${escapeHtml(t.title)}</h2>
      <p style="font-size: var(--text-lg);"><strong>${escapeHtml(t.subtitle)}</strong></p>
      <p style="font-size: var(--text-lg);">${escapeHtml(t.intro)}</p>
      <hr style="margin: 2rem 0; border: 0; border-top: 1px solid var(--border);">
      <div id="intl-list" style="display: flex; flex-direction: column; gap: 2rem;"></div>
      <section class="ui-card" style="margin-top: 3rem;">
        <p><em>${escapeHtml(t.summary)}</em></p>
      </section>
    </div>
  `;

  const list = container.querySelector('#intl-list');
  t.items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'split-row';
    row.innerHTML = `
      <div class="split-row__label">
        <small style="color: var(--accent); font-weight: bold; display: block; margin-bottom: 0.5rem;">${escapeHtml(item.org)}</small>
        <div style="font-weight: 600; color: var(--text);">${escapeHtml(item.status)}</div>
      </div>
      <ui-card id="intl-card-${index}"></ui-card>
    `;
    list.appendChild(row);
    const card = row.querySelector(`#intl-card-${index}`);
    if (card && typeof card.setContent === 'function') {
      const focusLabel = escapeHtml(t.labels?.focus ?? 'Key focus');
      const noticeLabel = escapeHtml(item.notice_label || (lang === 'ru' ? 'Официальное уведомление' : lang === 'sr' ? 'Zvanično obaveštenje' : 'Official Notice'));
      card.setContent({
        text: `${escapeHtml(item.text)}<br><br><div style="background: var(--surface-strong); padding: 10px; border-left: 3px solid var(--accent); font-size: 0.9em;"><strong>${focusLabel}:</strong> ${escapeHtml(item.focus)}</div>${item.notice ? `<blockquote style="margin:1.25rem 0 0;padding:1rem 1.25rem;border-left:4px solid #c0392b;background:var(--surface-strong);font-style:italic;line-height:1.7;"><strong style="display:block;margin-bottom:0.5rem;font-style:normal;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:#c0392b;">${noticeLabel}</strong>${escapeHtml(item.notice)}</blockquote>` : ''}`
      }, lang);
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

    // Validate logo URL and article link before emitting into HTML
    const logoSrc = safeUrl(item.logo_url);
    const articleHref = safeUrl(item.link);
    const logoAlt = escapeHtml(item.logo_alt || item.source);
    const sourceName = escapeHtml(item.source);

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
      const openLabel = escapeHtml(t.labels?.open_link ?? 'Open publication');
      const focusLabel = escapeHtml(t.labels?.focus ?? 'Key focus');
      card.setContent({
        title: item.title,
        text: `${escapeHtml(item.summary)}<br><br><div style="background: var(--surface-strong); padding: 10px; border-left: 3px solid var(--accent); font-size: 0.9em;"><strong>${focusLabel}:</strong> ${escapeHtml(item.focus)}</div><br><a href="${articleHref}" target="_blank" rel="noopener noreferrer" class="secondary" style="text-decoration: none;">${openLabel} →</a>`
      }, lang);
    }
  });

  const pressSection = page.querySelector('#press-call');
  const pressThesisLabel = escapeHtml(t.press_call.thesis_label || (lang === 'ru' ? 'Позиция для СМИ' : lang === 'sr' ? 'Pozicija za medije' : 'Press Statement'));
  pressSection.innerHTML = `<h3>${escapeHtml(t.press_call.title)}</h3><p>${escapeHtml(t.press_call.text)}</p>${t.press_call.thesis ? `<blockquote style="margin:1.25rem 0 0;padding:1rem 1.25rem;border-left:4px solid var(--accent);background:var(--surface-strong);font-style:italic;line-height:1.7;"><strong style="display:block;margin-bottom:0.5rem;font-style:normal;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;">${pressThesisLabel}</strong>${escapeHtml(t.press_call.thesis)}</blockquote>` : ''}`;
}

export async function renderMainPage() {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/home/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/home/ru.json`);
  const t = await response.json();

  // Navigation links use event dispatch — safe, no user input involved
  const navLink = (detail, label) =>
    `<a href="javascript:void(0)" onclick="document.querySelector('site-header').dispatchEvent(new CustomEvent('navigate', { detail: '${escapeHtml(detail)}', bubbles: true, composed: true }))" class="secondary" style="text-decoration: none;">${escapeHtml(label)} →</a>`;

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
          const logoSrc = safeUrl(n.logo_url);
          const logoAlt = escapeHtml(n.logo_alt || n.source);
          const newsHref = safeUrl(n.link);
          return `
          <div style="margin-bottom: 25px;">
            <small>${escapeHtml(n.date)}</small>
            ${logoSrc !== '#'
              ? `<div style="margin: 4px 0 6px;"><img src="${logoSrc}" alt="${logoAlt}" style="height:18px;max-width:90px;object-fit:contain;opacity:0.85;filter:var(--logo-filter,none);" onerror="this.style.display='none'"></div>`
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

  document.getElementById('main-anatomy').setContent({
    title: t.main.anatomy.title,
    text: `<strong>${escapeHtml(t.main.anatomy.subtitle)}</strong><br><br>${escapeHtml(t.main.anatomy.text)}${t.main.anatomy.manifesto ? `<blockquote style="margin:1.5rem 0 0;padding:1rem 1.25rem;border-left:4px solid var(--accent);background:var(--surface-strong);font-style:italic;line-height:1.7;">${escapeHtml(t.main.anatomy.manifesto)}</blockquote>` : ''}`
  }, lang);

  document.getElementById('card-legal').setContent({
    type: t.main.cards.legal.title,
    title: t.main.cards.legal.question,
    text: `${escapeHtml(t.main.cards.legal.text)} <br><br> ${navLink('legal', t.main.cards.legal.link)}`
  }, lang);

  document.getElementById('card-international').setContent({
    type: t.main.cards.international.title,
    text: `${escapeHtml(t.main.cards.international.text)} <br><br> ${navLink('intl', t.main.cards.international.link)}`
  }, lang);

  document.getElementById('card-actors').setContent({
    type: t.main.cards.actors.title,
    text: `${escapeHtml(t.main.cards.actors.text)} <br><br> ${navLink('persons', t.main.cards.actors.link)}`
  }, lang);

  document.getElementById('card-archive').setContent({
    type: t.main.cards.archive.title,
    text: `${escapeHtml(t.main.cards.archive.text)} <ul>${t.main.cards.archive.list.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
  }, lang);
}

// Apply initial settings synchronously before first render
document.documentElement.dataset.theme = store.state.theme;
document.documentElement.lang = store.state.lang;

let _prevLang = store.state.lang;

store.subscribe((state) => {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.lang = state.lang;
  if (state.lang !== _prevLang) {
    _prevLang = state.lang;
    // Invalidate search index when language changes
    searchIndex = null;
    renderActivePage();
  }
});

renderActivePage();
