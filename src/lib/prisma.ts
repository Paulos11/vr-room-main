// src/lib/prisma.ts - Updated with development optimizations
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // ✅ ADD LOGGING FOR DEVELOPMENT
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  
  // ✅ ADD TRANSACTION OPTIONS TO PREVENT P2028 ERRORS
  transactionOptions: {
    maxWait: 20000, // Maximum time to wait for a transaction slot (20 seconds)
    timeout: 30000, // Maximum time a transaction can run (30 seconds)
    isolationLevel: 'ReadCommitted', // Less strict isolation for better performance
  },
  
  // ✅ OPTIONAL: Add datasource configuration if needed
  // datasources: {
  //   db: {
  //     url: process.env.DATABASE_URL,
  //   },
  // },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma