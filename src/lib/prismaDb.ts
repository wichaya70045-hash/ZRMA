import prisma from './prisma';
import { Thread, Comment, ChatMessage, UserProfile } from '@/types';

/**
 * Prisma Database Adapter for PostgreSQL in ZRMA
 * Connects to PostgreSQL using Prisma Client when DB_MODE=prisma or DATABASE_URL is active.
 */

// --- Threads ---

export async function getPrismaThreads(options: {
  category?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<Thread[]> {
  const { category, limit = 50, offset = 0 } = options;

  const rows = await prisma.thread.findMany({
    where: {
      isHidden: false,
      expiresAt: { gt: new Date() },
      ...(category && category !== 'all' ? { category } : {}),
    },
    include: {
      _count: {
        select: { comments: true },
      },
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
    skip: offset,
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    category: r.category,
    flair: r.flair || undefined,
    source_url: r.sourceUrl || undefined,
    media_url: r.mediaUrl || undefined,
    media_type: (r.mediaType as any) || undefined,
    requires_login: r.requiresLogin,
    author_alias: r.authorAlias,
    author_avatar: r.authorAvatar,
    author_user_id: r.authorUserId || undefined,
    upvotes: r.upvotes,
    downvotes: r.downvotes,
    score: r.upvotes - r.downvotes,
    comment_count: r._count?.comments ?? 0,
    report_count: r.reportCount,
    is_hidden: r.isHidden ? 1 : 0,
    is_pinned: r.isPinned ? 1 : 0,
    is_edited: r.isEdited ? 1 : 0,
    edited_at: r.editedAt ? r.editedAt.toISOString() : undefined,
    expires_at: r.expiresAt.toISOString(),
    created_at: r.createdAt.toISOString(),
    poll_data: r.pollData ? JSON.parse(r.pollData) : undefined,
    job_data: r.jobData ? JSON.parse(r.jobData) : undefined,
    market_data: r.marketData ? JSON.parse(r.marketData) : undefined,
  }));
}

export async function getPrismaThreadById(id: string): Promise<Thread | null> {
  const r = await prisma.thread.findUnique({
    where: { id },
    include: {
      _count: {
        select: { comments: true },
      },
    },
  });

  if (!r) return null;

  return {
    id: r.id,
    title: r.title,
    content: r.content,
    category: r.category,
    flair: r.flair || undefined,
    source_url: r.sourceUrl || undefined,
    media_url: r.mediaUrl || undefined,
    media_type: (r.mediaType as any) || undefined,
    requires_login: r.requiresLogin,
    author_alias: r.authorAlias,
    author_avatar: r.authorAvatar,
    author_user_id: r.authorUserId || undefined,
    upvotes: r.upvotes,
    downvotes: r.downvotes,
    score: r.upvotes - r.downvotes,
    comment_count: r._count?.comments ?? 0,
    report_count: r.reportCount,
    is_hidden: r.isHidden ? 1 : 0,
    is_pinned: r.isPinned ? 1 : 0,
    is_edited: r.isEdited ? 1 : 0,
    edited_at: r.editedAt ? r.editedAt.toISOString() : undefined,
    expires_at: r.expiresAt.toISOString(),
    created_at: r.createdAt.toISOString(),
    poll_data: r.pollData ? JSON.parse(r.pollData) : undefined,
    job_data: r.jobData ? JSON.parse(r.jobData) : undefined,
    market_data: r.marketData ? JSON.parse(r.marketData) : undefined,
  };
}

export async function createPrismaThread(data: {
  title: string;
  content: string;
  category: string;
  flair?: string;
  source_url?: string;
  media_url?: string;
  media_type?: string;
  requires_login?: boolean;
  author_alias: string;
  author_avatar: string;
  author_user_id?: string;
  expires_hours?: number;
  edit_token?: string;
  poll_data?: any;
  job_data?: any;
  market_data?: any;
}): Promise<Thread> {
  const expiresHours = data.expires_hours || 24;
  const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000);

  const created = await prisma.thread.create({
    data: {
      title: data.title.trim(),
      content: data.content.trim(),
      category: data.category.toLowerCase().trim(),
      flair: data.flair?.trim() || null,
      sourceUrl: data.source_url?.trim() || null,
      mediaUrl: data.media_url?.trim() || null,
      mediaType: data.media_type || null,
      requiresLogin: Boolean(data.requires_login),
      authorAlias: data.author_alias,
      authorAvatar: data.author_avatar,
      authorUserId: data.author_user_id || null,
      editToken: data.edit_token || null,
      pollData: data.poll_data ? JSON.stringify(data.poll_data) : null,
      jobData: data.job_data ? JSON.stringify(data.job_data) : null,
      marketData: data.market_data ? JSON.stringify(data.market_data) : null,
      expiresAt,
    },
  });

  return (await getPrismaThreadById(created.id))!;
}

// --- Comments ---

export async function getPrismaCommentsByThread(threadId: string): Promise<Comment[]> {
  const rows = await prisma.comment.findMany({
    where: {
      threadId,
      isHidden: false,
    },
    orderBy: { createdAt: 'asc' },
  });

  return rows.map((r) => ({
    id: r.id,
    thread_id: r.threadId,
    parent_id: r.parentId || undefined,
    quote_text: r.quoteText || undefined,
    quote_author: r.quoteAuthor || undefined,
    content: r.content,
    media_url: r.mediaUrl || undefined,
    author_alias: r.authorAlias,
    author_avatar: r.authorAvatar,
    author_user_id: r.authorUserId || undefined,
    upvotes: r.upvotes,
    downvotes: r.downvotes,
    score: r.upvotes - r.downvotes,
    report_count: r.reportCount,
    is_hidden: r.isHidden ? 1 : 0,
    is_edited: r.isEdited ? 1 : 0,
    edited_at: r.editedAt ? r.editedAt.toISOString() : undefined,
    created_at: r.createdAt.toISOString(),
  }));
}

export async function createPrismaComment(data: {
  thread_id: string;
  parent_id?: string;
  quote_text?: string;
  quote_author?: string;
  content: string;
  media_url?: string;
  author_alias: string;
  author_avatar: string;
  author_user_id?: string;
  edit_token?: string;
}): Promise<Comment> {
  const created = await prisma.comment.create({
    data: {
      threadId: data.thread_id,
      parentId: data.parent_id || null,
      quoteText: data.quote_text || null,
      quoteAuthor: data.quote_author || null,
      content: data.content.trim(),
      mediaUrl: data.media_url || null,
      authorAlias: data.author_alias,
      authorAvatar: data.author_avatar,
      authorUserId: data.author_user_id || null,
      editToken: data.edit_token || null,
    },
  });

  return {
    id: created.id,
    thread_id: created.threadId,
    parent_id: created.parentId || undefined,
    quote_text: created.quoteText || undefined,
    quote_author: created.quoteAuthor || undefined,
    content: created.content,
    media_url: created.mediaUrl || undefined,
    author_alias: created.authorAlias,
    author_avatar: created.authorAvatar,
    author_user_id: created.authorUserId || undefined,
    upvotes: 0,
    downvotes: 0,
    score: 0,
    report_count: 0,
    is_hidden: 0,
    is_edited: 0,
    created_at: created.createdAt.toISOString(),
  };
}

// --- Chat Messages ---

export async function getPrismaChatMessages(roomId = 'global', limit = 50): Promise<ChatMessage[]> {
  const rows = await prisma.chatMessage.findMany({
    where: {
      roomId,
      isHidden: false,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return rows.reverse().map((r) => ({
    id: r.id,
    room_id: r.roomId,
    content: r.content,
    author_alias: r.authorAlias,
    author_avatar: r.authorAvatar,
    author_user_id: r.authorUserId || undefined,
    report_count: r.reportCount,
    is_hidden: r.isHidden ? 1 : 0,
    is_edited: r.isEdited ? 1 : 0,
    edited_at: r.editedAt ? r.editedAt.toISOString() : undefined,
    created_at: r.createdAt.toISOString(),
  }));
}

export async function createPrismaChatMessage(data: {
  room_id?: string;
  content: string;
  author_alias: string;
  author_avatar: string;
  author_user_id?: string;
  edit_token?: string;
}): Promise<ChatMessage> {
  const created = await prisma.chatMessage.create({
    data: {
      roomId: data.room_id || 'global',
      content: data.content.trim(),
      authorAlias: data.author_alias,
      authorAvatar: data.author_avatar,
      authorUserId: data.author_user_id || null,
      editToken: data.edit_token || null,
    },
  });

  return {
    id: created.id,
    room_id: created.roomId,
    content: created.content,
    author_alias: created.authorAlias,
    author_avatar: created.authorAvatar,
    author_user_id: created.authorUserId || undefined,
    report_count: 0,
    is_hidden: 0,
    is_edited: 0,
    created_at: created.createdAt.toISOString(),
  };
}

// --- Users ---

export async function getPrismaUserByUsername(username: string): Promise<UserProfile | null> {
  const u = await prisma.user.findUnique({
    where: { username: username.toLowerCase().trim() },
  });

  if (!u) return null;

  return {
    id: u.id,
    username: u.username,
    display_name: u.displayName,
    bio: u.bio || '',
    avatar_icon: (u.avatarIcon as any) || 'shield',
    avatar_url: u.avatarUrl || undefined,
    avatar_frame: (u.avatarFrame as any) || 'none',
    banner_theme: (u.bannerTheme as any) || 'obsidian',
    name_color: (u.nameColor as any) || 'default',
    custom_badge: u.customBadge || undefined,
    created_at: u.createdAt.toISOString(),
  };
}
