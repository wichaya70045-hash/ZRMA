import { NextResponse } from 'next/server';
import prisma, { formatDbError, getDatabaseConfigStatus } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getDatabaseConfigStatus();

  if (!config.hasUrl || config.isLocalhostOnVercel) {
    return NextResponse.json(
      {
        ok: false,
        environment: config.isVercel ? 'vercel' : 'local',
        databaseConfigured: false,
        error: formatDbError(null),
      },
      { status: 500 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const threadCount = await prisma.thread.count();
    return NextResponse.json({
      ok: true,
      environment: config.isVercel ? 'vercel' : 'local',
      databaseConfigured: true,
      threadCount,
    });
  } catch (err) {
    console.error('GET /api/health error:', err);
    return NextResponse.json(
      {
        ok: false,
        environment: config.isVercel ? 'vercel' : 'local',
        databaseConfigured: true,
        error: formatDbError(err),
      },
      { status: 500 }
    );
  }
}
