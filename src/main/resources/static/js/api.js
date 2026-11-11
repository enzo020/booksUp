// Cliente da API REST. Toda resposta de erro vira um ApiError com a mensagem do backend.

export class ApiError extends Error {
  constructor(message, status = 0, fields = null) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

// O backend devolve erros de validação como "email: inválido; name: é obrigatório".
function parseFieldErrors(message) {
  const fields = {};
  for (const part of message.split('; ')) {
    const separator = part.indexOf(': ');
    if (separator < 1) return null;
    fields[part.slice(0, separator)] = part.slice(separator + 2);
  }
  return fields;
}

async function request(method, path, body) {
  let response;
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('A API não respondeu. Confira se a aplicação está rodando e tente de novo.');
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (response.ok) return data;

  const message = data?.message || `A API retornou o erro ${response.status}.`;
  const fields = response.status === 400 && data?.error === 'Dados inválidos' ? parseFieldErrors(message) : null;
  throw new ApiError(message, response.status, fields);
}

function resource(path) {
  return {
    list: () => request('GET', path),
    create: (body) => request('POST', path, body),
    update: (id, body) => request('PUT', `${path}/${id}`, body),
    remove: (id) => request('DELETE', `${path}/${id}`),
  };
}

export const api = {
  users: resource('/users'),
  games: resource('/games'),
  reviews: resource('/reviews'),
};
