// In-memory Server-Sent Events (SSE) Hub for instant real-time broadcasts
// Zero persistent logs, zero user tracking

type Listener = (data: { event: string; payload: any }) => void;

interface RoomHub {
  listeners: Set<Listener>;
}

declare global {
  // eslint-disable-next-line no-var
  var __sseRooms: Map<string, RoomHub> | undefined;
}

function getRooms(): Map<string, RoomHub> {
  if (!global.__sseRooms) {
    global.__sseRooms = new Map();
  }
  return global.__sseRooms;
}

export function subscribeToRoom(roomId: string, listener: Listener): () => void {
  const rooms = getRooms();
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { listeners: new Set() });
  }

  const room = rooms.get(roomId)!;
  room.listeners.add(listener);

  // Return unsubscribe callback
  return () => {
    room.listeners.delete(listener);
    if (room.listeners.size === 0) {
      rooms.delete(roomId);
    }
  };
}

export function broadcastToRoom(roomId: string, event: string, payload: any): void {
  const rooms = getRooms();
  const room = rooms.get(roomId);
  if (!room) return;

  for (const listener of room.listeners) {
    try {
      listener({ event, payload });
    } catch {
      // ignore
    }
  }
}

export function getActiveListenersCount(roomId: string = 'global'): number {
  const rooms = getRooms();
  const room = rooms.get(roomId);
  return room ? room.listeners.size : 0;
}
