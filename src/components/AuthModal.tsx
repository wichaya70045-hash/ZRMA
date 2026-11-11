'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, UserPlus, LogIn, Sparkles, Lock, User } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

export default function AuthModal() {
  const { isAuthModalOpen, authModalTab, openAuthModal, closeAuthModal, login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(authModalTab);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTab(authModalTab);
    setError(null);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (tab === 'login') {
        const res = await login(username, password);
        if (!res.success) {
          setError(res.error || 'เข้าสู่ระบบไม่สำเร็จ');
        } else {
          setPassword('');
        }
      } else {
        const res = await register({
          username,
          password,
          display_name: displayName || username,
        });
        if (!res.success) {
          setError(res.error || 'สมัครสมาชิกไม่สำเร็จ');
        } else {
          setPassword('');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#111216] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500">
              {tab === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {tab === 'login' ? 'เข้าสู่ระบบบัญชี ZRMA' : 'สร้างบัญชีตกแต่งตัวตน (ทางเลือก)'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                ไม่ต้องใช้อีเมล • ไม่ใช้เบอร์โทร • ไม่เก็บ IP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.08] transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Optional notice */}
        <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-[11.5px] leading-relaxed text-emerald-800 dark:text-emerald-300">
            <strong>ไม่จำเป็นต้องล็อกอินก็ใช้งานได้ 100%!</strong> คุณสามารถอ่าน โพสต์ โหวต คอมเมนต์ และแชทแบบไม่ระบุตัวตนได้ทันที บัญชีมีไว้เพื่อตกแต่งโปรไฟล์ กรอบรูป ป้ายฉายา และจัดการโพสต์ข้ามอุปกรณ์
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1.5 mx-5 mt-4 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-white dark:bg-[#1b1d23] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('register')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-white dark:bg-[#1b1d23] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            สมัครบัญชีใหม่
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              Username (ภาษาอังกฤษ a-z, 0-9, _ 3–24 ตัว)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                minLength={3}
                maxLength={24}
                pattern="[a-zA-Z0-9_]{3,24}"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="เช่น cyber_fox99"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-red-500/60"
              />
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
                ชื่อที่แสดง (Display Name — ภาษาไทย/Emoji ได้, ตกแต่งทีหลังได้)
              </label>
              <input
                type="text"
                maxLength={40}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="เช่น นักสืบไซเบอร์"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-red-500/60"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-red-500/60"
              />
            </div>
          </div>

          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={closeAuthModal}
              className="px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              ใช้งานแบบไม่ระบุตัวตนต่อ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white shadow-md shadow-red-600/20 transition-all"
            >
              {submitting
                ? 'กำลังดำเนินการ...'
                : tab === 'login'
                ? 'เข้าสู่ระบบ'
                : 'สร้างบัญชีและเริ่มตกแต่ง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
