import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getThreads, createThread } from '@/lib/db';
import { verifyCaptcha } from '@/lib/captcha';
import { getSessionUser } from '@/lib/auth';
import { broadcastToRoom } from '@/lib/sse';
import { generateRandomAlias } from '@/lib/privacy';
import { Category, RedditSort, JobType, JobWorkMode, MarketCondition, MarketStatus, MarketDelivery } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const rawSort = searchParams.get('sort') || 'hot';
    const rawJobType = searchParams.get('job_type');
    const onlyJobs = searchParams.get('only_jobs') === '1';
    const rawCondition = searchParams.get('condition');
    const rawMarketStatus = searchParams.get('market_status');
    const onlyMarket = searchParams.get('only_market') === '1';

    // Map legacy 'latest' to Reddit 'new'
    let sort: RedditSort = 'hot';
    if (rawSort === 'latest' || rawSort === 'new') {
      sort = 'new';
    } else if (rawSort === 'top' || rawSort === 'rising' || rawSort === 'breaking') {
      sort = rawSort;
    }

    const jobType: JobType | undefined =
      rawJobType === 'hiring' || rawJobType === 'seeking' ? rawJobType : undefined;

    const condition: MarketCondition | undefined =
      rawCondition === 'new' || rawCondition === 'like_new' || rawCondition === 'used' || rawCondition === 'digital'
        ? rawCondition
        : undefined;

    const marketStatus: MarketStatus | undefined =
      rawMarketStatus === 'available' || rawMarketStatus === 'sold'
        ? rawMarketStatus
        : undefined;

    const threads = getThreads(
      category,
      sort,
      { onlyJobs, jobType },
      { onlyMarket, condition, status: marketStatus }
    );
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

    // Validate Anti-Spam Captcha (optional - only enforced if client explicitly provided a token)
    if (captcha_token && !verifyCaptcha(captcha_token, captcha_answer)) {
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

    // Process Job listing data if enabled
    let jobDataString: string | null = null;
    if (body.has_job === true || body.job) {
      const rawJob = body.job || body;
      const jobType: JobType = rawJob.job_type === 'seeking' ? 'seeking' : 'hiring';
      const rawMode = String(rawJob.work_mode || 'remote');
      const workMode: JobWorkMode =
        rawMode === 'onsite' || rawMode === 'hybrid' ? rawMode : 'remote';
      const rawSkills = Array.isArray(rawJob.skills)
        ? rawJob.skills
        : typeof rawJob.skills === 'string'
        ? rawJob.skills.split(',')
        : [];
      const cleanSkills = rawSkills
        .map((s: any) => String(s).trim())
        .filter(Boolean)
        .slice(0, 8);

      jobDataString = JSON.stringify({
        job_type: jobType,
        budget: rawJob.budget ? String(rawJob.budget).trim().slice(0, 80) : null,
        work_mode: workMode,
        skills: cleanSkills,
        contact_info: rawJob.contact_info ? String(rawJob.contact_info).trim().slice(0, 160) : null,
        status: 'open',
        applications: [],
        application_count: 0,
      });
    }

    // Process Marketplace listing data if enabled
    let marketDataString: string | null = null;
    if (body.has_market === true || body.market) {
      const rawMarket = body.market || body;
      const rawCond = String(rawMarket.condition || rawMarket.market_condition || 'used');
      const condition: MarketCondition =
        rawCond === 'new' || rawCond === 'like_new' || rawCond === 'digital' ? rawCond : 'used';
      const rawDel = String(rawMarket.delivery || rawMarket.market_delivery || 'shipping');
      const delivery: MarketDelivery =
        rawDel === 'meetup' || rawDel === 'online' ? rawDel : 'shipping';

      const itemName = rawMarket.item_name || rawMarket.market_item_name || title;
      const priceVal = rawMarket.price !== undefined && rawMarket.price !== null
        ? rawMarket.price
        : rawMarket.market_price;
      const locVal = rawMarket.location || rawMarket.market_location;
      const contactVal = rawMarket.contact_info || rawMarket.market_contact_info;

      marketDataString = JSON.stringify({
        item_name: itemName ? String(itemName).trim().slice(0, 150) : null,
        price: priceVal !== undefined && priceVal !== null ? String(priceVal).trim().slice(0, 60) : null,
        condition,
        delivery,
        location: locVal ? String(locVal).trim().slice(0, 100) : null,
        contact_info: contactVal ? String(contactVal).trim().slice(0, 160) : null,
        status: 'available',
      });
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
      job_data: jobDataString,
      market_data: marketDataString,
      author_alias: useAccountIdentity
        ? sessionUser!.display_name
        : (author_alias ? author_alias.trim() : generateRandomAlias()),
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
