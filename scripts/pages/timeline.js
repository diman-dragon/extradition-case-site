import { store } from '../store.js';
import { createPageShell, appendPageSummary } from '../components/page-shell.js';
import { getPageAside } from '../components/page-asides.js';
import { createRecordRow, createSectionHeading, splitRichText } from '../components/record-layout.js';

export async function renderTimelinePage(container) {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/timeline/${lang}.json`);
  if (!response.ok) response = await fetch('./scripts/data/i18n/timeline/ru.json');
  const t = await response.json();
  const aside = getPageAside('timeline', lang);

  const { body, after } = createPageShell(container, {
    badge: lang === 'ru' ? 'Хронология' : lang === 'sr' ? 'Hronologija' : 'Timeline',
    title: t.title,
    subtitle: t.subtitle,
    intro: t.intro,
    asideLabel: aside.label,
    asideText: aside.text,
  });

  body.appendChild(createSectionHeading({
    kicker: lang === 'ru' ? 'Линия времени' : lang === 'sr' ? 'Vremenska linija' : 'Timeline',
    title: lang === 'ru' ? 'События в последовательности, в которой они произошли' : lang === 'sr' ? 'Događaji redom kojim su se odvijali' : 'Events in the order they unfolded',
  }));

  const list = document.createElement('section');
  t.events.forEach((event) => {
    const row = createRecordRow({
      eyebrow: event.date,
      title: event.title,
      bodyHtml: `<p>${splitRichText(event.text)}</p>`,
    });
    list.appendChild(row);
  });

  body.appendChild(list);
  appendPageSummary(after, t.summary);
}
