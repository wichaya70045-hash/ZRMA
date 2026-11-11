'use client';

import React, { useState, useEffect } from 'react';
import { Thread } from '@/types';
import { getAuthoredThreadToken, saveAuthoredThread } from '@/lib/privacy';
import { X, Check, AlertCircle, Key, Edit3 } from 'lucide-react';

interface EditThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  thread: Thread;
  onThreadUpdated: (updated: Thread) => void;
}

export default function EditThreadModal({
  isOpen,
  onClose,
  thread,
  onThreadUpdated,
}: EditThreadModalProps) {
  const [title, setTitle] = useState(thread.title);
  const [content, setContent] = useState(thread.content);
  const [category, setCategory] = useState(thread.category);
  const [flair, setFlair] = useState(thread.flair || '');
  const [sourceUrl, setSourceUrl] = useState(thread.source_url || '');
  const [passcode, setPasscode] = useState('');
  const [hasStoredToken, setHasStoredToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(thread.title);
      setContent(thread.content);
      setCategory(thread.category);
      setFlair(thread.flair || '');
      setSourceUrl(thread.source_url || '');
      setErrorMsg('');

      const token = getAuthoredThreadToken(thread.id);
      if (token) {
        setPasscode(token);
        setHasStoredToken(true);
      } else {
        setPasscode('');
        setHasStoredToken(false);
      }
    }
  }, [isOpen, thread]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('กรุณาระบุหัวข้อโพสต์');
      return;
    }

    const effectiveToken = passcode.trim() || getAuthoredThreadToken(thread.id) || '';
    if (!effectiveToken) {
      setErrorMsg('กรุณากรอกรหัสลับสำหรับแก้ไขโพสต์ (Edit Passcode)');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/threads/${thread.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category: category.trim(),
          flair: flair.trim() || null,
          source_url: sourceUrl.trim() || null,
          edit_token: effectiveToken,
        }),
      });

      const data = await res.json();
      if (res.ok && data.thread) {
        saveAuthoredThread(thread.id, effectiveToken);
        onThreadUpdated(data.thread);
        onClose();
      } else {
        setErrorMsg(data.error || 'ไม่สามารถแก้ไขกระทู้ได้');
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-[#101217] border border-zinc-200 dark:border-white/[0.1] rounded-2xl max-w-xl w-full max-w-full p-4 sm:p-6 shadow-2xl relative text-zinc-800 dark:text-zinc-200 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/[0.08] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-yellow-500/10 text-amber-600 dark:text-yellow-400 border border-amber-200 dark:border-yellow-500/25 flex items-center justify-center">
              <Edit3 size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">แก้ไขโพสต์ของคุณ</h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">ระบบจะแสดงป้าย "(แก้ไขแล้ว)" อัตโนมัติหลังบันทึก</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-600 dark:text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Title */}
          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
              หัวข้อโพสต์ <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] focus:border-amber-500 dark:focus:border-yellow-400 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none transition-colors"
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-600 dark:text-zinc-400 font-medium">เนื้อหาโพสต์</label>
              <span className="text-[10px] text-zinc-500 font-mono">OPTIONAL</span>
            </div>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="เขียนรายละเอียดเพิ่มเติม (ไม่บังคับ)..."
              className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] focus:border-amber-500 dark:focus:border-yellow-400 rounded-lg p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none leading-relaxed transition-colors font-sans"
            />
          </div>

          {/* Flair & Source URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">ป้ายกำกับ (Flair)</label>
              <input
                type="text"
                value={flair}
                onChange={(e) => setFlair(e.target.value)}
                placeholder="เช่น ข่าวกรอง, เตือนภัย, วิเคราะห์"
                className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] focus:border-amber-500 dark:focus:border-yellow-400 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">ลิงก์ข่าวต้นทาง (Source URL)</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] focus:border-amber-500 dark:focus:border-yellow-400 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>

          {/* Passcode Confirmation */}
          <div className="p-3 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.06] rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Key size={12} className="text-amber-600 dark:text-yellow-400" />
                <span>รหัสลับยืนยันความเป็นเจ้าของ (Passcode)</span>
              </label>
              {hasStoredToken && (
                <span className="text-[10px] text-emerald-600 dark:text-green-400 font-mono">
                  ✓ ตรวจพบรหัสผ่านในเบราว์เซอร์นี้
                </span>
              )}
            </div>
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="รหัส PIN หรือ Passcode ที่ตั้งไว้ตอนสร้าง..."
              className="w-full bg-white dark:bg-white/[0.03] border border-zinc-300 dark:border-white/[0.08] focus:border-amber-500 dark:focus:border-yellow-400 rounded-lg px-3 py-1.5 text-xs text-amber-700 dark:text-yellow-400 font-mono focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04] text-xs transition-colors"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs !py-1.5 !px-4"
            >
              <Check size={14} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
