import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@packages/db';
import { buildApp } from '../src/app';

describe('api routes', () => {
  beforeEach(async () => {
    await prisma.todo.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns health payload with requestId', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.ok).toBe(true);
    expect(typeof body.requestId).toBe('string');
    await app.close();
  });

  it('supports create/list/update/delete todo flow', async () => {
    const app = buildApp();

    const create = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'alpha' }
    });

    expect(create.statusCode).toBe(201);
    const created = create.json();
    const id = created.data.id as string;

    const list = await app.inject({ method: 'GET', url: '/api/todos' });
    expect(list.statusCode).toBe(200);
    expect(list.json().data.length).toBe(1);

    const patch = await app.inject({
      method: 'PATCH',
      url: `/api/todos/${id}`,
      payload: { completed: true }
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().data.completed).toBe(true);

    const del = await app.inject({ method: 'DELETE', url: `/api/todos/${id}` });
    expect(del.statusCode).toBe(204);

    await app.close();
  });

  it('returns 400 for invalid create payload with details + requestId', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: '' }
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('invalid_request');
    expect(body.requestId).toBeTruthy();
    expect(body.details).toBeTruthy();

    await app.close();
  });

  it('returns 404 when patching missing todo', async () => {
    const app = buildApp();

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/todos/does-not-exist',
      payload: { completed: true }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe('not_found');

    await app.close();
  });

  it('returns 401 on mutating routes when API_WRITE_TOKEN is set and key is missing', async () => {
    const previous = process.env.API_WRITE_TOKEN;
    process.env.API_WRITE_TOKEN = 'secret-token';
    const app = buildApp();

    const create = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'protected' }
    });

    expect(create.statusCode).toBe(401);
    expect(create.json().error).toBe('unauthorized');

    await app.close();
    process.env.API_WRITE_TOKEN = previous;
  });

  it('allows mutating routes when API_WRITE_TOKEN matches x-api-key', async () => {
    const previous = process.env.API_WRITE_TOKEN;
    process.env.API_WRITE_TOKEN = 'secret-token';
    const app = buildApp();

    const create = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: { 'x-api-key': 'secret-token' },
      payload: { title: 'authorized' }
    });

    expect(create.statusCode).toBe(201);

    await app.close();
    process.env.API_WRITE_TOKEN = previous;
  });

  it('maps Prisma conflict-like errors to 409 payload', async () => {
    const app = buildApp();
    const createSpy = vi.spyOn(prisma.todo, 'create').mockRejectedValueOnce({ code: 'P2002' } as never);

    const response = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'will fail' }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error).toBe('conflict');

    createSpy.mockRestore();
    await app.close();
  });

  it('maps unknown errors to 500 payload', async () => {
    const app = buildApp();
    const createSpy = vi.spyOn(prisma.todo, 'create').mockRejectedValueOnce(new Error('boom') as never);

    const response = await app.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { title: 'will fail' }
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().error).toBe('internal_error');

    createSpy.mockRestore();
    await app.close();
  });
});
