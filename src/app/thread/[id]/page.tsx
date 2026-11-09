'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Thread, Comment, CommentNode, CaptchaChallenge } from '@/types';
import { getScopedIdentity, rerollScopedIdentity, setCustomScopedIdentity, isThreadAuthor, AnonymousIdentity } from '@/lib/privacy';
import { buildCommentTree } from '@/lib/commentTree';
import { useSettings } from '@/lib/settings';
import IdentityAvatar from '@/components/IdentityAvatar';
import ReportModal from '@/components/ReportModal';
import EditThreadModal from '@/components/EditThreadModal';
import DeleteThreadModal from '@/components/DeleteThreadModal';
import LiveChatBox from '@/components/LiveChatBox';
import CommunitySidebar from '@/components/CommunitySidebar';
import ThreadedCommentTree from '@/components/ThreadedCommentTree';
import ThreadPoll from '@/components/ThreadPoll';
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  ExternalLink,
  Clock,
  Flag,
  AlertTriangle,
  Send,
  Dices,
  RefreshCw,
  Radio,
  Share2,
  Check,
  Bookmark,
  Sparkles,
  Film,
  Image as ImageIcon,
  Edit2,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const threadId = resolvedParams.id;
  const { settings } = useSettings();

  const [thread, setThread] = useState<Thread | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentTree, setCommentTree] = useState<CommentNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isMediaRevealed, setIsMediaRevealed] = useState(!settings.blurMedia);

  const [activeView, setActiveView] = useState<'comments' | 'livechat'>('comments');

  const [threadScore, setThreadScore] = useState(0);
  const [threadVote, setThreadVote] = useState<'up' | 'down' | null>(null);

  const [commentVotes, setCommentVotes] = useState<Record<string, { score: number; voted: 'up' | 'down' | null }>>({});

  const [identity, setIdentity] = useState<AnonymousIdentity | null>(null);
  const [customAlias, setCustomAlias] = useState('');
  const [isEditingAlias, setIsEditingAlias] = useState(false);

  // Root comment input form
  const [commentContent, setCommentContent] = useState('');
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

  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const id = getScopedIdentity(`thread_${threadId}`);
    setIdentity(id);
    setCustomAlias(id.alias);
    setIsAuthor(isThreadAuthor(threadId));
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
        setErrorMsg('ไม่พบโพสต์นี้ หรือโพสต์อาจหมดอายุและถูกลบไปแล้วตามนโยบายความเป็นส่วนตัว');
        return;
      }

      const threadData = await threadRes.json();
      const commentsData = await commentsRes.json();

      setThread(threadData.thread);
      setThreadScore(threadData.thread.score);

      const rawComments: Comment[] = commentsData.comments || [];
      setComments(rawComments);
      setCommentTree(buildCommentTree(rawComments));

      const votesMap: Record<string, { score: number; voted: 'up' | 'down' | null }> = {};
      rawComments.forEach((c) => {
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
          const updated = [...prev, newC];
          setCommentTree(buildCommentTree(updated));
          return updated;
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
          setComments((prev) => {
            const updated = prev.map((c) => (c.id === id ? { ...c, is_hidden: 1 } : c));
            setCommentTree(buildCommentTree(updated));
            return updated;
          });
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
    setCustomAlias(newId.alias);
  };

  const handleSaveCustomAlias = () => {
    if (!customAlias.trim()) return;
    const finalAlias = customAlias.trim();
    setCustomScopedIdentity(`thread_${threadId}`, finalAlias);
    setIdentity((prev) => prev ? { ...prev, alias: finalAlias } : null);
    setIsEditingAlias(false);
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

  // Submit root level comment
  const handleSubmitRootComment = async (e: React.FormEvent) => {
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
          parent_id: null,
          author_alias: customAlias.trim() || identity.alias,
          author_avatar: identity.avatarIcon,
          captcha_token: captchaData.token,
          captcha_answer: captchaAnswer.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.comment) {
        setCommentContent('');
        setCooldown(5);
        fetchCaptcha();
        if (settings.strictZeroTrace) {
          const fresh = rerollScopedIdentity(`thread_${threadId}`);
          setIdentity(fresh);
          setCustomAlias(fresh.alias);
        }
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

  // Submit nested reply to another comment (Reddit nested comment)
  const handleNestedReply = async (
    parentId: string,
    content: string,
    ans: string
  ): Promise<boolean> => {
    if (!identity || !captchaData?.token) return false;

    try {
      const res = await fetch(`/api/threads/${threadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          parent_id: parentId,
          author_alias: customAlias.trim() || identity.alias,
          author_avatar: identity.avatarIcon,
          captcha_token: captchaData.token,
          captcha_answer: ans,
        }),
      });

      const data = await res.json();
      if (res.ok && data.comment) {
        fetchCaptcha();
        if (settings.strictZeroTrace) {
          const fresh = rerollScopedIdentity(`thread_${threadId}`);
          setIdentity(fresh);
          setCustomAlias(fresh.alias);
        }
        return true;
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการตอบกลับ');
        fetchCaptcha();
        return false;
      }
    } catch {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      fetchCaptcha();
      return false;
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
      <div className="max-w-4xl mx-auto py-12 text-center text-zinc-500 font-mono text-xs">
        LOADING ZRMA REDDIT THREAD...
      </div>
    );
  }

  if (errorMsg || !thread) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-3">
        <div className="w-10 h-10 bg-red-950/20 border border-red-900/40 text-red-400 rounded-lg flex items-center justify-center mx-auto">
          <AlertTriangle size={18} />
        </div>
        <h2 className="text-sm font-semibold text-zinc-100">ไม่พบโพสต์นี้</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {errorMsg || 'กระทู้อาจหมดอายุและถูกลบทำลายโดยอัตโนมัติ (Self-Destruct)'}
        </p>
        <Link
          href="/"
          className="btn-secondary text-xs inline-flex"
        >
          <ArrowLeft size={13} />
          <span>กลับบอร์ดหลัก</span>
        </Link>
      </div>
    );
  }

  const isThreadHidden = thread.is_hidden === 1 && !revealedIds[thread.id];
  const cleanCategory = (thread.category || 'general').replace(/^[zr]\//i, '');
  const subredditName = `z/${cleanCategory}`;
  const cleanAuthorAlias = (thread.author_alias || 'ผู้ไม่ประสงค์ออกนาม').replace(/^u\//, '');

  const isVideo =
    thread.media_type === 'video' ||
    (thread.media_url && /\.(mp4|webm|mov)$/i.test(thread.media_url));

  const isImage =
    thread.media_type === 'image' ||
    (thread.media_url && /\.(jpg|jpeg|png|webp|gif)$/i.test(thread.media_url));

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Top Breadcrumb & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
        <Link
          href={`/?category=${cleanCategory}`}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-yellow-400 transition-colors font-mono shrink-0"
        >
          <ArrowLeft size={13} />
          <span>กลับไปที่ {subredditName}</span>
        </Link>

        {/* View Switcher: Comments vs Live Chat */}
        <div className="inline-flex items-center bg-black/40 border border-white/[0.06] p-0.5 rounded-lg text-xs self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveView('comments')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors shrink-0 ${
              activeView === 'comments'
                ? 'bg-red-600 text-white font-medium shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare size={13} />
            <span className="font-mono tabular-nums">ความคิดเห็น ({comments.length})</span>
          </button>

          <button
            onClick={() => setActiveView('livechat')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors shrink-0 ${
              activeView === 'livechat'
                ? 'bg-yellow-400 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio size={13} className={activeView === 'livechat' ? 'text-zinc-950' : 'text-yellow-400'} />
            <span>ห้องแชทสดประจำข่าว</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Post & Comments (8 cols) + Community Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Post Card & Threaded Comments */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          
          {/* Main Post Card (Reddit Style) */}
          <article className="w-full max-w-full overflow-hidden bg-[#101217] border border-white/[0.08] rounded-xl p-3.5 sm:p-5 text-zinc-200 shadow-xl">
            {isThreadHidden && (
              <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-2.5 mb-4 text-xs text-red-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-400" />
                  <span>โพสต์นี้ถูกซ่อนอัตโนมัติเนื่องจากมีผู้รายงานครบ 5 ครั้ง</span>
                </div>
                <button
                  onClick={() => setRevealedIds((prev) => ({ ...prev, [thread.id]: true }))}
                  className="px-2 py-0.5 bg-white/[0.06] rounded text-[11px] text-zinc-200"
                >
                  แสดงเนื้อหา
                </button>
              </div>
            )}

            <div className={`flex gap-2.5 sm:gap-4 min-w-0 ${isThreadHidden ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
              
              {/* Reddit Upvote / Downvote column */}
              <div className="flex flex-col items-center bg-black/40 border border-white/[0.06] rounded-lg p-1 self-start shrink-0">
                <button
                  onClick={() => handleThreadVote('up')}
                  className={`p-1 rounded transition-colors active:scale-95 ${
                    threadVote === 'up'
                      ? 'text-yellow-400 bg-yellow-500/15'
                      : 'text-zinc-500 hover:text-yellow-400'
                  }`}
                  title="Upvote"
                >
                  <ChevronUp size={18} strokeWidth={2.5} />
                </button>

                <span
                  className={`text-xs font-mono font-bold tabular-nums my-0.5 ${
                    threadScore > 0
                      ? 'text-yellow-400'
                      : threadScore < 0
                      ? 'text-red-400'
                      : 'text-zinc-400'
                  }`}
                >
                  {threadScore}
                </span>

                <button
                  onClick={() => handleThreadVote('down')}
                  className={`p-1 rounded transition-colors active:scale-95 ${
                    threadVote === 'down'
                      ? 'text-red-400 bg-red-500/15'
                      : 'text-zinc-500 hover:text-red-400'
                  }`}
                  title="Downvote"
                >
                  <ChevronDown size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* Post Content */}
              <div className="flex-1 min-w-0 overflow-hidden">
                
                {/* Header metadata */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 text-xs">
                  <Link
                    href={`/?category=${cleanCategory}`}
                    className="font-mono font-bold text-yellow-400 hover:underline"
                  >
                    {subredditName}
                  </Link>

                  <span className="text-zinc-600">•</span>

                  <div className="flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                    <IdentityAvatar iconKey={thread.author_avatar} theme="red" size="xs" />
                    <span>u/{cleanAuthorAlias}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-red-600 text-white ml-0.5">
                      OP
                    </span>
                  </div>

                  <span className="text-zinc-600">•</span>

                  <span className="font-mono text-zinc-500 text-[11px] tabular-nums">
                    {new Date(thread.created_at).toLocaleString('th-TH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>

                  {thread.is_edited === 1 && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span className="font-mono text-zinc-500 text-[11px] italic">
                        (แก้ไขแล้ว)
                      </span>
                    </>
                  )}

                  {thread.flair && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold border text-yellow-400 bg-yellow-500/10 border-yellow-500/25 ml-1">
                      {thread.flair}
                    </span>
                  )}

                  {/* Expiration badge */}
                  <div className="flex items-center gap-1 font-mono text-[10px] text-orange-400 ml-auto bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 tabular-nums">
                    <Clock size={11} className="text-orange-400" />
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

                {/* Media Attachment Player / Preview */}
                {thread.media_url && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-white/[0.08] bg-black/60 relative">
                    {settings.blurMedia && !isMediaRevealed ? (
                      <div className="relative group/blur">
                        <div className="filter blur-xl scale-110 pointer-events-none select-none max-h-[400px] overflow-hidden opacity-40">
                          {isVideo ? (
                            <video src={thread.media_url} className="w-full max-h-[400px] object-cover" />
                          ) : (
                            <img src={thread.media_url} alt="" className="w-full max-h-[400px] object-cover" />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                          <button
                            type="button"
                            onClick={() => setIsMediaRevealed(true)}
                            className="px-4 py-2 rounded-xl bg-yellow-400 text-zinc-950 hover:bg-yellow-300 font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
                          >
                            <Eye size={15} />
                            <span>แตะเพื่อแสดงสื่อ (Auto-Blur Active)</span>
                          </button>
                          <p className="text-[11px] text-zinc-400 mt-2">
                            ตั้งค่าโหมดเบลอสื่อเริ่มต้นไว้ เพื่อความปลอดภัยในการเปิดอ่านในที่สาธารณะ
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        {isVideo ? (
                          <div className="relative">
                            <video
                              src={thread.media_url}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full max-h-[500px] object-contain bg-black"
                            />
                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-yellow-400 flex items-center gap-1 pointer-events-none">
                              <Film size={11} />
                              <span>วิดีโอ</span>
                            </div>
                          </div>
                        ) : isImage ? (
                          <div className="relative group/img cursor-pointer" onClick={() => window.open(thread.media_url!, '_blank')}>
                            <img
                              src={thread.media_url}
                              alt={thread.title}
                              className="w-full max-h-[500px] object-contain bg-black hover:opacity-95 transition-opacity"
                            />
                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-zinc-300 flex items-center gap-1 pointer-events-none">
                              <ImageIcon size={11} />
                              <span>รูปภาพ</span>
                            </div>
                          </div>
                        ) : null}

                        {settings.blurMedia && (
                          <button
                            type="button"
                            onClick={() => setIsMediaRevealed(false)}
                            className="absolute top-2 right-2 bg-black/75 hover:bg-black text-zinc-300 hover:text-white px-2.5 py-1 rounded text-[10px] font-mono border border-white/[0.1] flex items-center gap-1 transition-colors"
                          >
                            <EyeOff size={11} />
                            <span>เบลอกลับ</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Source Link */}
                {thread.source_url && (
                  <div className="mb-3">
                    <a
                      href={thread.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-yellow-400 bg-white/[0.02] border border-white/[0.06] hover:border-yellow-500/25 px-2.5 py-1 rounded transition-colors font-mono"
                    >
                      <ExternalLink size={12} className="text-yellow-400" />
                      <span>ข่าวต้นทาง: {thread.source_url}</span>
                    </a>
                  </div>
                )}

                {/* Body Content */}
                {thread.content && (
                  <div className={`text-zinc-300 leading-relaxed whitespace-pre-wrap pb-4 border-b border-white/[0.06] ${
                    settings.fontSize === 'comfortable' ? 'text-sm sm:text-base leading-relaxed' : 'text-xs sm:text-sm leading-relaxed'
                  }`}>
                    {thread.content}
                  </div>
                )}

                {/* Community Poll (if enabled) */}
                {thread.poll && (
                  <div className="pt-2 pb-1">
                    <ThreadPoll
                      threadId={thread.id}
                      poll={thread.poll}
                      onPollUpdated={(updated) => {
                        setThread((prev) => (prev ? { ...prev, poll: updated } : null));
                      }}
                    />
                  </div>
                )}

                {/* Reddit Action Bar */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3 text-xs w-full">
                  <div className="inline-flex items-center gap-1.5 text-zinc-400 font-mono text-[11px] shrink-0">
                    <MessageSquare size={13} />
                    <span>{comments.length} ความคิดเห็น</span>
                  </div>

                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-yellow-400 transition-colors p-1 rounded hover:bg-white/[0.03] shrink-0"
                  >
                    {copiedLink ? <Check size={13} className="text-yellow-400" /> : <Share2 size={13} />}
                    <span>{copiedLink ? 'คัดลอกแล้ว' : 'แชร์'}</span>
                  </button>

                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`inline-flex items-center gap-1.5 transition-colors p-1 rounded hover:bg-white/[0.03] shrink-0 ${
                      isSaved ? 'text-yellow-400 font-semibold' : 'text-zinc-400 hover:text-yellow-400'
                    }`}
                  >
                    <Bookmark size={13} />
                    <span>{isSaved ? 'บันทึกแล้ว' : 'บันทึก'}</span>
                  </button>

                  {isAuthor && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowEditModal(true)}
                        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-yellow-400 transition-colors p-1 rounded hover:bg-white/[0.03] shrink-0"
                        title="แก้ไขโพสต์นี้"
                      >
                        <Edit3 size={13} />
                        <span>แก้ไข</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-white/[0.03] shrink-0"
                        title="ลบโพสต์นี้"
                      >
                        <Trash2 size={13} />
                        <span>ลบ</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() =>
                      setReportTarget({
                        type: 'thread',
                        id: thread.id,
                        title: thread.title,
                      })
                    }
                    className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-red-400 transition-colors ml-auto shrink-0"
                  >
                    <Flag size={12} />
                    <span className="font-mono tabular-nums">
                      รายงาน ({thread.report_count})
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* Conditional View: Live Chat vs Comments */}
          {activeView === 'livechat' ? (
            <div className="h-[calc(100dvh-180px)] sm:h-[580px]">
              <LiveChatBox roomId={`thread_${thread.id}`} title={`แชทสด: ${thread.title.substring(0, 30)}...`} />
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Ephemeral Identity Notice with Custom Display Name Support */}
              {identity && (
                <div className="bg-[#101217] border border-white/[0.06] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <IdentityAvatar iconKey={identity.avatarIcon} theme="red" size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-400">คุณกำลังแสดงความเห็นในฐานะ:</span>
                        {isEditingAlias ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={customAlias}
                              onChange={(e) => setCustomAlias(e.target.value)}
                              placeholder="u/ชื่อที่คุณต้องการ"
                              maxLength={40}
                              className="bg-black/50 border border-yellow-400 rounded px-2 py-0.5 text-xs text-yellow-400 font-mono font-semibold focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleSaveCustomAlias}
                              className="px-2 py-0.5 bg-yellow-400 text-zinc-950 font-bold rounded text-[11px]"
                            >
                              บันทึก
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <strong className="text-zinc-100 font-semibold font-mono">
                              u/{customAlias.replace(/^u\//, '')}
                            </strong>
                            <button
                              type="button"
                              onClick={() => setIsEditingAlias(true)}
                              className="text-zinc-500 hover:text-yellow-400 p-0.5 rounded"
                              title="เปลี่ยนชื่อแสดงตัวตน"
                            >
                              <Edit2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        สุ่มรหัสหรือตั้งชื่อเองเฉพาะสำหรับโพสต์นี้ ข้อมูลไร้ประวัติติดตามตัว
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      onClick={handleRerollIdentity}
                      className="btn-secondary !py-1 !px-2 text-xs shrink-0 hover:border-yellow-500/30"
                      title="สุ่มชื่อใหม่เฉพาะกระทู้นี้"
                    >
                      <Dices size={13} className="text-yellow-400" />
                      <span>สุ่มชื่อใหม่</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Root Comment Form (Top-level reply) */}
              <div className="bg-[#101217] border border-white/[0.08] rounded-xl p-4 space-y-3">
                <span className="text-xs font-semibold text-zinc-200">
                  แสดงความคิดเห็นในโพสต์นี้
                </span>

                <form onSubmit={handleSubmitRootComment} className="space-y-3">
                  <textarea
                    rows={3}
                    required
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="เขียนความคิดเห็นของคุณในฐานะนิรนาม..."
                    className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-red-500 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors font-sans"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/25 rounded text-xs font-mono font-bold text-yellow-400 shrink-0">
                        {captchaData ? captchaData.question : '...'}
                      </div>
                      <input
                        type="number"
                        required
                        value={captchaAnswer}
                        onChange={(e) => setCaptchaAnswer(e.target.value)}
                        placeholder="คำตอบ..."
                        className="w-20 bg-white/[0.02] border border-white/[0.08] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-yellow-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={fetchCaptcha}
                        className="p-1 text-zinc-500 hover:text-yellow-400"
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
                          : 'โพสต์ความเห็น'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Reddit Threaded Comments Tree */}
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-white/[0.06] text-xs">
                  <span className="font-mono text-zinc-400 font-semibold tabular-nums">
                    ความคิดเห็นแบบจัดลำดับ ({comments.length})
                  </span>
                  <span className="text-[11px] text-zinc-500">คลิกเส้นด้านซ้ายเพื่อย่อ/ขยายบทสนทนา</span>
                </div>

                <ThreadedCommentTree
                  comments={commentTree}
                  opAuthorAlias={thread.author_alias}
                  onVote={handleCommentVote}
                  commentVotes={commentVotes}
                  onReport={(id, text) => setReportTarget({ type: 'comment', id, title: text })}
                  onSubmitNestedReply={handleNestedReply}
                  captchaData={captchaData}
                  onRefreshCaptcha={fetchCaptcha}
                  currentIdentityAlias={customAlias || identity?.alias}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Community Sidebar */}
        <aside className="lg:col-span-4 lg:sticky lg:top-16 space-y-4">
          <CommunitySidebar currentCategory={thread.category} />
        </aside>

      </div>

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

      {thread && (
        <>
          <EditThreadModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            thread={thread}
            onThreadUpdated={(updated) => setThread(updated)}
          />

          <DeleteThreadModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            thread={thread}
            onThreadDeleted={() => {
              router.push('/');
            }}
          />
        </>
      )}
    </div>
  );
}
