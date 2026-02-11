import { createTodo, deleteTodo, getApiBaseUrl, listTodos, toggleTodo, Todo } from '../src/todoApi';

type FetchResponse = {
  status?: number;
  ok?: boolean;
  body?: unknown;
};

function fakeResponse(input: FetchResponse): Response {
  const status = input.status ?? 200;
  const body = input.body ?? { ok: true };
  return {
    ok: input.ok ?? (status >= 200 && status < 300),
    status,
    async json() {
      return body;
    }
  } as Response;
}

async function main() {
  const created: Todo = {
    id: 'smoke-1',
    title: 'smoke',
    completed: false,
    createdAt: new Date().toISOString()
  };

  const fetchMock: typeof fetch = async (input, init) => {
    const url = typeof input === 'string' || input instanceof URL
      ? input.toString()
      : input.url;

    if (url.endsWith('/api/todos') && (!init?.method || init.method === 'GET')) {
      return fakeResponse({ body: { ok: true, data: [created] } });
    }

    if (url.endsWith('/api/todos') && init?.method === 'POST') {
      return fakeResponse({ status: 201, body: { ok: true, data: created } });
    }

    if (url.endsWith(`/api/todos/${created.id}`) && init?.method === 'PATCH') {
      return fakeResponse({ body: { ok: true, data: { ...created, completed: true } } });
    }

    if (url.endsWith(`/api/todos/${created.id}`) && init?.method === 'DELETE') {
      return fakeResponse({ status: 204, body: null });
    }

    return fakeResponse({ status: 404, ok: false, body: { ok: false, message: 'not mocked' } });
  };

  const items = await listTodos(fetchMock);
  if (items.length !== 1) throw new Error('listTodos failed');

  const afterCreate = await createTodo('smoke', fetchMock);
  if (afterCreate.id !== created.id) throw new Error('createTodo failed');

  const afterToggle = await toggleTodo(created, fetchMock);
  if (!afterToggle.completed) throw new Error('toggleTodo failed');

  await deleteTodo(created.id, fetchMock);

  const base = getApiBaseUrl();
  if (!base.startsWith('http')) throw new Error('invalid API base url');

  console.log('mobile_smoke_ok');
}

main().catch((error) => {
  console.error('mobile_smoke_failed', error);
  process.exitCode = 1;
});
