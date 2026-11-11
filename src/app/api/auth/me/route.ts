import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, hashPassword, verifyPassword } from '@/lib/auth';
import { getUserWithPasswordById, updateUserPassword, updateUserProfile } from '@/lib/db';
import type { AvatarFrame, BannerTheme, NameColor } from '@/types';

const VALID_FRAMES: AvatarFrame[] = ['none', 'crimson', 'amber', 'emerald', 'rainbow', 'neon'];
const VALID_BANNERS: BannerTheme[] = ['obsidian', 'crimson-grid', 'amber-cyber', 'aurora', 'sunset'];
const VALID_NAME_COLORS: NameColor[] = ['default', 'red', 'amber', 'emerald', 'cyan', 'purple', 'pink'];
const VALID_ICONS = ['shield', 'terminal', 'cpu', 'radar', 'key', 'lock', 'fingerprint', 'eye-off', 'binary', 'globe'];

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }
  return NextResponse.json({ authenticated: true, user });
}

export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
    }

    const body = await req.json();

    // Optional password update
    if (body.new_password) {
      const currentPassword = String(body.current_password || '');
      const newPassword = String(body.new_password || '');
      if (newPassword.length < 6 || newPassword.length > 128) {
        return NextResponse.json(
          { error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
          { status: 400 }
        );
      }
      const fullRecord = getUserWithPasswordById(sessionUser.id);
      if (!fullRecord || !verifyPassword(currentPassword, fullRecord.password_hash)) {
        return NextResponse.json(
          { error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' },
          { status: 400 }
        );
      }
      updateUserPassword(sessionUser.id, hashPassword(newPassword));
    }

    const updates: Parameters<typeof updateUserProfile>[1] = {};

    if (body.display_name !== undefined) {
      const dn = String(body.display_name).trim();
      if (!dn || dn.length > 40) {
        return NextResponse.json(
          { error: 'ชื่อที่แสดงต้องมี 1–40 ตัวอักษร' },
          { status: 400 }
        );
      }
      updates.display_name = dn;
    }

    if (body.bio !== undefined) {
      updates.bio = String(body.bio).trim().slice(0, 240);
    }

    if (body.avatar_icon !== undefined) {
      const icon = String(body.avatar_icon).trim().toLowerCase();
      updates.avatar_icon = VALID_ICONS.includes(icon) ? icon : 'shield';
    }

    if (body.avatar_url !== undefined) {
      const rawUrl = body.avatar_url ? String(body.avatar_url).trim() : '';
      if (
        rawUrl &&
        !rawUrl.startsWith('/uploads/') &&
        !rawUrl.startsWith('https://') &&
        !rawUrl.startsWith('http://')
      ) {
        return NextResponse.json(
          { error: 'URL รูปโปรไฟล์ไม่ถูกต้อง (รองรับเฉพาะไฟล์ที่อัปโหลดหรือ http/https)' },
          { status: 400 }
        );
      }
      updates.avatar_url = rawUrl ? rawUrl.slice(0, 300) : null;
    }

    if (body.avatar_frame !== undefined) {
      const frame = String(body.avatar_frame) as AvatarFrame;
      if (!VALID_FRAMES.includes(frame)) {
        return NextResponse.json({ error: 'กรอบโปรไฟล์ไม่ถูกต้อง' }, { status: 400 });
      }
      updates.avatar_frame = frame;
    }

    if (body.banner_theme !== undefined) {
      const banner = String(body.banner_theme) as BannerTheme;
      if (!VALID_BANNERS.includes(banner)) {
        return NextResponse.json({ error: 'ธีมแบนเนอร์ไม่ถูกต้อง' }, { status: 400 });
      }
      updates.banner_theme = banner;
    }

    if (body.name_color !== undefined) {
      const color = String(body.name_color) as NameColor;
      if (!VALID_NAME_COLORS.includes(color)) {
        return NextResponse.json({ error: 'สีชื่อไม่ถูกต้อง' }, { status: 400 });
      }
      updates.name_color = color;
    }

    if (body.custom_badge !== undefined) {
      const badge = body.custom_badge ? String(body.custom_badge).trim().slice(0, 24) : null;
      updates.custom_badge = badge;
    }

    const updated = updateUserProfile(sessionUser.id, updates);
    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error('PUT /api/auth/me error:', err);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตโปรไฟล์ได้' }, { status: 500 });
  }
}
