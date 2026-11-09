'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Thread } from '@/types';
import {
  ChevronUp,
  ChevronDown,
  MessageSquare,
  ExternalLink,
  Clock,
  Flag,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import IdentityAvatar from './IdentityAvatar';
import ReportModal from './ReportModal';

interface ThreadCardProps {
  thread: Thread;
  onVoteChange?: (id: string, score: number) => void;
}

export default function ThreadCard({ thread, onVoteChange }: ThreadCardProps) {
  const [score, setScore] = useState(thread.score);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isHidden, setIsHidden] = useState(thread.is_hidden === 1);
  const [forceReveal, setForceReveal] = useState(false);
  const [reportCount, setReportCount] = useState(thread.report_count);

  const getRemainingTime = () => {
    const expires = new Date(thread.expires_at).getTime();
    const now = Date.now();
    const diff = expires - now;
    if (diff <= 0) return 'หมดอายุแล้ว';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) {
      return `${hours}h เหลือ`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d เหลือ`;
  };

  const getTimeAgo = () => {
    const created = new Date(thread.created_at).getTime();
    const diffSec = Math.floor((Date.now() - created) / 1000);
    if (diffSec < 60) return 'เมื่อสักครู่';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    return `${Math.floor(diffHr / 24)}d`;
  };

  const handleVote = async (type: 'up' | 'down') => {
    if (isVoting) return;
    if (userVote === type) return;

    setIsVoting(true);
    const voteDelta = userVote === null ? (type === 'up' ? 1 : -1) : (type === 'up' ? 2 : -2);
    setScore((prev) => prev + voteDelta);
    setUserVote(type);

    try {
      const res = await fetch(`/api/threads/${thread.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok && data.score !== undefined) {
        setScore(data.score);
        if (onVoteChange) onVoteChange(thread.id, data.score);
      }
    } catch {
      setScore((prev) => prev - voteDelta);
      setUserVote(null);
    } finally {
      setIsVoting(false);
    }
  };

  const getCategoryMeta = () => {
    switch (thread.category) {
      case 'breaking':
        return { label: 'ข่าวด่วน', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      case 'tech':
        return { label: 'เทคโนโลยี', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
      case 'society':
        return { label: 'สังคม', color: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20' };
      case 'finance':
        return { label: 'เศรษฐกิจ', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'science':
        return { label: 'วิทยาศาสตร์', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      default:
        return { label: 'ทั่วไป', color: 'text-zinc-400 bg-zinc-800/40 border-zinc-700/50' };
    }
  };

  const cat = getCategoryMeta();

  return (
    <article className="bg-[#101216] border border-white/[0.07] hover:border-white/[0.14] rounded-xl p-4 transition-colors relative group">
      {/* Hidden Banner */}
      {isHidden && !forceReveal && (
        <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-2.5 mb-3 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-rose-400 shrink-0" />
            <span>กระทู้นี้ถูกซ่อนอัตโนมัติเนื่องจากมีผู้รายงานครบ 5 ครั้ง</span>
          </div>
          <button
            onClick={() => setForceReveal(true)}
            className="flex items-center gap-1 px-2 py-1 bg-white/[0.06] hover:bg-white/[0.1] rounded text-[11px] text-zinc-200 transition-colors"
          >
            <Eye size={12} />
            <span>ดูเนื้อหา</span>
          </button>
        </div>
      )}

      <div className={`flex gap-3.5 ${isHidden && !forceReveal ? 'opacity-30 blur-[1px]' : ''}`}>
        
        {/* Vote Column */}
        <div className="flex flex-col items-center bg-black/30 border border-white/[0.06] rounded-lg p-1 self-start shrink-0">
          <button
            onClick={() => handleVote('up')}
            disabled={isVoting}
            className={`p-1 rounded transition-colors active:scale-95 ${
              userVote === 'up'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
            title="โหวตขึ้น"
            aria-label="Upvote"
          >
            <ChevronUp size={16} strokeWidth={2.5} />
          </button>

          <span
            className={`text-xs font-mono font-semibold tabular-nums my-0.5 ${
              score > 0
                ? 'text-emerald-400'
                : score < 0
                ? 'text-rose-400'
                : 'text-zinc-400'
            }`}
          >
            {score}
          </span>

          <button
            onClick={() => handleVote('down')}
            disabled={isVoting}
            className={`p-1 rounded transition-colors active:scale-95 ${
              userVote === 'down'
                ? 'text-rose-400 bg-rose-500/10'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
            title="โหวตลง"
            aria-label="Downvote"
          >
            <ChevronDown size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          
          {/* Metadata Row */}
          <div className="flex items-center gap-2 mb-1.5 text-xs">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${cat.color}`}>
              {cat.label}
            </span>

            <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-xs">
              <IdentityAvatar iconKey={thread.author_avatar} size="xs" />
              <span className="truncate max-w-[130px]">{thread.author_alias}</span>
            </div>

            <span className="text-zinc-600">•</span>

            <span className="font-mono text-zinc-500 text-[11px] tabular-nums">
              {getTimeAgo()}
            </span>

            {/* Expiration badge */}
            <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-400 ml-auto bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.04] tabular-nums">
              <Clock size={11} className="text-zinc-500" />
              <span>{getRemainingTime()}</span>
            </div>
          </div>

          {/* Title */}
          <Link href={`/thread/${thread.id}`} className="block group/link focus-visible:outline-none focus-visible:underline">
            <h2 className="text-sm sm:text-base font-semibold text-zinc-100 group-hover/link:text-white transition-colors line-clamp-2 leading-snug mb-1.5">
              {thread.title}
            </h2>
          </Link>

          {/* Snippet */}
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2.5">
            {thread.content}
          </p>

          {/* Source Link if present */}
          {thread.source_url && (
            <div className="mb-2.5">
              <a
                href={thread.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded transition-colors"
              >
                <ExternalLink size={11} />
                <span className="truncate max-w-xs font-mono">
                  {thread.source_url.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
              </a>
            </div>
          )}

          {/* Footer: Comments Count & Report */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
            <Link
              href={`/thread/${thread.id}`}
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <MessageSquare size={13} />
              <span className="font-mono text-[11px] tabular-nums">
                {thread.comment_count || 0} ความคิดเห็น
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {forceReveal && isHidden && (
                <button
                  onClick={() => setForceReveal(false)}
                  className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  <EyeOff size={12} />
                  <span>ซ่อนกลับ</span>
                </button>
              )}

              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-rose-400 transition-colors"
                title="รายงานข้อความ"
              >
                <Flag size={12} />
                <span className="font-mono tabular-nums">
                  รายงาน{reportCount > 0 ? ` (${reportCount})` : ''}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="thread"
        targetId={thread.id}
        targetTitle={thread.title}
        onReportSuccess={(newCount, hidden) => {
          setReportCount(newCount);
          if (hidden) setIsHidden(true);
        }}
      />
    </article>
  );
}
