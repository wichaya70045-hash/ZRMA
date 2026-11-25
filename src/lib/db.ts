import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { seedInitialDatabaseWithClient } from './seedData.mjs';
import {
  Thread,
  Comment,
  ChatMessage,
  RedditSort,
  Community,
  MediaType,
  GhostRoom,
  PollData,
  JobData,
  JobApplication,
  JobType,
  JobStatus,
  JobWorkMode,
  MarketData,
  MarketCondition,
  MarketStatus,
  MarketDelivery,
  TickerItem,
  UserProfile,
  AvatarFrame,
  BannerTheme,
  NameColor,
} from '@/types';

export { buildCommentTree } from './commentTree';

declare global {
  // eslint-disable-next-line no-var
  var __zrmaSeedPromise: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var __zrmaSeeded: boolean | undefined;
}

const AUTHOR_PUBLIC_SELECT = {
  username: true,
  displayName: true,
  avatarIcon: true,
  avatarUrl: true,
  avatarFrame: true,
  nameColor: true,
  customBadge: true,
} as const;

function toJsonValue(raw: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (raw === null || raw === undefined || raw === '') return Prisma.DbNull;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Prisma.InputJsonValue;
    } catch {
      return Prisma.DbNull;
    }
  }
  return raw as Prisma.InputJsonValue;
}

function authorizeThreadAction(
  existing: { authorUserId: string | null; editToken: string | null },
  editToken: string | null | undefined,
  currentUserId: string | null | undefined,
  unauthorizedAccountMsg: string,
  invalidTokenMsg: string
): string | null {
  if (existing.authorUserId) {
    const isOwner = Boolean(currentUserId && existing.authorUserId === currentUserId);
    const hasToken = Boolean(existing.editToken && editToken && existing.editToken === editToken);
    return isOwner || hasToken ? null : unauthorizedAccountMsg;
  }
  if (!existing.editToken || !editToken || existing.editToken !== editToken) {
    return invalidTokenMsg;
  }
  return null;
}

function authorizeChatAction(
  existing: { authorUserId: string | null; editToken: string | null; authorAlias: string },
  opts: { author_alias?: string; edit_token?: string; current_user_id?: string | null },
  verb: string
): string | null {
  if (existing.authorUserId) {
    const isOwner = Boolean(opts.current_user_id && existing.authorUserId === opts.current_user_id);
    const hasToken = Boolean(existing.editToken && opts.edit_token && existing.editToken === opts.edit_token);
    return isOwner || hasToken ? null : `คุณไม่มีสิทธิ์${verb}ข้อความนี้`;
  }
  if (existing.editToken) {
    return opts.edit_token && existing.editToken === opts.edit_token
      ? null
      : `คุณไม่มีสิทธิ์${verb}ข้อความนี้ (รหัสยืนยันไม่ถูกต้อง)`;
  }
  if (opts.author_alias) {
    return existing.authorAlias === opts.author_alias
      ? null
      : `คุณสามารถ${verb}ได้เฉพาะข้อความของตัวเองเท่านั้น`;
  }
  return `คุณไม่มีสิทธิ์${verb}ข้อความนี้`;
}

function computeVoteCounts(
  currentUp: number,
  currentDown: number,
  type: 'up' | 'down' | 'cancel',
  prevVote?: 'up' | 'down' | null
): { upvotes: number; downvotes: number; score: number } {
  let up = Number(currentUp || 0);
  let down = Number(currentDown || 0);

  if (type === 'cancel') {
    if (prevVote === 'up') up = Math.max(0, up - 1);
    else if (prevVote === 'down') down = Math.max(0, down - 1);
  } else if (type === 'up') {
    if (prevVote === 'down') {
      down = Math.max(0, down - 1);
      up += 1;
    } else if (prevVote !== 'up') {
      up += 1;
    }
  } else if (type === 'down') {
    if (prevVote === 'up') {
      up = Math.max(0, up - 1);
      down += 1;
    } else if (prevVote !== 'down') {
      down += 1;
    }
  }

  return { upvotes: up, downvotes: down, score: up - down };
}

export async function ensureSeeded(): Promise<void> {
  if (global.__zrmaSeeded) return;
  if (!global.__zrmaSeedPromise) {
    global.__zrmaSeedPromise = seedInitialDatabaseWithClient(prisma, Prisma)
      .then(() => {
        global.__zrmaSeeded = true;
      })
      .catch((err) => {
        // Reset promise so transient startup/DB connection retries cleanly
        global.__zrmaSeedPromise = undefined;
        throw err;
      });
  }
  await global.__zrmaSeedPromise;
}

export async function seedInitialDatabase(): Promise<void> {
  await seedInitialDatabaseWithClient(prisma, Prisma);
}

// ----------------------------------------------------
// COMMUNITIES
// ----------------------------------------------------

