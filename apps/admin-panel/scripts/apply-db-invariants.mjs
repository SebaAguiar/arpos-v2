import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const INVARIANTS = [
  `CREATE UNIQUE INDEX IF NOT EXISTS clients_email_lower_trim_unique
   ON clients (lower(trim(email)))`,
];

for (const sql of INVARIANTS) {
  await db.$executeRawUnsafe(sql);
  console.log('applied:', sql.replace(/\s+/g, ' ').trim());
}

await db.$disconnect();
