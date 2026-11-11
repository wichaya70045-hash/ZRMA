import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getThreads, createThread } from '@/lib/db';
import { verifyCaptcha } from '@/lib/captcha';
import { getSessionUser } from '@/lib/auth';
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
    if (!title || !title.trim() || title.length > 200) {
      return NextResponse.json(
        { error: 'กรุณาระบุหัวข้อกระทู้ (ความยาวไม่เกิน 200 ตัวอักษร)' },
        { status: 400 }
      );
    }

    const cleanContent = typeof content === 'string' ? content.trim() : '';

    // Process z/ category slug
    const rawCategory = (category || 'general').trim().replace(/^[zr]\//i, '').toLowerCase();
    const cleanCategory = rawCategory.replace(/[^a-z0-9_\-]/g, '') || 'general';

    const validHours = [24, 72, 168]; // 24h, 3 days, 7 days
    const hours = validHours.includes(Number(expires_hours)) ? Number(expires_hours) : 72;

    const validatedMediaType = (media_type === 'image' || media_type === 'video') ? media_type : null;

    const isPinned = (body.is_pinned === 1 || body.is_pinned === true || body.pin_breaking === true) ? 1 : 0;

    // Process Poll data if enabled
    let pollDataString: string | null = null;
    if (body.has_poll === true || body.poll) {
      const rawOptions = Array.isArray(body.poll_options)
        ? body.poll_options
        : Array.isArray(body.poll?.options)
        ? body.poll.options.map((o: any) => (typeof o === 'string' ? o : o.text))
        : [];

      const cleanOptions = rawOptions
        .map((opt: any) => (typeof opt === 'string' ? opt.trim() : String(opt?.text || '').trim()))
        .filter(Boolean);

      if (cleanOptions.length < 2) {
        return NextResponse.json(
          { error: 'โพลสำรวจความคิดเห็นต้องมีตัวเลือกอย่างน้อย 2 ตัวเลือก' },
          { status: 400 }
        );
      }

      if (cleanOptions.length > 8) {
        return NextResponse.json(
          { error: 'โพลสามารถมีตัวเลือกได้สูงสุดไม่เกิน 8 ตัวเลือก' },
          { status: 400 }
        );
      }

      const pollQuestion = body.poll_question?.trim() || body.poll?.question?.trim() || null;
      const pollPayload = {
        question: pollQuestion,
        options: cleanOptions.map((text: string, idx: number) => ({
          id: idx + 1,
          text,
          votes: 0,
        })),
        total_votes: 0,
        closed: false,
      };
      pollDataString = JSON.stringify(pollPayload);
    }

    const sessionUser = await getSessionUser(req);
    const useAccountIdentity = Boolean(sessionUser && body.post_anonymously !== true);

    const id = crypto.randomUUID();
    const token = body.edit_token?.trim() || crypto.randomBytes(16).toString('hex');
    const newThread = createThread({
      id,
      title: title.trim(),
      content: cleanContent,
      category: cleanCategory,
      flair: flair ? flair.trim() : null,
      source_url: source_url ? source_url.trim() : null,
      media_url: media_url ? media_url.trim() : null,
      media_type: validatedMediaType,
      poll_data: pollDataString,
      author_alias: useAccountIdentity
        ? sessionUser!.display_name
        : (author_alias ? author_alias.trim() : 'u/ผู้ไม่ประสงค์ออกนาม #????'),
      author_avatar: useAccountIdentity
        ? sessionUser!.avatar_icon
        : (author_avatar || 'terminal'),
      author_user_id: useAccountIdentity ? sessionUser!.id : null,
      is_pinned: isPinned,
      expires_hours: hours,
      edit_token: token,
    });

    // Broadcast new thread event
    broadcastToRoom('global', 'new_thread', newThread);

    return NextResponse.json({ thread: newThread, edit_token: token }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating thread:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
