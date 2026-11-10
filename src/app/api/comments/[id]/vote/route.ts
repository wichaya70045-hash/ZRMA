import { NextRequest, NextResponse } from 'next/server';
import { voteComment } from '@/lib/db';

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

    const result = voteComment(id, type, prevVote);
    if (!result) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error voting comment:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
