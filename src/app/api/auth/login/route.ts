import { NextRequest, NextResponse } from 'next/server';
import { getUserWithPasswordByUsername } from '@/lib/db';
import { verifyPassword, attachSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!username || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอก Username และรหัสผ่าน' },
        { status: 400 }
      );
    }

    const record = getUserWithPasswordByUsername(username);
    if (!record || !verifyPassword(password, record.password_hash)) {
      return NextResponse.json(
        { error: 'Username หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const { password_hash: _ignored, ...user } = record;
    const res = NextResponse.json({ success: true, user });
    attachSessionCookie(res, user.id, req);
    return res;
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }, { status: 500 });
  }
}
