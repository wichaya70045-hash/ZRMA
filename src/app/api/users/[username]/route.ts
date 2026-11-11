import { NextRequest, NextResponse } from 'next/server';
import { getPublicProfileByUsername } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const data = getPublicProfileByUsername(decodeURIComponent(username));
    if (!data) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งานนี้' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('GET /api/users/[username] error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการโหลดโปรไฟล์' }, { status: 500 });
  }
}
