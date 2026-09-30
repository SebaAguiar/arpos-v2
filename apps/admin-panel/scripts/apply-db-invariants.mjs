// Import from @arcom/prisma-schema, not @prisma/client: this app does not
// depend on @prisma/client, it depends on the workspace package that wraps
// the generated client (see src/server/db.ts). The bare specifier resolves
// to nothing under pnpm's isolated node_modules and throws
// ERR_MODULE_NOT_FOUND before a single query runs.
import { PrismaClient } from '@arcom/prisma-schema';

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
