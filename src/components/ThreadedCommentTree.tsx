'use client';

import React, { useState } from 'react';
import { CommentNode, CaptchaChallenge } from '@/types';
import IdentityAvatar from './IdentityAvatar';
import {
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Flag,
  Send,
  Eye,
  X,
  Minus,
  Plus,
  RefreshCw,
  CornerDownRight,
} from 'lucide-react';

interface ThreadedCommentTreeProps {
  comments: CommentNode[];
  opAuthorAlias?: string;
  onVote: (commentId: string, type: 'up' | 'down') => void;
  commentVotes: Record<string, { score: number; voted: 'up' | 'down' | null }>;
  onReport: (targetId: string, contentText: string) => void;
  onSubmitNestedReply: (parentId: string, content: string, captchaAnswer: string) => Promise<boolean>;
  captchaData: CaptchaChallenge | null;
  onRefreshCaptcha: () => void;
  currentIdentityAlias?: string;
}

function SingleCommentNode({
  node,
  opAuthorAlias,
  onVote,
  commentVotes,
  onReport,
  onSubmitNestedReply,
  captchaData,
  onRefreshCaptcha,
  currentIdentityAlias,
  depth = 0,
}: {
  node: CommentNode;
  opAuthorAlias?: string;
  onVote: (commentId: string, type: 'up' | 'down') => void;
  commentVotes: Record<string, { score: number; voted: 'up' | 'down' | null }>;
  onReport: (targetId: string, contentText: string) => void;
  onSubmitNestedReply: (parentId: string, content: string, captchaAnswer: string) => Promise<boolean>;
  captchaData: CaptchaChallenge | null;
  onRefreshCaptcha: () => void;
  currentIdentityAlias?: string;
  depth?: number;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyCaptcha, setReplyCaptcha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const voteState = commentVotes[node.id] || { score: node.score, voted: null };
  const isOP = opAuthorAlias && node.author_alias === opAuthorAlias;
  const isHidden = node.is_hidden === 1 && !isRevealed;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyCaptcha.trim()) return;

    setIsSubmitting(true);
    const success = await onSubmitNestedReply(node.id, replyText.trim(), replyCaptcha.trim());
    setIsSubmitting(false);

    if (success) {
      setReplyText('');
      setReplyCaptcha('');
      setShowReplyForm(false);
    }
  };

  return (
    <div className={`relative w-full max-w-full overflow-hidden ${depth > 0 ? (depth > 2 ? 'ml-1.5 sm:ml-4 pl-1.5 sm:pl-3' : 'ml-2 sm:ml-4 pl-2 sm:pl-3') : ''}`}>
      {/* Reddit-style Vertical Threadline */}
      {depth > 0 && (
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute left-0 top-0 bottom-0 w-[2px] bg-zinc-200 dark:bg-white/[0.08] hover:bg-amber-500 dark:hover:bg-yellow-400/80 cursor-pointer transition-colors"
          title="คลิกเพื่อย่อ/ขยายบทสนทนานี้"
        />
      )}

      <div className="bg-white dark:bg-[#101217] border border-zinc-200 dark:border-white/[0.06] rounded-xl p-3 my-2 text-xs text-zinc-800 dark:text-zinc-200 w-full max-w-full overflow-hidden shadow-sm dark:shadow-none">
        
        {/* Comment Header */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <IdentityAvatar iconKey={node.author_avatar} theme={isOP ? 'red' : 'zinc'} size="xs" />
            
            <span className={`font-semibold ${isOP ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-900 dark:text-zinc-200'}`}>
              u/{node.author_alias.replace(/^u\//, '')}
            </span>

            {/* Reddit OP (Original Poster) Badge */}
            {isOP && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-red-600 text-white">
                OP
              </span>
            )}

            <span className="text-zinc-300 dark:text-zinc-600">•</span>

            <span className="font-mono text-zinc-500 text-[11px] tabular-nums">
              {new Date(node.created_at).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Collapse [-] button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 rounded hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors"
            title={isCollapsed ? 'ขยายความเห็น' : 'ย่อความเห็น'}
          >
            {isCollapsed ? <Plus size={12} /> : <Minus size={12} />}
          </button>
        </div>

        {/* If collapsed, show brief teaser */}
        {isCollapsed ? (
          <div
            onClick={() => setIsCollapsed(false)}
            className="text-[11px] text-zinc-500 italic cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-400 py-0.5"
          >
            [ซ่อนความเห็นของ {node.author_alias} และ {node.children.length} การตอบกลับ]
          </div>
        ) : isHidden ? (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded p-2 text-red-700 dark:text-red-300 flex items-center justify-between">
            <span>ความคิดเห็นนี้ถูกซ่อนเนื่องจากถูกรายงาน 5 ครั้ง</span>
            <button
              onClick={() => setIsRevealed(true)}
              className="px-2 py-0.5 bg-white dark:bg-white/[0.06] rounded text-[11px] text-zinc-800 dark:text-zinc-200 border border-red-200 dark:border-transparent"
            >
              ดูเนื้อหา
            </button>
          </div>
        ) : (
          <>
            {/* Comment Body */}
            <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap py-1 text-xs sm:text-sm">
              {node.content}
            </div>

            {/* Media Attachment if present in comment */}
            {node.media_url && (
              <div className="my-2 rounded-lg overflow-hidden border border-zinc-200 dark:border-white/[0.08] max-w-sm">
                <img
                  src={node.media_url}
                  alt="Comment attachment"
                  className="max-h-64 w-auto object-cover cursor-pointer hover:opacity-95"
                  onClick={() => window.open(node.media_url!, '_blank')}
                />
              </div>
            )}

            {/* Action Bar (Reddit Style: Vote, Reply, Report) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 mt-1 border-t border-zinc-100 dark:border-white/[0.04] text-xs">
              
              {/* Up/Down Vote pill */}
              <div className="flex items-center bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.06] rounded p-0.5">
                <button
                  onClick={() => onVote(node.id, 'up')}
                  className={`p-0.5 rounded transition-colors active:scale-95 ${
                    voteState.voted === 'up'
                      ? 'text-amber-600 dark:text-yellow-400 bg-amber-500/15 dark:bg-yellow-500/15'
                      : 'text-zinc-500 hover:text-amber-600 dark:hover:text-yellow-400'
                  }`}
                  title="โหวตขึ้น"
                >
                  <ChevronUp size={13} strokeWidth={2.5} />
                </button>

                <span
                  className={`px-1 text-[11px] font-mono font-bold tabular-nums ${
                    voteState.score > 0
                      ? 'text-amber-600 dark:text-yellow-400'
                      : voteState.score < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {voteState.score}
                </span>

                <button
                  onClick={() => onVote(node.id, 'down')}
                  className={`p-0.5 rounded transition-colors active:scale-95 ${
                    voteState.voted === 'down'
                      ? 'text-red-600 dark:text-red-400 bg-red-500/15'
                      : 'text-zinc-500 hover:text-red-600 dark:hover:text-red-400'
                  }`}
                  title="โหวตลง"
                >
                  <ChevronDown size={13} strokeWidth={2.5} />
                </button>
              </div>

              {/* Reply trigger */}
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className={`inline-flex items-center gap-1 text-[11px] transition-colors ${
                  showReplyForm ? 'text-amber-600 dark:text-yellow-400' : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-yellow-400'
                }`}
              >
                <MessageSquare size={11} />
                <span>ตอบกลับ</span>
              </button>

              {/* Report button */}
              <button
                onClick={() => onReport(node.id, node.content)}
                className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors ml-auto"
                title="รายงานข้อความ"
              >
                <Flag size={11} />
                <span>รายงาน</span>
              </button>
            </div>

            {/* Inline Nested Reply Form */}
            {showReplyForm && (
              <form onSubmit={handleSendReply} className="mt-2.5 pt-2.5 border-t border-zinc-200 dark:border-white/[0.06] space-y-2">
                <div className="flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <CornerDownRight size={12} className="text-amber-600 dark:text-yellow-400" />
                  <span>
                    ตอบกลับ <strong className="text-zinc-900 dark:text-zinc-200">u/{node.author_alias}</strong> (ในฐานะ: {currentIdentityAlias})
                  </span>
                </div>

                <textarea
                  rows={2}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="พิมพ์ข้อความตอบกลับแบบนิรนาม..."
                  className="w-full bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] focus:border-red-500 rounded-lg p-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/20 text-amber-700 dark:text-yellow-400 rounded text-xs font-mono font-bold">
                      {captchaData ? captchaData.question : '...'}
                    </span>
                    <input
                      type="number"
                      required
                      value={replyCaptcha}
                      onChange={(e) => setReplyCaptcha(e.target.value)}
                      placeholder="คำตอบ..."
                      className="w-20 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.08] rounded px-2 py-0.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-yellow-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={onRefreshCaptcha}
                      className="p-1 text-zinc-500 hover:text-amber-600 dark:hover:text-yellow-400"
                      title="เปลี่ยนโจทย์"
                    >
                      <RefreshCw size={11} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setShowReplyForm(false)}
                      className="px-2.5 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !replyText.trim() || !replyCaptcha.trim()}
                      className="btn-primary !py-1 !px-3 text-xs"
                    >
                      <Send size={11} />
                      <span>{isSubmitting ? 'กำลังส่ง...' : 'ตอบกลับ'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Recursive Nested Children */}
            {node.children && node.children.length > 0 && (
              <div className="mt-1 space-y-1">
                {node.children.map((child) => (
                  <SingleCommentNode
                    key={child.id}
                    node={child}
                    opAuthorAlias={opAuthorAlias}
                    onVote={onVote}
                    commentVotes={commentVotes}
                    onReport={onReport}
                    onSubmitNestedReply={onSubmitNestedReply}
                    captchaData={captchaData}
                    onRefreshCaptcha={onRefreshCaptcha}
                    currentIdentityAlias={currentIdentityAlias}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ThreadedCommentTree({
  comments,
  opAuthorAlias,
  onVote,
  commentVotes,
  onReport,
  onSubmitNestedReply,
  captchaData,
  onRefreshCaptcha,
  currentIdentityAlias,
}: ThreadedCommentTreeProps) {
  if (comments.length === 0) {
    return (
      <div className="bg-[#101217] border border-white/[0.06] rounded-xl p-6 text-center text-zinc-500 text-xs">
        ยังไม่มีความคิดเห็นในกระทู้นี้ มาร่วมเปิดการสนทนาแรกกันเลย
      </div>
    );
  }

  return (
    <div className="space-y-1 w-full max-w-full overflow-hidden">
      {comments.map((root) => (
        <SingleCommentNode
          key={root.id}
          node={root}
          opAuthorAlias={opAuthorAlias}
          onVote={onVote}
          commentVotes={commentVotes}
          onReport={onReport}
          onSubmitNestedReply={onSubmitNestedReply}
          captchaData={captchaData}
          onRefreshCaptcha={onRefreshCaptcha}
          currentIdentityAlias={currentIdentityAlias}
          depth={0}
        />
      ))}
    </div>
  );
}
