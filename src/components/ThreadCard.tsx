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
  Share2,
  Bookmark,
  Check,
  Film,
  Image as ImageIcon,
  Pin,
} from 'lucide-react';
import IdentityAvatar from './IdentityAvatar';
import ReportModal from './ReportModal';
import { useSettings } from '@/lib/settings';

interface ThreadCardProps {
  thread: Thread;
  layout?: 'card' | 'compact';
  onVoteChange?: (id: string, score: number) => void;
}

export default function ThreadCard({ thread, layout, onVoteChange }: ThreadCardProps) {
  const { settings } = useSettings();
  const activeLayout = layout || settings.feedLayout;

  const [score, setScore] = useState(thread.score);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isHidden, setIsHidden] = useState(thread.is_hidden === 1);
  const [forceReveal, setForceReveal] = useState(false);
  const [reportCount, setReportCount] = useState(thread.report_count);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMediaRevealed, setIsMediaRevealed] = useState(!settings.blurMedia);

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

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/thread/${thread.id}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
  };

  const cleanCategory = (thread.category || 'general').replace(/^[zr]\//i, '');
  const subredditName = `z/${cleanCategory}`;
  const cleanAlias = (thread.author_alias || 'ผู้ไม่ประสงค์ออกนาม').replace(/^u\//, '');

  const isVideo =
    thread.media_type === 'video' ||
    (thread.media_url && /\.(mp4|webm|mov)$/i.test(thread.media_url));

  const isImage =
    thread.media_type === 'image' ||
    (thread.media_url && /\.(jpg|jpeg|png|webp|gif)$/i.test(thread.media_url));

  // COMPACT ROW VIEW (Activated via Settings or Feed toggle)
  if (activeLayout === 'compact') {
    return (
      <article
        className={`rounded-lg px-3 py-2.5 transition-all relative group shadow-sm flex items-center gap-2.5 sm:gap-3.5 ${
          thread.is_pinned === 1
            ? 'border border-red-500/40 border-l-4 border-l-red-500 bg-[#101217]'
            : 'bg-[#101217] border border-white/[0.06] hover:border-white/[0.15]'
        }`}
      >
        {/* Upvote & Score Compact Pill */}
        <div className="flex items-center gap-1 bg-black/50 border border-white/[0.08] rounded px-1.5 py-0.5 shrink-0">
          <button
            onClick={() => handleVote('up')}
            disabled={isVoting}
            className={`p-0.5 rounded transition-colors ${
              userVote === 'up' ? 'text-yellow-400' : 'text-zinc-500 hover:text-yellow-400'
            }`}
            title="Upvote"
          >
            <ChevronUp size={13} strokeWidth={2.5} />
          </button>
          <span
            className={`text-xs font-mono font-bold tabular-nums min-w-[1.2rem] text-center ${
              score > 0 ? 'text-yellow-400' : score < 0 ? 'text-red-400' : 'text-zinc-400'
            }`}
          >
            {score}
          </span>
          <button
            onClick={() => handleVote('down')}
            disabled={isVoting}
            className={`p-0.5 rounded transition-colors ${
              userVote === 'down' ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'
            }`}
            title="Downvote"
          >
            <ChevronDown size={13} strokeWidth={2.5} />
          </button>
        </div>

        {/* Media Thumbnail Pill (If media exists) */}
        {thread.media_url && (
          <div
            onClick={() => setIsMediaRevealed(true)}
            className="w-10 h-10 rounded-md bg-black/60 border border-white/[0.08] overflow-hidden shrink-0 flex items-center justify-center relative cursor-pointer group/thumb"
            title="คลิกเพื่อดูรูปภาพ"
          >
            {isVideo ? (
              <Film size={15} className="text-yellow-400" />
            ) : isImage ? (
              <img
                src={thread.media_url}
                alt=""
                className={`w-full h-full object-cover ${
                  settings.blurMedia && !isMediaRevealed ? 'filter blur-sm scale-110' : ''
                }`}
              />
            ) : (
              <ImageIcon size={15} className="text-zinc-400" />
            )}
          </div>
        )}

        {/* Text Details & Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {thread.is_pinned === 1 && (
              <span className="text-[9px] font-mono font-bold text-red-400 bg-red-950/60 px-1 py-0.2 rounded border border-red-500/30 flex items-center gap-1">
                <Pin size={9} />
                <span>PIN</span>
              </span>
            )}
            <Link
              href={`/?category=${cleanCategory}`}
              className="font-mono font-bold text-[11px] text-yellow-400 hover:underline shrink-0"
            >
              {subredditName}
            </Link>
            <span className="text-zinc-600 text-[10px]">•</span>
            <Link
              href={`/thread/${thread.id}`}
              className={`font-semibold text-zinc-100 hover:text-white truncate max-w-lg focus-visible:underline ${
                settings.fontSize === 'comfortable' ? 'text-sm' : 'text-xs'
              }`}
            >
              {thread.title}
            </Link>
            {thread.flair && (
              <span className="px-1 py-0.2 rounded text-[9px] font-semibold border text-yellow-400 bg-yellow-500/10 border-yellow-500/25">
                {thread.flair}
              </span>
            )}
            {thread.source_url && (
              <a
                href={thread.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-zinc-500 hover:text-yellow-400 hidden sm:inline-flex items-center gap-0.5"
              >
                <ExternalLink size={9} />
                <span>{thread.source_url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 18)}</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono mt-0.5">
            <span>u/{cleanAlias}</span>
            <span>•</span>
            <span>{getTimeAgo()}</span>
            <span>•</span>
            <Link href={`/thread/${thread.id}`} className="hover:text-yellow-400 flex items-center gap-1">
              <MessageSquare size={10} />
              <span>{thread.comment_count || 0} คอมเมนต์</span>
            </Link>
            <span className="ml-auto text-orange-400 flex items-center gap-1">
              <Clock size={10} />
              <span>{getRemainingTime()}</span>
            </span>
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

  // STANDARD CARD VIEW

  return (
    <article
      className={`rounded-xl p-3.5 sm:p-4 transition-all relative group shadow-sm ${
        thread.is_pinned === 1
          ? 'border border-red-500/40 border-l-4 border-l-red-500 bg-[#101217]'
          : 'bg-[#101217] border border-white/[0.07] hover:border-white/[0.18]'
      }`}
    >
      {/* Pinned Breaking News Header Ribbon */}
      {thread.is_pinned === 1 && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.06] text-xs">
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 ${settings.reduceMotion ? '' : 'animate-ping'}`}></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[11px] font-mono font-bold text-red-400 flex items-center gap-1.5">
            <Pin size={11} />
            <span>ข่าวด่วนปักหมุด</span>
          </span>
          {thread.source_url && (
            <span className="ml-auto text-[10px] font-mono text-zinc-400 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.08] flex items-center gap-1">
              <span>แหล่งข่าวอ้างอิง</span>
            </span>
          )}
        </div>
      )}
      {/* Hidden Banner */}
      {isHidden && !forceReveal && (
        <div className="bg-red-950/25 border border-red-900/40 rounded-lg p-2.5 mb-3 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
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

      <div className={`flex gap-3 sm:gap-3.5 ${isHidden && !forceReveal ? 'opacity-30 blur-[1px]' : ''}`}>
        
        {/* Reddit Left-Hand Vote Column */}
        <div className="flex flex-col items-center bg-black/40 border border-white/[0.06] rounded-lg p-1 self-start shrink-0">
          <button
            onClick={() => handleVote('up')}
            disabled={isVoting}
            className={`p-1 rounded transition-colors active:scale-95 ${
              userVote === 'up'
                ? 'text-yellow-400 bg-yellow-500/15'
                : 'text-zinc-500 hover:text-yellow-400 hover:bg-white/[0.04]'
            }`}
            title="Upvote"
            aria-label="Upvote"
          >
            <ChevronUp size={18} strokeWidth={2.5} />
          </button>

          <span
            className={`text-xs font-mono font-bold tabular-nums my-0.5 ${
              score > 0
                ? 'text-yellow-400'
                : score < 0
                ? 'text-red-400'
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
                ? 'text-red-400 bg-red-500/15'
                : 'text-zinc-500 hover:text-red-400 hover:bg-white/[0.04]'
            }`}
            title="Downvote"
            aria-label="Downvote"
          >
            <ChevronDown size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Post Content Body */}
        <div className="flex-1 min-w-0">
          
          {/* Reddit-style Header Line: z/community • u/author • time ago */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 text-xs">
            <Link
              href={`/?category=${cleanCategory}`}
              className="font-mono font-bold text-xs text-yellow-400 hover:underline"
            >
              {subredditName}
            </Link>

            <span className="text-zinc-600">•</span>

            <div className="flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
              <IdentityAvatar iconKey={thread.author_avatar} theme="red" size="xs" />
              <span>u/{cleanAlias}</span>
            </div>

            <span className="text-zinc-600">•</span>

            <span className="font-mono text-zinc-500 text-[11px] tabular-nums">
              {getTimeAgo()}
            </span>

            {/* Flair tag if provided */}
            {thread.flair && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold border text-yellow-400 bg-yellow-500/10 border-yellow-500/25 ml-1">
                {thread.flair}
              </span>
            )}

            {/* Expiration badge (Touch of Orange) */}
            <div className="flex items-center gap-1 font-mono text-[10px] text-orange-400 ml-auto bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 tabular-nums">
              <Clock size={11} className="text-orange-400" />
              <span>{getRemainingTime()}</span>
            </div>
          </div>

          {/* Post Title */}
          <Link href={`/thread/${thread.id}`} className="block group/link focus-visible:outline-none focus-visible:underline">
            <h2 className={`font-semibold text-zinc-100 group-hover/link:text-white transition-colors line-clamp-2 leading-snug mb-1.5 ${
              settings.fontSize === 'comfortable' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
            }`}>
              {thread.title}
            </h2>
          </Link>

          {/* Post Snippet */}
          <p className={`text-zinc-400 line-clamp-2 leading-relaxed mb-2.5 ${
            settings.fontSize === 'comfortable' ? 'text-sm' : 'text-xs'
          }`}>
            {thread.content}
          </p>

          {/* Media Preview: Image or Video with Auto-Blur Support */}
          {thread.media_url && (
            <div className="mb-3 rounded-lg overflow-hidden border border-white/[0.08] bg-black/40 relative">
              {settings.blurMedia && !isMediaRevealed ? (
                <div className="relative group/blur">
                  <div className="filter blur-xl scale-110 pointer-events-none select-none max-h-80 overflow-hidden opacity-40">
                    {isVideo ? (
                      <video src={thread.media_url} className="w-full max-h-80 object-cover" />
                    ) : (
                      <img src={thread.media_url} alt="" className="w-full max-h-80 object-cover" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
                    <button
                      type="button"
                      onClick={() => setIsMediaRevealed(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-yellow-400 text-zinc-950 hover:bg-yellow-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
                    >
                      <Eye size={14} />
                      <span>แตะเพื่อแสดงสื่อ (Auto-Blur Active)</span>
                    </button>
                    <p className="text-[11px] text-zinc-400 mt-1.5">
                      เปิดโหมดเบลอสื่อเริ่มต้นไว้ เพื่อความปลอดภัยในที่สาธารณะ
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {isVideo ? (
                    <div className="relative group/video">
                      <video
                        src={thread.media_url}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full max-h-80 object-contain bg-black"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-yellow-400 flex items-center gap-1 pointer-events-none">
                        <Film size={11} />
                        <span>VIDEO</span>
                      </div>
                    </div>
                  ) : isImage ? (
                    <div className="relative group/img cursor-pointer" onClick={() => window.open(thread.media_url!, '_blank')}>
                      <img
                        src={thread.media_url}
                        alt={thread.title}
                        loading="lazy"
                        className="w-full max-h-80 object-cover hover:scale-[1.01] transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-zinc-300 flex items-center gap-1 pointer-events-none">
                        <ImageIcon size={11} />
                        <span>IMAGE</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Re-blur toggle button if blurMedia is enabled */}
                  {settings.blurMedia && (
                    <button
                      type="button"
                      onClick={() => setIsMediaRevealed(false)}
                      className="absolute top-2 right-2 bg-black/75 hover:bg-black text-zinc-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-mono border border-white/[0.1] flex items-center gap-1 transition-colors"
                      title="ซ่อนและเบลอสื่อกลับ"
                    >
                      <EyeOff size={11} />
                      <span>เบลอกลับ</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* External Link Pill (Reddit Style) */}
          {thread.source_url && (
            <div className="mb-2.5">
              <a
                href={thread.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-yellow-400 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-yellow-500/25 px-2.5 py-1 rounded-md transition-colors"
              >
                <ExternalLink size={12} className="text-yellow-400" />
                <span className="truncate max-w-xs font-mono">
                  {thread.source_url.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
              </a>
            </div>
          )}

          {/* Reddit Action Bar: Comments, Share, Save, Report */}
          <div className="flex items-center gap-3 sm:gap-4 pt-2 border-t border-white/[0.04] text-xs">
            <Link
              href={`/thread/${thread.id}`}
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-yellow-400 transition-colors p-1 rounded hover:bg-white/[0.03]"
            >
              <MessageSquare size={14} />
              <span className="font-mono text-[11px] tabular-nums font-semibold">
                {thread.comment_count || 0} ความคิดเห็น
              </span>
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-yellow-400 transition-colors p-1 rounded hover:bg-white/[0.03]"
            >
              {copiedLink ? <Check size={14} className="text-yellow-400" /> : <Share2 size={14} />}
              <span className="text-[11px]">{copiedLink ? 'คัดลอกแล้ว' : 'แชร์'}</span>
            </button>

            <button
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-1.5 transition-colors p-1 rounded hover:bg-white/[0.03] ${
                isSaved ? 'text-yellow-400 font-semibold' : 'text-zinc-400 hover:text-yellow-400'
              }`}
            >
              <Bookmark size={14} />
              <span className="text-[11px]">{isSaved ? 'บันทึกแล้ว' : 'บันทึก'}</span>
            </button>

            <div className="ml-auto flex items-center gap-2">
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
                className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-red-400 transition-colors p-1"
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
