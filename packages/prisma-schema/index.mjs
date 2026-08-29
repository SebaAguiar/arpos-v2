import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const cjs = require('./generated/index.js');

export const PrismaClient = cjs.PrismaClient;
export const Prisma = cjs.Prisma;
