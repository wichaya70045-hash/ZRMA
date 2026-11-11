'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Wrench,
  Banknote,
  Users,
  Send,
  CheckCircle2,
  Lock,
  Unlock,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import type { JobData } from '@/types';
import { getAuthoredThreadToken } from '@/lib/privacy';
import IdentityAvatar from './IdentityAvatar';

interface ThreadJobBoxProps {
  threadId: string;
  job: JobData;
  isInteractive?: boolean;
  isAuthor?: boolean;
  authorAlias?: string;
  authorAvatar?: string;
  postAnonymously?: boolean;
  onJobUpdated?: (nextJob: JobData) => void;
}

export default function ThreadJobBox({
  threadId,
  job: initialJob,
  isInteractive = false,
  isAuthor = false,
  authorAlias,
  authorAvatar,
  postAnonymously = false,
  onJobUpdated,
}: ThreadJobBoxProps) {
  const [job, setJob] = useState<JobData>(initialJob);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [pitch, setPitch] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    setJob(initialJob);
  }, [initialJob]);

  const isHiring = job.job_type === 'hiring';
  const isClosed = job.status === 'closed';

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitch.trim()) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/threads/${threadId}/job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          pitch: pitch.trim(),
          proposed_budget: proposedBudget.trim() || null,
          contact: contact.trim() || null,
          author_alias: authorAlias,
          author_avatar: authorAvatar,
          post_anonymously: postAnonymously,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.job) {
        setFeedback({ type: 'error', text: data.error || 'ไม่สามารถส่งข้อเสนอได้' });
        return;
      }
      setJob(data.job);
      onJobUpdated?.(data.job);
      setPitch('');
      setProposedBudget('');
      setContact('');
      setShowApplyForm(false);
      setFeedback({
        type: 'success',
        text: isHiring ? 'ส่งคำขอรับงานเรียบร้อยแล้ว!' : 'ส่งข้อเสนอจ้างงานเรียบร้อยแล้ว!',
      });
    } catch {
      setFeedback({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    setFeedback(null);
    const nextStatus = isClosed ? 'open' : 'closed';
    const editToken = getAuthoredThreadToken(threadId);
    try {
      const res = await fetch(`/api/threads/${threadId}/job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          status: nextStatus,
          edit_token: editToken || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.job) {
        setFeedback({ type: 'error', text: data.error || 'ไม่สามารถเปลี่ยนสถานะได้' });
        return;
      }
      setJob(data.job);
      onJobUpdated?.(data.job);
    } catch {
      setFeedback({ type: 'error', text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' });
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <div
      id={isInteractive ? 'job-panel' : undefined}
      onClick={(e) => {
        if (!isInteractive) e.stopPropagation();
      }}
      className={`rounded-xl border p-3.5 space-y-3 ${
        isHiring
          ? 'bg-emerald-50/60 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-500/25'
          : 'bg-sky-50/60 dark:bg-sky-950/15 border-sky-200 dark:border-sky-500/25'
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
              isHiring
                ? 'bg-emerald-600 text-white'
                : 'bg-sky-600 text-white'
            }`}
          >
            {isHiring ? <Briefcase size={11} /> : <Wrench size={11} />}
            <span>{isHiring ? 'เสนองาน / จ้างงาน' : 'เสนอตัวรับงาน'}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${
              isClosed
                ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                : 'bg-white dark:bg-black/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-zinc-400' : 'bg-emerald-500 animate-pulse'}`} />
            {isClosed ? 'ปิดรับแล้ว' : 'เปิดรับอยู่'}
          </span>
        </div>

        {isInteractive && isAuthor && (
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-300 dark:border-white/[0.12] bg-white dark:bg-black/40 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 hover:border-amber-500/50 transition-colors"
          >
            {isClosed ? <Unlock size={11} /> : <Lock size={11} />}
            <span>{isClosed ? 'เปิดรับงานอีกครั้ง' : 'ปิดรับงานแล้ว'}</span>
          </button>
        )}
      </div>

      {/* Metadata Pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-black/35 border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 font-medium">
          <Banknote size={13} className="text-amber-500 shrink-0" />
          <span>{job.budget || 'ค่าตอบแทนตามตกลง'}</span>
        </span>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-black/35 border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
          <Users size={12} className="text-sky-500 shrink-0" />
          <span>{job.application_count || 0} ข้อเสนอ</span>
        </span>
      </div>

      {/* Direct Contact info */}
      {isInteractive && job.contact_info && (
        <div className="text-[11px] text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 pt-0.5">
          <MessageSquare size={12} className="text-amber-500 shrink-0" />
          <span>ช่องทางติดต่อผู้ประกาศ: <strong className="font-mono">{job.contact_info}</strong></span>
        </div>
      )}

      {/* Card Preview CTA vs Interactive Apply Flow */}
      {!isInteractive ? (
        <div className="pt-1 flex items-center justify-end">
          <Link
            href={`/thread/${threadId}#job-panel`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition-all ${
              isClosed
                ? 'bg-zinc-500 hover:bg-zinc-600'
                : isHiring
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-sky-600 hover:bg-sky-500'
            }`}
          >
            <span>
              {isClosed
                ? 'ดูรายละเอียดประกาศงาน'
                : isHiring
                ? 'ดูรายละเอียด & กดรับงานนี้'
                : 'ดูโปรไฟล์ & ติดต่อจ้างงาน'}
            </span>
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle2 size={14} className="shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {!isClosed && !showApplyForm && (
            <button
              type="button"
              onClick={() => setShowApplyForm(true)}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
                isHiring ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-sky-600 hover:bg-sky-500'
              }`}
            >
              <Send size={13} />
              <span>
                {isHiring ? 'กดรับงาน / ส่งรายละเอียดเสนอตัว' : 'กดจ้างงาน / ส่งบรีฟให้ผู้รับงาน'}
              </span>
            </button>
          )}

          {showApplyForm && !isClosed && (
            <form
              onSubmit={handleApply}
              className="p-3.5 rounded-xl bg-white dark:bg-[#0e1015] border border-zinc-200 dark:border-white/[0.1] space-y-3 text-xs"
            >
              <div className="font-bold text-zinc-900 dark:text-zinc-100">
                {isHiring ? 'ส่งคำขอรับงาน / เสนอราคา' : 'ส่งรายละเอียดงานที่ต้องการจ้าง'}
              </div>

              <textarea
                required
                rows={3}
                maxLength={600}
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder={
                  isHiring
                    ? 'แนะนำความถนัด ผลงาน หรือระยะเวลาที่คุณส่งงานได้...'
                    : 'อธิบายรายละเอียดงานที่ต้องการให้ทำ ขอบเขตงาน และกำหนดส่ง...'
                }
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-black/40 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  maxLength={80}
                  value={proposedBudget}
                  onChange={(e) => setProposedBudget(e.target.value)}
                  placeholder="งบ / เรทราคาที่เสนอ (ไม่บังคับ)"
                  className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-black/40 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  maxLength={160}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="ช่องทางติดต่อกลับ (Telegram / Line / แชทสด)"
                  className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-black/40 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.1] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold"
                >
                  {submitting ? 'กำลังส่ง...' : 'ส่งข้อเสนอ'}
                </button>
              </div>
            </form>
          )}

          {/* List of submitted applications */}
          {job.applications && job.applications.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-200/80 dark:border-white/[0.08]">
              <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                รายการผู้เสนอตัว / ติดต่องาน ({job.applications.length})
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {job.applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-2.5 rounded-lg bg-white/95 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.07] space-y-1 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <IdentityAvatar iconKey={app.applicant_avatar} size="xs" theme="amber" />
                        {app.applicant_username ? (
                          <Link
                            href={`/u/${encodeURIComponent(app.applicant_username)}`}
                            className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline"
                          >
                            u/{app.applicant_alias}
                          </Link>
                        ) : (
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            u/{app.applicant_alias}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px]">
                        {app.proposed_budget && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold">
                            {app.proposed_budget}
                          </span>
                        )}
                        <span className="text-zinc-400 font-mono">
                          {new Date(app.created_at).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {app.pitch}
                    </p>
                    {app.contact && (
                      <div className="text-[11px] text-sky-600 dark:text-sky-400 font-mono">
                        ติดต่อ: {app.contact}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
