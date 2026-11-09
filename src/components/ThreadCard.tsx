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
  Shield,
  EyeOff
} from 'lucide-react';
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

  // Calculate remaining time before auto-destruction
  const getRemainingTime = () => {
    const expires = new Date(thread.expires_at).getTime();
    const now = Date.now();
    const diff = expires - now;
    if (diff <= 0) return 'หมดอายุแล้ว';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) {
      return `ลบใน ${hours} ชม.`;
    }
    const days = Math.floor(hours / 24);
    return `ลบใน ${days} วัน`;
  };

  // Format relative creation time
  const getTimeAgo = () => {
    const created = new Date(thread.created_at).getTime();
    const diffSec = Math.floor((Date.now() - created) / 1000);
    if (diffSec < 60) return 'เมื่อสักครู่';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} น. ที่แล้ว`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ชม. ที่แล้ว`;
    return `${Math.floor(diffHr / 24)} วันที่แล้ว`;
  };

  const handleVote = async (type: 'up' | 'down') => {
    if (isVoting) return;
    if (userVote === type) return; // already voted this direction

    setIsVoting(true);
    const voteDelta = userVote === null ? (type === 'up' ? 1 : -1) : (type === 'up' ? 2 : -2);
    setScore(prev => prev + voteDelta);
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
      // rollback if failed
      setScore(prev => prev - voteDelta);
      setUserVote(null);
    } finally {
      setIsVoting(false);
    }
  };

  const getCategoryBadge = () => {
    switch (thread.category) {
      case 'breaking':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
            🚨 ข่าวด่วน
          </span>
        );
      case 'tech':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            💻 เทคโนโลยี
          </span>
        );
      case 'society':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30">
            🏛️ สังคม
          </span>
        );
      case 'finance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            📈 เศรษฐกิจ
          </span>
        );
      case 'science':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            🔬 วิทยาศาสตร์
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            💬 ทั่วไป
          </span>
        );
    }
  };

  return (
    <article className="bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-lg hover:shadow-slate-900/50 relative overflow-hidden group">
      {/* Top Banner if hidden due to community reports */}
      {isHidden && !forceReveal && (
        <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-3 mb-3 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>กระทู้นี้ถูกซ่อนอัตโนมัติ เนื่องจากถูกรายงานจากชุมชนครบ 5 ครั้ง</span>
          </div>
          <button
            onClick={() => setForceReveal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg text-[11px] font-medium transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>แสดงเนื้อหา</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className={`flex gap-3 sm:gap-4 ${isHidden && !forceReveal ? 'opacity-40 filter blur-[1px]' : ''}`}>
        
        {/* Vote Counter Column */}
        <div className="flex flex-col items-center bg-slate-950/60 border border-slate-800/60 rounded-xl p-1.5 self-start shrink-0">
          <button
            onClick={() => handleVote('up')}
            disabled={isVoting}
            className={`p-1 rounded-md transition-colors ${
              userVote === 'up'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50'
            }`}
            title="เห็นด้วย / โหวตขึ้น"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          <span
            className={`text-xs font-bold my-0.5 ${
              score > 0
                ? 'text-emerald-400'
                : score < 0
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {score}
          </span>

          <button
            onClick={() => handleVote('down')}
            disabled={isVoting}
            className={`p-1 rounded-md transition-colors ${
              userVote === 'down'
                ? 'text-rose-400 bg-rose-500/10'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/50'
            }`}
            title="ไม่เห็นด้วย / โหวตลง"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Column */}
        <div className="flex-1 min-w-0">
          {/* Metadata Row: Category, Author, Time, Auto-Destruct */}
          <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-slate-400">
            {getCategoryBadge()}

            {/* Author alias */}
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <span className="text-sm">{thread.author_avatar}</span>
              <span>{thread.author_alias}</span>
            </div>

            <span className="text-slate-600">•</span>

            {/* Time ago */}
            <span>{getTimeAgo()}</span>

            {/* Expiry Badge */}
            <div className="flex items-center gap-1 text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-800/30 px-2 py-0.5 rounded-full ml-auto">
              <Clock className="w-3 h-3" />
              <span>{getRemainingTime()}</span>
            </div>
          </div>

          {/* Title */}
          <Link href={`/thread/${thread.id}`} className="block group/title">
            <h2 className="text-base sm:text-lg font-bold text-white group-hover/title:text-emerald-400 transition-colors line-clamp-2 leading-snug mb-2">
              {thread.title}
            </h2>
          </Link>

          {/* Content snippet */}
          <p className="text-xs sm:text-sm text-slate-300/90 line-clamp-2 leading-relaxed mb-3">
            {thread.content}
          </p>

          {/* Source Link if provided */}
          {thread.source_url && (
            <div className="mb-3">
              <a
                href={thread.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-400/90 hover:text-cyan-300 bg-cyan-950/20 border border-cyan-800/30 px-2.5 py-1 rounded-lg transition-colors group/link"
              >
                <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                <span className="truncate max-w-xs sm:max-w-md">
                  ข่าวต้นทาง: {thread.source_url.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
              </a>
            </div>
          )}

          {/* Card Footer: Comments, Report */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
            <Link
              href={`/thread/${thread.id}`}
              className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{thread.comment_count || 0} ความคิดเห็น</span>
            </Link>

            <div className="flex items-center gap-3">
              {forceReveal && isHidden && (
                <button
                  onClick={() => setForceReveal(false)}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>ซ่อนกลับ</span>
                </button>
              )}

              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1 text-slate-500 hover:text-rose-400 transition-colors"
                title="รายงานกระทู้นี้"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>รายงาน{reportCount > 0 ? ` (${reportCount})` : ''}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
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
