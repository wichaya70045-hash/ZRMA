import { NextRequest, NextResponse } from 'next/server';
import { getThreadById } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const thread = getThreadById(id);

    if (!thread) {
      return NextResponse.json(
        { error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุและถูกลบไปแล้วตามนโยบายความเป็นส่วนตัว' },
        { status: 404 }
      );
    }

    return NextResponse.json({ thread });
  } catch (err: any) {
    console.error('Error fetching thread:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
