import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

let prisma: PrismaClient;
let testDbPath: string;

export async function setupTestDb(): Promise<PrismaClient> {
  if (prisma) {
    await prisma.$disconnect();
  }

  const testId = `test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  testDbPath = path.join(process.cwd(), 'prisma', `${testId}.db`);

  prisma = new PrismaClient({
    datasources: {
      db: { url: `file:./${testId}.db` },
    },
  });

  await prisma.$connect();

  const migrationPath = path.join(process.cwd(), 'prisma', 'migrations');
  const entries = fs.readdirSync(migrationPath, { withFileTypes: true });
  const migrationDirs = entries
    .filter((e) => e.isDirectory() && !e.name.includes('.'))
    .map((e) => e.name)
    .sort();

  for (const dir of migrationDirs) {
    const migrationFile = path.join(migrationPath, dir, 'migration.sql');
    if (fs.existsSync(migrationFile)) {
      const raw = fs.readFileSync(migrationFile, 'utf-8');
      const sql = raw
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n');

      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        await prisma.$executeRawUnsafe(stmt);
      }
    }
  }

  return prisma;
}

export async function teardownTestDb(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }

  if (testDbPath) {
    const suffixes = ['', '-wal', '-shm'];
    for (const suffix of suffixes) {
      try { fs.unlinkSync(testDbPath + suffix); } catch { /* ignore */ }
    }
  }
}

export async function clearTestDb(): Promise<void> {
  if (!prisma) return;

  await prisma.$executeRawUnsafe('DELETE FROM sale_items');
  await prisma.$executeRawUnsafe('DELETE FROM sales');
  await prisma.$executeRawUnsafe('DELETE FROM inventory');
  await prisma.$executeRawUnsafe('DELETE FROM products');
  await prisma.$executeRawUnsafe('DELETE FROM cash_registers');
  await prisma.$executeRawUnsafe('DELETE FROM contacts');
  await prisma.$executeRawUnsafe('DELETE FROM users');
  await prisma.$executeRawUnsafe('DELETE FROM stores');
  await prisma.$executeRawUnsafe('DELETE FROM companies');
}

export function getPrisma(): PrismaClient {
  if (!prisma) {
    throw new Error('Test database not initialized.');
  }
  return prisma;
}