export async function getCommunities(): Promise<Community[]> {
  await ensureSeeded();

  const [communities, counts] = await Promise.all([
    prisma.community.findMany(),
    prisma.thread.groupBy({
      by: ['category'],
      where: { expiresAt: { gt: new Date() } },
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map<string, number>();
  for (const c of counts) {
    countMap.set(c.category, c._count._all);
  }

  return communities
    .map((c) => ({
      name: c.name,
      title: c.title,
      description: c.description || '',
      icon: c.icon || 'terminal',
      post_count: countMap.get(c.name) ?? 0,
      created_at: c.createdAt.toISOString(),
    }))
    .sort((a, b) => {
      if (b.post_count !== a.post_count) return b.post_count - a.post_count;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
}

export async function createOrUpdateCommunity(data: {
  name: string;
  title: string;
  description?: string;
  icon?: string;
}): Promise<Community> {
  await ensureSeeded();
  const cleanName = data.name.toLowerCase().trim();

  const row = await prisma.community.upsert({
    where: { name: cleanName },
    create: {
      name: cleanName,
      title: data.title.trim(),
      description: data.description || '',
      icon: data.icon || 'terminal',
      postCount: 0,
    },
    update: {
      title: data.title.trim(),
      description: data.description || '',
      icon: data.icon || 'terminal',
    },
  });

  const postCount = await prisma.thread.count({
    where: { category: cleanName, expiresAt: { gt: new Date() } },
  });

  return {
    name: row.name,
    title: row.title,
    description: row.description || '',
    icon: row.icon || 'terminal',
    post_count: postCount,
    created_at: row.createdAt.toISOString(),
  };
}

// ----------------------------------------------------
// CAPTCHA & TTL PURGE
// ----------------------------------------------------

export async function purgeExpiredCaptchas(): Promise<void> {
  try {
    await prisma.usedCaptcha.deleteMany({
      where: { expiresAt: { lt: BigInt(Date.now()) } },
    });
  } catch (err) {
    console.error('Error in purgeExpiredCaptchas:', err);
  }
}

export async function isCaptchaUsed(tokenHash: string): Promise<boolean> {
  try {
    const row = await prisma.usedCaptcha.findUnique({
      where: { tokenHash },
      select: { tokenHash: true },
    });
    return Boolean(row);
  } catch {
    return false;
  }
}

export async function markCaptchaUsed(tokenHash: string, expiresAt: number): Promise<void> {
  try {
    await prisma.usedCaptcha.upsert({
      where: { tokenHash },
      create: { tokenHash, expiresAt: BigInt(expiresAt) },
      update: { expiresAt: BigInt(expiresAt) },
    });
  } catch (err) {
    console.error('Error marking captcha used:', err);
  }
}

export async function purgeExpiredData(): Promise<void> {
  try {
    await prisma.thread.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    await purgeExpiredCaptchas();
  } catch (err) {
    console.error('Error in purgeExpiredData:', err);
  }
}

export async function pruneChatRoom(roomId: string): Promise<void> {
  try {
    const latest = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true },
    });

    if (latest.length >= 100) {
      await prisma.chatMessage.deleteMany({
        where: {
          roomId,
          id: { notIn: latest.map((m) => m.id) },
        },
      });
    }
  } catch (err) {
    console.error('Error in pruneChatRoom:', err);
  }
}

// ----------------------------------------------------
// JSON DATA PARSERS
// ----------------------------------------------------

export function parsePoll(raw: any): PollData | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed && Array.isArray(parsed.options) && parsed.options.length > 0) {
      return {
        question: parsed.question || null,
        options: parsed.options.map((opt: any, idx: number) => ({
          id: Number(opt.id ?? idx + 1),
          text: String(opt.text || ''),
          votes: Number(opt.votes || 0),
        })),
        total_votes: Number(parsed.total_votes || 0),
        closed: Boolean(parsed.closed),
      };
    }
  } catch {}
  return null;
}

export function parseJob(raw: any): JobData | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed && (parsed.job_type === 'hiring' || parsed.job_type === 'seeking')) {
      const apps: JobApplication[] = Array.isArray(parsed.applications)
        ? parsed.applications.map((a: any) => ({
            id: String(a.id || ''),
            applicant_alias: String(a.applicant_alias || 'ผู้สนใจนิรนาม'),
            applicant_avatar: String(a.applicant_avatar || 'shield'),
            applicant_user_id: a.applicant_user_id || null,
            applicant_username: a.applicant_username || null,
            pitch: String(a.pitch || ''),
            contact: a.contact || null,
            proposed_budget: a.proposed_budget || null,
            created_at: String(a.created_at || ''),
          }))
        : [];
      return {
        job_type: parsed.job_type as JobType,
        budget: parsed.budget || null,
        work_mode: (parsed.work_mode as JobWorkMode) || 'remote',
        skills: Array.isArray(parsed.skills) ? parsed.skills.map((s: any) => String(s)).filter(Boolean) : [],
        contact_info: parsed.contact_info || null,
        status: parsed.status === 'closed' ? 'closed' : 'open',
        applications: apps,
        application_count: Number(parsed.application_count ?? apps.length),
      };
    }
  } catch {}
  return null;
}

export function parseMarket(raw: any): MarketData | null {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      item_name: parsed.item_name ? String(parsed.item_name) : null,
      price: parsed.price ? String(parsed.price) : null,
      condition: (parsed.condition as MarketCondition) || 'used',
      delivery: (parsed.delivery as MarketDelivery) || 'shipping',
      location: parsed.location ? String(parsed.location) : null,
      contact_info: parsed.contact_info ? String(parsed.contact_info) : null,
      status: parsed.status === 'sold' ? 'sold' : 'available',
    };
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// TICKER & THREADS
// ----------------------------------------------------

