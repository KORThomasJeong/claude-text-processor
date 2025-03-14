import { PrismaClient } from '@prisma/client';

// PrismaClient는 싱글톤으로 관리
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#prismaclient-in-long-running-applications

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
