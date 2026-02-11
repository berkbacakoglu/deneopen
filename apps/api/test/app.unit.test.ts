import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';

describe('health route', () => {
  it('returns ok', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.ok).toBe(true);
    await app.close();
  });
});