export async function getTickerItems(): Promise<TickerItem[]> {
  await ensureSeeded();
  await purgeExpiredData();

  const rows = await prisma.thread.findMany({
    where: {
      isHidden: false,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      title: true,
      category: true,
      isPinned: true,
      upvotes: true,
      downvotes: true,
      createdAt: true,
      _count: { select: { comments: true } },
    },
  });

  const sorted = rows
    .map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      is_pinned: r.isPinned ? 1 : 0,
      score: r.upvotes - r.downvotes,
      comment_count: r._count.comments,
      created_at: r.createdAt.toISOString(),
      createdMs: r.createdAt.getTime(),
    }))
    .sort((a, b) => {
      if (b.is_pinned !== a.is_pinned) return b.is_pinned - a.is_pinned;
      const aBreak = a.category === 'breaking' ? 1 : 0;
      const bBreak = b.category === 'breaking' ? 1 : 0;
      if (bBreak !== aBreak) return bBreak - aBreak;
      if (b.score !== a.score) return b.score - a.score;
      return b.createdMs - a.createdMs;
    })
    .slice(0, 12);

  return sorted.map((r) => {
    let badge: 'PINNED' | 'BREAKING' | 'RISING' | 'HOT' = 'HOT';
    if (r.is_pinned === 1) {
      badge = 'PINNED';
    } else if (r.category === 'breaking') {
      badge = 'BREAKING';
    } else if (r.score >= 5 || r.comment_count >= 3) {
      badge = 'RISING';
    }

    return {
      id: r.id,
      title: r.title,
      category: r.category,
      score: r.score,
      comment_count: r.comment_count,
      is_pinned: r.is_pinned,
      created_at: r.created_at,
      badge,
    };
  });
}

