import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@packages/db';

describe('db integration', () => {
  beforeEach(async () => {
    await prisma.todo.deleteMany();
  });

  it('connects and runs simple query', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    expect(result).toBeTruthy();
  });

  it('performs CRUD for todo model', async () => {
    const created = await prisma.todo.create({ data: { title: 'db todo' } });
    expect(created.id).toBeTruthy();

    const found = await prisma.todo.findUnique({ where: { id: created.id } });
    expect(found?.title).toBe('db todo');

    const updated = await prisma.todo.update({
      where: { id: created.id },
      data: { completed: true }
    });
    expect(updated.completed).toBe(true);

    await prisma.todo.delete({ where: { id: created.id } });

    const deleted = await prisma.todo.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });
});
