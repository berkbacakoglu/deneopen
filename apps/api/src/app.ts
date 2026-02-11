import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import { randomUUID } from 'node:crypto';
import { prisma } from '@packages/db';
import { logger } from '@packages/logger';
import { CreateTodoSchema, UpdateTodoSchema } from '@packages/shared';

function canWrite(req: { headers: Record<string, unknown> }): boolean {
  const configured = process.env.API_WRITE_TOKEN;
  if (!configured) return true;
  const header = req.headers['x-api-key'];
  return typeof header === 'string' && header === configured;
}

export function buildApp(): ReturnType<typeof Fastify> {
  const app = Fastify({ loggerInstance: logger });
  app.register(sensible);

  app.addHook('onRequest', async (req) => {
    const requestId = req.headers['x-request-id']?.toString() ?? randomUUID();
    req.headers['x-request-id'] = requestId;
    (req as any).requestId = requestId;
  });

  app.addHook('onResponse', async (req, reply) => {
    const latencyMs = reply.elapsedTime;
    req.log.info({
      requestId: (req as any).requestId,
      route: req.routeOptions?.url ?? req.url,
      method: req.method,
      statusCode: reply.statusCode,
      latencyMs
    }, 'request_complete');
  });

  app.setErrorHandler((error: any, req, reply) => {
    req.log.error({
      requestId: (req as any).requestId,
      err: error,
      stack: error?.stack
    }, 'request_failed');

    reply.status(error?.statusCode ?? 500).send({
      error: 'internal_error',
      message: 'An unexpected error occurred.',
      requestId: (req as any).requestId
    });
  });

  app.get('/health', async (req) => ({
    ok: true,
    requestId: (req as any).requestId,
    now: new Date().toISOString()
  }));

  app.get('/ready', async (req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { ok: true, requestId: (req as any).requestId, db: 'up' };
    } catch (error) {
      req.log.error({ requestId: (req as any).requestId, err: error }, 'db_not_ready');
      return reply.status(503).send({ ok: false, requestId: (req as any).requestId, db: 'down' });
    }
  });

  app.get('/api/todos', async (req) => {
    const todos = await prisma.todo.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    return { ok: true, requestId: (req as any).requestId, data: todos };
  });

  app.post('/api/todos', async (req, reply) => {
    if (!canWrite(req)) {
      return reply.status(401).send({ ok: false, requestId: (req as any).requestId, error: 'unauthorized' });
    }

    const parsed = CreateTodoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, requestId: (req as any).requestId, error: 'invalid_body' });
    }

    const todo = await prisma.todo.create({ data: parsed.data });
    return reply.status(201).send({ ok: true, requestId: (req as any).requestId, data: todo });
  });

  app.patch('/api/todos/:id', async (req, reply) => {
    if (!canWrite(req)) {
      return reply.status(401).send({ ok: false, requestId: (req as any).requestId, error: 'unauthorized' });
    }

    const params = req.params as { id?: string };
    if (!params?.id) {
      return reply.status(400).send({ ok: false, requestId: (req as any).requestId, error: 'missing_id' });
    }

    const parsed = UpdateTodoSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, requestId: (req as any).requestId, error: 'invalid_body' });
    }

    const existing = await prisma.todo.findUnique({ where: { id: params.id } });
    if (!existing) {
      return reply.status(404).send({ ok: false, requestId: (req as any).requestId, error: 'not_found' });
    }

    const updated = await prisma.todo.update({ where: { id: params.id }, data: parsed.data });
    return { ok: true, requestId: (req as any).requestId, data: updated };
  });

  app.delete('/api/todos/:id', async (req, reply) => {
    if (!canWrite(req)) {
      return reply.status(401).send({ ok: false, requestId: (req as any).requestId, error: 'unauthorized' });
    }

    const params = req.params as { id?: string };
    if (!params?.id) {
      return reply.status(400).send({ ok: false, requestId: (req as any).requestId, error: 'missing_id' });
    }

    const existing = await prisma.todo.findUnique({ where: { id: params.id } });
    if (!existing) {
      return reply.status(404).send({ ok: false, requestId: (req as any).requestId, error: 'not_found' });
    }

    await prisma.todo.delete({ where: { id: params.id } });
    return reply.status(204).send();
  });

  return app;
}
