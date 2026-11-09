'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Thread, Comment, CaptchaChallenge } from '@/types';
import { getScopedIdentity, rerollScopedIdentity, AnonymousIdentity } from '@/lib/privacy';
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
  ShieldCheck,
  X
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

  // Tab: 'comments' or 'livechat'
  const [activeView, setActiveView] = useState<'comments' | 'livechat'>('comments');

  // Voting state for thread
  const [threadScore, setThreadScore] = useState(0);
  const [threadVote, setThreadVote] = useState<'up' | 'down' | null>(null);

  // Voting state for comments
  const [commentVotes, setCommentVotes] = useState<Record<string, { score: number; voted: 'up' | 'down' | null }>>({});

  // Ephemeral Scoped Persona for this specific thread
  const [identity, setIdentity] = useState<AnonymousIdentity | null>(null);

  // Comment input form
  const [commentContent, setCommentContent] = useState('');
  const [quotedComment, setQuotedComment] = useState<{ id: string; author: string; text: string } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Captcha
  const [captchaData, setCaptchaData] = useState<CaptchaChallenge | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  // Report modal
  const [reportTarget, setReportTarget] = useState<{
    type: 'thread' | 'comment';
    id: string;
    title?: string;
  } | null>(null);

  // Revealed hidden items
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Copied link indicator
  const [copiedLink, setCopiedLink] = useState(false);

  // Load scoped identity specifically for this thread
  useEffect(() => {
    const id = getScopedIdentity(`thread_${threadId}`);
    setIdentity(id);
  }, [threadId]);

  // Fetch captcha
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

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Fetch Thread and Comments
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

      // initialize comment votes map
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

  // Connect SSE for Real-Time Thread Updates
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
    // Scroll smoothly to reply form
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
          author_avatar: identity.avatar,
          captcha_token: captchaData.token,
          captcha_answer: captchaAnswer.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.comment) {
        setCommentContent('');
        setQuotedComment(null);
        setCooldown(5); // 5 seconds anti-spam client cooldown
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
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs">กำลังโหลดเนื้อหาแบบปลอดภัย (Zero-Trace)...</p>
      </div>
    );
  }

  if (errorMsg || !thread) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-950/40 border border-rose-800 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-white">ไม่พบกระทู้นี้</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {errorMsg || 'กระทู้อาจหมดอายุและถูกลบทำลายโดยอัตโนมัติ (Self-Destruct) หรือถูกซ่อนโดยชุมชน'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าบอร์ดหลัก</span>
        </Link>
      </div>
    );
  }

  const isThreadHidden = thread.is_hidden === 1 && !revealedIds[thread.id];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับบอร์ดข่าว</span>
        </Link>

        {/* View Switcher: กระทู้สนทนา vs แชทสดประจำกระทู้ */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveView('comments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeView === 'comments'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>กระทู้พูดคุย ({comments.length})</span>
          </button>

          <button
            onClick={() => setActiveView('livechat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeView === 'livechat'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>ห้องแชทสดประจำข่าวนี้</span>
          </button>
        </div>
      </div>

      {/* Main Thread Article */}
      <article className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Hidden notification banner */}
        {isThreadHidden && (
          <div className="bg-rose-950/50 border border-rose-900/60 rounded-xl p-3 mb-4 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>กระทู้นี้ถูกซ่อนอัตโนมัติ เนื่องจากถูกรายงานจากชุมชนครบ 5 ครั้ง</span>
            </div>
            <button
              onClick={() => setRevealedIds((prev) => ({ ...prev, [thread.id]: true }))}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-medium"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>แสดงเนื้อหา</span>
            </button>
          </div>
        )}

        <div className={isThreadHidden ? 'opacity-30 filter blur-sm pointer-events-none' : ''}>
          {/* Metadata Header */}
          <div className="flex flex-wrap items-center gap-2.5 mb-3 text-xs text-slate-400">
            {/* Category */}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
              {thread.category.toUpperCase()}
            </span>

            {/* Author */}
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <span className="text-base">{thread.author_avatar}</span>
              <span>{thread.author_alias}</span>
            </div>

            <span className="text-slate-600">•</span>

            {/* Created time */}
            <span>
              {new Date(thread.created_at).toLocaleString('th-TH', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>

            {/* Expiry Badge */}
            <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2.5 py-0.5 rounded-full ml-auto">
              <Clock className="w-3 h-3" />
              <span>
                ทำลายใน:{' '}
                {Math.max(
                  0,
                  Math.round(
                    (new Date(thread.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)
                  )
                )}{' '}
                ชม.
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-black text-white leading-snug mb-4">
            {thread.title}
          </h1>

          {/* Source Link */}
          {thread.source_url && (
            <div className="mb-4">
              <a
                href={thread.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 border border-cyan-800/40 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>ข่าวต้นทาง: {thread.source_url}</span>
              </a>
            </div>
          )}

          {/* Body Content */}
          <div className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap pb-6 border-b border-slate-800/80">
            {thread.content}
          </div>

          {/* Article Footer: Votes, Share, Report */}
          <div className="flex items-center justify-between pt-4 text-xs">
            <div className="flex items-center gap-2">
              {/* Vote controls */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
                <button
                  onClick={() => handleThreadVote('up')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    threadVote === 'up'
                      ? 'text-emerald-400 bg-emerald-500/15'
                      : 'text-slate-400 hover:text-emerald-400'
                  }`}
                  title="เห็นด้วย / โหวตขึ้น"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>

                <span
                  className={`px-1.5 font-bold ${
                    threadScore > 0
                      ? 'text-emerald-400'
                      : threadScore < 0
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {threadScore}
                </span>

                <button
                  onClick={() => handleThreadVote('down')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    threadVote === 'down'
                      ? 'text-rose-400 bg-rose-500/15'
                      : 'text-slate-400 hover:text-rose-400'
                  }`}
                  title="ไม่เห็นด้วย / โหวตลง"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Share button */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-850 rounded-xl text-slate-300 hover:text-white transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'คัดลอกลิงก์แล้ว' : 'แชร์'}</span>
              </button>
            </div>

            {/* Report */}
            <button
              onClick={() =>
                setReportTarget({
                  type: 'thread',
                  id: thread.id,
                  title: thread.title,
                })
              }
              className="flex items-center gap-1 text-slate-500 hover:text-rose-400 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>รายงานกระทู้ ({thread.report_count})</span>
            </button>
          </div>
        </div>
      </article>

      {/* Conditionally Show Live Chat vs Comments */}
      {activeView === 'livechat' ? (
        <div className="space-y-3">
          <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-2xl text-xs text-cyan-300 flex items-center gap-2">
            <Radio className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>
              ห้องแชทสดประจำกระทู้นี้ (คุยสดแบบเรียลไทม์ จำกัด 100 ข้อความล่าสุด ไม่บันทึกข้อมูลส่วนบุคคล)
            </span>
          </div>
          <LiveChatBox roomId={`thread_${thread.id}`} title={`แชทสด: ${thread.title.substring(0, 30)}...`} />
        </div>
      ) : (
        /* Comments Section */
        <div className="space-y-6">
          
          {/* Per-Thread Scoped Anonymous Identity Card */}
          {identity && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-center text-lg">
                  {identity.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">คุณกำลังตอบในฐานะ:</span>
                    <strong className="text-emerald-400 font-bold">{identity.alias}</strong>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    🛡️ ชื่อนี้สุ่มเฉพาะสำหรับกระทู้นี้เท่านั้น เมื่อไปกระทู้อื่นคุณจะได้ชื่อใหม่ เพื่อไม่ให้คนอื่นตามรอยได้
                  </p>
                </div>
              </div>

              <button
                onClick={handleRerollIdentity}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-emerald-400 transition-colors self-start sm:self-auto shrink-0"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>ทอยสุ่มชื่อใหม่</span>
              </button>
            </div>
          )}

          {/* Reply Form */}
          <div id="reply-form" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>เขียนความคิดเห็นตอบกลับ</span>
              </h3>
            </div>

            {/* Quoted Comment Preview Banner */}
            {quotedComment && (
              <div className="bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs relative flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                    <Quote className="w-3.5 h-3.5" />
                    <span>กำลังอ้างอิงถึงข้อความของ: {quotedComment.author}</span>
                  </div>
                  <p className="text-slate-300 italic border-l-2 border-cyan-500/40 pl-2">
                    &ldquo;{quotedComment.text}&rdquo;
                  </p>
                </div>
                <button
                  onClick={() => setQuotedComment(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  title="ยกเลิกการอ้างอิง"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitComment} className="space-y-4">
              <textarea
                rows={3}
                required
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="แสดงความคิดเห็นแบบสุภาพ ให้เกียรติซึ่งกันและกัน (ไม่เก็บ IP หรือประวัติ)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
              />

              {/* Captcha and Submit row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Math Captcha */}
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-emerald-300 shrink-0">
                    {captchaData ? captchaData.question : '...'}
                  </div>
                  <input
                    type="number"
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="คำตอบ..."
                    className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    className="p-1.5 text-slate-500 hover:text-white rounded-lg"
                    title="เปลี่ยนโจทย์คำถาม"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!commentContent.trim() || cooldown > 0 || isSubmittingComment}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all self-end sm:self-auto"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {cooldown > 0
                      ? `รอ ${cooldown} วินาที...`
                      : isSubmittingComment
                      ? 'กำลังส่ง...'
                      : 'ส่งความเห็น'}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Comments List */}
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold text-slate-300">
              ความคิดเห็นทั้งหมด ({comments.length})
            </h3>

            {comments.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                ยังไม่มีความคิดเห็นในกระทู้นี้ มาเป็นคนแรกที่เปิดประเด็นกันเลย
              </div>
            ) : (
              comments.map((comment) => {
                const isCommentHidden = comment.is_hidden === 1 && !revealedIds[comment.id];
                const voteState = commentVotes[comment.id] || { score: comment.score, voted: null };

                return (
                  <div
                    key={comment.id}
                    className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3 transition-colors"
                  >
                    {/* If comment is hidden by 5 reports */}
                    {isCommentHidden ? (
                      <div className="bg-rose-950/30 border border-rose-900/40 rounded-xl p-3 text-xs text-rose-300 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span>ความคิดเห็นนี้ถูกซ่อน เนื่องจากมีผู้รายงานครบ 5 ครั้ง</span>
                        </div>
                        <button
                          onClick={() => setRevealedIds((prev) => ({ ...prev, [comment.id]: true }))}
                          className="flex items-center gap-1 px-2 py-0.5 bg-rose-900/60 rounded text-[11px]"
                        >
                          <Eye className="w-3 h-3" />
                          <span>ดูเนื้อหา</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Comment Header: Author & Time */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{comment.author_avatar}</span>
                            <span className="font-bold text-slate-200">{comment.author_alias}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-500 text-[11px]">
                              {new Date(comment.created_at).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {/* Quoted action button */}
                          <button
                            onClick={() => handleQuoteClick(comment)}
                            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            <Quote className="w-3 h-3" />
                            <span>อ้างอิงข้อความนี้</span>
                          </button>
                        </div>

                        {/* Quoted Text if this comment replied to another */}
                        {comment.quote_text && (
                          <div className="bg-slate-950/60 border-l-2 border-cyan-500/60 pl-3 py-1.5 rounded-r-lg text-xs space-y-0.5">
                            <div className="text-[10px] text-cyan-400 font-semibold">
                              อ้างอิงถึง {comment.quote_author || 'ความคิดเห็น'}:
                            </div>
                            <div className="text-slate-400 italic line-clamp-2">
                              &ldquo;{comment.quote_text}&rdquo;
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </div>

                        {/* Comment Footer: Vote and Report */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                            <button
                              onClick={() => handleCommentVote(comment.id, 'up')}
                              className={`p-1 rounded transition-colors ${
                                voteState.voted === 'up'
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : 'text-slate-400 hover:text-emerald-400'
                              }`}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>

                            <span
                              className={`px-1 text-[11px] font-bold ${
                                voteState.score > 0
                                  ? 'text-emerald-400'
                                  : voteState.score < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {voteState.score}
                            </span>

                            <button
                              onClick={() => handleCommentVote(comment.id, 'down')}
                              className={`p-1 rounded transition-colors ${
                                voteState.voted === 'down'
                                  ? 'text-rose-400 bg-rose-500/10'
                                  : 'text-slate-400 hover:text-rose-400'
                              }`}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
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
                            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Flag className="w-3 h-3" />
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

      {/* Global Report Modal */}
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
