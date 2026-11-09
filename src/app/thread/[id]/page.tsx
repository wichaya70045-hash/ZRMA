'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Thread, Comment, CaptchaChallenge } from '@/types';
import { getScopedIdentity, rerollScopedIdentity, AnonymousIdentity } from '@/lib/privacy';
import IdentityAvatar from '@/components/IdentityAvatar';
import ReportModal from '@/components/ReportModal';
import LiveChatBox from '@/components/LiveChatBox';
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  ExternalLink,
  Clock,
  Flag,
  AlertTriangle,
  Quote,
  Send,
  Dices,
  Eye,
  EyeOff,
  RefreshCw,
  Radio,
  Share2,
  Check,
  X,
} from 'lucide-react';

export default function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const threadId = resolvedParams.id;

  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [activeView, setActiveView] = useState<'comments' | 'livechat'>('comments');

  const [threadScore, setThreadScore] = useState(0);
  const [threadVote, setThreadVote] = useState<'up' | 'down' | null>(null);

  const [commentVotes, setCommentVotes] = useState<Record<string, { score: number; voted: 'up' | 'down' | null }>>({});

  const [identity, setIdentity] = useState<AnonymousIdentity | null>(null);

  const [commentContent, setCommentContent] = useState('');
  const [quotedComment, setQuotedComment] = useState<{ id: string; author: string; text: string } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [captchaData, setCaptchaData] = useState<CaptchaChallenge | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const [reportTarget, setReportTarget] = useState<{
    type: 'thread' | 'comment';
    id: string;
    title?: string;
  } | null>(null);

  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const id = getScopedIdentity(`thread_${threadId}`);
    setIdentity(id);
  }, [threadId]);

  const fetchCaptcha = async () => {
    try {
      const res = await fetch('/api/captcha');
      const data = await res.json();
      setCaptchaData(data);
      setCaptchaAnswer('');
    } catch (err) {
      console.error('Error fetching captcha:', err);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [threadRes, commentsRes] = await Promise.all([
        fetch(`/api/threads/${threadId}`),
        fetch(`/api/threads/${threadId}/comments`),
      ]);

      if (!threadRes.ok) {
        setErrorMsg('ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุและถูกลบไปแล้วตามนโยบายความเป็นส่วนตัว');
        return;
      }

      const threadData = await threadRes.json();
      const commentsData = await commentsRes.json();

      setThread(threadData.thread);
      setThreadScore(threadData.thread.score);
      setComments(commentsData.comments || []);

      const votesMap: Record<string, { score: number; voted: 'up' | 'down' | null }> = {};
      (commentsData.comments || []).forEach((c: Comment) => {
        votesMap[c.id] = { score: c.score, voted: null };
      });
      setCommentVotes(votesMap);
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [threadId]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/chat/stream?room=thread_${threadId}`);

    eventSource.addEventListener('new_comment', (event) => {
      try {
        const newC: Comment = JSON.parse(event.data);
        setComments((prev) => {
          if (prev.some((c) => c.id === newC.id)) return prev;
          return [...prev, newC];
        });
        setCommentVotes((prev) => ({
          ...prev,
          [newC.id]: { score: newC.score, voted: null },
        }));
      } catch (err) {
        console.error('Error parsing new_comment:', err);
      }
    });

    eventSource.addEventListener('content_hidden', (event) => {
      try {
        const { target_type, id } = JSON.parse(event.data);
        if (target_type === 'comment') {
          setComments((prev) =>
            prev.map((c) => (c.id === id ? { ...c, is_hidden: 1 } : c))
          );
        } else if (target_type === 'thread' && id === threadId) {
          setThread((prev) => (prev ? { ...prev, is_hidden: 1 } : prev));
        }
      } catch (err) {
        console.error('Error parsing content_hidden:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [threadId]);

  const handleRerollIdentity = () => {
    const newId = rerollScopedIdentity(`thread_${threadId}`);
    setIdentity(newId);
  };

  const handleThreadVote = async (type: 'up' | 'down') => {
    if (threadVote === type || !thread) return;
    const delta = threadVote === null ? (type === 'up' ? 1 : -1) : (type === 'up' ? 2 : -2);
    setThreadScore((s) => s + delta);
    setThreadVote(type);

    try {
      const res = await fetch(`/api/threads/${thread.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok && data.score !== undefined) {
        setThreadScore(data.score);
      }
    } catch {
      setThreadScore((s) => s - delta);
      setThreadVote(null);
    }
  };

  const handleCommentVote = async (commentId: string, type: 'up' | 'down') => {
    const current = commentVotes[commentId] || { score: 0, voted: null };
    if (current.voted === type) return;

    const delta = current.voted === null ? (type === 'up' ? 1 : -1) : (type === 'up' ? 2 : -2);
    setCommentVotes((prev) => ({
      ...prev,
      [commentId]: { score: current.score + delta, voted: type },
    }));

    try {
      const res = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok && data.score !== undefined) {
        setCommentVotes((prev) => ({
          ...prev,
          [commentId]: { score: data.score, voted: type },
        }));
      }
    } catch {
      setCommentVotes((prev) => ({
        ...prev,
        [commentId]: current,
      }));
    }
  };

  const handleQuoteClick = (c: Comment) => {
    setQuotedComment({
      id: c.id,
      author: c.author_alias,
      text: c.content.length > 100 ? `${c.content.substring(0, 100)}...` : c.content,
    });
    const formEl = document.getElementById('reply-form');
    formEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || cooldown > 0 || isSubmittingComment || !identity) return;

    if (!captchaAnswer.trim() || !captchaData?.token) {
      alert('กรุณากรอกคำตอบคำถามยืนยันความปลอดภัย');
      return;
    }

    setIsSubmittingComment(true);

    try {
      const res = await fetch(`/api/threads/${threadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentContent.trim(),
          parent_id: quotedComment ? quotedComment.id : null,
          quote_text: quotedComment ? quotedComment.text : null,
          quote_author: quotedComment ? quotedComment.author : null,
          author_alias: identity.alias,
          author_avatar: identity.avatarIcon,
          captcha_token: captchaData.token,
          captcha_answer: captchaAnswer.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.comment) {
        setCommentContent('');
        setQuotedComment(null);
        setCooldown(5);
        fetchCaptcha();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการตอบกลับ');
        fetchCaptcha();
      }
    } catch {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      fetchCaptcha();
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-zinc-500 font-mono text-xs">
        LOADING DATA...
      </div>
    );
  }

  if (errorMsg || !thread) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-3">
        <div className="w-10 h-10 bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded-lg flex items-center justify-center mx-auto">
          <AlertTriangle size={18} />
        </div>
        <h2 className="text-sm font-semibold text-zinc-100">ไม่พบกระทู้นี้</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {errorMsg || 'กระทู้อาจหมดอายุและถูกลบทำลายโดยอัตโนมัติ (Self-Destruct)'}
        </p>
        <Link
          href="/"
          className="btn-secondary text-xs inline-flex"
        >
          <ArrowLeft size={13} />
          <span>กลับหน้าบอร์ดหลัก</span>
        </Link>
      </div>
    );
  }

  const isThreadHidden = thread.is_hidden === 1 && !revealedIds[thread.id];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={13} />
          <span>กลับบอร์ดข่าว</span>
        </Link>

        {/* View Switcher: Comments vs Live Chat */}
        <div className="inline-flex items-center bg-white/[0.03] border border-white/[0.06] p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setActiveView('comments')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              activeView === 'comments'
                ? 'bg-zinc-800 text-white font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare size={13} />
            <span className="font-mono tabular-nums">ความคิดเห็น ({comments.length})</span>
          </button>

          <button
            onClick={() => setActiveView('livechat')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
              activeView === 'livechat'
                ? 'bg-zinc-800 text-white font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio size={13} className="text-emerald-400" />
            <span>แชทสดประจำข่าว</span>
          </button>
        </div>
      </div>

      {/* Main Post Card */}
      <article className="bg-[#101216] border border-white/[0.08] rounded-xl p-5 sm:p-6 text-zinc-200">
        {isThreadHidden && (
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-2.5 mb-4 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-rose-400" />
              <span>กระทู้นี้ถูกซ่อนอัตโนมัติเนื่องจากมีผู้รายงานครบ 5 ครั้ง</span>
            </div>
            <button
              onClick={() => setRevealedIds((prev) => ({ ...prev, [thread.id]: true }))}
              className="px-2 py-0.5 bg-white/[0.06] rounded text-[11px] text-zinc-200"
            >
              แสดงเนื้อหา
            </button>
          </div>
        )}

        <div className={isThreadHidden ? 'opacity-30 blur-sm pointer-events-none' : ''}>
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5 text-xs">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white/[0.04] text-zinc-300 border border-white/[0.06]">
              {thread.category.toUpperCase()}
            </span>

            <div className="flex items-center gap-1.5 font-medium text-zinc-200">
              <IdentityAvatar iconKey={thread.author_avatar} size="xs" />
              <span>{thread.author_alias}</span>
            </div>

            <span className="text-zinc-600">•</span>

            <span className="font-mono text-zinc-500 text-[11px] tabular-nums">
              {new Date(thread.created_at).toLocaleString('th-TH', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>

            <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-400 ml-auto bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.04] tabular-nums">
              <Clock size={11} className="text-zinc-500" />
              <span>
                ทำลายใน:{' '}
                {Math.max(
                  0,
                  Math.round(
                    (new Date(thread.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)
                  )
                )}
                h
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-lg sm:text-xl font-bold text-zinc-100 leading-snug mb-3">
            {thread.title}
          </h1>

          {/* Source Link */}
          {thread.source_url && (
            <div className="mb-3">
              <a
                href={thread.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-white/[0.02] border border-white/[0.06] px-2.5 py-1 rounded transition-colors font-mono"
              >
                <ExternalLink size={12} />
                <span>ข่าวต้นทาง: {thread.source_url}</span>
              </a>
            </div>
          )}

          {/* Content Body */}
          <div className="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap pb-5 border-b border-white/[0.06]">
            {thread.content}
          </div>

          {/* Footer: Votes & Share */}
          <div className="flex items-center justify-between pt-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-black/30 border border-white/[0.06] rounded-md p-0.5">
                <button
                  onClick={() => handleThreadVote('up')}
                  className={`p-1 rounded transition-colors active:scale-95 ${
                    threadVote === 'up'
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-zinc-500 hover:text-zinc-200'
                  }`}
                  title="โหวตขึ้น"
                >
                  <ChevronUp size={15} strokeWidth={2.5} />
                </button>

                <span
                  className={`px-1.5 font-mono font-semibold tabular-nums ${
                    threadScore > 0
                      ? 'text-emerald-400'
                      : threadScore < 0
                      ? 'text-rose-400'
                      : 'text-zinc-400'
                  }`}
                >
                  {threadScore}
                </span>

                <button
                  onClick={() => handleThreadVote('down')}
                  className={`p-1 rounded transition-colors active:scale-95 ${
                    threadVote === 'down'
                      ? 'text-rose-400 bg-rose-500/10'
                      : 'text-zinc-500 hover:text-zinc-200'
                  }`}
                  title="โหวตลง"
                >
                  <ChevronDown size={15} strokeWidth={2.5} />
                </button>
              </div>

              <button
                onClick={handleShare}
                className="btn-secondary !py-1 !px-2.5 text-xs"
              >
                {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
                <span>{copiedLink ? 'คัดลอกแล้ว' : 'แชร์'}</span>
              </button>
            </div>

            <button
              onClick={() =>
                setReportTarget({
                  type: 'thread',
                  id: thread.id,
                  title: thread.title,
                })
              }
              className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-rose-400 transition-colors"
            >
              <Flag size={12} />
              <span className="font-mono tabular-nums">
                รายงาน ({thread.report_count})
              </span>
            </button>
          </div>
        </div>
      </article>

      {/* Conditional View: Live Chat vs Comments */}
      {activeView === 'livechat' ? (
        <div className="space-y-3">
          <LiveChatBox roomId={`thread_${thread.id}`} title={`แชทสด: ${thread.title.substring(0, 30)}...`} />
        </div>
      ) : (
        <div className="space-y-5">
          
          {/* Identity Scoped Card */}
          {identity && (
            <div className="bg-[#101216] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <IdentityAvatar iconKey={identity.avatarIcon} size="sm" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">คุณกำลังตอบในฐานะ:</span>
                    <strong className="text-zinc-100 font-semibold">{identity.alias}</strong>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    ชื่อนี้ถูกสุ่มเฉพาะสำหรับกระทู้นี้เท่านั้น จะเปลี่ยนใหม่เมื่อไปกระทู้อื่น
                  </p>
                </div>
              </div>

              <button
                onClick={handleRerollIdentity}
                className="btn-secondary !py-1 !px-2 text-xs shrink-0"
                title="สุ่มชื่อใหม่เฉพาะกระทู้นี้"
              >
                <Dices size={13} />
                <span className="hidden sm:inline">สุ่มชื่อใหม่</span>
              </button>
            </div>
          )}

          {/* Reply Form */}
          <div id="reply-form" className="bg-[#101216] border border-white/[0.08] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <MessageSquare size={13} className="text-emerald-400" />
              <span>แสดงความคิดเห็น</span>
            </h3>

            {/* Quoted preview block */}
            {quotedComment && (
              <div className="bg-white/[0.02] border-l-2 border-emerald-500/70 p-2.5 rounded-r text-xs relative flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                    <Quote size={11} />
                    <span>อ้างอิงถึง {quotedComment.author}:</span>
                  </div>
                  <p className="text-zinc-400 italic text-[11px] line-clamp-2">
                    &ldquo;{quotedComment.text}&rdquo;
                  </p>
                </div>
                <button
                  onClick={() => setQuotedComment(null)}
                  className="p-1 text-zinc-500 hover:text-white rounded"
                  title="ยกเลิกการอ้างอิง"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitComment} className="space-y-3">
              <textarea
                rows={3}
                required
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="แสดงความคิดเห็นอย่างสุภาพ (ไม่บันทึก IP หรือประวัติ)..."
                className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-zinc-500 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors font-sans"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 bg-white/[0.03] border border-white/[0.08] rounded text-xs font-mono font-bold text-emerald-400 shrink-0">
                    {captchaData ? captchaData.question : '...'}
                  </div>
                  <input
                    type="number"
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="คำตอบ..."
                    className="w-20 bg-white/[0.02] border border-white/[0.08] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    className="p-1 text-zinc-500 hover:text-zinc-300"
                    title="เปลี่ยนคำถาม"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!commentContent.trim() || cooldown > 0 || isSubmittingComment}
                  className="btn-primary !py-1.5 !px-3.5 text-xs self-end sm:self-auto"
                >
                  <Send size={12} />
                  <span>
                    {cooldown > 0
                      ? `รอ ${cooldown}s...`
                      : isSubmittingComment
                      ? 'กำลังส่ง...'
                      : 'ส่งความเห็น'}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-zinc-400 tabular-nums">
              ความคิดเห็นทั้งหมด ({comments.length})
            </h3>

            {comments.length === 0 ? (
              <div className="bg-[#101216] border border-white/[0.06] rounded-xl p-6 text-center text-zinc-500 text-xs">
                ยังไม่มีความคิดเห็นในกระทู้นี้
              </div>
            ) : (
              comments.map((comment) => {
                const isCommentHidden = comment.is_hidden === 1 && !revealedIds[comment.id];
                const voteState = commentVotes[comment.id] || { score: comment.score, voted: null };

                return (
                  <div
                    key={comment.id}
                    className="bg-[#101216] border border-white/[0.06] rounded-xl p-3.5 space-y-2.5"
                  >
                    {isCommentHidden ? (
                      <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-2 text-xs text-rose-300 flex items-center justify-between">
                        <span>ความคิดเห็นนี้ถูกซ่อนเนื่องจากถูกรายงาน 5 ครั้ง</span>
                        <button
                          onClick={() => setRevealedIds((prev) => ({ ...prev, [comment.id]: true }))}
                          className="px-2 py-0.5 bg-white/[0.06] rounded text-[11px]"
                        >
                          ดูเนื้อหา
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <IdentityAvatar iconKey={comment.author_avatar} size="xs" />
                            <span className="font-semibold text-zinc-200">{comment.author_alias}</span>
                            <span className="text-zinc-600">•</span>
                            <span className="font-mono text-zinc-500 text-[11px] tabular-nums">
                              {new Date(comment.created_at).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <button
                            onClick={() => handleQuoteClick(comment)}
                            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            <Quote size={11} />
                            <span>อ้างอิง</span>
                          </button>
                        </div>

                        {comment.quote_text && (
                          <div className="bg-white/[0.02] border-l-2 border-white/[0.14] pl-2.5 py-1 text-xs">
                            <div className="text-[10px] font-mono text-zinc-500">
                              อ้างอิงถึง {comment.quote_author || 'ความคิดเห็น'}:
                            </div>
                            <div className="text-zinc-400 italic text-[11px] line-clamp-2">
                              &ldquo;{comment.quote_text}&rdquo;
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04] text-xs">
                          <div className="flex items-center bg-black/30 border border-white/[0.06] rounded p-0.5">
                            <button
                              onClick={() => handleCommentVote(comment.id, 'up')}
                              className={`p-0.5 rounded transition-colors active:scale-95 ${
                                voteState.voted === 'up'
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : 'text-zinc-500 hover:text-zinc-200'
                              }`}
                            >
                              <ChevronUp size={13} strokeWidth={2.5} />
                            </button>

                            <span
                              className={`px-1 text-[11px] font-mono font-semibold tabular-nums ${
                                voteState.score > 0
                                  ? 'text-emerald-400'
                                  : voteState.score < 0
                                  ? 'text-rose-400'
                                  : 'text-zinc-400'
                              }`}
                            >
                              {voteState.score}
                            </span>

                            <button
                              onClick={() => handleCommentVote(comment.id, 'down')}
                              className={`p-0.5 rounded transition-colors active:scale-95 ${
                                voteState.voted === 'down'
                                  ? 'text-rose-400 bg-rose-500/10'
                                  : 'text-zinc-500 hover:text-zinc-200'
                              }`}
                            >
                              <ChevronDown size={13} strokeWidth={2.5} />
                            </button>
                          </div>

                          <button
                            onClick={() =>
                              setReportTarget({
                                type: 'comment',
                                id: comment.id,
                                title: comment.content,
                              })
                            }
                            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-rose-400 transition-colors"
                          >
                            <Flag size={11} />
                            <span>รายงาน</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {reportTarget && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetTitle={reportTarget.title}
          onReportSuccess={(newCount, hidden) => {
            if (hidden) {
              setRevealedIds((prev) => ({ ...prev, [reportTarget.id]: false }));
            }
          }}
        />
      )}
    </div>
  );
}
