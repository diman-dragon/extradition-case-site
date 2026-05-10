export const Win11Button = (label, onClick, variant = '') => {
  const btn = document.createElement('button');
  btn.className = `win11-button ${variant ? `win11-button--${variant}` : ''}`;
  btn.innerText = label;
  btn.onclick = onClick;
  return btn;
};

export const Win11Card = (content) => {
  const card = document.createElement('div');
  card.className = 'win11-card';
  card.innerHTML = content;
  return card;
};

export const Win11Search = (placeholder, onInput) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'win11-search-wrapper';
  const input = document.createElement('input');
  input.className = 'win11-search';
  input.placeholder = placeholder;
  input.oninput = (e) => onInput(e.target.value);
  wrapper.appendChild(input);
  return wrapper;
};
