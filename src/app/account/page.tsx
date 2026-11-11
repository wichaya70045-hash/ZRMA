'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Upload,
  Check,
  ArrowLeft,
  ExternalLink,
  KeyRound,
  LogIn,
  UserPlus,
  Trash2,
  Palette,
  Award,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import IdentityAvatar, {
  AuthorIdentityChip,
  AVATAR_FRAME_OPTIONS,
  BANNER_THEME_CLASSES,
  BANNER_THEME_OPTIONS,
  NAME_COLOR_CLASSES,
  NAME_COLOR_OPTIONS,
  ICON_KEY_OPTIONS,
} from '@/components/IdentityAvatar';
import type { AvatarFrame, BannerTheme, NameColor } from '@/types';

const BADGE_PRESETS = ['นักข่าวอิสระ', 'Cyber Ghost', 'Zero-Log', 'Insider', 'VIP', 'Verified'];

export default function AccountStudioPage() {
  const { user, loading, openAuthModal, updateUserState } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarIcon, setAvatarIcon] = useState('shield');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avatarFrame, setAvatarFrame] = useState<AvatarFrame>('none');
  const [bannerTheme, setBannerTheme] = useState<BannerTheme>('obsidian');
  const [nameColor, setNameColor] = useState<NameColor>('default');
  const [customBadge, setCustomBadge] = useState('');

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      setAvatarIcon(user.avatar_icon || 'shield');
      setAvatarUrl(user.avatar_url || '');
      setAvatarFrame(user.avatar_frame || 'none');
      setBannerTheme(user.banner_theme || 'obsidian');
      setNameColor(user.name_color || 'default');
      setCustomBadge(user.custom_badge || '');
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setStatusMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setStatusMsg({ type: 'error', text: data.error || 'อัปโหลดรูปภาพไม่สำเร็จ' });
        return;
      }
      if (data.media_type !== 'image') {
        setStatusMsg({ type: 'error', text: 'รองรับเฉพาะไฟล์รูปภาพสำหรับรูปโปรไฟล์' });
        return;
      }
      setAvatarUrl(data.url);
    } catch {
      setStatusMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          avatar_icon: avatarIcon,
          avatar_url: avatarUrl || null,
          avatar_frame: avatarFrame,
          banner_theme: bannerTheme,
          name_color: nameColor,
          custom_badge: customBadge || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'error', text: data.error || 'บันทึกไม่สำเร็จ' });
        return;
      }
      updateUserState(data.user);
      setStatusMsg({ type: 'success', text: 'บันทึกการตกแต่งโปรไฟล์เรียบร้อยแล้ว!' });
    } catch {
      setStatusMsg({ type: 'error', text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSaving(true);
    setPwMsg(null);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwMsg({ type: 'error', text: data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ' });
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setPwMsg({ type: 'success', text: 'อัปเดตรหัสผ่านใหม่เรียบร้อยแล้ว' });
    } catch {
      setPwMsg({ type: 'error', text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' });
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-sm text-slate-500 dark:text-zinc-400">
        กำลังโหลดข้อมูลบัญชี...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4">
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111216] p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
            สตูดิโอตกแต่งบัญชี ZRMA
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            คุณสามารถใช้งานบอร์ด อ่าน โพสต์ โหวต และแชทได้ทันทีโดยไม่ต้องล็อกอิน แต่หากต้องการ{' '}
            <strong className="text-slate-900 dark:text-zinc-200">ตกแต่งกรอบรูป สีชื่อ ป้ายฉายา และแบนเนอร์โปรไฟล์</strong>{' '}
            สามารถเข้าสู่ระบบหรือสร้างบัญชีได้ฟรีโดยไม่ต้องใช้อีเมลหรือเบอร์โทร
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-3.5 h-3.5" />
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              สมัครบัญชีใหม่
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-zinc-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              กลับหน้าแรก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111216] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="กลับหน้าหลัก"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Palette className="w-5 h-5 text-red-500" />
              สตูดิโอตกแต่งบัญชี (@{user.username})
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              ปรับแต่งกรอบรูป สีชื่อ แบนเนอร์ และป้ายฉายา — อัปเดตแสดงผลทันทีในทุกกระทู้และแชทของคุณ
            </p>
          </div>
        </div>

        <Link
          href={`/u/${encodeURIComponent(user.username)}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#111216] text-xs font-medium text-slate-700 dark:text-zinc-200 hover:border-red-500/40 transition-colors"
        >
          ดูหน้าโปรไฟล์สาธารณะ
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live Preview Sticky Column */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111216] overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                ตัวอย่างโปรไฟล์แบบเรียลไทม์
              </span>
              <span className="text-[11px] text-emerald-500 font-medium">Live Preview</span>
            </div>

            {/* Banner */}
            <div className={`h-24 relative ${BANNER_THEME_CLASSES[bannerTheme]}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_60%)]" />
            </div>

            {/* Profile Body */}
            <div className="px-5 pb-5">
              <div className="-mt-10 mb-3 flex items-end justify-between">
                <IdentityAvatar
                  iconKey={avatarIcon}
                  avatarUrl={avatarUrl || null}
                  frame={avatarFrame}
                  theme={avatarFrame !== 'none' ? 'amber' : 'zinc'}
                  size="xl"
                  className="bg-white dark:bg-[#111216]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`text-lg font-bold ${NAME_COLOR_CLASSES[nameColor]}`}>
                  {displayName.trim() || user.username}
                </h2>
                {customBadge.trim() && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-600 dark:text-amber-300">
                    {customBadge.trim()}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                @{user.username}
              </p>

              <p className="text-xs text-slate-600 dark:text-zinc-300 mt-3 leading-relaxed">
                {bio.trim() || 'ยังไม่มีคำแนะนำตัว — เขียนข้อความสั้นๆ เพื่อแนะนำตัวตนของคุณ'}
              </p>

              {/* Sample Feed Chip Preview */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mb-2">
                  ตัวอย่างการแสดงชื่อในกระทู้และแชท:
                </p>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                  <AuthorIdentityChip
                    alias={displayName.trim() || user.username}
                    avatarIcon={avatarIcon}
                    avatarUrl={avatarUrl || null}
                    frame={avatarFrame}
                    nameColor={nameColor}
                    badge={customBadge.trim() || null}
                    avatarSize="sm"
                    prefix="u/"
                    onClickStopPropagation={false}
                  />
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">z/general • เมื่อสักครู่</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-5">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111216] p-5 space-y-5 shadow-sm"
          >
            {statusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400'
                }`}
              >
                {statusMsg.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
                {statusMsg.text}
              </div>
            )}

            {/* Display Name & Bio */}
            <div className="space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                1. ข้อมูลพื้นฐาน & ป้ายฉายา
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    ชื่อที่แสดง (Display Name)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-red-500/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    ป้ายฉายา (Custom Badge)
                  </label>
                  <input
                    type="text"
                    maxLength={24}
                    value={customBadge}
                    onChange={(e) => setCustomBadge(e.target.value)}
                    placeholder="เช่น นักข่าวอิสระ (เว้นว่างได้)"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-red-500/60"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 mr-1">แนะนำ:</span>
                {BADGE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomBadge(preset)}
                    className="px-2 py-0.5 rounded-md text-[11px] border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-zinc-300 hover:border-amber-500/50 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
                {customBadge && (
                  <button
                    type="button"
                    onClick={() => setCustomBadge('')}
                    className="px-2 py-0.5 rounded-md text-[11px] text-red-500 hover:bg-red-500/10"
                  >
                    ล้างป้าย
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  คำแนะนำตัว (Bio — สูงสุด 240 ตัวอักษร)
                </label>
                <textarea
                  rows={2}
                  maxLength={240}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="เล่าเรื่องราวหรือจุดยืนของคุณแบบสั้นๆ..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-red-500/60 resize-none"
                />
              </div>
            </div>

            {/* Avatar Image / Icon */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-sky-500" />
                2. รูปโปรไฟล์ & ไอคอนประจำตัว
              </h3>

              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] text-xs font-medium text-slate-700 dark:text-zinc-200 hover:border-red-500/40 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingAvatar ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปโปรไฟล์'}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ใช้ไอคอนแทนรูป
                  </button>
                )}
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {ICON_KEY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAvatarIcon(opt.id)}
                    title={opt.label}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                      avatarIcon === opt.id
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <IdentityAvatar iconKey={opt.id} size="sm" theme={avatarIcon === opt.id ? 'red' : 'zinc'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Frame */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                3. กรอบโปรไฟล์ (Avatar Frame)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {AVATAR_FRAME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAvatarFrame(opt.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      avatarFrame === opt.id
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg shrink-0 bg-slate-200 dark:bg-zinc-800 ${opt.previewClass}`} />
                    <span className="text-xs font-medium text-slate-700 dark:text-zinc-200 leading-tight">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name Color */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                4. สีชื่อ (Name Color)
              </h3>
              <div className="flex flex-wrap gap-2">
                {NAME_COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNameColor(opt.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      nameColor === opt.id
                        ? 'border-red-500 bg-red-500/10 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-300'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${opt.swatchClass}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Banner Theme */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                5. ธีมแบนเนอร์โปรไฟล์ (Banner Theme)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BANNER_THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBannerTheme(opt.id)}
                    className={`overflow-hidden rounded-xl border text-left transition-all ${
                      bannerTheme === opt.id
                        ? 'border-red-500 ring-1 ring-red-500'
                        : 'border-slate-200 dark:border-white/[0.08] opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className={`h-10 w-full ${opt.className}`} />
                    <div className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-200 bg-slate-50 dark:bg-black/30">
                      {opt.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {saving ? 'กำลังบันทึก...' : 'บันทึกการตกแต่งโปรไฟล์'}
              </button>
            </div>
          </form>

          {/* Optional Password Update */}
          <form
            onSubmit={handleUpdatePassword}
            className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111216] p-5 space-y-3.5 shadow-sm"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-slate-500" />
              เปลี่ยนรหัสผ่าน (ความปลอดภัยบัญชี)
            </h3>
            {pwMsg && (
              <div
                className={`p-2.5 rounded-xl text-xs ${
                  pwMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400'
                }`}
              >
                {pwMsg.text}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="รหัสผ่านปัจจุบัน"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-red-500/60"
              />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-red-500/60"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pwSaving}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                {pwSaving ? 'กำลังอัปเดต...' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
