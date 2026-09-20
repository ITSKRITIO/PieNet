import { PrismaClient } from '@prisma/client'

const g = globalThis as unknown as { __piePrisma?: PrismaClient }

export const prisma: PrismaClient =
  g.__piePrisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'] })

g.__piePrisma = prisma
