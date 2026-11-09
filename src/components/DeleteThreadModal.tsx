'use client';

import React, { useState, useEffect } from 'react';
import { Thread } from '@/types';
import { getAuthoredThreadToken, removeAuthoredThread } from '@/lib/privacy';
import { X, Trash2, AlertTriangle, Key } from 'lucide-react';

interface DeleteThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  thread: Thread;
  onThreadDeleted: (id: string) => void;
}

export default function DeleteThreadModal({
  isOpen,
  onClose,
  thread,
  onThreadDeleted,
}: DeleteThreadModalProps) {
  const [passcode, setPasscode] = useState('');
  const [hasStoredToken, setHasStoredToken] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
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

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const effectiveToken = passcode.trim() || getAuthoredThreadToken(thread.id) || '';
    if (!effectiveToken) {
      setErrorMsg('กรุณากรอกรหัสลับยืนยันการลบ (Delete Passcode)');
      return;
    }

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/threads/${thread.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edit_token: effectiveToken }),
      });

      const data = await res.json();
      if (res.ok) {
        removeAuthoredThread(thread.id);
        onThreadDeleted(thread.id);
        onClose();
      } else {
        setErrorMsg(data.error || 'ไม่สามารถลบโพสต์ได้');
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#101217] border border-red-500/30 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative text-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950/60 text-red-400 border border-red-500/30 flex items-center justify-center">
              <Trash2 size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">ยืนยันการลบโพสต์</h2>
              <p className="text-[11px] text-zinc-400">การลบนี้จะทำลายกระทู้และความคิดเห็นทั้งหมดถาวร</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleDelete} className="space-y-4 text-xs">
          <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl space-y-1">
            <span className="font-semibold text-zinc-200 block truncate">
              "{thread.title}"
            </span>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              เมื่อกดลบ ข้อมูลจะถูกถอดถอนออกจากฐานข้อมูลทันที 100% ไม่สามารถกู้คืนได้
            </p>
          </div>

          <div className="p-3 bg-black/40 border border-white/[0.06] rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
                <Key size={12} className="text-yellow-400" />
                <span>รหัสลับยืนยันการลบ (Passcode)</span>
              </label>
              {hasStoredToken && (
                <span className="text-[10px] text-green-400 font-mono">
                  ✓ ตรวจพบรหัสผ่านในเครื่อง
                </span>
              )}
            </div>
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="รหัส PIN หรือ Passcode..."
              className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-red-500 rounded-lg px-3 py-1.5 text-xs text-red-400 font-mono focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.04] text-xs transition-colors"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isDeleting}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span>{isDeleting ? 'กำลังลบ...' : 'ยืนยันลบโพสต์'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
