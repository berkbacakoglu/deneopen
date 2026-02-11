import { z } from 'zod';

export const PingResponseSchema = z.object({
  ok: z.literal(true),
  requestId: z.string(),
  now: z.string()
});

export type PingResponse = z.infer<typeof PingResponseSchema>;
