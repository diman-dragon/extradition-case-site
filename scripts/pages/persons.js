import { store } from '../store.js';
import { sanitizeRichText } from '../security.js';
import { createPageShell, appendPageSummary } from '../components/page-shell.js';
import { getPageAside } from '../components/page-asides.js';
import { createRecordRow, createSectionHeading, createStatsGrid, splitRichText } from '../components/record-layout.js';

export async function renderPersonsPage(container) {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/persons/${lang}.json`);
  if (!response.ok) response = await fetch('./scripts/data/i18n/persons/ru.json');
  const t = await response.json();
  const aside = getPageAside('persons', lang);

  const { body, after } = createPageShell(container, {
    pageClass: 'flagrant-page',
    badge: lang === 'ru' ? 'Действующие лица' : lang === 'sr' ? 'Učesnici' : 'Actors',
    title: t.title,
    subtitle: t.subtitle,
    intro: t.intro,
    asideLabel: aside.label,
    asideText: aside.text,
  });

  if (t.stats?.length) {
    body.appendChild(createStatsGrid(t.stats));
  }

  body.appendChild(createSectionHeading({
    kicker: lang === 'ru' ? 'Контуры' : lang === 'sr' ? 'Konture' : 'Contours',
    title: t.clusters.title,
  }));

  const clusterList = document.createElement('section');
  t.clusters.items.forEach((item, index) => {
    clusterList.appendChild(createRecordRow({
      eyebrow: lang === 'ru' ? `Контур ${index + 1}` : lang === 'sr' ? `Kontura ${index + 1}` : `Contour ${index + 1}`,
      status: item.label,
      title: item.title,
      tone: item.tone || 'default',
      bodyHtml: `<p>${sanitizeRichText(item.desc)}</p>`,
    }));
  });
  body.appendChild(clusterList);

  body.appendChild(createSectionHeading({
    kicker: lang === 'ru' ? 'Фигуранты' : lang === 'sr' ? 'Akteri' : 'Actors',
    title: t.profiles.title,
  }));

  const profileList = document.createElement('section');
  t.profiles.items.forEach((item, index) => {
    profileList.appendChild(createRecordRow({
      eyebrow: lang === 'ru' ? `Фигура ${index + 1}` : lang === 'sr' ? `Akter ${index + 1}` : `Actor ${index + 1}`,
      status: t.labels?.role ?? 'Role',
      title: item.name,
      tone: item.tone || 'danger',
      bodyHtml: `
        <div class="record-focus"><span class="record-focus__label">${t.labels?.role ?? 'Role'}</span>${splitRichText(item.role)}</div>
        <div class="record-focus"><span class="record-focus__label">${t.labels?.doc ?? 'Document'}</span>${splitRichText(item.doc)}</div>
        <div class="record-focus"><span class="record-focus__label">${t.labels?.action ?? 'Action'}</span>${splitRichText(item.action)}</div>
      `,
    }));
  });
  body.appendChild(profileList);

  appendPageSummary(after, t.summary, 'danger');
}
