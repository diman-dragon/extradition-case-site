const template = document.createElement('template');
template.innerHTML = `
<style>
  .ui-card {
    display: block;
    background: var(--surface-strong);
    border: 1px solid var(--border);
    border-radius: 1.5rem;
    padding: 1.5rem;
    color: var(--text);
    transition: transform 0.2s ease, border-color 0.2s ease;
  }
  .ui-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
  .primary, .secondary {
    display: inline-block;
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.75rem 1rem;
    cursor: pointer;
    text-decoration: none;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }
  .primary {
    background: var(--accent);
    color: var(--accent-soft);
  }
  .secondary {
    background: var(--surface-strong);
    color: var(--text);
  }
  .primary:hover, .secondary:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
    filter: brightness(1.1);
  }
</style>
<article class="ui-card">
  <div class="ui-card__body">
    <p class="ui-card__type"></p>
    <h3 class="ui-card__title"></h3>
    <p class="ui-card__content"></p>
  </div>
</article>
`;

class UICard extends HTMLElement {
  constructor() {
    super();
    this.appendChild(template.content.cloneNode(true));
    this.data = null;
    this.lang = 'ru';
    this.term = '';
    this.titleEl = this.querySelector('.ui-card__title');
    this.typeEl = this.querySelector('.ui-card__type');
    this.contentEl = this.querySelector('.ui-card__content');
  }

  connectedCallback() {
    this.render();
  }

  setContent(data, lang = this.lang, term = this.term) {
    this.data = data;
    this.lang = lang;
    this.term = term;
    this.render();
  }

  render() {
    if (!this.data) {
      this.titleEl.textContent = '';
      this.typeEl.textContent = '';
      this.contentEl.innerHTML = '';
      return;
    }

    const title = this.data.title?.[this.lang] ?? this.data.title?.ru ?? '';
    const text = this.data.text?.[this.lang] ?? this.data.text?.ru ?? '';
    
    this.titleEl.textContent = title;
    this.typeEl.textContent = this.data.type?.toUpperCase() ?? '';
    this.contentEl.innerHTML = this.term ? `${text} (${this.term})` : text;
    
    this.classList.toggle('ui-card--feature', this.data.type === 'feature');
    this.classList.toggle('ui-card--highlight', this.data.type === 'highlight');
    this.classList.toggle('ui-card--entry', this.data.type === 'entry');
    this.classList.toggle('ui-card--news', this.data.type === 'news');
  }
}

customElements.define('ui-card', UICard);