function mapThreadRow(r: any): Thread {
  const u = r.author;
  const hasUser = Boolean(u?.username);
  const upvotes = Number(r.upvotes || 0);
  const downvotes = Number(r.downvotes || 0);

  return {
    id: r.id,
    title: r.title,
    content: r.content,
    category: r.category,
    flair: r.flair || null,
    source_url: r.sourceUrl || null,
    media_url: r.mediaUrl || null,
    media_type: (r.mediaType as MediaType) || null,
    poll_data: r.pollData ? JSON.stringify(r.pollData) : null,
    poll: parsePoll(r.pollData),
    job_data: r.jobData ? JSON.stringify(r.jobData) : null,
    job: parseJob(r.jobData),
    market_data: r.marketData ? JSON.stringify(r.marketData) : null,
    market: parseMarket(r.marketData),
    author_alias: hasUser ? (u.displayName || r.authorAlias) : r.authorAlias,
    author_avatar: hasUser ? (u.avatarIcon || r.authorAvatar) : r.authorAvatar,
    author_user_id: r.authorUserId || null,
    author_username: u?.username || null,
    author_avatar_url: u?.avatarUrl || null,
    author_frame: (u?.avatarFrame as AvatarFrame) || null,
    author_name_color: (u?.nameColor as NameColor) || null,
    author_badge: u?.customBadge || null,
    upvotes,
    downvotes,
    score: upvotes - downvotes,
    comment_count: Number(r._count?.comments ?? 0),
    report_count: Number(r.reportCount || 0),
    is_hidden: r.isHidden ? 1 : 0,
    is_pinned: r.isPinned ? 1 : 0,
    requires_login: Boolean(r.requiresLogin),
    is_edited: r.isEdited ? 1 : 0,
    edited_at: r.editedAt instanceof Date ? r.editedAt.toISOString() : (r.editedAt || null),
    expires_at: r.expiresAt instanceof Date ? r.expiresAt.toISOString() : String(r.expiresAt),
    created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

export async function getThreads(
  category?: string,
  sort: RedditSort = 'hot',
  jobFilter?: { onlyJobs?: boolean; jobType?: JobType },
  marketFilter?: { onlyMarket?: boolean; condition?: MarketCondition; status?: MarketStatus }
): Promise<Thread[]> {
  await ensureSeeded();
  await purgeExpiredData();

  const andConditions: Prisma.ThreadWhereInput[] = [
    { expiresAt: { gt: new Date() } },
  ];

  if (category && category !== 'all') {
    const cleanCat = category.replace(/^[zr]\//i, '');
    if (cleanCat === 'jobs') {
      andConditions.push({ OR: [{ category: 'jobs' }, { jobData: { not: Prisma.DbNull } }] });
    } else if (cleanCat === 'market') {
      andConditions.push({ OR: [{ category: 'market' }, { marketData: { not: Prisma.DbNull } }] });
    } else {
      andConditions.push({ category: cleanCat });
    }
  }

  if (jobFilter?.onlyJobs) {
    andConditions.push({ jobData: { not: Prisma.DbNull } });
  }

  if (jobFilter?.jobType === 'hiring' || jobFilter?.jobType === 'seeking') {
    andConditions.push({
      jobData: { path: ['job_type'], equals: jobFilter.jobType },
    });
  }

  if (marketFilter?.onlyMarket) {
    andConditions.push({ marketData: { not: Prisma.DbNull } });
  }

  if (marketFilter?.condition) {
    andConditions.push({
      marketData: { path: ['condition'], equals: marketFilter.condition },
    });
  }

  if (marketFilter?.status) {
    andConditions.push({
      marketData: { path: ['status'], equals: marketFilter.status },
    });
  }

  if (sort === 'breaking') {
    andConditions.push({ category: 'breaking' });
  }

  const rows = await prisma.thread.findMany({
    where: { AND: andConditions },
    include: {
      author: { select: AUTHOR_PUBLIC_SELECT },
      _count: { select: { comments: true } },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  });

  const mapped = rows.map(mapThreadRow);

  mapped.sort((a, b) => {
    const aPin = a.is_pinned || 0;
    const bPin = b.is_pinned || 0;
    if (bPin !== aPin) return bPin - aPin;

    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();

    if (sort === 'hot') {
      const aHot = a.score * 1000 + Math.floor(aTime / 1000) / 100;
      const bHot = b.score * 1000 + Math.floor(bTime / 1000) / 100;
      if (bHot !== aHot) return bHot - aHot;
      return bTime - aTime;
    }

    if (sort === 'top') {
      if (b.score !== a.score) return b.score - a.score;
      return bTime - aTime;
    }

    if (sort === 'rising') {
      if (b.comment_count !== a.comment_count) return b.comment_count - a.comment_count;
      if (b.score !== a.score) return b.score - a.score;
      return bTime - aTime;
    }

    // 'new' or 'breaking'
    return bTime - aTime;
  });

  return mapped.slice(0, 50);
}

export async function getThreadById(id: string): Promise<Thread | null> {
  await ensureSeeded();
  await purgeExpiredData();

  const row = await prisma.thread.findUnique({
    where: { id },
    include: {
      author: { select: AUTHOR_PUBLIC_SELECT },
      _count: { select: { comments: true } },
    },
  });

  if (!row) return null;
  return mapThreadRow(row);
}

export async function createThread(data: {
  id: string;
  title: string;
  content: string;
  category: string;
  flair?: string | null;
  source_url?: string | null;
  media_url?: string | null;
  media_type?: MediaType | null;
  poll_data?: string | null;
  job_data?: string | null;
  market_data?: string | null;
  requires_login?: number | boolean;
  author_alias: string;
  author_avatar: string;
  author_user_id?: string | null;
  is_pinned?: number;
  expires_hours: number;
  edit_token?: string | null;
}): Promise<Thread> {
  await ensureSeeded();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + data.expires_hours * 60 * 60 * 1000);
  const cleanCat = data.category.toLowerCase().trim().replace(/^[zr]\//i, '') || 'general';

  // Auto-register community if new
  await prisma.community.upsert({
    where: { name: cleanCat },
    create: {
      name: cleanCat,
      title: `z/${cleanCat}`,
      description: `ชุมชนแลกเปลี่ยนข่าวสาร z/${cleanCat}`,
      icon: 'terminal',
      postCount: 0,
      createdAt: now,
    },
    update: {},
  });

  const created = await prisma.thread.create({
    data: {
      id: data.id,
      title: data.title,
      content: data.content,
      category: cleanCat,
      flair: data.flair || null,
      sourceUrl: data.source_url || null,
      mediaUrl: data.media_url || null,
      mediaType: data.media_type || null,
      pollData: toJsonValue(data.poll_data),
      jobData: toJsonValue(data.job_data),
      marketData: toJsonValue(data.market_data),
      requiresLogin: Boolean(data.requires_login),
      authorAlias: data.author_alias,
      authorAvatar: data.author_avatar,
      authorUserId: data.author_user_id || null,
      isPinned: Boolean(data.is_pinned),
      editToken: data.edit_token || null,
      isEdited: false,
      expiresAt,
      createdAt: now,
    },
    include: {
      author: { select: AUTHOR_PUBLIC_SELECT },
      _count: { select: { comments: true } },
    },
  });

  return mapThreadRow(created);
}

export async function toggleMarketStatus(
  threadId: string,
  status: MarketStatus,
  edit_token?: string | null,
  current_user_id?: string | null
): Promise<{ success: boolean; market?: MarketData; error?: string }> {
  const existing = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!existing) {
    return { success: false, error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุแล้ว' };
  }

  const market = parseMarket(existing.marketData);
  if (!market) {
    return { success: false, error: 'กระทู้นี้ไม่ใช่ประกาศขายของ' };
  }

  const authError = authorizeThreadAction(
    existing,
    edit_token,
    current_user_id,
    'คุณไม่มีสิทธิ์เปลี่ยนสถานะสินค้านี้',
    'รหัสยืนยันการแก้ไข (Edit Passcode) ไม่ถูกต้อง'
  );
  if (authError) return { success: false, error: authError };

  const updatedMarket: MarketData = {
    ...market,
    status,
  };

  await prisma.thread.update({
    where: { id: threadId },
    data: { marketData: updatedMarket as unknown as Prisma.InputJsonValue },
  });

  return { success: true, market: updatedMarket };
}

export async function applyToJobThread(
  threadId: string,
  application: JobApplication
): Promise<{ success: boolean; job?: JobData; error?: string }> {
  const existing = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!existing) {
    return { success: false, error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุแล้ว' };
  }

  const job = parseJob(existing.jobData);
  if (!job) {
    return { success: false, error: 'กระทู้นี้ไม่ใช่ประกาศจ้างงานหรือรับงาน' };
  }

  if (job.status === 'closed') {
    return { success: false, error: 'ประกาศงานนี้ปิดรับสมัคร/ปิดรับงานแล้ว' };
  }

  const nextApps = [application, ...(job.applications || [])].slice(0, 50);
  const updatedJob: JobData = {
    ...job,
    applications: nextApps,
    application_count: Number(job.application_count || 0) + 1,
  };

  await prisma.thread.update({
    where: { id: threadId },
    data: { jobData: updatedJob as unknown as Prisma.InputJsonValue },
  });

  return { success: true, job: updatedJob };
}

export async function toggleJobStatus(
  threadId: string,
  status: JobStatus,
  edit_token?: string | null,
  current_user_id?: string | null
): Promise<{ success: boolean; job?: JobData; error?: string }> {
  const existing = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!existing) {
    return { success: false, error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุแล้ว' };
  }

  const job = parseJob(existing.jobData);
  if (!job) {
    return { success: false, error: 'กระทู้นี้ไม่ใช่ประกาศงาน' };
  }

  const authError = authorizeThreadAction(
    existing,
    edit_token,
    current_user_id,
    'คุณไม่มีสิทธิ์เปลี่ยนสถานะประกาศงานนี้',
    'รหัสยืนยันการแก้ไข (Edit Passcode) ไม่ถูกต้อง'
  );
  if (authError) return { success: false, error: authError };

  const updatedJob: JobData = {
    ...job,
    status,
  };

  await prisma.thread.update({
    where: { id: threadId },
    data: { jobData: updatedJob as unknown as Prisma.InputJsonValue },
  });

  return { success: true, job: updatedJob };
}

export async function voteThreadPoll(
  threadId: string,
  optionId: number
): Promise<{ success: boolean; poll?: PollData; error?: string }> {
  const existing = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!existing) {
    return { success: false, error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุแล้ว' };
  }
  if (!existing.pollData) {
    return { success: false, error: 'กระทู้นี้ไม่มีโพลให้โหวต' };
  }

  const poll = parsePoll(existing.pollData);
  if (!poll) {
    return { success: false, error: 'ข้อมูลโพลในระบบไม่ถูกต้อง' };
  }

  if (poll.closed) {
    return { success: false, error: 'โพลนี้ปิดรับการลงคะแนนแล้ว' };
  }

  const targetOption = poll.options.find((o) => Number(o.id) === Number(optionId));
  if (!targetOption) {
    return { success: false, error: 'ไม่พบตัวเลือกที่ระบุ' };
  }

  targetOption.votes = (Number(targetOption.votes) || 0) + 1;
  poll.total_votes = poll.options.reduce((sum, o) => sum + (Number(o.votes) || 0), 0);

  await prisma.thread.update({
    where: { id: threadId },
    data: { pollData: poll as unknown as Prisma.InputJsonValue },
  });

  return { success: true, poll };
}

export async function updateThread(
  id: string,
  data: {
    title: string;
    content: string;
    category?: string;
    flair?: string | null;
    source_url?: string | null;
    requires_login?: boolean | number;
    edit_token?: string | null;
    current_user_id?: string | null;
  }
): Promise<{ success: boolean; thread?: Thread; error?: string }> {
  const existing = await prisma.thread.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุแล้ว' };
  }

  const authError = authorizeThreadAction(
    existing,
    data.edit_token,
    data.current_user_id,
    'คุณไม่มีสิทธิ์แก้ไขกระทู้นี้ กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าของโพสต์หรือใช้รหัสยืนยัน',
    'รหัสยืนยันการแก้ไข (Edit Passcode) ไม่ถูกต้อง'
  );
  if (authError) return { success: false, error: authError };

  const cleanCat = (data.category || existing.category).toLowerCase().trim().replace(/^[zr]\//i, '') || existing.category;
  const reqLogin = data.requires_login !== undefined ? Boolean(data.requires_login) : existing.requiresLogin;

  const updated = await prisma.thread.update({
    where: { id },
    data: {
      title: data.title.trim(),
      content: data.content.trim(),
      category: cleanCat,
      flair: data.flair !== undefined ? (data.flair?.trim() || null) : existing.flair,
      sourceUrl: data.source_url !== undefined ? (data.source_url?.trim() || null) : existing.sourceUrl,
      requiresLogin: reqLogin,
      isEdited: true,
      editedAt: new Date(),
    },
    include: {
      author: { select: AUTHOR_PUBLIC_SELECT },
      _count: { select: { comments: true } },
    },
  });

  return { success: true, thread: mapThreadRow(updated) };
}

export async function deleteThread(
  id: string,
  edit_token?: string | null,
  current_user_id?: string | null
): Promise<{ success: boolean; error?: string }> {
  const existing = await prisma.thread.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุแล้ว' };
  }

  const authError = authorizeThreadAction(
    existing,
    edit_token,
    current_user_id,
    'คุณไม่มีสิทธิ์ลบกระทู้นี้ กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าของโพสต์หรือใช้รหัสยืนยัน',
    'รหัสยืนยันการลบ (Delete Passcode) ไม่ถูกต้อง'
  );
  if (authError) return { success: false, error: authError };

  await prisma.thread.delete({ where: { id } });
  return { success: true };
}

export async function voteThread(
  id: string,
  type: 'up' | 'down' | 'cancel',
  prevVote?: 'up' | 'down' | null
): Promise<{ upvotes: number; downvotes: number; score: number } | null> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.thread.findUnique({
      where: { id },
      select: { upvotes: true, downvotes: true },
    });
    if (!existing) return null;

    const next = computeVoteCounts(existing.upvotes, existing.downvotes, type, prevVote);
    await tx.thread.update({
      where: { id },
      data: { upvotes: next.upvotes, downvotes: next.downvotes },
    });

    return next;
  });
}

