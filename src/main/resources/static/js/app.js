import { api, ApiError } from './api.js';
import {
  STATUSES, statusLabel, h, ball, formatScore, formatDate, plural, average, normalize,
  toast, openSheet, closeSheet, confirmAction,
} from './ui.js';

const main = document.getElementById('conteudo');
const state = { users: [], games: [], reviews: [] };
const filters = { status: 'TODOS', userId: '', query: '' };
const catalog = { games: '', users: '' };

/* ---------- Dados ---------- */

async function loadData() {
  const [users, games, reviews] = await Promise.all([api.users.list(), api.games.list(), api.reviews.list()]);
  state.users = users.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  state.games = games.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  state.reviews = reviews.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

const reviewsOfGame = (id) => state.reviews.filter((review) => review.gameId === id);
const reviewsOfUser = (id) => state.reviews.filter((review) => review.userId === id);

/* ---------- Rotas ---------- */

const NAV = { registros: 'Registros', jogos: 'Jogos', jogadores: 'Jogadores' };
const ROUTES = [
  { pattern: /^#?\/?$/, nav: 'registros', view: recordsView },
  { pattern: /^#\/jogos$/, nav: 'jogos', view: gamesView },
  { pattern: /^#\/jogos\/(\d+)$/, nav: 'jogos', view: gameDetailView },
  { pattern: /^#\/jogadores$/, nav: 'jogadores', view: usersView },
  { pattern: /^#\/jogadores\/(\d+)$/, nav: 'jogadores', view: userDetailView },
];

let renderToken = 0;

// Busca os dados e redesenha a rota atual, descartando respostas que chegarem fora de ordem.
async function render({ moveFocus = false } = {}) {
  const token = ++renderToken;
  const route = ROUTES.find(({ pattern }) => pattern.test(location.hash));
  if (!route) return showMessage('Página não encontrada', 'Esse endereço não existe.', linkTo('#/', 'Ver registros'));

  document.querySelectorAll('[data-nav]').forEach((link) => {
    if (link.dataset.nav === route.nav) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  try {
    await loadData();
  } catch (error) {
    if (token === renderToken) showMessage('Não foi possível carregar os dados', error.message, h('button', { class: 'btn btn-solid', type: 'button', onclick: () => render() }, 'Tentar de novo'));
    return;
  }
  if (token !== renderToken) return;

  const param = Number(location.hash.match(route.pattern)[1]);
  const { title, content } = route.view(param);
  document.title = `${title} | books-up`;
  main.replaceChildren(...[content].flat());
  if (moveFocus) {
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

function showMessage(title, message, action) {
  document.title = `${title} | books-up`;
  main.replaceChildren(emptyState(title, message, action));
}

const linkTo = (href, label) => h('a', { class: 'btn btn-solid', href }, label);

const resultsAnnouncer = () => h('p', { class: 'visually-hidden', role: 'status' });

function emptyState(title, message, ...actions) {
  return h('div', { class: 'empty' }, h('h2', {}, title), h('p', {}, message), h('div', { class: 'actions' }, actions));
}

/* ---------- Registros ---------- */

function matchesFilters(review, { ignoreStatus = false } = {}) {
  if (!ignoreStatus && filters.status !== 'TODOS' && review.status !== filters.status) return false;
  if (filters.userId && review.userId !== Number(filters.userId)) return false;
  return normalize(`${review.gameTitle} ${review.comment ?? ''}`).includes(normalize(filters.query));
}

function recordRow(review, { title, withPlayer }) {
  const meta = [statusLabel(review.status)];
  if (withPlayer) meta.push(review.userName);
  if (review.hoursPlayed !== null && review.hoursPlayed !== undefined) meta.push(`${review.hoursPlayed} h`);
  meta.push(formatDate(review.createdAt));
  return h('li', {},
    h('button', { class: 'row', type: 'button', onclick: () => openReviewForm(review), 'aria-label': `Editar registro de ${title}, ${meta.join(', ')}` },
      h('span', { class: 'row-title' }, title),
      h('span', { class: 'row-score' }, formatScore(review.rating)),
      h('span', { class: 'row-meta' }, ball(review.status), meta.join(', ')),
      review.comment ? h('span', { class: 'row-comment' }, review.comment) : null,
    ),
  );
}

function recordsView() {
  const title = NAV.registros;
  if (!state.reviews.length) {
    return { title, content: [h('h1', { class: 'visually-hidden' }, title), firstRecordEmpty()] };
  }
  if (filters.userId && !state.users.some((user) => user.id === Number(filters.userId))) filters.userId = '';

  const results = h('div');
  const announcer = resultsAnnouncer();
  const statusBar = h('div', { class: 'status-filter', role: 'group', 'aria-label': 'Filtrar por status' });

  const refresh = () => {
    const pool = state.reviews.filter((review) => matchesFilters(review, { ignoreStatus: true }));
    const options = [{ value: 'TODOS', label: 'Todos' }, ...STATUSES];
    statusBar.replaceChildren(...options.map(({ value, label }) => {
      const count = value === 'TODOS' ? pool.length : pool.filter((review) => review.status === value).length;
      return h('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(filters.status === value),
        onclick: () => { filters.status = value; refresh(); },
      }, value === 'TODOS' ? null : ball(value), label, h('span', { class: 'count' }, String(count)));
    }));
    const visible = pool.filter((review) => matchesFilters(review));
    announcer.textContent = plural(visible.length, 'registro encontrado', 'registros encontrados');
    results.replaceChildren(visible.length
      ? h('ul', { class: 'list' }, visible.map((review) => recordRow(review, { title: review.gameTitle, withPlayer: true })))
      : emptyState('Nenhum registro com esses filtros', 'Mude o status, o jogador ou o texto da busca.',
        h('button', { class: 'btn', type: 'button', onclick: clearFilters }, 'Limpar filtros')));
  };

  const search = h('input', {
    class: 'search', type: 'search', placeholder: 'Buscar', 'aria-label': 'Buscar por jogo ou comentário', value: filters.query,
    oninput: (event) => { filters.query = event.target.value; refresh(); },
  });
  const player = h('select', {
    class: 'picker', 'aria-label': 'Filtrar por jogador',
    onchange: (event) => { filters.userId = event.target.value; refresh(); },
  }, h('option', { value: '' }, 'Todos os jogadores'), state.users.map((user) => h('option', { value: String(user.id) }, user.name)));
  player.value = filters.userId;

  function clearFilters() {
    Object.assign(filters, { status: 'TODOS', userId: '', query: '' });
    search.value = '';
    player.value = '';
    refresh();
  }

  refresh();
  return { title, content: [h('h1', { class: 'visually-hidden' }, title), h('div', { class: 'bar' }, statusBar, player, search), announcer, results] };
}

function firstRecordEmpty() {
  if (!state.users.length) {
    return emptyState('Comece cadastrando um jogador', 'Depois de ter um jogador e um jogo, você já pode fazer o primeiro registro.',
      h('button', { class: 'btn btn-solid', type: 'button', onclick: () => openUserForm() }, 'Adicionar jogador'));
  }
  if (!state.games.length) {
    return emptyState('Agora adicione um jogo', 'Com um jogo cadastrado, você já pode fazer o primeiro registro.',
      h('button', { class: 'btn btn-solid', type: 'button', onclick: () => openGameForm() }, 'Adicionar jogo'));
  }
  return emptyState('Nenhum jogo registrado ainda', 'Registre o que você está jogando, o que já zerou ou o que pretende jogar.',
    h('button', { class: 'btn btn-solid', type: 'button', onclick: () => openReviewForm() }, 'Registrar jogo'));
}

/* ---------- Jogos ---------- */

const gameInfo = (game) => [game.genre, game.platform, game.releaseYear].filter(Boolean).join(', ');

function catalogView({ title, items, key, placeholder, addLabel, onAdd, row, match, emptyTitle, emptyText }) {
  const heading = h('h1', { class: 'visually-hidden' }, title);
  if (!items.length) {
    return { title, content: [heading, emptyState(emptyTitle, emptyText, h('button', { class: 'btn btn-solid', type: 'button', onclick: onAdd }, addLabel))] };
  }
  const results = h('div');
  const announcer = resultsAnnouncer();
  const refresh = () => {
    const visible = items.filter((item) => normalize(match(item)).includes(normalize(catalog[key])));
    announcer.textContent = plural(visible.length, 'resultado encontrado', 'resultados encontrados');
    results.replaceChildren(visible.length
      ? h('ul', { class: 'list' }, visible.map((item) => h('li', {}, row(item))))
      : emptyState('Nada encontrado', 'Tente buscar por outro termo.'));
  };
  const search = h('input', {
    class: 'search', type: 'search', placeholder, 'aria-label': placeholder, value: catalog[key],
    oninput: (event) => { catalog[key] = event.target.value; refresh(); },
  });
  refresh();
  return {
    title,
    content: [heading, h('div', { class: 'bar' }, search, h('button', { class: 'btn', type: 'button', onclick: onAdd, style: 'margin-left:auto' }, addLabel)), announcer, results],
  };
}

function gamesView() {
  return catalogView({
    title: NAV.jogos,
    items: state.games,
    key: 'games',
    placeholder: 'Buscar jogo',
    addLabel: 'Adicionar jogo',
    onAdd: () => openGameForm(),
    emptyTitle: 'Nenhum jogo cadastrado',
    emptyText: 'Adicione os jogos que você e seus amigos querem acompanhar.',
    match: (game) => `${game.title} ${gameInfo(game)}`,
    row: (game) => {
      const reviews = reviewsOfGame(game.id);
      const info = [gameInfo(game), plural(reviews.length, 'registro', 'registros')].filter(Boolean).join(', ');
      return h('a', { class: 'row', href: `#/jogos/${game.id}` },
        h('span', { class: 'row-title' }, game.title),
        h('span', { class: 'row-score' }, formatScore(average(reviews))),
        h('span', { class: 'row-meta' }, info),
      );
    },
  });
}

function notFound(title, href, label) {
  return { title, content: emptyState(title, 'Ele pode ter sido excluído.', linkTo(href, label)) };
}

function gameDetailView(id) {
  const game = state.games.find((item) => item.id === id);
  if (!game) return notFound('Jogo não encontrado', '#/jogos', 'Ver jogos');
  const reviews = reviewsOfGame(id);
  const rated = reviews.filter((review) => review.rating !== null).length;
  return {
    title: game.title,
    content: [
      h('a', { class: 'back', href: '#/jogos' }, 'Voltar para jogos'),
      h('div', { class: 'detail-head' },
        h('h1', {}, game.title),
        h('div', { class: 'detail-score' }, formatScore(average(reviews)), h('small', {}, rated ? `média de ${plural(rated, 'nota', 'notas')}` : 'sem notas')),
        gameInfo(game) ? h('p', { class: 'detail-info' }, gameInfo(game)) : null,
        h('div', { class: 'detail-actions' },
          h('button', { class: 'btn btn-solid', type: 'button', onclick: () => openReviewForm(null, { gameId: id }) }, 'Registrar este jogo'),
          h('button', { class: 'btn', type: 'button', onclick: () => openGameForm(game) }, 'Editar jogo'),
          h('button', { class: 'btn', type: 'button', onclick: () => removeGame(game, reviews.length) }, 'Excluir jogo'),
        ),
      ),
      reviews.length
        ? [h('h2', { class: 'section-title' }, 'Quem registrou'), h('ul', { class: 'list' }, reviews.map((review) => recordRow(review, { title: review.userName })))]
        : h('p', { class: 'detail-info' }, 'Ninguém registrou este jogo ainda.'),
    ].flat(),
  };
}

/* ---------- Jogadores ---------- */

function usersView() {
  return catalogView({
    title: NAV.jogadores,
    items: state.users,
    key: 'users',
    placeholder: 'Buscar jogador',
    addLabel: 'Adicionar jogador',
    onAdd: () => openUserForm(),
    emptyTitle: 'Nenhum jogador cadastrado',
    emptyText: 'Adicione quem vai registrar os jogos.',
    match: (user) => `${user.name} ${user.email}`,
    row: (user) => {
      const count = reviewsOfUser(user.id).length;
      return h('a', { class: 'row', href: `#/jogadores/${user.id}` },
        h('span', { class: 'row-title' }, user.name),
        h('span', { class: 'row-score' }, String(count), h('span', { class: 'visually-hidden' }, count === 1 ? ' registro' : ' registros')),
        h('span', { class: 'row-meta' }, user.email),
      );
    },
  });
}

function userDetailView(id) {
  const user = state.users.find((item) => item.id === id);
  if (!user) return notFound('Jogador não encontrado', '#/jogadores', 'Ver jogadores');
  const reviews = reviewsOfUser(id);
  const rated = reviews.filter((review) => review.rating !== null).length;
  return {
    title: user.name,
    content: [
      h('a', { class: 'back', href: '#/jogadores' }, 'Voltar para jogadores'),
      h('div', { class: 'detail-head' },
        h('h1', {}, user.name),
        h('div', { class: 'detail-score' }, formatScore(average(reviews)), h('small', {}, rated ? `média de ${plural(rated, 'nota', 'notas')}` : 'sem notas')),
        h('p', { class: 'detail-info' }, user.email),
        user.bio ? h('p', { class: 'detail-bio' }, user.bio) : null,
        reviews.length
          ? h('div', { class: 'detail-tally' }, STATUSES.map(({ value, label }) => h('span', {}, ball(value), `${label}: ${reviews.filter((review) => review.status === value).length}`)))
          : null,
        h('div', { class: 'detail-actions' },
          h('button', { class: 'btn btn-solid', type: 'button', onclick: () => openReviewForm(null, { userId: id }) }, 'Registrar jogo'),
          h('button', { class: 'btn', type: 'button', onclick: () => openUserForm(user) }, 'Editar jogador'),
          h('button', { class: 'btn', type: 'button', onclick: () => removeUser(user, reviews.length) }, 'Excluir jogador'),
        ),
      ),
      reviews.length
        ? [h('h2', { class: 'section-title' }, 'Registros'), h('ul', { class: 'list' }, reviews.map((review) => recordRow(review, { title: review.gameTitle })))]
        : h('p', { class: 'detail-info' }, 'Este jogador ainda não registrou nenhum jogo.'),
    ].flat(),
  };
}

/* ---------- Formulários ---------- */

function field({ name, label, optional, type = 'text', value, control, ...attrs }) {
  const id = `f-${name}`;
  const input = control ?? h(type === 'textarea' ? 'textarea' : 'input', {
    class: 'input', id, name, ...(type === 'textarea' ? {} : { type }), value: value ?? '', ...attrs,
  });
  return h('div', { class: 'field', 'data-field': name },
    h('label', { class: 'field-label', for: id }, label, optional ? h('em', {}, ' (opcional)') : null),
    input,
  );
}

function clearErrors(form) {
  form.querySelector('.form-alert')?.remove();
  form.querySelectorAll('.field-error').forEach((node) => node.remove());
  form.querySelectorAll('[aria-invalid]').forEach((node) => { node.removeAttribute('aria-invalid'); node.removeAttribute('aria-describedby'); });
}

function showErrors(form, error) {
  let firstInvalid = null;
  let shownOnField = false;
  for (const [name, message] of Object.entries(error.fields ?? {})) {
    const wrapper = form.querySelector(`[data-field="${name}"]`);
    if (!wrapper) continue;
    shownOnField = true;
    const errorId = `erro-${name}`;
    wrapper.append(h('span', { class: 'field-error', id: errorId }, message));
    const input = wrapper.querySelector('input, select, textarea');
    if (input && input.type !== 'radio') {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', errorId);
    }
    firstInvalid ??= input;
  }
  if (shownOnField) {
    firstInvalid?.focus();
    return;
  }
  form.prepend(h('p', { class: 'form-alert', role: 'alert' }, error.message));
}

const text = (form, name) => {
  const value = form.elements[name]?.value.trim();
  return value ? value : null;
};

function number(form, name) {
  const input = form.elements[name];
  if (input.validity.badInput) throw new ApiError('Número inválido', 400, { [name]: 'digite um número válido' });
  return input.value === '' ? null : Number(input.value);
}

function formActions(saveLabel, removeAction) {
  return h('div', { class: 'form-actions' },
    h('button', { class: 'btn btn-solid', type: 'submit' }, saveLabel),
    h('button', { class: 'btn', type: 'button', onclick: closeSheet }, 'Cancelar'),
    removeAction ? h('button', { class: 'btn-text', type: 'button', onclick: removeAction.onclick }, removeAction.label) : null,
  );
}

function buildForm(children, submit, doneMessage) {
  const form = h('form', {
    class: 'form', novalidate: true,
    onsubmit: async (event) => {
      event.preventDefault();
      clearErrors(form);
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      try {
        await submit(form);
        closeSheet();
        toast(doneMessage);
        await render();
        // O elemento que abriu o painel pode ter sido redesenhado; mantém o foco na página.
        if (document.activeElement === document.body) main.focus({ preventScroll: true });
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        showErrors(form, error);
      } finally {
        button.disabled = false;
      }
    },
  }, children);
  return form;
}

function openUserForm(user = null) {
  openSheet(user ? 'Editar jogador' : 'Adicionar jogador', buildForm([
    field({ name: 'name', label: 'Nome', value: user?.name, maxlength: 100, autocomplete: 'off' }),
    field({ name: 'email', label: 'E-mail', type: 'email', value: user?.email, maxlength: 100, autocomplete: 'off' }),
    field({ name: 'bio', label: 'Sobre', optional: true, type: 'textarea', value: user?.bio, maxlength: 255 }),
    formActions(user ? 'Salvar jogador' : 'Adicionar jogador'),
  ], (form) => {
    const body = { name: text(form, 'name'), email: text(form, 'email'), bio: text(form, 'bio') };
    return user ? api.users.update(user.id, body) : api.users.create(body);
  }, user ? 'Jogador salvo' : 'Jogador adicionado'));
}

function openGameForm(game = null) {
  openSheet(game ? 'Editar jogo' : 'Adicionar jogo', buildForm([
    field({ name: 'title', label: 'Título', value: game?.title, maxlength: 150, autocomplete: 'off' }),
    field({ name: 'genre', label: 'Gênero', optional: true, value: game?.genre, maxlength: 100 }),
    h('div', { class: 'two' },
      field({ name: 'platform', label: 'Plataforma', optional: true, value: game?.platform, maxlength: 100 }),
      field({ name: 'releaseYear', label: 'Ano', optional: true, type: 'number', value: game?.releaseYear, min: 1950, max: 2100, step: 1 }),
    ),
    formActions(game ? 'Salvar jogo' : 'Adicionar jogo'),
  ], (form) => {
    const body = { title: text(form, 'title'), genre: text(form, 'genre'), platform: text(form, 'platform'), releaseYear: number(form, 'releaseYear') };
    return game ? api.games.update(game.id, body) : api.games.create(body);
  }, game ? 'Jogo salvo' : 'Jogo adicionado'));
}

function selectField(name, label, items, optionLabel, selected) {
  return field({
    name, label,
    control: (() => {
      const select = h('select', { class: 'input', id: `f-${name}`, name },
        h('option', { value: '' }, 'Escolher'),
        items.map((item) => h('option', { value: String(item.id) }, optionLabel(item))));
      select.value = selected ? String(selected) : '';
      return select;
    })(),
  });
}

function statusField(current) {
  return h('fieldset', { 'data-field': 'status' },
    h('legend', {}, 'Status'),
    h('div', { class: 'status-options' }, STATUSES.map(({ value, label }) => h('label', { class: 'status-option' },
      h('input', { type: 'radio', name: 'status', value, checked: value === current }),
      ball(value), label))),
  );
}

function openReviewForm(review = null, preset = {}) {
  if (!review && (!state.users.length || !state.games.length)) {
    const needsUser = !state.users.length;
    openSheet('Registrar jogo', h('div', {},
      h('p', { style: 'margin-bottom:1.25rem' }, needsUser ? 'Cadastre um jogador antes de registrar um jogo.' : 'Cadastre um jogo antes de fazer um registro.'),
      h('button', { class: 'btn btn-solid', type: 'button', onclick: () => (needsUser ? openUserForm() : openGameForm()) }, needsUser ? 'Adicionar jogador' : 'Adicionar jogo'),
    ));
    return;
  }

  const who = review
    ? h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Jogador'), h('span', {}, review.userName))
    : selectField('userId', 'Jogador', state.users, (user) => user.name, preset.userId ?? (state.users.length === 1 ? state.users[0].id : filters.userId));
  const what = review
    ? null
    : selectField('gameId', 'Jogo', state.games, (game) => game.title, preset.gameId);

  const removeAction = review
    ? { label: 'Excluir registro', onclick: () => removeReview(review) }
    : null;

  openSheet(review ? review.gameTitle : 'Registrar jogo', buildForm([
    who,
    what,
    statusField(review?.status ?? 'JOGANDO'),
    h('div', { class: 'two' },
      field({ name: 'rating', label: 'Nota de 0 a 10', optional: true, type: 'number', value: review?.rating, min: 0, max: 10, step: 0.1, inputmode: 'decimal' }),
      field({ name: 'hoursPlayed', label: 'Horas jogadas', optional: true, type: 'number', value: review?.hoursPlayed, min: 0, step: 1, inputmode: 'numeric' }),
    ),
    field({ name: 'comment', label: 'Comentário', optional: true, type: 'textarea', value: review?.comment, maxlength: 5000 }),
    formActions(review ? 'Salvar registro' : 'Registrar jogo', removeAction),
  ], (form) => {
    const details = {
      rating: number(form, 'rating'),
      comment: text(form, 'comment'),
      status: form.elements.status.value || null,
      hoursPlayed: number(form, 'hoursPlayed'),
    };
    if (review) return api.reviews.update(review.id, details);
    return api.reviews.create({ userId: Number(form.elements.userId.value) || null, gameId: Number(form.elements.gameId.value) || null, ...details });
  }, review ? 'Registro salvo' : 'Jogo registrado'));
}

/* ---------- Exclusões ---------- */

const linkedWarning = (count) => (count
  ? `${plural(count, 'registro ligado também será excluído', 'registros ligados também serão excluídos')}. Essa ação não pode ser desfeita.`
  : 'Essa ação não pode ser desfeita.');

async function runRemoval(action, doneMessage, afterHash) {
  try {
    await action();
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    toast(error.message);
    return;
  }
  toast(doneMessage);
  if (afterHash && location.hash !== afterHash) location.hash = afterHash;
  else await render();
}

async function removeGame(game, count) {
  const accepted = await confirmAction({ title: `Excluir ${game.title}?`, message: linkedWarning(count), action: 'Excluir jogo' });
  if (accepted) await runRemoval(() => api.games.remove(game.id), 'Jogo excluído', '#/jogos');
}

async function removeUser(user, count) {
  const accepted = await confirmAction({ title: `Excluir ${user.name}?`, message: linkedWarning(count), action: 'Excluir jogador' });
  if (accepted) await runRemoval(() => api.users.remove(user.id), 'Jogador excluído', '#/jogadores');
}

async function removeReview(review) {
  const accepted = await confirmAction({ title: `Excluir o registro de ${review.gameTitle}?`, message: linkedWarning(0), action: 'Excluir registro' });
  if (!accepted) return;
  closeSheet();
  await runRemoval(() => api.reviews.remove(review.id), 'Registro excluído');
}

/* ---------- Início ---------- */

document.getElementById('novo-registro').addEventListener('click', () => openReviewForm());
document.querySelector('.skip').addEventListener('click', (event) => {
  event.preventDefault();
  main.focus();
});
// Fecha só com clique no fundo escurecido, não na área vazia do próprio painel.
document.getElementById('sheet').addEventListener('click', (event) => {
  const panel = event.currentTarget;
  if (event.target === panel && event.clientX < panel.getBoundingClientRect().left) closeSheet();
});
window.addEventListener('hashchange', () => render({ moveFocus: true }));
render();
