import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getResolvedDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_POSTGRES_PRISMA_URL ||
    undefined
  );
}

export function getDatabaseConfigStatus(): {
  hasUrl: boolean;
  isVercel: boolean;
  isLocalhostOnVercel: boolean;
} {
  const url = getResolvedDatabaseUrl();
  const isVercel = Boolean(process.env.VERCEL);
  const isLocalhost = Boolean(url && /(?:localhost|127\.0\.0\.1|::1)/i.test(url));
  return {
    hasUrl: Boolean(url),
    isVercel,
    isLocalhostOnVercel: isVercel && isLocalhost,
  };
}

export function formatDbError(err: unknown, fallback = 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล PostgreSQL'): string {
  const status = getDatabaseConfigStatus();
  if (!status.hasUrl || status.isLocalhostOnVercel) {
    return 'ยังไม่ได้ตั้งค่า Cloud PostgreSQL (DATABASE_URL) บน Vercel หรือยังชี้ไปที่ localhost — กรุณาเชื่อมต่อฐานข้อมูล Cloud (เช่น Neon, Supabase, Vercel Postgres) ใน Vercel Environment Variables';
  }

  const anyErr = err as { code?: string; message?: string } | undefined;
  const code = anyErr?.code || '';
  const msg = String(anyErr?.message || '');

  if (code === 'P2021' || code === 'P2022' || /does not exist/i.test(msg)) {
    return 'ยังไม่มีตารางข้อมูลใน PostgreSQL (P2021) กรุณาตรวจสอบ Build Logs หรือรัน npx prisma db push กับฐานข้อมูล Cloud ของคุณ';
  }
  if (code === 'P1000' || /Authentication failed/i.test(msg)) {
    return 'ข้อมูลรับรอง (Username/Password) ของ PostgreSQL ใน DATABASE_URL ไม่ถูกต้อง';
  }
  if (code === 'P1001' || code === 'P1002' || /Can't reach database server/i.test(msg)) {
    return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ PostgreSQL ได้ กรุณาตรวจสอบ DATABASE_URL, SSL mode (?sslmode=require) และสถานะฐานข้อมูล';
  }

  return fallback;
}

const resolvedUrl = getResolvedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(resolvedUrl ? { datasources: { db: { url: resolvedUrl } } } : {}),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Always cache singleton on globalThis (including Vercel serverless warm containers)
globalForPrisma.prisma = prisma;

export default prisma;
