'use client';

import React from 'react';
import Link from 'next/link';
import { Thread } from '@/types';
import {
  AlertCircle,
  ExternalLink,
  Clock,
  MessageSquare,
  ChevronRight,
  Pin,
  Radio,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import IdentityAvatar from './IdentityAvatar';

interface PinnedBreakingBannerProps {
  pinnedThread: Thread | null;
}

export default function PinnedBreakingBanner({ pinnedThread }: PinnedBreakingBannerProps) {
  if (!pinnedThread) return null;

  const getTimeAgo = () => {
    const created = new Date(pinnedThread.created_at).getTime();
    const diffSec = Math.floor((Date.now() - created) / 1000);
    if (diffSec < 60) return 'เมื่อสักครู่';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diffHr / 24)} วันที่แล้ว`;
  };

  const getSourceDomain = () => {
    if (!pinnedThread.source_url) return null;
    try {
      const url = new URL(pinnedThread.source_url);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return pinnedThread.source_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    }
  };

  const sourceDomain = getSourceDomain();

  return (
    <aside
      aria-label="Pinned Breaking News"
      className="w-full max-w-full overflow-hidden rounded-xl border border-red-500/40 border-l-4 border-l-red-500 bg-[#101217] p-3.5 sm:p-4.5 shadow-sm transition-all"
    >
      {/* Top Header Wire */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          {/* Subtle Live Radar Indicator */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>

          <span className="text-xs font-mono font-bold text-red-400 flex items-center gap-1.5">
            <Radio size={13} />
            <span>ข่าวด่วนล่าสุด</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-950/60 text-red-300 border border-red-500/30">
            <Pin size={10} />
            <span>ปักหมุด</span>
          </span>
        </div>

        {/* Live Timestamp */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 tabular-nums">
          <Clock size={12} className="text-yellow-400" />
          <span>{getTimeAgo()}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-500">
            {new Date(pinnedThread.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
          </span>
        </div>
      </div>

      {/* Main Breaking Headline */}
      <div className="space-y-2">
        <Link
          href={`/thread/${pinnedThread.id}`}
          className="group block focus-visible:outline-none focus-visible:underline"
        >
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 group-hover:text-yellow-400 transition-colors leading-snug">
            {pinnedThread.title}
          </h2>
        </Link>

        {/* Snippet / Briefing */}
        <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed line-clamp-2">
          {pinnedThread.content}
        </p>

        {/* Source Citation & Publisher Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 text-xs">
          {/* Verified Source Link */}
          {pinnedThread.source_url && (
            <a
              href={pinnedThread.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-yellow-500/30 text-zinc-300 hover:text-yellow-400 px-2.5 py-1 rounded-md font-mono text-[11px] font-medium transition-colors"
              title="ตรวจสอบข่าวต้นทาง"
            >
              <ExternalLink size={11} className="text-yellow-400 shrink-0" />
              <span>แหล่งข่าว: {sourceDomain}</span>
            </a>
          )}

          {/* Author metadata */}
          <div className="inline-flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
            <IdentityAvatar iconKey={pinnedThread.author_avatar} theme="red" size="xs" />
            <span>u/{pinnedThread.author_alias.replace(/^u\//, '')}</span>
          </div>

          {/* Comments and Read Button */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Link
              href={`/thread/${pinnedThread.id}`}
              className="btn-primary !py-1 !px-2.5 text-xs font-semibold"
            >
              <MessageSquare size={12} />
              <span className="font-mono tabular-nums">{pinnedThread.comment_count || 0} ความคิดเห็น</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