// ----------------------------------------------------
// COMMENTS
// ----------------------------------------------------

function mapCommentRow(r: any): Comment {
  const u = r.author;
  const hasUser = Boolean(u?.username);
  const upvotes = Number(r.upvotes || 0);
  const downvotes = Number(r.downvotes || 0);

  return {
    id: r.id,
    thread_id: r.threadId,
    parent_id: r.parentId || null,
    quote_text: r.quoteText || null,
    quote_author: r.quoteAuthor || null,
    content: r.content,
    media_url: r.mediaUrl || null,
    author_alias: hasUser ? (u.displayName || r.authorAlias) : r.authorAlias,
    author_avatar: hasUser ? (u.avatarIcon || r.authorAvatar) : r.authorAvatar,
    author_user_id: r.authorUserId || null,
    author_username: u?.username || null,
    author_avatar_url: u?.avatarUrl || null,
    author_frame: (u?.avatarFrame as AvatarFrame) || null,
    author_name_color: (u?.nameColor as NameColor) || null,
    author_badge: u?.customBadge || null,
    upvotes,
    downvotes,
    score: upvotes - downvotes,
    report_count: Number(r.reportCount || 0),
    is_hidden: r.isHidden ? 1 : 0,
    is_edited: r.isEdited ? 1 : 0,
    edited_at: r.editedAt instanceof Date ? r.editedAt.toISOString() : (r.editedAt || null),
    created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

export async function getCommentsByThread(threadId: string): Promise<Comment[]> {
  await ensureSeeded();

  const rows = await prisma.comment.findMany({
    where: { threadId },
    include: { author: { select: AUTHOR_PUBLIC_SELECT } },
    orderBy: { createdAt: 'asc' },
  });

  return rows.map(mapCommentRow);
}

export async function createComment(data: {
  id: string;
  thread_id: string;
  parent_id?: string | null;
  quote_text?: string | null;
  quote_author?: string | null;
  content: string;
  media_url?: string | null;
  author_alias: string;
  author_avatar: string;
  author_user_id?: string | null;
}): Promise<Comment> {
  await ensureSeeded();

  let validParentId: string | null = null;
  if (data.parent_id) {
    const parentExists = await prisma.comment.findFirst({
      where: { id: data.parent_id, threadId: data.thread_id },
      select: { id: true },
    });
    if (parentExists) {
      validParentId = parentExists.id;
    }
  }

  const created = await prisma.comment.create({
    data: {
      id: data.id,
      threadId: data.thread_id,
      parentId: validParentId,
      quoteText: data.quote_text || null,
      quoteAuthor: data.quote_author || null,
      content: data.content,
      mediaUrl: data.media_url || null,
      authorAlias: data.author_alias,
      authorAvatar: data.author_avatar,
      authorUserId: data.author_user_id || null,
    },
    include: { author: { select: AUTHOR_PUBLIC_SELECT } },
  });

  return mapCommentRow(created);
}

export async function voteComment(
  id: string,
  type: 'up' | 'down' | 'cancel',
  prevVote?: 'up' | 'down' | null
): Promise<{ upvotes: number; downvotes: number; score: number } | null> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.comment.findUnique({
      where: { id },
      select: { upvotes: true, downvotes: true },
    });
    if (!existing) return null;

    const next = computeVoteCounts(existing.upvotes, existing.downvotes, type, prevVote);
    await tx.comment.update({
      where: { id },
      data: { upvotes: next.upvotes, downvotes: next.downvotes },
    });

    return next;
  });
}

