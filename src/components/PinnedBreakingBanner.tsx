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
    <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/70 bg-gradient-to-r from-red-950/70 via-[#120a0d] to-[#101217] p-4 sm:p-5 shadow-2xl shadow-red-950/30">
      
      {/* Background Ambient Glow */}
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Wire */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-red-500/25">
        <div className="flex items-center gap-2">
          {/* Pulsing Live Radar Indicator */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>

          <span className="text-xs font-mono font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
            <Radio size={14} className="animate-pulse" />
            <span>BREAKING NEWS LIVE WIRE</span>
          </span>

          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-600 text-white shadow-sm">
            📌 ปักหมุดข่าวด่วน
          </span>
        </div>

        {/* Live Timestamp */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 tabular-nums">
          <Clock size={13} className="text-yellow-400" />
          <span className="text-zinc-400">เวลาอัปเดต:</span>
          <span className="text-yellow-400 font-bold">{getTimeAgo()}</span>
          <span className="text-zinc-500">
            ({new Date(pinnedThread.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.)
          </span>
        </div>
      </div>

      {/* Main Breaking Headline */}
      <div className="space-y-2.5">
        <Link
          href={`/thread/${pinnedThread.id}`}
          className="group block focus-visible:outline-none"
        >
          <h2 className="text-base sm:text-lg md:text-xl font-black text-white group-hover:text-yellow-400 transition-colors leading-snug">
            {pinnedThread.title}
          </h2>
        </Link>

        {/* Snippet / Briefing */}
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-2">
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
              className="inline-flex items-center gap-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 px-2.5 py-1 rounded-md font-mono text-xs font-semibold transition-colors active:scale-95"
              title="ตรวจสอบข่าวต้นทาง"
            >
              <ExternalLink size={12} className="text-yellow-400 shrink-0" />
              <span>แหล่งข่าวต้นทาง: {sourceDomain}</span>
            </a>
          )}

          {/* Author metadata */}
          <div className="inline-flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
            <IdentityAvatar iconKey={pinnedThread.author_avatar} theme="red" size="xs" />
            <span>รายงานโดย: u/{pinnedThread.author_alias.replace(/^u\//, '')}</span>
          </div>

          {/* Comments and Read Button */}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={`/thread/${pinnedThread.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm active:scale-95"
            >
              <MessageSquare size={13} />
              <span className="font-mono tabular-nums">{pinnedThread.comment_count || 0} ความคิดเห็น</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
