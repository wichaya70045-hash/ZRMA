import { NextRequest, NextResponse } from 'next/server';
import { voteThreadPoll, getThreadById } from '@/lib/db';
import { broadcastToRoom } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { option_id } = body;

    if (option_id === undefined || option_id === null || isNaN(Number(option_id))) {
      return NextResponse.json(
        { error: 'กรุณาระบุตัวเลือกที่ต้องการโหวต (option_id)' },
        { status: 400 }
      );
    }

    const result = voteThreadPoll(id, Number(option_id));
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'ไม่สามารถลงคะแนนได้' }, { status: 400 });
    }

    // Broadcast poll update to real-time subscribers
    broadcastToRoom('global', 'poll_voted', {
      thread_id: id,
      poll: result.poll,
    });

    return NextResponse.json({
      success: true,
      poll: result.poll,
    });
  } catch (err: any) {
    console.error('Error voting on poll:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
