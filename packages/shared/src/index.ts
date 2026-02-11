import { z } from 'zod';

export const PingResponseSchema = z.object({
  ok: z.literal(true),
  requestId: z.string(),
  now: z.string()
});

export const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string().datetime().or(z.date())
});

export const CreateTodoSchema = z.object({
  title: z.string().trim().min(1).max(200)
});

export const UpdateTodoSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  completed: z.boolean().optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required'
});

export const RequestIdParamsSchema = z.object({
  id: z.string().trim().min(1)
});

export const ApiErrorCodeSchema = z.enum([
  'invalid_request',
  'unauthorized',
  'not_found',
  'conflict',
  'internal_error'
]);

export const ApiErrorSchema = z.object({
  ok: z.literal(false),
  requestId: z.string(),
  error: ApiErrorCodeSchema,
  message: z.string(),
  details: z.unknown().optional()
});

export const TodoListResponseSchema = z.object({
  ok: z.literal(true),
  requestId: z.string(),
  data: z.array(TodoSchema)
});

export const TodoResponseSchema = z.object({
  ok: z.literal(true),
  requestId: z.string(),
  data: TodoSchema
});

export type PingResponse = z.infer<typeof PingResponseSchema>;
export type Todo = z.infer<typeof TodoSchema>;
export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
