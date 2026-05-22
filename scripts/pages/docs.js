import { store } from '../store.js';
import { escapeHtml } from '../security.js';
import { createPageShell } from '../components/page-shell.js';
import { getPageAside } from '../components/page-asides.js';
import { createSectionHeading } from '../components/record-layout.js';
import { createDocumentCard } from '../components/docs/document-card.js';
import { createDocumentPreview } from '../components/docs/preview.js';
import { flattenCatalog, getFileType, groupRelatedDocs } from '../components/docs/catalog.js';
import { resolveDocMeta, resolveI18n } from '../utils/resolve-i18n.js';
import '../components/site-search.js';

function langLabelFactory(i18n) {
  return (code) => (i18n.lang_labels && i18n.lang_labels[code]) || code.toUpperCase();
}

function createFilterSelect(id, label, options) {
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

function createSectionBrief(meta, ui) {
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

export async function renderDocumentsPage(container) {
  const previousPreview = container._docsPreview;
  if (previousPreview?.destroy) previousPreview.destroy();

  const lang = store.state.lang;
  const [i18nResp, catalogResp, navResp] = await Promise.all([
    fetch(`./scripts/data/i18n/docs/${lang}.json`).then((r) => (r.ok ? r : fetch('./scripts/data/i18n/docs/ru.json'))),
    fetch('./scripts/data/documents.json'),
    fetch(`./scripts/data/i18n/nav/${lang}.json`).then((r) => (r.ok ? r : fetch('./scripts/data/i18n/nav/ru.json'))),
  ]);

  const i18n = await i18nResp.json();
  const catalog = await catalogResp.json();
  const nav = await navResp.json();
  const ui = i18n.ui || {};
  ui.__i18n = i18n;

  const allDocs = flattenCatalog(catalog, ui);
  const aside = getPageAside('docs', lang);
  const preview = createDocumentPreview({ ui });
  const langLabel = langLabelFactory(i18n);
  container._docsPreview = preview;

  let activeCategory = catalog.categories[0]?.id || '';
  let activeSub = null;
  let searchTerm = '';
  let activeType = 'all';
  let activeInstitution = 'all';
  let activeVariant = 'all';

  const { body, after } = createPageShell(container, {
    pageClass: 'docs-page',
    badge: lang === 'ru' ? 'Архив документов' : lang === 'sr' ? 'Arhiva dokumenata' : 'Document archive',
    title: i18n.title,
    subtitle: i18n.subtitle,
    asideLabel: aside.label,
    asideText: aside.text,
  });

  after.appendChild(createSectionHeading({
    kicker: lang === 'ru' ? 'Навигация по архиву' : lang === 'sr' ? 'Kretanje kroz arhivu' : 'Archive navigation',
    title: lang === 'ru'
      ? 'Документы сгруппированы по смыслу и процессу'
      : lang === 'sr'
        ? 'Dokumenti su složeni po smislu i toku postupka'
        : 'Documents are grouped by logic and procedural track',
    text: lang === 'ru'
      ? 'Сначала выберите раздел слева, затем уточните блок или воспользуйтесь поиском и фильтрами.'
      : lang === 'sr'
        ? 'Najpre izaberite odeljak levo, zatim suzite blok ili koristite pretragu i filtere.'
        : 'Start with a section on the left, then narrow to a block or use search and filters.',
  }));

  const typeOptions = [
    { value: 'all', label: ui.filterAll || 'All' },
    { value: 'request', label: ui.filterRequest || 'Request / appeal' },
    { value: 'response', label: ui.filterResponse || 'Response / refusal' },
    { value: 'decision', label: ui.filterDecision || 'Decision' },
    { value: 'evidence', label: ui.filterEvidence || 'Evidence' },
  ];

  const institutionOptions = [
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
  ];

  const variantOptions = [
    { value: 'all', label: ui.filterAll || 'All' },
    { value: 'original', label: ui.filterOriginal || 'Original' },
    { value: 'translation', label: ui.filterTranslation || 'Translation' },
    { value: 'serbian', label: ui.filterSerbian || 'Serbian version' },
  ];

  body.innerHTML += `
    <div class="docs-layout">
      <nav class="docs-nav" id="docs-primary-nav" aria-label="${escapeHtml(ui.navPrimary || 'Categories')}"></nav>
      <div class="docs-main">
        <div class="docs-toolbar">
          <div class="docs-search-card">
            <p class="docs-search-card__eyebrow">${escapeHtml(ui.searchTitle || 'Search the archive')}</p>
            <p class="docs-search-card__hint">${escapeHtml(ui.searchHint || '')}</p>
            <site-search id="doc-search-comp" placeholder="${escapeHtml(nav.search || ui.searchPlaceholder || '')}"></site-search>
          </div>
          <div class="docs-filters-card">
            <p class="docs-search-card__eyebrow">${escapeHtml(ui.filtersTitle || 'Filters')}</p>
            <p class="docs-search-card__hint">${escapeHtml(ui.filtersHint || '')}</p>
            <div class="docs-toolbar__filters">
              ${createFilterSelect('docs-type-filter', ui.filterType || 'Document type', typeOptions)}
              ${createFilterSelect('docs-institution-filter', ui.filterInstitution || 'Institution / track', institutionOptions)}
              ${createFilterSelect('docs-variant-filter', ui.filterVariant || 'Original / translation', variantOptions)}
            </div>
          </div>
        </div>
        <div class="docs-subnav" id="docs-subnav" hidden></div>
        <div class="docs-panel" id="docs-panel"></div>
      </div>
    </div>
  `;

  const primaryNav = body.querySelector('#docs-primary-nav');
  const subNav = body.querySelector('#docs-subnav');
  const panel = body.querySelector('#docs-panel');

  function filterDocuments(docs) {
    return docs.filter((doc) => {
      if (activeType !== 'all' && doc.type !== activeType) return false;
      if (activeInstitution !== 'all' && doc.source !== activeInstitution) return false;
      if (activeVariant !== 'all' && doc.variant !== activeVariant) return false;
      return true;
    });
  }

  function getCategory(catId) {
    return catalog.categories.find((cat) => cat.id === catId);
  }

  function renderPrimaryNav() {
    primaryNav.innerHTML = '';
    catalog.categories.forEach((cat) => {
      const label = resolveI18n(i18n, cat.title_i18n_key) || cat.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'docs-nav__btn';
      btn.dataset.cat = cat.id;
      btn.textContent = typeof label === 'string' ? label : label?.title || cat.id;
      btn.setAttribute('aria-current', cat.id === activeCategory ? 'true' : 'false');
      btn.addEventListener('click', () => {
        activeCategory = cat.id;
        activeSub = getCategory(cat.id)?.subcategories?.[0]?.id || null;
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
    if (!activeSub || !cat.subcategories.some((sub) => sub.id === activeSub)) {
      activeSub = cat.subcategories[0].id;
    }

    cat.subcategories.forEach((sub) => {
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

  function normalizeDate(date) {
    if (!date) return '0000-01-01';
    return date.length === 4 ? `${date}-01-01` : date;
  }

  function appendCards(fragment, docs) {
    const { byGroup, ungrouped } = groupRelatedDocs(docs, i18n);
    const variantOrder = { original: 0, translation: 1, serbian: 2 };
    const items = [];

    byGroup.forEach((groupDocs) => {
      const sorted = [...groupDocs].sort((a, b) => {
        const dateDiff = normalizeDate(resolveDocMeta(i18n, b.title_i18n_key).date)
          .localeCompare(normalizeDate(resolveDocMeta(i18n, a.title_i18n_key).date));
        if (dateDiff !== 0) return dateDiff;
        return variantOrder[a.variant || 'original'] - variantOrder[b.variant || 'original'];
      });
      const groupDate = normalizeDate(resolveDocMeta(i18n, sorted[0].title_i18n_key).date);
      const shown = new Set();
      items.push({
        sortDate: groupDate,
        variantRank: 0,
        render: () => {
          sorted.forEach((doc) => {
            if (shown.has(doc.id)) return;
            shown.add(doc.id);
            fragment.appendChild(createDocumentCard({
              docRow: doc,
              i18n,
              lang,
              ui,
              related: sorted.filter((item) => item.id !== doc.id),
              langLabel,
              onPreview: preview.openPreview,
              onRelatedNavigate: (id) => {
                const target = allDocs.find((item) => item.id === id);
                if (!target) return;
                activeCategory = target.categoryId;
                activeSub = target.subcategoryId;
                render();
                preview.openPreview(target, resolveDocMeta(i18n, target.title_i18n_key), getFileType(target.filename));
              },
            }));
          });
        },
      });
    });

    ungrouped.forEach((doc) => {
      const meta = resolveDocMeta(i18n, doc.title_i18n_key);
      items.push({
        sortDate: normalizeDate(meta.date),
        variantRank: variantOrder[doc.variant || 'original'] || 0,
        render: () => {
          fragment.appendChild(createDocumentCard({
            docRow: doc,
            i18n,
            lang,
            ui,
            langLabel,
            onPreview: preview.openPreview,
            onRelatedNavigate: () => {},
          }));
        },
      });
    });

    items.sort((a, b) => {
      const dateDiff = b.sortDate.localeCompare(a.sortDate);
      return dateDiff !== 0 ? dateDiff : a.variantRank - b.variantRank;
    });
    items.forEach((item) => item.render());
  }

  function renderSearchResults() {
    const term = searchTerm.trim().toLowerCase();
    const docs = filterDocuments(allDocs).filter((doc) => {
      const meta = resolveDocMeta(i18n, doc.title_i18n_key);
      return [meta.title, meta.desc, meta.date].join(' ').toLowerCase().includes(term);
    });

    if (!docs.length) {
      panel.innerHTML = `<p class="docs-empty">${escapeHtml(ui.none)}</p>`;
      return;
    }

    panel.innerHTML = '';
    const frag = document.createDocumentFragment();
    const resultHeader = document.createElement('p');
    resultHeader.className = 'docs-empty docs-empty--inline';
    resultHeader.textContent = ui.searchResults?.replace('{n}', docs.length) || `${docs.length}`;
    frag.appendChild(resultHeader);
    appendCards(frag, docs);
    panel.appendChild(frag);
  }

  function renderCategoryList(cat) {
    panel.innerHTML = '';
    const frag = document.createDocumentFragment();

    const catMeta = resolveI18n(i18n, cat.title_i18n_key);
    const catBrief = createSectionBrief(catMeta, ui);
    if (catBrief) frag.appendChild(catBrief);

    const topDocs = filterDocuments(allDocs.filter((doc) => doc.categoryId === cat.id && !doc.subcategoryId));
    if (topDocs.length) {
      appendCards(frag, topDocs);
    }

    if (cat.subcategories?.length) {
      const subs = activeSub ? cat.subcategories.filter((sub) => sub.id === activeSub) : cat.subcategories;
      subs.forEach((sub) => {
        const subMeta = resolveI18n(i18n, sub.title_i18n_key);
        const heading = document.createElement('h3');
        heading.className = 'docs-group__title';
        heading.textContent = typeof subMeta === 'string' ? subMeta : subMeta?.title || sub.id;
        frag.appendChild(heading);

        const subBrief = createSectionBrief(subMeta, ui);
        if (subBrief) frag.appendChild(subBrief);

        const docs = filterDocuments(allDocs.filter((doc) => doc.categoryId === cat.id && doc.subcategoryId === sub.id));
        if (!docs.length) {
          const empty = document.createElement('p');
          empty.className = 'docs-empty';
          empty.textContent = ui.emptySection || ui.none;
          frag.appendChild(empty);
          return;
        }

        appendCards(frag, docs);
      });
    } else if (!cat.documents?.length) {
      const empty = document.createElement('p');
      empty.className = 'docs-empty';
      empty.textContent = ui.emptySection || ui.none;
      frag.appendChild(empty);
    }

    panel.appendChild(frag);
  }

  function render() {
    renderPrimaryNav();

    if (searchTerm.trim()) {
      subNav.hidden = true;
      renderSearchResults();
      return;
    }

    const cat = getCategory(activeCategory);
    renderSubNav(cat);
    if (!cat) {
      panel.innerHTML = `<p class="docs-empty">${escapeHtml(ui.none)}</p>`;
      return;
    }

    renderCategoryList(cat);
  }

  body.querySelector('#doc-search-comp')?.addEventListener('search', (event) => {
    searchTerm = event.detail;
    render();
  });

  body.querySelector('#docs-type-filter')?.addEventListener('change', (event) => {
    activeType = event.target.value;
    render();
  });
  body.querySelector('#docs-institution-filter')?.addEventListener('change', (event) => {
    activeInstitution = event.target.value;
    render();
  });
  body.querySelector('#docs-variant-filter')?.addEventListener('change', (event) => {
    activeVariant = event.target.value;
    render();
  });

  render();
}
