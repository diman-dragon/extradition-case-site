import { store } from '../store.js';
import { escapeHtml } from '../security.js';

function tag(txt, color = '#c0392b') {
  return `<span style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;color:${color};background:${color}1a;border:1px solid ${color}44;padding:0.2rem 0.55rem;border-radius:999px;">${escapeHtml(txt)}</span>`;
}

function sectionTitle(txt) {
  return `<h3 style="margin:0 0 0.9rem;font-size:var(--text-lg);">${escapeHtml(txt)}</h3>`;
}

/**
 * Dispatch a navigate event to site-header (the component that app.js listens on).
 * container.dispatchEvent does NOT reach site-header because app.js binds the listener
 * to header, not to the container element.
 */
function navigateTo(pageId) {
  const header = document.querySelector('site-header');
  if (header) {
    header.dispatchEvent(new CustomEvent('navigate', {
      detail: pageId,
      bubbles: true,
      composed: true,
    }));
  }
}

export async function renderFlagrantPage(container) {
  const lang = store.state.lang;
  let response = await fetch(`./scripts/data/i18n/flagrant/${lang}.json`);
  if (!response.ok) response = await fetch('./scripts/data/i18n/flagrant/ru.json');
  const t = await response.json();

  const el = txt => escapeHtml(txt || '');

  container.innerHTML = `<div class="page" id="flagrant-root"></div>`;
  const root = container.querySelector('#flagrant-root');

  // ── Header ──────────────────────────────────────────────
  const header = document.createElement('div');
  header.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.75rem;">
      ${tag(t.badge)}
    </div>
    <h2 style="margin-top:0;">${el(t.title)}</h2>
    <p style="font-size:var(--text-lg);font-weight:600;line-height:1.5;">${el(t.subtitle)}</p>
    <p style="font-size:var(--text-md);color:var(--text-muted);line-height:1.7;">${el(t.intro)}</p>
  `;
  root.appendChild(header);

  // ── Stats ────────────────────────────────────────────────
  if (t.stats?.length) {
    const statsGrid = document.createElement('div');
    statsGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:0.75rem;margin:1.5rem 0 2rem;';
    t.stats.forEach(s => {
      const card = document.createElement('div');
      card.style.cssText = 'background:var(--surface-strong);border:1px solid var(--border);border-radius:8px;padding:1rem 1.25rem;text-align:center;';
      card.innerHTML = `
        <div style="font-size:var(--text-3xl);font-weight:800;color:#c0392b;line-height:1;">${el(s.value)}</div>
        <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:0.4rem;line-height:1.35;">${el(s.label)}</div>
      `;
      statsGrid.appendChild(card);
    });
    root.appendChild(statsGrid);
  }

  root.appendChild(Object.assign(document.createElement('hr'), {
    style: 'border:0;border-top:1px solid var(--border);margin:0 0 2rem;'
  }));

  // ── ECHR Block ──────────────────────────────────────────
  if (t.echr_block) {
    const echrWrap = document.createElement('div');
    echrWrap.style.cssText = 'background:var(--surface-strong);border:1px solid var(--border);border-left:4px solid var(--accent);border-radius:8px;padding:1.5rem;margin-bottom:2rem;';
    echrWrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
        <span style="font-size:1.2rem;">⚖️</span>
        ${sectionTitle(t.echr_block.title)}
      </div>
    `;
    const parasWrap = document.createElement('div');
    parasWrap.style.cssText = 'display:flex;flex-direction:column;gap:0.75rem;';
    (t.echr_block.paras || []).forEach(p => {
      const para = document.createElement('p');
      para.style.cssText = 'margin:0;line-height:1.7;font-size:var(--text-sm);';
      para.textContent = p;
      parasWrap.appendChild(para);
    });
    echrWrap.appendChild(parasWrap);
    root.appendChild(echrWrap);
  }

  // ── Pattern title + docs CTA ─────────────────────────────
  if (t.pattern_title) {
    const pt = document.createElement('div');
    pt.style.cssText = 'margin-bottom:1.25rem;';
    pt.innerHTML = `
      ${sectionTitle(t.pattern_title)}
      <p style="margin:0;color:var(--text-muted);font-size:var(--text-sm);line-height:1.65;">${el(t.pattern_desc)}</p>
    `;
    root.appendChild(pt);
  }

  // Docs CTA
  let ctaBtn = null;
  if (t.docs_cta) {
    const cta = document.createElement('div');
    cta.style.cssText = 'background:var(--surface-strong);border:1px solid rgba(192,57,43,0.3);border-left:4px solid #c0392b;border-radius:8px;padding:1.1rem 1.4rem;margin-bottom:2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;';
    cta.innerHTML = `
      <div>
        <div style="font-weight:700;font-size:var(--text-sm);">${el(t.docs_cta.title)}</div>
        <div style="color:var(--text-muted);font-size:var(--text-xs);margin-top:0.2rem;">${el(t.docs_cta.desc)}</div>
      </div>
    `;
    ctaBtn = document.createElement('button');
    ctaBtn.type = 'button';
    ctaBtn.id = 'go-to-denials-btn';
    ctaBtn.style.cssText = 'white-space:nowrap;background:#c0392b;color:#fff;border:none;border-radius:6px;padding:0.55rem 1.1rem;font:inherit;font-weight:600;cursor:pointer;font-size:var(--text-xs);';
    ctaBtn.textContent = `${t.docs_cta.btn} →`;
    cta.appendChild(ctaBtn);
    root.appendChild(cta);
  }

  // ── Episodes ─────────────────────────────────────────────
  const epList = document.createElement('div');
  epList.style.cssText = 'display:flex;flex-direction:column;gap:1.5rem;margin-bottom:2.5rem;';

  (t.episodes || []).forEach((ep) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'border:1px solid var(--border);border-radius:8px;overflow:hidden;';

    const hd = document.createElement('div');
    hd.style.cssText = 'background:var(--surface-strong);padding:0.75rem 1rem;display:flex;align-items:flex-start;gap:0.5rem;flex-wrap:wrap;border-bottom:1px solid var(--border);';
    hd.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:0.4rem;align-items:center;width:100%;">
        <span style="font-size:0.75rem;font-weight:700;background:rgba(192,57,43,0.1);color:#c0392b;border:1px solid rgba(192,57,43,0.25);padding:0.15rem 0.5rem;border-radius:999px;">${el(ep.tag)}</span>
        <strong style="font-size:var(--text-sm);line-height:1.45;">${el(ep.title)}</strong>
      </div>
    `;
    wrap.appendChild(hd);

    const bd = document.createElement('div');
    bd.style.cssText = 'padding:1rem;display:flex;flex-direction:column;gap:0.85rem;';

    const what = document.createElement('p');
    what.style.cssText = 'margin:0;line-height:1.7;font-size:var(--text-sm);';
    what.textContent = ep.what_happened;
    bd.appendChild(what);

    if (ep.quote) {
      const bq = document.createElement('blockquote');
      bq.style.cssText = 'margin:0;padding:0.85rem 1.1rem;border-left:4px solid #c0392b;background:rgba(192,57,43,0.05);font-style:italic;line-height:1.7;border-radius:0 6px 6px 0;font-size:var(--text-sm);';
      const lbl = document.createElement('strong');
      lbl.style.cssText = 'display:block;margin-bottom:0.3rem;font-style:normal;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;color:#c0392b;';
      lbl.textContent = t.labels?.quote || '';
      bq.appendChild(lbl);
      bq.appendChild(document.createTextNode(ep.quote));
      bd.appendChild(bq);
    }

    if (ep.why_flagrant) {
      const why = document.createElement('div');
      why.style.cssText = 'background:var(--surface-strong);padding:0.85rem 1rem;border-left:3px solid var(--accent);border-radius:0 6px 6px 0;font-size:var(--text-sm);line-height:1.65;';
      const lbl = document.createElement('strong');
      lbl.style.cssText = 'font-size:0.7rem;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-muted);display:block;margin-bottom:0.4rem;';
      lbl.textContent = t.labels?.why_flagrant || '';
      why.appendChild(lbl);
      why.appendChild(document.createTextNode(ep.why_flagrant));
      bd.appendChild(why);
    }

    if (ep.violations?.length) {
      const tags = document.createElement('div');
      tags.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.35rem;';
      ep.violations.forEach(v => {
        const s = document.createElement('span');
        s.style.cssText = 'font-size:0.72rem;background:rgba(192,57,43,0.09);color:#c0392b;border:1px solid rgba(192,57,43,0.22);padding:0.15rem 0.45rem;border-radius:999px;';
        s.textContent = v;
        tags.appendChild(s);
      });
      bd.appendChild(tags);
    }

    if (ep.echr_refs?.length) {
      const refs = document.createElement('div');
      refs.style.cssText = 'font-size:0.72rem;color:var(--text-muted);line-height:1.6;';
      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-weight:700;text-transform:uppercase;letter-spacing:0.07em;font-size:0.67rem;margin-right:0.4rem;';
      lbl.textContent = (t.labels?.echr_refs || 'ECHR') + ':';
      refs.appendChild(lbl);
      refs.appendChild(document.createTextNode(ep.echr_refs.join(' · ')));
      bd.appendChild(refs);
    }

    wrap.appendChild(bd);
    epList.appendChild(wrap);
  });

  root.appendChild(epList);

  // ── Conclusion ───────────────────────────────────────────
  if (t.conclusion_title) {
    const conclWrap = document.createElement('div');
    conclWrap.style.cssText = 'background:var(--surface-strong);border:1px solid var(--border);border-radius:8px;padding:1.5rem;margin-bottom:2rem;';
    conclWrap.innerHTML = sectionTitle(t.conclusion_title);
    (t.conclusion_paras || []).forEach(p => {
      const para = document.createElement('p');
      para.style.cssText = 'margin:0 0 0.75rem;line-height:1.75;font-size:var(--text-sm);';
      para.textContent = p;
      conclWrap.appendChild(para);
    });
    root.appendChild(conclWrap);
  }

  // ── Summary callout ──────────────────────────────────────
  const summ = document.createElement('div');
  summ.style.cssText = 'background:rgba(192,57,43,0.07);border:1px solid rgba(192,57,43,0.3);border-left:4px solid #c0392b;border-radius:8px;padding:1.25rem 1.5rem;';
  const summTxt = document.createElement('p');
  summTxt.style.cssText = 'margin:0;font-style:italic;line-height:1.75;font-size:var(--text-sm);';
  summTxt.textContent = t.summary;
  summ.appendChild(summTxt);
  root.appendChild(summ);

  // ── Navigate to docs ─────────────────────────────────────
  // FIX: must dispatch on site-header, not container.
  // app.js binds the 'navigate' listener on header, not on the container element.
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      navigateTo('docs');
      // After navigation renders docs page, try to activate the 'otkazy' category tab
      setTimeout(() => {
        const btns = [...document.querySelectorAll('.docs-nav__btn')];
        const otkazy = btns.find(b =>
          b.textContent.toLowerCase().includes('отказ') ||
          b.textContent.toLowerCase().includes('refusal') ||
          b.textContent.toLowerCase().includes('odbijan') ||
          (b.dataset && b.dataset.cat === 'otkazy')
        );
        if (otkazy) otkazy.click();
      }, 400);
    });
  }
}
