import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getThreads, createThread } from '@/lib/db';
import { verifyCaptcha } from '@/lib/captcha';
import { broadcastToRoom } from '@/lib/sse';
import { Category, RedditSort } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const rawSort = searchParams.get('sort') || 'hot';
    
    // Map legacy 'latest' to Reddit 'new'
    let sort: RedditSort = 'hot';
    if (rawSort === 'latest' || rawSort === 'new') {
      sort = 'new';
    } else if (rawSort === 'top' || rawSort === 'rising' || rawSort === 'breaking') {
      sort = rawSort;
    }

    const threads = getThreads(category, sort);
    return NextResponse.json({ threads });
  } catch (err: any) {
    console.error('Error fetching threads:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      content,
      category,
      flair,
      source_url,
      media_url,
      media_type,
      author_alias,
      author_avatar,
      expires_hours,
      captcha_token,
      captcha_answer,
    } = body;

    // Validate Anti-Spam Captcha
    if (!verifyCaptcha(captcha_token, captcha_answer)) {
      return NextResponse.json(
        { error: 'คำตอบเพื่อยืนยันความปลอดภัยไม่ถูกต้องหรือหมดอายุแล้ว กรุณาลองใหม่อีกครั้ง' },
        { status: 400 }
      );
    }

    // Input Validation
    if (!title || !title.trim() || title.length < 5 || title.length > 200) {
      return NextResponse.json(
        { error: 'หัวข้อกระทู้ต้องมีความยาวระหว่าง 5 ถึง 200 ตัวอักษร' },
        { status: 400 }
      );
    }

    if (!content || !content.trim() || content.length < 10) {
      return NextResponse.json(
        { error: 'เนื้อหากระทู้ต้องมีความยาวอย่างน้อย 10 ตัวอักษร' },
        { status: 400 }
      );
    }

    // Process r/ category slug
    const rawCategory = (category || 'general').trim().replace(/^r\//i, '').toLowerCase();
    const cleanCategory = rawCategory.replace(/[^a-z0-9_\-]/g, '') || 'general';

    const validHours = [24, 72, 168]; // 24h, 3 days, 7 days
    const hours = validHours.includes(Number(expires_hours)) ? Number(expires_hours) : 72;

    const validatedMediaType = (media_type === 'image' || media_type === 'video') ? media_type : null;

    const id = crypto.randomUUID();
    const newThread = createThread({
      id,
      title: title.trim(),
      content: content.trim(),
      category: cleanCategory,
      flair: flair ? flair.trim() : null,
      source_url: source_url ? source_url.trim() : null,
      media_url: media_url ? media_url.trim() : null,
      media_type: validatedMediaType,
      author_alias: author_alias ? author_alias.trim() : 'u/ผู้ไม่ประสงค์ออกนาม #????',
      author_avatar: author_avatar || 'terminal',
      expires_hours: hours,
    });

    // Broadcast new thread event
    broadcastToRoom('global', 'new_thread', newThread);

    return NextResponse.json({ thread: newThread }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating thread:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
