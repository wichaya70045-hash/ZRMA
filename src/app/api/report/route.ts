import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { reportContent } from '@/lib/db';
import { broadcastToRoom } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target_type, target_id, reason } = body;

    if (!target_type || !target_id || !reason) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    if (!['thread', 'comment', 'chat'].includes(target_type)) {
      return NextResponse.json({ error: 'ประเภทเป้าหมายไม่ถูกต้อง' }, { status: 400 });
    }

    const reportId = crypto.randomUUID();
    const result = reportContent({
      id: reportId,
      target_type,
      target_id,
      reason,
    });

    // If item was hidden, broadcast update so everyone's UI immediately masks it!
    if (result.isHidden) {
      if (target_type === 'chat') {
        broadcastToRoom('chat_global', 'message_hidden', { id: target_id });
      } else {
        broadcastToRoom('global', 'content_hidden', { target_type, id: target_id });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'ส่งรายงานเรียบร้อยแล้ว ขอบคุณที่ช่วยดูแลความเรียบร้อยของชุมชน',
      ...result,
    });
  } catch (err: any) {
    console.error('Error reporting content:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
