import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import sensible from '@fastify/sensible';
import { randomUUID } from 'node:crypto';
import { prisma } from '@packages/db';
import { logger } from '@packages/logger';
import {
  ApiErrorCode,
  CreateTodoSchema,
  RequestIdParamsSchema,
  TodoListResponseSchema,
  TodoResponseSchema,
  UpdateTodoSchema
} from '@packages/shared';

type ErrorPayload = {
  ok: false;
  requestId: string;
  error: ApiErrorCode;
  message: string;
  details?: unknown;
};

function getRequestId(req: FastifyRequest): string {
  return req.headers['x-request-id']?.toString() ?? req.id;
}

function canWrite(req: { headers: Record<string, unknown> }): boolean {
  const configured = process.env.API_WRITE_TOKEN;
  if (!configured) return true;
  const header = req.headers['x-api-key'];
  return typeof header === 'string' && header === configured;
}

function sendError(
  reply: FastifyReply,
  requestId: string,
  statusCode: 400 | 401 | 404 | 409 | 500,
  error: ApiErrorCode,
  message: string,
  details?: unknown
) {
  const payload: ErrorPayload = { ok: false, requestId, error, message, details };
  return reply.status(statusCode).send(payload);
}

function parseParamsId(req: FastifyRequest, reply: FastifyReply, requestId: string): string | null {
  const parsed = RequestIdParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    sendError(reply, requestId, 400, 'invalid_request', 'Path param "id" is required.', parsed.error.flatten());
    return null;
  }

  return parsed.data.id;
}

function parsePrismaStatus(error: unknown): 404 | 409 | 500 {
  const code = (error as { code?: string })?.code;
  if (code === 'P2025') return 404;
  if (code === 'P2002') return 409;
  return 500;
}

export function buildApp(): ReturnType<typeof Fastify> {
  const app = Fastify({ loggerInstance: logger });
  app.register(sensible);

  app.addHook('onRequest', async (req) => {
    const requestId = req.headers['x-request-id']?.toString() ?? randomUUID();
    req.headers['x-request-id'] = requestId;
    req.log = req.log.child({ requestId });
  });

  app.addHook('onResponse', async (req, reply) => {
    const latencyMs = reply.elapsedTime;
    req.log.info({
      requestId: getRequestId(req),
      route: req.routeOptions?.url ?? req.url,
      method: req.method,
      statusCode: reply.statusCode,
      latencyMs
    }, 'request_complete');
  });

  app.setErrorHandler((error: any, req, reply) => {
    req.log.error({
      requestId: getRequestId(req),
      err: error,
      stack: error?.stack
    }, 'request_failed');

    const status = parsePrismaStatus(error);
    if (status === 404) {
      return sendError(reply, getRequestId(req), 404, 'not_found', 'Todo was not found.');
    }

    if (status === 409) {
      return sendError(reply, getRequestId(req), 409, 'conflict', 'Operation conflicts with existing data.');
    }

    return sendError(reply, getRequestId(req), 500, 'internal_error', 'An unexpected error occurred.');
  });

  app.get('/health', async (req) => ({
    ok: true,
    requestId: getRequestId(req),
    now: new Date().toISOString()
  }));

  app.get('/ready', async (req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { ok: true, requestId: getRequestId(req), db: 'up' };
    } catch (error) {
      req.log.error({ requestId: getRequestId(req), err: error }, 'db_not_ready');
      return reply.status(503).send({ ok: false, requestId: getRequestId(req), db: 'down' });
    }
  });

  app.get('/api/todos', async (req, reply) => {
    const requestId = getRequestId(req);
    const todos = await prisma.todo.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    const payload = { ok: true, requestId, data: todos };
    const parsed = TodoListResponseSchema.safeParse(payload);

    if (!parsed.success) {
      return sendError(reply, requestId, 500, 'internal_error', 'Response validation failed.', parsed.error.flatten());
    }

    return parsed.data;
  });

  app.post('/api/todos', async (req, reply) => {
    const requestId = getRequestId(req);

    if (!canWrite(req)) {
      return sendError(reply, requestId, 401, 'unauthorized', 'Missing or invalid x-api-key for write operation.');
    }

    const parsed = CreateTodoSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(reply, requestId, 400, 'invalid_request', 'Invalid request body.', parsed.error.flatten());
    }

    const todo = await prisma.todo.create({ data: parsed.data });
    const payload = { ok: true, requestId, data: todo };
    const validated = TodoResponseSchema.safeParse(payload);

    if (!validated.success) {
      return sendError(reply, requestId, 500, 'internal_error', 'Response validation failed.', validated.error.flatten());
    }

    return reply.status(201).send(validated.data);
  });

  app.patch('/api/todos/:id', async (req, reply) => {
    const requestId = getRequestId(req);

    if (!canWrite(req)) {
      return sendError(reply, requestId, 401, 'unauthorized', 'Missing or invalid x-api-key for write operation.');
    }

    const id = parseParamsId(req, reply, requestId);
    if (!id) return;

    const parsed = UpdateTodoSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(reply, requestId, 400, 'invalid_request', 'Invalid request body.', parsed.error.flatten());
    }

    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      return sendError(reply, requestId, 404, 'not_found', 'Todo was not found.');
    }

    const updated = await prisma.todo.update({ where: { id }, data: parsed.data });
    const payload = { ok: true, requestId, data: updated };
    const validated = TodoResponseSchema.safeParse(payload);

    if (!validated.success) {
      return sendError(reply, requestId, 500, 'internal_error', 'Response validation failed.', validated.error.flatten());
    }

    return validated.data;
  });

  app.delete('/api/todos/:id', async (req, reply) => {
    const requestId = getRequestId(req);

    if (!canWrite(req)) {
      return sendError(reply, requestId, 401, 'unauthorized', 'Missing or invalid x-api-key for write operation.');
    }

    const id = parseParamsId(req, reply, requestId);
    if (!id) return;

    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      return sendError(reply, requestId, 404, 'not_found', 'Todo was not found.');
    }

    await prisma.todo.delete({ where: { id } });
    return reply.status(204).send();
  });

  return app;
}

