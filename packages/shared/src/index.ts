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

export type PingResponse = z.infer<typeof PingResponseSchema>;
export type Todo = z.infer<typeof TodoSchema>;
export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;
