export function pick(obj, lang) {
  if (!obj || typeof obj !== 'object') {
    return '';
  }
  return obj[lang] ?? obj.ru ?? Object.values(obj)[0] ?? '';
}
