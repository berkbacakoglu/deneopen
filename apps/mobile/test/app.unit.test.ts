import { describe, expect, it, vi } from 'vitest';
import { createTodo, deleteTodo, listTodos, toggleTodo } from '../src/todoApi';

describe('mobile todo api helpers', () => {
  it('supports read + create + toggle + delete with injected fetch', async () => {
    const seed = {
      id: 't1',
      title: 'one',
      completed: false,
      createdAt: new Date().toISOString()
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' || input instanceof URL
        ? input.toString()
        : input.url;

      if (url.endsWith('/api/todos') && (!init?.method || init.method === 'GET')) {
        return { ok: true, status: 200, json: async () => ({ ok: true, data: [seed] }) } as Response;
      }
      if (url.endsWith('/api/todos') && init?.method === 'POST') {
        return { ok: true, status: 201, json: async () => ({ ok: true, data: seed }) } as Response;
      }
      if (url.endsWith(`/api/todos/${seed.id}`) && init?.method === 'PATCH') {
        return { ok: true, status: 200, json: async () => ({ ok: true, data: { ...seed, completed: true } }) } as Response;
      }
      if (url.endsWith(`/api/todos/${seed.id}`) && init?.method === 'DELETE') {
        return { ok: true, status: 204, json: async () => ({}) } as Response;
      }

      return { ok: false, status: 500, json: async () => ({ ok: false }) } as Response;
    });

    expect((await listTodos(fetchMock as unknown as typeof fetch)).length).toBe(1);
    expect((await createTodo('one', fetchMock as unknown as typeof fetch)).id).toBe(seed.id);
    expect((await toggleTodo(seed, fetchMock as unknown as typeof fetch)).completed).toBe(true);
    await expect(deleteTodo(seed.id, fetchMock as unknown as typeof fetch)).resolves.toBeUndefined();
  });
});
