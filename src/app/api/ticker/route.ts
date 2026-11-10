import { NextResponse } from 'next/server';
import { getTickerItems } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = getTickerItems();
    return NextResponse.json({ items });
  } catch (err: any) {
    console.error('Error fetching ticker items:', err);
    return NextResponse.json({ error: 'Internal server error', items: [] }, { status: 500 });
  }
}
