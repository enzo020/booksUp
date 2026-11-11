// Utilitários de interface. Todo conteúdo vindo da API entra no DOM como texto, nunca como HTML.

export const STATUSES = [
  { value: 'JOGANDO', label: 'Jogando' },
  { value: 'PRETENDO_JOGAR', label: 'Pretendo jogar' },
  { value: 'ZERADO', label: 'Zerado' },
  { value: 'ABANDONADO', label: 'Abandonado' },
];

export const statusLabel = (value) => STATUSES.find((status) => status.value === value)?.label ?? value;

export function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') element.className = value;
    else if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
    else if (key === 'value') element.value = value;
    else if (value === true) element.setAttribute(key, '');
    else element.setAttribute(key, value);
  }
  element.append(...children.flat().filter((child) => child !== null && child !== undefined && child !== false));
  return element;
}

const SVG = 'http://www.w3.org/2000/svg';

// O preenchimento do círculo mostra o estado: vazio, metade, cheio ou riscado.
export function ball(status) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'ball');
  svg.setAttribute('aria-hidden', 'true');
  const shape = (name, attrs) => {
    const node = document.createElementNS(SVG, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    svg.append(node);
  };
  shape('circle', { cx: 12, cy: 12, r: 9.5, fill: status === 'ZERADO' ? 'currentColor' : 'none', stroke: 'currentColor', 'stroke-width': 3 });
  if (status === 'JOGANDO') shape('path', { d: 'M12 2.5a9.5 9.5 0 0 1 0 19z', fill: 'currentColor' });
  if (status === 'ABANDONADO') shape('line', { x1: 5.5, y1: 18.5, x2: 18.5, y2: 5.5, stroke: 'currentColor', 'stroke-width': 3 });
  return svg;
}

const numberFormat = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
const fullDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatScore = (value) => (value === null || value === undefined ? '–' : numberFormat.format(value));
export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return (date.getFullYear() === new Date().getFullYear() ? shortDate : fullDate).format(date);
}
export const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

export function average(reviews) {
  const rated = reviews.filter((review) => review.rating !== null && review.rating !== undefined);
  return rated.length ? rated.reduce((sum, review) => sum + review.rating, 0) / rated.length : null;
}

export const normalize = (text) => (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

let toastTimer;
export function toast(message) {
  const element = document.getElementById('toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2800);
}

const sheet = () => document.getElementById('sheet');

export function closeSheet() {
  sheet().close();
}

export function openSheet(title, content) {
  const dialog = sheet();
  dialog.replaceChildren(
    h('div', { class: 'sheet-body' },
      h('div', { class: 'sheet-head' },
        h('h2', { id: 'sheet-title' }, title),
        h('button', { class: 'btn-text', type: 'button', onclick: closeSheet }, 'Fechar'),
      ),
      content,
    ),
  );
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('.form input:not([type="radio"]), .form select, .form textarea')?.focus();
}

export function confirmAction({ title, message, action }) {
  const dialog = document.getElementById('confirm');
  return new Promise((resolve) => {
    dialog.replaceChildren(
      h('h2', { id: 'confirm-title' }, title),
      h('p', {}, message),
      h('div', { class: 'actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => dialog.close('cancel') }, 'Cancelar'),
        h('button', { class: 'btn btn-solid', type: 'button', onclick: () => dialog.close('ok') }, action),
      ),
    );
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
    dialog.returnValue = '';
    dialog.showModal();
  });
}
