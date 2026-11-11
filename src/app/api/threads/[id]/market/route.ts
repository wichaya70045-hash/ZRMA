import { NextRequest, NextResponse } from 'next/server';
import { toggleMarketStatus } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { broadcastToRoom } from '@/lib/sse';
import type { MarketStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params;
    const body = await req.json();
    const sessionUser = await getSessionUser(req);

    if (body.action === 'toggle_status') {
      const nextStatus: MarketStatus = body.status === 'sold' ? 'sold' : 'available';
      const result = toggleMarketStatus(
        threadId,
        nextStatus,
        body.edit_token ? String(body.edit_token).trim() : null,
        sessionUser?.id || null
      );

      if (!result.success || !result.market) {
        return NextResponse.json(
          { error: result.error || 'ไม่สามารถเปลี่ยนสถานะสินค้าได้' },
          { status: 403 }
        );
      }

      broadcastToRoom(`thread_${threadId}`, 'market_updated', result.market);
      return NextResponse.json({ success: true, market: result.market });
    }

    return NextResponse.json({ error: 'คำขอไม่ถูกต้อง' }, { status: 400 });
  } catch (err) {
    console.error('POST /api/threads/[id]/market error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในระบบซื้อขาย' }, { status: 500 });
  }
}
