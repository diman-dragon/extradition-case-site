import { store } from '../store.js';
import { escapeHtml, safeUrl } from '../security.js';
import { resolveI18n, resolveDocMeta } from '../utils/resolve-i18n.js';
import '../components/site-search.js';

function getFileType(filename) {
  if (!filename) return 'unknown';
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'word';
  return 'unknown';
}

function fileTypeBadge(type, lang, ui) {
  const map = { pdf: ui.badgePdf, word: ui.badgeWord };
  return map[type] || '';
}

function buildFileUrl(categoryId, subcategoryId, filename) {
  const base = subcategoryId
    ? `./files/${categoryId}/${subcategoryId}/${filename}`
    : `./files/${categoryId}/${filename}`;
  return base;
}

function flattenCatalog(catalog) {
  const rows = [];
  for (const cat of catalog.categories) {
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        for (const doc of sub.documents) {
          rows.push({
            categoryId: cat.id,
            subcategoryId: sub.id,
            subcategoryKey: sub.title_i18n_key,
            ...doc,
          });
        }
      }
    } else if (cat.documents) {
      for (const doc of cat.documents) {
        rows.push({
          categoryId: cat.id,
          subcategoryId: null,
          subcategoryKey: null,
          ...doc,
        });
      }
    }
  }
  return rows;
}

