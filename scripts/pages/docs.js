import { store } from '../store.js';
import { escapeHtml, safeUrl } from '../security.js';

// Detect file type from extension
function getFileType(filename) {
  if (!filename) return 'unknown';
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'word';
  return 'unknown';
}

// Label for file type badge
function fileTypeBadge(type, lang) {
  const labels = {
    pdf:  { ru: 'PDF',  en: 'PDF',  sr: 'PDF'  },
    word: { ru: 'Word', en: 'Word', sr: 'Word' },
  };
  return labels[type]?.[lang] ?? labels[type]?.en ?? '';
}

export async function renderDocumentsPage(container) {
  const lang = store.state.lang;

  let response = await fetch(`./scripts/data/i18n/docs/${lang}.json`);
  if (!response.ok) response = await fetch(`./scripts/data/i18n/docs/ru.json`);
  const t = await response.json();

  let navResp = await fetch(`./scripts/data/i18n/nav/${lang}.json`);
  if (!navResp.ok) navResp = await fetch('./scripts/data/i18n/nav/ru.json');
  const nav = await navResp.json();

  const i18n = {
    filter:   { ru: 'Фильтр и поиск', en: 'Filter & Search', sr: 'Filter i pretraga' }[lang] || 'Filter',
    none:     { ru: 'Ничего не найдено', en: 'No results found', sr: 'Nema rezultata' }[lang] || 'No results',
    preview:  { ru: 'Предпросмотр', en: 'Preview', sr: 'Pregled' }[lang] || 'Preview',
    download: { ru: 'Скачать', en: 'Download', sr: 'Preuzmi' }[lang] || 'Download',
    close:    { ru: 'Закрыть', en: 'Close', sr: 'Zatvori' }[lang] || 'Close',
    openNew:  { ru: 'Открыть в новой вкладке', en: 'Open in new tab', sr: 'Otvori u novom tabu' }[lang] || 'Open',
    wordNote: { ru: 'Предпросмотр недоступен для файлов Word. Скачайте документ, чтобы открыть его.', en: 'Preview is not available for Word files. Download the document to open it.', sr: 'Pregled nije dostupan za Word datoteke. Preuzmite dokument da biste ga otvorili.' }[lang] || 'Preview unavailable.',
  };

  container.innerHTML = `
    <div class="page">
      <h2>${escapeHtml(t.title)}</h2>
      <p>${escapeHtml(t.subtitle)}</p>

      <div class="ui-card" style="margin-bottom:1.5rem; padding:1rem 1.25rem;">
        <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
          <site-search id="doc-search-comp"
            placeholder="${escapeHtml(nav.search || '')}"
            style="flex-grow:1; min-width:180px;"></site-search>
          <select id="doc-filter"
            style="padding:0.5rem 0.75rem; background:var(--surface); border:1px solid var(--border);
                   color:var(--text); border-radius:var(--radius-sm); font-size:var(--text-sm);">
            ${Object.entries(t.categories).map(([id, label]) =>
              `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`
            ).join('')}
          </select>
        </div>
      </div>

      <div id="docs-list" class="ui-card" style="padding:0.5rem 0;"></div>

      <div id="doc-preview-overlay" style="
        display:none; position:fixed; inset:0; z-index:9000;
        background:rgba(0,0,0,0.72); backdrop-filter:blur(4px);
        align-items:center; justify-content:center; padding:1rem;">
        <div style="
          background:var(--surface); border:1px solid var(--border);
          border-radius:var(--radius); width:min(96vw,1000px); max-height:90vh;
          display:flex; flex-direction:column; overflow:hidden; box-shadow:var(--shadow);">
          <div style="
            display:flex; align-items:center; justify-content:space-between;
            padding:1rem 1.25rem; border-bottom:1px solid var(--border);
            gap:1rem; flex-shrink:0;">
            <div style="display:flex; align-items:center; gap:0.75rem; min-width:0;">
              <span id="preview-type-badge" style="
                font-size:var(--text-xs); font-weight:700; letter-spacing:0.05em;
                background:var(--accent); color:var(--accent-soft);
                padding:0.2rem 0.6rem; border-radius:999px; flex-shrink:0;"></span>
              <strong id="preview-title" style="
                font-size:var(--text-base); overflow:hidden;
                text-overflow:ellipsis; white-space:nowrap;"></strong>
            </div>
            <div style="display:flex; gap:0.5rem; flex-shrink:0;">
              <a id="preview-download-btn" href="#" download style="
                display:inline-flex; align-items:center; gap:0.35rem;
                padding:0.45rem 0.9rem; border-radius:999px; font-size:var(--text-sm);
                border:1px solid var(--border); background:var(--surface-strong);
                color:var(--text); text-decoration:none;">
                ↓ ${escapeHtml(i18n.download)}
              </a>
              <button id="preview-close-btn" style="
                padding:0.45rem 0.9rem; border-radius:999px; font-size:var(--text-sm);
                border:1px solid var(--border); background:var(--surface-strong);
                color:var(--text); cursor:pointer;">
                ${escapeHtml(i18n.close)} ✕
              </button>
            </div>
          </div>
          <div id="preview-body" style="flex:1; overflow:hidden; min-height:0;"></div>
        </div>
      </div>
    </div>
  `;

  const list           = container.querySelector('#docs-list');
  const overlay        = container.querySelector('#doc-preview-overlay');
  const previewTitle   = container.querySelector('#preview-title');
  const previewBadge   = container.querySelector('#preview-type-badge');
  const previewDlBtn   = container.querySelector('#preview-download-btn');
  const previewBody    = container.querySelector('#preview-body');
  const previewCloseBtn = container.querySelector('#preview-close-btn');

  function openPreview(doc) {
    const type    = getFileType(doc.file);
    const fileUrl = `./files/${doc.file}`;

    previewTitle.textContent = doc.title;
    previewBadge.textContent = fileTypeBadge(type, lang);
    previewDlBtn.href        = fileUrl;
    previewDlBtn.setAttribute('download', doc.file);

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (type === 'pdf') {
      // <embed> is the most reliable cross-browser PDF viewer tag
      // Server must send Content-Disposition: inline (fixed in server.mjs)
      previewBody.innerHTML = `
        <embed
          src="${safeUrl(fileUrl)}"
          type="application/pdf"
          style="width:100%; height:100%; min-height:60vh; border:none; display:block;">`;

    } else if (type === 'word') {
      const isLocalhost = /^https?:\/\/(localhost|127\.|0\.0\.0\.)/.test(window.location.origin);
      if (!isLocalhost) {
        const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
        const absUrl = window.location.origin + basePath + '/files/' + encodeURIComponent(doc.file);
        const officeUrl = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(absUrl);
        previewBody.innerHTML = `
          <iframe src="${officeUrl}"
            style="width:100%;height:100%;min-height:60vh;border:none;display:block;"
            title="${escapeHtml(doc.title)}"></iframe>`;
      } else {
        previewBody.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
               padding:2.5rem 2rem;gap:1.25rem;text-align:center;color:var(--text-muted);">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="var(--surface-strong)"/>
              <path d="M12 9h15l9 9v22a2 2 0 01-2 2H12a2 2 0 01-2-2V11a2 2 0 012-2z"
                    fill="none" stroke="var(--accent)" stroke-width="1.5"/>
              <path d="M27 9v9h9" stroke="var(--accent)" stroke-width="1.5" fill="none"/>
              <text x="24" y="33" text-anchor="middle" font-family="system-ui"
                    font-size="9" font-weight="700" fill="var(--accent)">DOCX</text>
            </svg>
            <p style="margin:0;font-size:var(--text-sm);max-width:360px;line-height:1.6;">
              ${escapeHtml(i18n.wordNote)}
            </p>
            <a href="${safeUrl(fileUrl)}" download="${escapeHtml(doc.file)}"
               style="padding:0.65rem 1.25rem;border-radius:999px;font-size:var(--text-sm);
                      background:var(--accent);color:var(--accent-soft);text-decoration:none;font-weight:600;">
              ↓ ${escapeHtml(i18n.download)}
            </a>
          </div>`;
      }

    } else {
      previewBody.innerHTML = `
        <div style="padding:2rem;color:var(--text-muted);text-align:center;">
          <a href="${safeUrl(fileUrl)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(i18n.openNew)} ↗
          </a>
        </div>`;
    }
  }

  function closePreview() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    previewBody.innerHTML = '';
    // Revoke blob URL if one was created for PDF preview
    if (overlay._blobUrl) {
      URL.revokeObjectURL(overlay._blobUrl);
      overlay._blobUrl = null;
    }
  }

  previewCloseBtn.addEventListener('click', closePreview);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePreview(); });

  function escListener(e) {
    if (e.key === 'Escape') {
      closePreview();
      document.removeEventListener('keydown', escListener);
    }
  }
  document.addEventListener('keydown', escListener);

  // ── Render list ─────────────────────────────────────────────────
  const renderList = (filter = 'all', search = '') => {
    const filtered = t.documents.filter(d =>
      (filter === 'all' || d.category === filter) &&
      (d.title.toLowerCase().includes(search.toLowerCase()) ||
       (d.desc || '').toLowerCase().includes(search.toLowerCase()))
    );

    if (filtered.length === 0) {
      list.innerHTML = `<p style="color:var(--text-muted);padding:1rem;">${escapeHtml(i18n.none)}</p>`;
      return;
    }

    list.innerHTML = '';

    filtered.forEach((d, idx) => {
      const hasFile  = !!d.file;
      const type     = hasFile ? getFileType(d.file) : 'unknown';
      const fileUrl  = hasFile ? `./files/${d.file}` : '#';
      const typeLbl  = hasFile ? fileTypeBadge(type, lang) : '';
      const isLast   = idx === filtered.length - 1;

      const row = document.createElement('div');
      row.style.cssText = `padding:0.9rem 1.25rem;${isLast ? '' : 'border-bottom:1px solid var(--border);'}`;

      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem; flex-wrap:wrap;">
          ${d.highlight ? `<span style="
            font-size:var(--text-xs); background:var(--accent); color:var(--accent-soft);
            padding:0.15rem 0.55rem; border-radius:999px; font-weight:700;">
            ${escapeHtml(d.highlight_label)}
          </span>` : ''}
          ${typeLbl ? `<span style="
            font-size:var(--text-xs); background:var(--surface-strong);
            border:1px solid var(--border); color:var(--text-muted);
            padding:0.15rem 0.5rem; border-radius:999px;">
            ${escapeHtml(typeLbl)}
          </span>` : ''}
          <span style="color:var(--text-muted); font-size:var(--text-sm);">${escapeHtml(d.date)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem;">
          <div style="min-width:0;">
            <strong style="font-size:var(--text-base);">${escapeHtml(d.title)}</strong>
            ${d.desc ? `<p style="margin:0.3rem 0 0; font-size:var(--text-sm); color:var(--text-muted); line-height:1.55;">${escapeHtml(d.desc)}</p>` : ''}
          </div>
          <div style="display:flex; gap:0.5rem; flex-shrink:0; align-items:center; flex-wrap:wrap; justify-content:flex-end;">
            ${hasFile ? `
            <button class="doc-preview-btn" style="
              padding:0.45rem 0.9rem; border-radius:999px; font-size:var(--text-sm);
              background:var(--accent); color:var(--accent-soft);
              border:none; cursor:pointer; font-weight:600; white-space:nowrap;">
              ${escapeHtml(i18n.preview)}
            </button>
            <a href="${safeUrl(fileUrl)}" download="${escapeHtml(d.file)}" style="
              padding:0.45rem 0.9rem; border-radius:999px; font-size:var(--text-sm);
              border:1px solid var(--border); background:var(--surface-strong);
              color:var(--text); text-decoration:none; white-space:nowrap;">
              ↓ ${escapeHtml(i18n.download)}
            </a>` : ''}
          </div>
        </div>
      `;

      row.querySelector('.doc-preview-btn')?.addEventListener('click', () => openPreview(d));
      list.appendChild(row);
    });
  };

  container.querySelector('#doc-search-comp').addEventListener('search', (e) => {
    renderList(container.querySelector('#doc-filter').value, e.detail);
  });

  container.querySelector('#doc-filter').addEventListener('change', (e) => {
    const searchVal = container.querySelector('#doc-search-comp')
      ?.shadowRoot?.querySelector('input')?.value ?? '';
    renderList(e.target.value, searchVal);
  });

  renderList();
}
