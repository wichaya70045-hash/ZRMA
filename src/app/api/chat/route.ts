import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getChatMessages, sendChatMessage, updateChatMessage, deleteChatMessage } from '@/lib/db';
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
    const { room_id = 'global', content, author_alias, author_avatar, edit_token } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'ข้อความแชทต้องไม่ว่างเปล่า' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'ข้อความยาวเกินกำหนด (สูงสุด 500 ตัวอักษร)' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const token = edit_token || crypto.randomBytes(12).toString('hex');
    const message = sendChatMessage({
      id,
      room_id,
      content: content.trim(),
      author_alias: author_alias || 'ผู้ไม่ประสงค์ออกนาม #????',
      author_avatar: author_avatar || '🥷',
      edit_token: token,
    });

    // Broadcast in real-time to all connected users in this room
    broadcastToRoom(`chat_${room_id}`, 'chat_message', message);

    return NextResponse.json({ message, edit_token: token }, { status: 201 });
  } catch (err: any) {
    console.error('Error sending chat message:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, room_id = 'global', content, author_alias, edit_token } = body;

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบรหัสข้อความที่ต้องการแก้ไข' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'ข้อความแชทต้องไม่ว่างเปล่า' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'ข้อความยาวเกินกำหนด (สูงสุด 500 ตัวอักษร)' }, { status: 400 });
    }

    const result = updateChatMessage(id, {
      content: content.trim(),
      author_alias,
      edit_token,
    });

    if (!result.success || !result.message) {
      return NextResponse.json({ error: result.error || 'ไม่สามารถแก้ไขข้อความได้' }, { status: 403 });
    }

    // Broadcast update in real-time
    broadcastToRoom(`chat_${room_id}`, 'chat_edited', result.message);

    return NextResponse.json({ success: true, message: result.message });
  } catch (err: any) {
    console.error('Error editing chat message:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    let room_id = searchParams.get('room') || 'global';
    let edit_token = searchParams.get('token');
    let author_alias: string | undefined = undefined;

    try {
      const body = await req.json();
      if (body.id) id = body.id;
      if (body.room_id) room_id = body.room_id;
      if (body.edit_token) edit_token = body.edit_token;
      if (body.author_alias) author_alias = body.author_alias;
    } catch {}

    if (!id) {
      return NextResponse.json({ error: 'ไม่พบรหัสข้อความที่ต้องการลบ' }, { status: 400 });
    }

    const result = deleteChatMessage(id, author_alias, edit_token || undefined);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'ไม่สามารถลบข้อความได้' }, { status: 403 });
    }

    // Broadcast deletion in real-time
    broadcastToRoom(`chat_${room_id}`, 'chat_deleted', { id });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error deleting chat message:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
