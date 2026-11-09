import { NextRequest, NextResponse } from 'next/server';
import { getGhostRoom, destroyGhostRoom, updateGhostRoomPresence } from '@/lib/db';
import { broadcastToRoom } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const room = getGhostRoom(name);
    if (!room || room.is_destroyed === 1) {
      return NextResponse.json({ error: 'ห้องนี้ถูกทำลายและสลายตัวไปแล้ว', is_destroyed: true }, { status: 404 });
    }
    return NextResponse.json({ room });
  } catch (err: any) {
    console.error('Error fetching ghost room:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const body = await req.json();
    const { action, active_count } = body;

    const room = getGhostRoom(name);
    if (!room || room.is_destroyed === 1) {
      return NextResponse.json({ destroyed: true });
    }

    if (action === 'leave' && (active_count === undefined || active_count <= 0)) {
      // Room is empty! Destroy it immediately!
      destroyGhostRoom(name);
      broadcastToRoom(`chat_ghost_${name}`, 'room_destroyed', {
        reason: 'ผู้ใช้งานทุกคนออกจากห้องแล้ว ห้องและข้อความถูกลบทำลายตัวเองเรียบร้อย'
      });
      return NextResponse.json({ destroyed: true });
    }

    if (typeof active_count === 'number') {
      updateGhostRoomPresence(name, active_count);
      broadcastToRoom(`chat_ghost_${name}`, 'presence_update', { active_users: active_count });
    }

    return NextResponse.json({ success: true, active_users: active_count });
  } catch (err: any) {
    console.error('Error updating ghost room presence:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    destroyGhostRoom(name);
    broadcastToRoom(`chat_ghost_${name}`, 'room_destroyed', {
      reason: 'ห้องถูกสั่งทำลายตัวเองเรียบร้อยแล้ว'
    });
    return NextResponse.json({ success: true, message: 'ห้องและข้อความถูกลบทำลายถาวรแล้ว' });
  } catch (err: any) {
    console.error('Error destroying ghost room:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
