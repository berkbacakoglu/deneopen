import 'dotenv/config';
import { buildApp } from '../src/app';

async function main() {
  const app = buildApp();
  const server = await app.listen({ port: Number(process.env.PORT ?? 3001), host: '127.0.0.1' });

  const base = new URL(server);
  const health = await fetch(new URL('/health', base));
  if (!health.ok) throw new Error('/health failed');

  const ready = await fetch(new URL('/ready', base));
  if (!ready.ok) throw new Error('/ready failed');

  const todos = await fetch(new URL('/api/todos', base));
  if (!todos.ok) throw new Error('/api/todos failed');

  await app.close();
}

main().catch((error) => {
  console.error('smoke_failed', error);
  process.exitCode = 1;
});