// ----------------------------------------------------
// LIVE CHAT
// ----------------------------------------------------

function mapChatMessageRow(r: any): ChatMessage {
  const u = r.author;
  const hasUser = Boolean(u?.username);
  return {
    id: r.id,
    room_id: r.roomId,
    content: r.content,
    author_alias: hasUser ? (u.displayName || r.authorAlias) : r.authorAlias,
    author_avatar: hasUser ? (u.avatarIcon || r.authorAvatar) : r.authorAvatar,
    author_user_id: r.authorUserId || null,
    author_username: u?.username || null,
    author_avatar_url: u?.avatarUrl || null,
    author_frame: (u?.avatarFrame as AvatarFrame) || null,
    author_name_color: (u?.nameColor as NameColor) || null,
    author_badge: u?.customBadge || null,
    report_count: Number(r.reportCount || 0),
    is_hidden: r.isHidden ? 1 : 0,
    is_edited: r.isEdited ? 1 : 0,
    edited_at: r.editedAt instanceof Date ? r.editedAt.toISOString() : (r.editedAt || null),
    created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

export async function getChatMessages(roomId: string = 'global'): Promise<ChatMessage[]> {
  await ensureSeeded();
  await pruneChatRoom(roomId);

  const rows = await prisma.chatMessage.findMany({
    where: { roomId },
    include: { author: { select: AUTHOR_PUBLIC_SELECT } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  return rows.map(mapChatMessageRow);
}

export async function sendChatMessage(data: {
  id: string;
  room_id: string;
  content: string;
  author_alias: string;
  author_avatar: string;
  author_user_id?: string | null;
  edit_token?: string | null;
}): Promise<ChatMessage> {
  await ensureSeeded();
  const room = data.room_id || 'global';

  const created = await prisma.chatMessage.create({
    data: {
      id: data.id,
      roomId: room,
      content: data.content,
      authorAlias: data.author_alias,
      authorAvatar: data.author_avatar,
      authorUserId: data.author_user_id || null,
      editToken: data.edit_token || null,
      isEdited: false,
    },
    include: { author: { select: AUTHOR_PUBLIC_SELECT } },
  });

  await pruneChatRoom(room);
  return mapChatMessageRow(created);
}

export async function updateChatMessage(
  id: string,
  data: {
    content: string;
    author_alias?: string;
    edit_token?: string;
    current_user_id?: string | null;
  }
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
  const existing = await prisma.chatMessage.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: 'ไม่พบข้อความแชทนี้' };
  }

  const authError = authorizeChatAction(existing, data, 'แก้ไข');
  if (authError) return { success: false, error: authError };

  const updated = await prisma.chatMessage.update({
    where: { id },
    data: {
      content: data.content.trim(),
      isEdited: true,
      editedAt: new Date(),
    },
    include: { author: { select: AUTHOR_PUBLIC_SELECT } },
  });

  return {
    success: true,
    message: mapChatMessageRow(updated),
  };
}

export async function deleteChatMessage(
  id: string,
  author_alias?: string,
  edit_token?: string,
  current_user_id?: string | null
): Promise<{ success: boolean; error?: string }> {
  const existing = await prisma.chatMessage.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: 'ไม่พบข้อความแชทนี้' };
  }

  const authError = authorizeChatAction(
    existing,
    { author_alias, edit_token, current_user_id },
    'ลบ'
  );
  if (authError) return { success: false, error: authError };

  await prisma.chatMessage.delete({ where: { id } });
  return { success: true };
}

// ----------------------------------------------------
// REPORTS & AUTO-HIDE
// ----------------------------------------------------

export async function reportContent(data: {
  id: string;
  target_type: 'thread' | 'comment' | 'chat';
  target_id: string;
  reason: string;
}): Promise<{ newReportCount: number; isHidden: boolean }> {
  return prisma.$transaction(async (tx) => {
    await tx.report.create({
      data: {
        id: data.id,
        targetType: data.target_type,
        targetId: data.target_id,
        reason: data.reason,
      },
    });

    const delegate =
      data.target_type === 'thread'
        ? tx.thread
        : data.target_type === 'comment'
        ? tx.comment
        : tx.chatMessage;

    const target = await (delegate as any).findUnique({
      where: { id: data.target_id },
      select: { id: true },
    });
    if (!target) return { newReportCount: 0, isHidden: false };

    const updated = await (delegate as any).update({
      where: { id: data.target_id },
      data: { reportCount: { increment: 1 } },
      select: { reportCount: true },
    });

    const newReportCount = Number(updated.reportCount || 0);
    const isHidden = newReportCount >= 5;
    if (isHidden) {
      await (delegate as any).update({
        where: { id: data.target_id },
        data: { isHidden: true },
      });
    }

    return { newReportCount, isHidden };
  });
}

// ----------------------------------------------------
// GHOST ROOMS
// ----------------------------------------------------

function mapGhostRoomRow(r: any): GhostRoom {
  return {
    id: r.id,
    name: r.name,
    title: r.title,
    topic: r.topic || null,
    creator_alias: r.creatorAlias,
    active_users: Number(r.activeUsers || 0),
    last_active_at: r.lastActiveAt instanceof Date ? r.lastActiveAt.toISOString() : String(r.lastActiveAt),
    is_destroyed: r.isDestroyed ? 1 : 0,
    created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

export async function createGhostRoom(data: {
  id: string;
  name: string;
  title: string;
  topic?: string | null;
  creator_alias: string;
}): Promise<GhostRoom> {
  const now = new Date();
  const cleanName =
    data.name.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '') ||
    `ghost-${Math.floor(Math.random() * 9000 + 1000)}`;

  const room = await prisma.ghostRoom.upsert({
    where: { name: cleanName },
    create: {
      id: data.id,
      name: cleanName,
      title: data.title.trim(),
      topic: data.topic ? data.topic.trim() : null,
      creatorAlias: data.creator_alias,
      activeUsers: 1,
      lastActiveAt: now,
      isDestroyed: false,
      createdAt: now,
    },
    update: {
      isDestroyed: false,
      activeUsers: { increment: 1 },
      lastActiveAt: now,
    },
  });

  return mapGhostRoomRow(room);
}

export async function getGhostRooms(): Promise<GhostRoom[]> {
  await purgeInactiveGhostRooms();

  const rows = await prisma.ghostRoom.findMany({
    where: { isDestroyed: false },
    orderBy: [{ activeUsers: 'desc' }, { lastActiveAt: 'desc' }],
  });

  return rows.map(mapGhostRoomRow);
}

export async function getGhostRoom(idOrName: string): Promise<GhostRoom | null> {
  const row = await prisma.ghostRoom.findFirst({
    where: { OR: [{ id: idOrName }, { name: idOrName }] },
  });

  if (!row) return null;
  return mapGhostRoomRow(row);
}

export async function updateGhostRoomPresence(roomIdOrName: string, activeCount: number): Promise<boolean> {
  if (activeCount <= 0) {
    await destroyGhostRoom(roomIdOrName);
    return false;
  }

  await prisma.ghostRoom.updateMany({
    where: { OR: [{ id: roomIdOrName }, { name: roomIdOrName }] },
    data: { activeUsers: activeCount, lastActiveAt: new Date() },
  });
  return true;
}

export async function destroyGhostRoom(roomIdOrName: string): Promise<boolean> {
  const room = await prisma.ghostRoom.findFirst({
    where: { OR: [{ id: roomIdOrName }, { name: roomIdOrName }] },
    select: { id: true, name: true },
  });
  if (!room) return false;

  await prisma.$transaction([
    prisma.chatMessage.deleteMany({
      where: { OR: [{ roomId: room.id }, { roomId: `ghost_${room.name}` }] },
    }),
    prisma.ghostRoom.update({
      where: { id: room.id },
      data: { isDestroyed: true, activeUsers: 0 },
    }),
  ]);
  return true;
}

export async function purgeInactiveGhostRooms(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 90 * 1000);
    const inactive = await prisma.ghostRoom.findMany({
      where: {
        isDestroyed: false,
        OR: [{ activeUsers: { lte: 0 } }, { lastActiveAt: { lt: cutoff } }],
      },
      select: { id: true },
    });

    for (const r of inactive) {
      await destroyGhostRoom(r.id);
    }
  } catch {
    // ignore
  }
}

