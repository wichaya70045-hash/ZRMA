import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getChatMessages, sendChatMessage } from '@/lib/db';
import { broadcastToRoom } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room') || 'global';
    const messages = getChatMessages(room);

    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error('Error fetching chat messages:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { room_id = 'global', content, author_alias, author_avatar } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'ข้อความแชทต้องไม่ว่างเปล่า' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'ข้อความยาวเกินกำหนด (สูงสุด 500 ตัวอักษร)' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const message = sendChatMessage({
      id,
      room_id,
      content: content.trim(),
      author_alias: author_alias || 'ผู้ไม่ประสงค์ออกนาม #????',
      author_avatar: author_avatar || '🥷',
    });

    // Broadcast in real-time to all connected users in this room
    broadcastToRoom(`chat_${room_id}`, 'chat_message', message);

    return NextResponse.json({ message }, { status: 201 });
  } catch (err: any) {
    console.error('Error sending chat message:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
