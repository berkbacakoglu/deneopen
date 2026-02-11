import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import { randomUUID } from 'node:crypto';
import { prisma } from '@packages/db';
import { logger } from '@packages/logger';

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
    const todos = await prisma.todo.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
    return { ok: true, requestId: (req as any).requestId, data: todos };
  });

  return app;
}