// ----------------------------------------------------
// OPTIONAL ACCOUNTS & DECORATION SYSTEM (Zero-Log: No Email/IP/Phone)
// ----------------------------------------------------

function mapUserProfile(row: any): UserProfile {
  return {
    id: row.id,
    username: row.username,
    display_name: row.displayName,
    bio: row.bio || '',
    avatar_icon: row.avatarIcon || 'shield',
    avatar_url: row.avatarUrl || null,
    avatar_frame: (row.avatarFrame as AvatarFrame) || 'none',
    banner_theme: (row.bannerTheme as BannerTheme) || 'obsidian',
    name_color: (row.nameColor as NameColor) || 'default',
    custom_badge: row.customBadge || null,
    created_at: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function createUser(data: {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  avatar_icon?: string;
}): Promise<UserProfile> {
  const cleanUsername = data.username.trim().toLowerCase();

  const row = await prisma.user.create({
    data: {
      id: data.id,
      username: cleanUsername,
      displayName: data.display_name.trim(),
      passwordHash: data.password_hash,
      bio: '',
      avatarIcon: data.avatar_icon || 'shield',
      avatarUrl: null,
      avatarFrame: 'none',
      bannerTheme: 'obsidian',
      nameColor: 'default',
      customBadge: null,
    },
  });

  return mapUserProfile(row);
}

export async function getUserWithPasswordByUsername(
  username: string
): Promise<(UserProfile & { password_hash: string }) | null> {
  const row = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
  });
  if (!row) return null;
  return {
    ...mapUserProfile(row),
    password_hash: row.passwordHash,
  };
}

