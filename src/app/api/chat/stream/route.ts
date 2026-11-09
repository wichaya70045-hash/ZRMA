import { NextRequest } from 'next/server';
import { subscribeToRoom } from '@/lib/sse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get('room') || 'global';
  const roomChannel = `chat_${room}`;

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Initial connection message
  writer.write(encoder.encode(`: connected to room ${room}\n\n`));

  const unsubscribe = subscribeToRoom(roomChannel, (data) => {
    try {
      const msg = `event: ${data.event}\ndata: ${JSON.stringify(data.payload)}\n\n`;
      writer.write(encoder.encode(msg));
    } catch {
      // client may have disconnected
    }
  });

  // Keep-alive heartbeat every 15 seconds
  const pingInterval = setInterval(() => {
    try {
      writer.write(encoder.encode(`: ping\n\n`));
    } catch {
      clearInterval(pingInterval);
      unsubscribe();
    }
  }, 15000);

  req.signal.addEventListener('abort', () => {
    clearInterval(pingInterval);
    unsubscribe();
    try {
      writer.close();
    } catch {
      // ignore
    }
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
