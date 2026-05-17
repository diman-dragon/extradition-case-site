import { escapeHtml, safeUrl } from '../../security.js';
import { resolveDocMeta } from '../../utils/resolve-i18n.js';
import { buildFileUrl, fileTypeBadge, getFileType } from './catalog.js';

export function createDocumentCard({
  docRow,
  i18n,
  lang,
  ui,
  related = [],
  langLabel,
  onPreview,
  onRelatedNavigate,
}) {
  const meta = resolveDocMeta(i18n, docRow.title_i18n_key);
  const fileUrl = buildFileUrl(docRow.categoryId, docRow.subcategoryId, docRow.filename);
  const type = getFileType(docRow.filename);
  const typeLbl = fileTypeBadge(type, ui);

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
      <div class="docs-card__copy">
        <strong class="docs-card__title">${escapeHtml(meta.title)}</strong>
        ${meta.desc ? `<p class="docs-card__desc">${escapeHtml(meta.desc)}</p>` : ''}
      </div>
      <div class="docs-card__actions">
        <button type="button" class="docs-card__btn docs-card__btn--primary doc-preview-btn">${escapeHtml(ui.preview)}</button>
        <a href="${safeUrl(fileUrl)}" download="${escapeHtml(docRow.filename)}" class="docs-card__btn docs-card__btn--secondary">↓ ${escapeHtml(ui.download)}</a>
      </div>
    </div>
  `;

  if (related.length) {
    const rel = document.createElement('div');
    rel.className = 'docs-related';
    rel.innerHTML = `<strong>${escapeHtml(ui.related || 'Related')}:</strong> ` +
      related.map((item) => {
        const itemMeta = resolveDocMeta(i18n, item.title_i18n_key);
        return `<a href="#" data-related-id="${escapeHtml(item.id)}">${escapeHtml(itemMeta.title)}</a>`;
      }).join(' · ');
    card.appendChild(rel);
    rel.querySelectorAll('[data-related-id]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        onRelatedNavigate(link.dataset.relatedId);
      });
    });
  }

  card.querySelector('.doc-preview-btn')?.addEventListener('click', () => onPreview(docRow, meta, type));
  return card;
}
