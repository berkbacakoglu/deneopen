import 'dotenv/config';
import { buildApp } from '../src/app';

function writeHeaders() {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (process.env.API_WRITE_TOKEN) {
    headers['x-api-key'] = process.env.API_WRITE_TOKEN;
  }
  return headers;
}

async function main() {
  const app = buildApp();
  const server = await app.listen({ port: Number(process.env.PORT ?? 3001), host: '127.0.0.1' });

  const base = new URL(server);
  const health = await fetch(new URL('/health', base));
  if (!health.ok) throw new Error('/health failed');

  const ready = await fetch(new URL('/ready', base));
  if (!ready.ok) throw new Error('/ready failed');

  const create = await fetch(new URL('/api/todos', base), {
    method: 'POST',
    headers: writeHeaders(),
    body: JSON.stringify({ title: 'smoke todo' })
  });
  if (!create.ok) throw new Error('/api/todos POST failed');
  const created = await create.json();

  const todoId = created?.data?.id;
  if (!todoId) throw new Error('created todo id missing');

  const update = await fetch(new URL(`/api/todos/${todoId}`, base), {
    method: 'PATCH',
    headers: writeHeaders(),
    body: JSON.stringify({ completed: true })
  });
  if (!update.ok) throw new Error('/api/todos/:id PATCH failed');

  const list = await fetch(new URL('/api/todos', base));
  if (!list.ok) throw new Error('/api/todos GET failed');

  const del = await fetch(new URL(`/api/todos/${todoId}`, base), {
    method: 'DELETE',
    headers: process.env.API_WRITE_TOKEN ? { 'x-api-key': process.env.API_WRITE_TOKEN } : undefined
  });
  if (del.status !== 204) throw new Error('/api/todos/:id DELETE failed');

  await app.close();
}

main().catch((error) => {
  console.error('smoke_failed', error);
  process.exitCode = 1;
});
