import { resolveDocMeta } from '../../utils/resolve-i18n.js';

export function getFileType(filename) {
  if (!filename) return 'unknown';
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'word';
  return 'unknown';
}

export function fileTypeBadge(type, ui) {
  const map = { pdf: ui.badgePdf, word: ui.badgeWord };
  return map[type] || '';
}

export function buildFileUrl(categoryId, subcategoryId, filename) {
  return subcategoryId
    ? `./files/${categoryId}/${subcategoryId}/${filename}`
    : `./files/${categoryId}/${filename}`;
}

export function flattenCatalog(catalog) {
  const rows = [];
  for (const cat of catalog.categories) {
    // Top-level documents (with or without subcategories)
    if (cat.documents) {
      for (const doc of cat.documents) {
        rows.push({
          categoryId: cat.id,
          subcategoryId: null,
          subcategoryKey: null,
          ...doc,
        });
      }
    }
    // Subcategory documents
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        for (const doc of sub.documents || []) {
          rows.push({
            categoryId: cat.id,
            subcategoryId: sub.id,
            subcategoryKey: sub.title_i18n_key,
            ...doc,
          });
        }
      }
    }
  }
  return rows;
}

export function groupRelatedDocs(docs, i18n) {
  const byGroup = new Map();
  const ungrouped = [];

  docs.forEach((doc) => {
    const meta = resolveDocMeta(i18n, doc.title_i18n_key);
    if (!meta.group) {
      ungrouped.push(doc);
      return;
    }
    if (!byGroup.has(meta.group)) byGroup.set(meta.group, []);
    byGroup.get(meta.group).push(doc);
  });

  return { byGroup, ungrouped };
}
