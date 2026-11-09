import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getGhostRooms, createGhostRoom, destroyGhostRoom, getGhostRoom } from '@/lib/db';
import { broadcastToRoom } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rooms = getGhostRooms();
    return NextResponse.json({ rooms });
  } catch (err: any) {
    console.error('Error fetching ghost rooms:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { name, title, topic, creator_alias } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อห้องแชทชั่วคราว' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const cleanName = (name || `ghost-${Math.floor(Math.random() * 9000 + 1000)}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_\-]/g, '');

    const room = createGhostRoom({
      id,
      name: cleanName,
      title: title.trim(),
      topic: topic ? topic.trim() : null,
      creator_alias: creator_alias || 'u/วิญญาณนิรนาม',
    });

    // Broadcast new ghost room to global chat listeners
    broadcastToRoom('chat_global', 'new_ghost_room', room);

    return NextResponse.json({ room }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating ghost room:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
