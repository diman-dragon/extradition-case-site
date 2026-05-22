import { escapeHtml } from '../../security.js';

export function langLabelFactory(i18n) {
  return (code) => (i18n.lang_labels && i18n.lang_labels[code]) || code.toUpperCase();
}

export function createFilterSelect(id, label, options) {
  return `
    <label class="docs-filter-label" for="${escapeHtml(id)}">
      <span>${escapeHtml(label)}</span>
      <select id="${escapeHtml(id)}">
        ${options.map((option) => `
          <option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>
        `).join('')}
      </select>
    </label>
  `;
}

export function createSectionBrief(meta, ui) {
  if (!meta || typeof meta !== 'object') return null;

  const hasSubtitle = Boolean(meta.subtitle);
  const rows = [
    meta.contains ? [ui.sectionContains || 'What is in this block', meta.contains] : null,
    meta.proves ? [ui.sectionProves || 'What it helps show', meta.proves] : null,
    meta.purpose ? [ui.sectionPurpose || 'Why it matters', meta.purpose] : null,
  ].filter(Boolean);

  if (!hasSubtitle && rows.length === 0) return null;

  const brief = document.createElement('section');
  brief.className = 'docs-brief';
  brief.innerHTML = `
    ${meta.subtitle ? `<p class="docs-brief__lead">${escapeHtml(meta.subtitle)}</p>` : ''}
    ${rows.length ? `
      <div class="docs-brief__grid">
        ${rows.map(([label, text]) => `
          <div class="docs-brief__item">
            <span class="docs-brief__label">${escapeHtml(label)}</span>
            <p>${escapeHtml(text)}</p>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
  return brief;
}

export function getFilterOptions(ui) {
  return {
    types: [
      { value: 'all', label: ui.filterAll || 'All' },
      { value: 'request', label: ui.filterRequest || 'Request / appeal' },
      { value: 'response', label: ui.filterResponse || 'Response / refusal' },
      { value: 'decision', label: ui.filterDecision || 'Decision' },
      { value: 'evidence', label: ui.filterEvidence || 'Evidence' },
    ],
    institutions: [
      { value: 'all', label: ui.filterAll || 'All' },
      { value: 'court', label: ui.filterCourt || 'Court' },
      { value: 'prosecutor', label: ui.filterProsecutor || 'Prosecutor' },
      { value: 'mvd', label: ui.filterMvd || 'MVD / GSU' },
      { value: 'upch', label: ui.filterUpch || 'UPCH' },
      { value: 'fsb', label: ui.filterFsb || 'FSB' },
      { value: 'president-rf', label: ui.filterPresident || 'President RF' },
      { value: 'sovet-federatsii', label: ui.filterSenate || 'Senate' },
      { value: 'serbia', label: ui.filterSerbia || 'Serbia' },
      { value: 'europe', label: ui.filterEurope || 'Europe' },
      { value: 'asylum', label: ui.filterAsylum || 'Asylum' },
      { value: 'party', label: ui.filterParty || 'Serbian parties' },
      { value: 'interpol', label: ui.filterInterpol || 'Interpol' },
      { value: 'evidence', label: ui.filterEvidenceLabel || 'Evidence' },
      { value: 'complaints', label: ui.filterComplaints || 'Complaints' },
    ],
    variants: [
      { value: 'all', label: ui.filterAll || 'All' },
      { value: 'original', label: ui.filterOriginal || 'Original' },
      { value: 'translation', label: ui.filterTranslation || 'Translation' },
      { value: 'serbian', label: ui.filterSerbian || 'Serbian version' },
    ]
  };
}
