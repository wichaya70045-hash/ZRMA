import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createUser, getUserByUsername } from '@/lib/db';
import { hashPassword, attachSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUsername = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const rawDisplayName = String(body.display_name || '').trim();
    const avatarIcon = String(body.avatar_icon || 'shield').trim();

    if (!/^[a-z0-9_]{3,24}$/.test(rawUsername)) {
      return NextResponse.json(
        { error: 'Username ต้องเป็นภาษาอังกฤษพิมพ์เล็ก ตัวเลข หรือ _ ความยาว 3–24 ตัวอักษร' },
        { status: 400 }
      );
    }

    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      );
    }

    const existing = getUserByUsername(rawUsername);
    if (existing) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น' },
        { status: 409 }
      );
    }

    const displayName = (rawDisplayName || rawUsername).slice(0, 40);
    const passwordHash = hashPassword(password);
    const id = `usr-${crypto.randomUUID().slice(0, 12)}`;

    const user = createUser({
      id,
      username: rawUsername,
      display_name: displayName,
      password_hash: passwordHash,
      avatar_icon: avatarIcon,
    });

    const res = NextResponse.json({ success: true, user }, { status: 201 });
    attachSessionCookie(res, user.id, req);
    return res;
  } catch (err) {
    console.error('POST /api/auth/register error:', err);
    return NextResponse.json({ error: 'ไม่สามารถสมัครสมาชิกได้' }, { status: 500 });
  }
}
