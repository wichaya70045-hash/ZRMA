import { NextRequest, NextResponse } from 'next/server';
import { voteThread } from '@/lib/db';
import { broadcastToRoom } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const type = body.type === 'down' ? 'down' : body.type === 'cancel' ? 'cancel' : 'up';
    const prevVote = body.prev_vote || body.previous_vote || undefined;

    const result = voteThread(id, type, prevVote);
    if (!result) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    broadcastToRoom(`thread_${id}`, 'vote_update', { id, ...result });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error voting thread:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
