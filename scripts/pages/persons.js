import { store } from '../store.js';
import { sanitizeRichText } from '../security.js';
import { createPageShell, appendPageSummary } from '../components/page-shell.js';
import { getPageAside } from '../components/page-asides.js';
import { createRecordRow, createSectionHeading, splitRichText } from '../components/record-layout.js';

function layerLabel(lang, index, kind) {
  if (lang === 'ru') return kind === 'network' ? `Контур ${index + 1}` : `Фигура ${index + 1}`;
  if (lang === 'sr') return kind === 'network' ? `Sloj ${index + 1}` : `Akter ${index + 1}`;
  return kind === 'network' ? `Layer ${index + 1}` : `Actor ${index + 1}`;
}

export async function renderPersonsPage(container) {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/persons/${lang}.json`);
  if (!response.ok) response = await fetch('./scripts/data/i18n/persons/ru.json');
  const t = await response.json();
  const aside = getPageAside('persons', lang);

  const { body, after } = createPageShell(container, {
    badge: lang === 'ru' ? 'Действующие лица' : lang === 'sr' ? 'Učesnici' : 'Actors',
    title: t.title,
    subtitle: t.subtitle,
    intro: t.intro,
    asideLabel: aside.label,
    asideText: aside.text,
  });

  body.appendChild(createSectionHeading({
    kicker: lang === 'ru' ? 'Слой 1' : lang === 'sr' ? 'Sloj 1' : 'Layer 1',
    title: t.layers.network.title,
  }));

  const networkList = document.createElement('section');
  t.layers.network.items.forEach((item, index) => {
    networkList.appendChild(createRecordRow({
      eyebrow: layerLabel(lang, index, 'network'),
      title: item.category,
      bodyHtml: `<p>${sanitizeRichText(item.desc)}</p>`,
    }));
  });
  body.appendChild(networkList);

  body.appendChild(createSectionHeading({
    kicker: lang === 'ru' ? 'Слой 2' : lang === 'sr' ? 'Sloj 2' : 'Layer 2',
    title: t.layers.analysis.title,
  }));

  const analysisList = document.createElement('section');
  t.layers.analysis.items.forEach((item, index) => {
    analysisList.appendChild(createRecordRow({
      eyebrow: layerLabel(lang, index, 'analysis'),
      status: t.labels?.role ?? 'Role',
      title: item.name,
      bodyHtml: `
        <div class="record-focus"><span class="record-focus__label">${t.labels?.role ?? 'Role'}</span>${splitRichText(item.role)}</div>
        <div class="record-focus"><span class="record-focus__label">${t.labels?.doc ?? 'Document'}</span>${splitRichText(item.doc)}</div>
        <div class="record-focus"><span class="record-focus__label">${t.labels?.action ?? 'Action'}</span>${splitRichText(item.action)}</div>
      `,
    }));
  });
  body.appendChild(analysisList);

  appendPageSummary(after, t.summary);
}
