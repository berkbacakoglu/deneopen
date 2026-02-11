import { describe, expect, it } from 'vitest';
import { prisma } from '@packages/db';

describe('db integration', () => {
  it('connects and runs simple query', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    expect(result).toBeTruthy();
  });
});
