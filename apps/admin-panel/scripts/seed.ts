/**
 * Seed script: creates the initial admin user and default products.
 * Run with: bun run seed
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createHash, randomBytes, randomUUID } from 'crypto';
import * as schema from '../src/database/schema';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(salt + password)
    .digest('hex');
  return `${hash}:${salt}`;
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });

  console.log('🌱 Seeding database...');

  // Admin user
  const adminId = randomUUID();
  const adminPasswordHash = hashPassword('admin123');

  await db
    .insert(schema.adminUsers)
    .values({
      id: adminId,
      email: 'admin@arcom.app',
      passwordHash: adminPasswordHash,
      name: 'Admin',
      role: 'superadmin',
      active: true,
    })
    .onConflictDoNothing();

  console.log('✅ Admin user: admin@arcom.app / admin123');

  // Products
  const products = [
    { id: randomUUID(), name: 'Arcom POS', type: 'saas' },
    { id: randomUUID(), name: 'Arcom Custom', type: 'custom' },
  ];

  for (const p of products) {
    await db
      .insert(schema.products)
      .values(p)
      .onConflictDoNothing();
  }

  console.log(`✅ ${products.length} products created`);
  console.log('🌱 Seed complete');

  await client.end();
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
