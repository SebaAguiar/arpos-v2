/**
 * Seed script: creates the initial admin user and default products.
 * Run with: bun run seed
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import * as schema from '../src/database/schema';

const BCRYPT_ROUNDS = 12;

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });

  console.log('🌱 Seeding database...');

  // Admin user
  const adminId = randomUUID();
  const adminPasswordHash = await bcrypt.hash('admin123', BCRYPT_ROUNDS);

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
