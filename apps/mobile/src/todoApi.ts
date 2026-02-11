export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? 'http://127.0.0.1:3001';
const API_WRITE_TOKEN = process.env.EXPO_PUBLIC_API_WRITE_TOKEN ?? process.env.API_WRITE_TOKEN;

function writeHeaders() {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (API_WRITE_TOKEN) headers['x-api-key'] = API_WRITE_TOKEN;
  return headers;
}

async function asJson<T>(response: Response): Promise<T> {
  const payload = await response.json();
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message ?? payload?.error ?? 'Request failed');
  }
  return payload as T;
}

export async function listTodos(fetchImpl: typeof fetch = fetch): Promise<Todo[]> {
  const response = await fetchImpl(`${API_BASE_URL}/api/todos`, { cache: 'no-store' });
  const payload = await asJson<{ data?: Todo[] }>(response);
  return payload.data ?? [];
}

export async function createTodo(title: string, fetchImpl: typeof fetch = fetch): Promise<Todo> {
  const response = await fetchImpl(`${API_BASE_URL}/api/todos`, {
    method: 'POST',
    headers: writeHeaders(),
    body: JSON.stringify({ title })
  });

  const payload = await asJson<{ data: Todo }>(response);
  return payload.data;
}

export async function toggleTodo(todo: Todo, fetchImpl: typeof fetch = fetch): Promise<Todo> {
  const response = await fetchImpl(`${API_BASE_URL}/api/todos/${todo.id}`, {
    method: 'PATCH',
    headers: writeHeaders(),
    body: JSON.stringify({ completed: !todo.completed })
  });

  const payload = await asJson<{ data: Todo }>(response);
  return payload.data;
}

export async function deleteTodo(id: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  const response = await fetchImpl(`${API_BASE_URL}/api/todos/${id}`, {
    method: 'DELETE',
    headers: API_WRITE_TOKEN ? { 'x-api-key': API_WRITE_TOKEN } : undefined
  });

  if (response.status === 204) return;
  const payload = await response.json();
  throw new Error(payload?.message ?? payload?.error ?? 'Delete failed');
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