export async function renderDocumentsPage(container) {
  const lang = store.state.lang;

  const [i18nResp, catalogResp, navResp] = await Promise.all([
    fetch(`./scripts/data/i18n/docs/${lang}.json`).then(r => (r.ok ? r : fetch('./scripts/data/i18n/docs/ru.json'))),
    fetch('./scripts/data/documents.json'),
    fetch(`./scripts/data/i18n/nav/${lang}.json`).then(r => (r.ok ? r : fetch('./scripts/data/i18n/nav/ru.json'))),
  ]);

  const i18n = await i18nResp.json();
  const catalog = await catalogResp.json();
  const nav = await navResp.json();
  const ui = i18n.ui || {};
  const allDocs = flattenCatalog(catalog);

  let activeCategory = catalog.categories[0]?.id || '';
  let activeSub = null;
  let searchTerm = '';

  container.innerHTML = `
    <div class="page docs-page">
      <div class="docs-page__intro">
        <h2>${escapeHtml(i18n.title)}</h2>
        <p>${escapeHtml(i18n.subtitle)}</p>
      </div>
      <div class="docs-layout">
        <nav class="docs-nav" id="docs-primary-nav" aria-label="${escapeHtml(ui.navPrimary || 'Categories')}"></nav>
        <div class="docs-main">
          <div class="docs-toolbar">
            <site-search id="doc-search-comp" placeholder="${escapeHtml(nav.search || ui.searchPlaceholder || '')}"></site-search>
          </div>
          <div class="docs-subnav" id="docs-subnav" hidden></div>
          <div class="docs-panel" id="docs-panel"></div>
        </div>
      </div>
      <div id="doc-preview-overlay" class="doc-preview-overlay" hidden>
        <div class="doc-preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title">
          <div class="doc-preview-modal__head">
            <div class="doc-preview-modal__titles">
              <span id="preview-type-badge" class="docs-card__badge docs-card__badge--type"></span>
              <strong id="preview-title"></strong>
            </div>
            <div class="doc-preview-modal__actions">
              <a id="preview-download-btn" href="#" download class="docs-card__btn docs-card__btn--secondary"></a>
              <button type="button" id="preview-close-btn" class="docs-card__btn docs-card__btn--secondary"></button>
            </div>
          </div>
          <div id="preview-body" class="doc-preview-modal__body"></div>
        </div>
      </div>
    </div>
  `;

  const primaryNav = container.querySelector('#docs-primary-nav');
  const subNav = container.querySelector('#docs-subnav');
  const panel = container.querySelector('#docs-panel');
  const overlay = container.querySelector('#doc-preview-overlay');
  const previewTitle = container.querySelector('#preview-title');
  const previewBadge = container.querySelector('#preview-type-badge');
  const previewDlBtn = container.querySelector('#preview-download-btn');
  const previewBody = container.querySelector('#preview-body');
  const previewCloseBtn = container.querySelector('#preview-close-btn');

  function langLabel(code) {
    return (i18n.lang_labels && i18n.lang_labels[code]) || code.toUpperCase();
  }

  function getCategory(catId) {
    return catalog.categories.find(c => c.id === catId);
  }

  function openPreview(docRow, meta) {
    const fileUrl = buildFileUrl(docRow.categoryId, docRow.subcategoryId, docRow.filename);
    const type = getFileType(docRow.filename);

    previewTitle.textContent = meta.title;
    previewBadge.textContent = fileTypeBadge(type, lang, ui);
    previewDlBtn.href = safeUrl(fileUrl);
    previewDlBtn.setAttribute('download', docRow.filename);
    previewDlBtn.textContent = `↓ ${ui.download}`;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';

    if (type === 'pdf') {
      previewBody.innerHTML = `<iframe src="${safeUrl(fileUrl)}#toolbar=1&navpanes=1&scrollbar=1&page=1&zoom=page-fit" title="${escapeHtml(meta.title)}" class="doc-preview-iframe"></iframe>`;
    } else if (type === 'word') {
      const isLocal = /^https?:\/\/(localhost|127\.|0\.0\.0\.)/.test(window.location.origin);
      if (!isLocal) {
        const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
        const absUrl = window.location.origin + basePath + '/files/' +
          [docRow.categoryId, docRow.subcategoryId, docRow.filename].filter(Boolean).join('/');
        const officeUrl = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(absUrl);
        previewBody.innerHTML = `<iframe src="${officeUrl}" title="${escapeHtml(meta.title)}" class="doc-preview-iframe"></iframe>`;
      } else {
        previewBody.innerHTML = `
          <div class="doc-preview-fallback">
            <p>${escapeHtml(ui.wordNote)}</p>
            <a href="${safeUrl(fileUrl)}" download="${escapeHtml(docRow.filename)}" class="docs-card__btn docs-card__btn--primary">↓ ${escapeHtml(ui.download)}</a>
          </div>`;
      }
    } else {
      previewBody.innerHTML = `<p class="docs-empty"><a href="${safeUrl(fileUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(ui.openNew)} ↗</a></p>`;
    }
  }

  function closePreview() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    previewBody.innerHTML = '';
  }

  previewCloseBtn.textContent = `${ui.close} ✕`;
  previewCloseBtn.addEventListener('click', closePreview);
  overlay.addEventListener('click', e => { if (e.target === overlay) closePreview(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape' && !overlay.hidden) closePreview();
  });

  function renderPrimaryNav() {
    primaryNav.innerHTML = '';
    catalog.categories.forEach(cat => {
      const label = resolveI18n(i18n, cat.title_i18n_key) || cat.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'docs-nav__btn';
      btn.dataset.cat = cat.id;
      btn.textContent = typeof label === 'string' ? label : label?.title || cat.id;
      btn.setAttribute('aria-current', cat.id === activeCategory ? 'true' : 'false');
      btn.addEventListener('click', () => {
        activeCategory = cat.id;
        const c = getCategory(cat.id);
        activeSub = c?.subcategories?.[0]?.id || null;
        render();
      });
      primaryNav.appendChild(btn);
    });
  }

  function renderSubNav(cat) {
    subNav.innerHTML = '';
    if (!cat?.subcategories?.length) {
      subNav.hidden = true;
      return;
    }
    subNav.hidden = false;
    if (!activeSub || !cat.subcategories.some(s => s.id === activeSub)) {
      activeSub = cat.subcategories[0].id;
    }
    cat.subcategories.forEach(sub => {
      const label = resolveI18n(i18n, sub.title_i18n_key) || sub.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'docs-subnav__btn';
      btn.textContent = typeof label === 'string' ? label : label?.title || sub.id;
      btn.setAttribute('aria-current', sub.id === activeSub ? 'true' : 'false');
      btn.addEventListener('click', () => {
        activeSub = sub.id;
        render();
      });
      subNav.appendChild(btn);
    });
  }

  function renderDocCard(docRow, relatedInGroup) {
    const meta = resolveDocMeta(i18n, docRow.title_i18n_key);
    const fileUrl = buildFileUrl(docRow.categoryId, docRow.subcategoryId, docRow.filename);
    const type = getFileType(docRow.filename);
    const typeLbl = fileTypeBadge(type, lang, ui);

    const card = document.createElement('article');
    card.className = 'docs-card';
    card.innerHTML = `
      <div class="docs-card__meta">
        ${meta.highlight ? `<span class="docs-card__badge docs-card__badge--highlight">${escapeHtml(meta.highlight_label)}</span>` : ''}
        ${typeLbl ? `<span class="docs-card__badge docs-card__badge--type">${escapeHtml(typeLbl)}</span>` : ''}
        <span class="docs-card__badge docs-card__badge--lang">${escapeHtml(langLabel(docRow.language))}</span>
        ${meta.date ? `<span class="docs-card__date">${escapeHtml(meta.date)}</span>` : ''}
      </div>
      <div class="docs-card__body">
        <div>
          <strong>${escapeHtml(meta.title)}</strong>
          ${meta.desc ? `<p style="margin:0.35rem 0 0;font-size:var(--text-sm);color:var(--text-muted);line-height:1.55;">${escapeHtml(meta.desc)}</p>` : ''}
        </div>
        <div class="docs-card__actions">
          <button type="button" class="docs-card__btn docs-card__btn--primary doc-preview-btn">${escapeHtml(ui.preview)}</button>
          <a href="${safeUrl(fileUrl)}" download="${escapeHtml(docRow.filename)}" class="docs-card__btn docs-card__btn--secondary">↓ ${escapeHtml(ui.download)}</a>
        </div>
      </div>
    `;

    if (relatedInGroup?.length) {
      const rel = document.createElement('div');
      rel.className = 'docs-related';
      rel.innerHTML = `<strong>${escapeHtml(ui.related || 'Related')}:</strong> ` +
        relatedInGroup.map(r => {
          const m = resolveDocMeta(i18n, r.title_i18n_key);
          return `<a href="#" data-related-id="${escapeHtml(r.id)}">${escapeHtml(m.title)}</a>`;
        }).join(' · ');
      card.appendChild(rel);
      rel.querySelectorAll('[data-related-id]').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          const id = a.dataset.relatedId;
          const target = allDocs.find(d => d.id === id);
          if (target) {
            activeCategory = target.categoryId;
            activeSub = target.subcategoryId;
            const m = resolveDocMeta(i18n, target.title_i18n_key);
            openPreview(target, m);
          }
        });
      });
    }

    card.querySelector('.doc-preview-btn')?.addEventListener('click', () => openPreview(docRow, meta));
    return card;
  }

  function groupRelated(docs) {
    const byGroup = new Map();
    const ungrouped = [];
    docs.forEach(d => {
      const meta = resolveDocMeta(i18n, d.title_i18n_key);
      if (meta.group) {
        if (!byGroup.has(meta.group)) byGroup.set(meta.group, []);
        byGroup.get(meta.group).push(d);
      } else {
        ungrouped.push(d);
      }
    });
    return { byGroup, ungrouped };
  }

  function renderList() {
    const term = searchTerm.trim().toLowerCase();
    let docs = allDocs.filter(d => d.categoryId === activeCategory);
    if (activeSub) docs = docs.filter(d => d.subcategoryId === activeSub);

    if (term) {
      docs = allDocs.filter(d => {
        const m = resolveDocMeta(i18n, d.title_i18n_key);
        return [m.title, m.desc, m.date].join(' ').toLowerCase().includes(term);
      });
      if (!docs.length) {
        panel.innerHTML = `<p class="docs-empty">${escapeHtml(ui.none)}</p>`;
        return;
      }
      const frag = document.createDocumentFragment();
      const header = document.createElement('p');
      header.className = 'docs-empty';
      header.style.textAlign = 'left';
      header.style.padding = '0.75rem 1rem';
      header.textContent = ui.searchResults?.replace('{n}', docs.length) || `${docs.length}`;
      frag.appendChild(header);
      const { byGroup, ungrouped } = groupRelated(docs);
      const shown = new Set();
      byGroup.forEach(groupDocs => {
        groupDocs.forEach(d => {
          if (shown.has(d.id)) return;
          shown.add(d.id);
          const related = groupDocs.filter(x => x.id !== d.id);
          frag.appendChild(renderDocCard(d, related.length ? related : null));
        });
      });
      ungrouped.forEach(d => {
        if (!shown.has(d.id)) frag.appendChild(renderDocCard(d));
      });
      panel.innerHTML = '';
      panel.appendChild(frag);
      return;
    }

    const cat = getCategory(activeCategory);
    if (!cat) {
      panel.innerHTML = `<p class="docs-empty">${escapeHtml(ui.none)}</p>`;
      return;
    }

    panel.innerHTML = '';
    const frag = document.createDocumentFragment();

    if (cat.subcategories?.length) {
      const subs = activeSub
        ? cat.subcategories.filter(s => s.id === activeSub)
        : cat.subcategories;
      subs.forEach(sub => {
        const subLabel = resolveI18n(i18n, sub.title_i18n_key);
        const title = typeof subLabel === 'string' ? subLabel : subLabel?.title || sub.id;
        const h = document.createElement('h3');
        h.className = 'docs-group__title';
        h.textContent = title;
        frag.appendChild(h);
        const subDocs = sub.documents || [];
        const { byGroup, ungrouped } = groupRelated(
          subDocs.map(d => ({ ...d, categoryId: cat.id, subcategoryId: sub.id }))
        );
        const shown = new Set();
        byGroup.forEach(groupDocs => {
          groupDocs.forEach(d => {
            if (shown.has(d.id)) return;
            shown.add(d.id);
            frag.appendChild(renderDocCard(d, groupDocs.filter(x => x.id !== d.id)));
          });
        });
        ungrouped.forEach(d => {
          if (!shown.has(d.id)) frag.appendChild(renderDocCard(d));
        });
        if (!subDocs.length) {
          const empty = document.createElement('p');
          empty.className = 'docs-empty';
          empty.textContent = ui.emptySection || ui.none;
          frag.appendChild(empty);
        }
      });
    } else {
      const catDocs = (cat.documents || []).map(d => ({
        ...d,
        categoryId: cat.id,
        subcategoryId: null,
      }));
      if (!catDocs.length) {
        frag.appendChild(Object.assign(document.createElement('p'), {
          className: 'docs-empty',
          textContent: ui.emptySection || ui.none,
        }));
      } else {
        const { byGroup, ungrouped } = groupRelated(catDocs);
        const shown = new Set();
        byGroup.forEach(groupDocs => {
          groupDocs.forEach(d => {
            if (shown.has(d.id)) return;
            shown.add(d.id);
            frag.appendChild(renderDocCard(d, groupDocs.filter(x => x.id !== d.id)));
          });
        });
        ungrouped.forEach(d => {
          if (!shown.has(d.id)) frag.appendChild(renderDocCard(d));
        });
      }
    }

    panel.appendChild(frag);
  }

  function render() {
    renderPrimaryNav();
    const cat = getCategory(activeCategory);
    if (searchTerm.trim()) {
      subNav.hidden = true;
    } else {
      renderSubNav(cat);
    }
    renderList();
  }

  container.querySelector('#doc-search-comp')?.addEventListener('search', e => {
    searchTerm = e.detail;
    render();
  });

  render();
}
