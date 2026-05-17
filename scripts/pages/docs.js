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

function getSectionStats(lang, totalDocs, totalCategories, totalLanguages) {
  return [
    {
      value: totalDocs,
      label: lang === 'ru' ? 'документов' : lang === 'sr' ? 'dokumenata' : 'documents',
    },
    {
      value: totalCategories,
      label: lang === 'ru' ? 'разделов' : lang === 'sr' ? 'celina' : 'sections',
    },
    {
      value: totalLanguages,
      label: lang === 'ru' ? 'языка' : lang === 'sr' ? 'jezika' : 'languages',
    },
  ];
}

function renderStats(target, stats) {
  const wrap = document.createElement('div');
  wrap.className = 'docs-page__stats';
  wrap.innerHTML = stats.map((item) => `
    <div class="docs-page__stat">
      <strong>${escapeHtml(String(item.value))}</strong>
      <span>${escapeHtml(item.label)}</span>
    </div>
  `).join('');
  target.appendChild(wrap);
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
  const allDocs = flattenCatalog(catalog);
  const aside = getPageAside('docs', lang);
  const preview = createDocumentPreview({ ui });
  container._docsPreview = preview;

  let activeCategory = catalog.categories[0]?.id || '';
  let activeSub = null;
  let searchTerm = '';

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
    title: lang === 'ru' ? 'Разделы, версии и переводы сведены в один рабочий каталог' : lang === 'sr' ? 'Celine, verzije i prevodi objedinjeni su u jedan radni katalog' : 'Sections, versions, and translations are gathered into one working catalog',
    text: lang === 'ru' ? 'Сначала выберите тему слева, затем уточните подраздел или используйте поиск по названиям и описаниям.' : lang === 'sr' ? 'Prvo izaberite temu levo, zatim pododeljak ili pretragu po naslovu i opisu.' : 'Start with the topic on the left, then narrow by sub-section or search by title and description.',
  }));

  renderStats(after, getSectionStats(
    lang,
    allDocs.length,
    catalog.categories.length,
    new Set(allDocs.map((doc) => doc.language).filter(Boolean)).size,
  ));

  body.innerHTML += `
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
  `;

  const primaryNav = body.querySelector('#docs-primary-nav');
  const subNav = body.querySelector('#docs-subnav');
  const panel = body.querySelector('#docs-panel');

  function langLabel(code) {
    return (i18n.lang_labels && i18n.lang_labels[code]) || code.toUpperCase();
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

  function appendCards(fragment, docs) {
    const { byGroup, ungrouped } = groupRelatedDocs(docs, i18n);
    const shown = new Set();

    byGroup.forEach((groupDocs) => {
      groupDocs.forEach((doc) => {
        if (shown.has(doc.id)) return;
        shown.add(doc.id);
        fragment.appendChild(createDocumentCard({
          docRow: doc,
          i18n,
          lang,
          ui,
          related: groupDocs.filter((item) => item.id !== doc.id),
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
    });

    ungrouped.forEach((doc) => {
      if (shown.has(doc.id)) return;
      fragment.appendChild(createDocumentCard({
        docRow: doc,
        i18n,
        lang,
        ui,
        langLabel,
        onPreview: preview.openPreview,
        onRelatedNavigate: () => {},
      }));
    });
  }

  function renderSearchResults() {
    const term = searchTerm.trim().toLowerCase();
    const docs = allDocs.filter((doc) => {
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

    if (cat.subcategories?.length) {
      const subs = activeSub ? cat.subcategories.filter((sub) => sub.id === activeSub) : cat.subcategories;
      subs.forEach((sub) => {
        const subLabel = resolveI18n(i18n, sub.title_i18n_key);
        const heading = document.createElement('h3');
        heading.className = 'docs-group__title';
        heading.textContent = typeof subLabel === 'string' ? subLabel : subLabel?.title || sub.id;
        frag.appendChild(heading);

        const docs = (sub.documents || []).map((doc) => ({
          ...doc,
          categoryId: cat.id,
          subcategoryId: sub.id,
        }));

        if (!docs.length) {
          const empty = document.createElement('p');
          empty.className = 'docs-empty';
          empty.textContent = ui.emptySection || ui.none;
          frag.appendChild(empty);
          return;
        }

        appendCards(frag, docs);
      });
    } else {
      const docs = (cat.documents || []).map((doc) => ({
        ...doc,
        categoryId: cat.id,
        subcategoryId: null,
      }));

      if (!docs.length) {
        const empty = document.createElement('p');
        empty.className = 'docs-empty';
        empty.textContent = ui.emptySection || ui.none;
        frag.appendChild(empty);
      } else {
        appendCards(frag, docs);
      }
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

  body.querySelector('#doc-search-comp')?.addEventListener('search', (e) => {
    searchTerm = e.detail;
    render();
  });

  render();
}