export async function getUserWithPasswordById(
  id: string
): Promise<(UserProfile & { password_hash: string }) | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  if (!row) return null;
  return {
    ...mapUserProfile(row),
    password_hash: row.passwordHash,
  };
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  if (!row) return null;
  return mapUserProfile(row);
}

export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const row = await prisma.user.findUnique({
    where: { username: username.trim().toLowerCase() },
  });
  if (!row) return null;
  return mapUserProfile(row);
}

export async function updateUserProfile(
  id: string,
  data: {
    display_name?: string;
    bio?: string;
    avatar_icon?: string;
    avatar_url?: string | null;
    avatar_frame?: AvatarFrame;
    banner_theme?: BannerTheme;
    name_color?: NameColor;
    custom_badge?: string | null;
  }
): Promise<UserProfile | null> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return null;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      displayName: data.display_name !== undefined ? data.display_name.trim() : existing.displayName,
      bio: data.bio !== undefined ? data.bio.trim() : (existing.bio ?? ''),
      avatarIcon: data.avatar_icon !== undefined ? data.avatar_icon : existing.avatarIcon,
      avatarUrl: data.avatar_url !== undefined ? (data.avatar_url || null) : existing.avatarUrl,
      avatarFrame: data.avatar_frame !== undefined ? data.avatar_frame : existing.avatarFrame,
      bannerTheme: data.banner_theme !== undefined ? data.banner_theme : existing.bannerTheme,
      nameColor: data.name_color !== undefined ? data.name_color : existing.nameColor,
      customBadge:
        data.custom_badge !== undefined ? (data.custom_badge?.trim() || null) : existing.customBadge,
    },
  });

  return mapUserProfile(updated);
}

export async function updateUserPassword(id: string, password_hash: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id },
      data: { passwordHash: password_hash },
    });
    return true;
  } catch {
    return false;
  }
}

export async function getThreadsByUserId(userId: string): Promise<Thread[]> {
  await ensureSeeded();
  await purgeExpiredData();

  const rows = await prisma.thread.findMany({
    where: {
      authorUserId: userId,
      isHidden: false,
      expiresAt: { gt: new Date() },
    },
    include: {
      author: { select: AUTHOR_PUBLIC_SELECT },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return rows.map(mapThreadRow);
}

export async function getPublicProfileByUsername(username: string): Promise<{
  profile: UserProfile;
  stats: { thread_count: number; comment_count: number; total_score: number };
  threads: Thread[];
} | null> {
  await ensureSeeded();
  await purgeExpiredData();

  const profile = await getUserByUsername(username);
  if (!profile) return null;

  const [threads, allUserThreadsStats, commentCount] = await Promise.all([
    getThreadsByUserId(profile.id),
    prisma.thread.aggregate({
      where: { authorUserId: profile.id, isHidden: false },
      _count: { _all: true },
      _sum: { upvotes: true, downvotes: true },
    }),
    prisma.comment.count({
      where: { authorUserId: profile.id },
    }),
  ]);

  const totalScore =
    Number(allUserThreadsStats._sum.upvotes || 0) - Number(allUserThreadsStats._sum.downvotes || 0);

  return {
    profile,
    stats: {
      thread_count: allUserThreadsStats._count._all,
      comment_count: commentCount,
      total_score: totalScore,
    },
    threads,
  };
}
