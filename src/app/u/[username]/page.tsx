'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MessageSquare, FileText, TrendingUp, Palette } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import IdentityAvatar, {
  BANNER_THEME_CLASSES,
  NAME_COLOR_CLASSES,
} from '@/components/IdentityAvatar';
import ThreadCard from '@/components/ThreadCard';
import type { Thread, UserProfile } from '@/types';

interface PublicProfileResponse {
  profile: UserProfile;
  stats: {
    thread_count: number;
    comment_count: number;
    total_score: number;
  };
  threads: Thread[];
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadProfile = async () => {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}`, { cache: 'no-store' });
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const json = (await res.json()) as PublicProfileResponse;
      setData(json);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-sm text-slate-500 dark:text-zinc-400">
        กำลังโหลดโปรไฟล์ @{decodeURIComponent(username)}...
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="max-w-xl mx-auto py-14 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
          ไม่พบบัญชีผู้ใช้ @{decodeURIComponent(username)}
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          ผู้ใช้นี้อาจไม่ได้สร้างบัญชีถาวร หรือชื่อผู้ใช้อาจไม่ถูกต้อง
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  const { profile, stats, threads } = data;
  const isSelf = currentUser?.id === profile.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          กลับหน้าหลัก
        </Link>
      </div>

      {/* Decorated Profile Hero */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111216] overflow-hidden shadow-sm">
        <div className={`h-32 sm:h-40 relative ${BANNER_THEME_CLASSES[profile.banner_theme]}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_60%)]" />
        </div>

        <div className="px-5 sm:px-7 pb-6">
          <div className="-mt-11 flex flex-wrap items-end justify-between gap-3">
            <IdentityAvatar
              iconKey={profile.avatar_icon}
              avatarUrl={profile.avatar_url}
              frame={profile.avatar_frame}
              theme={profile.avatar_frame !== 'none' ? 'amber' : 'zinc'}
              size="xl"
              className="bg-white dark:bg-[#111216]"
            />

            {isSelf && (
              <Link
                href="/account"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Palette className="w-3.5 h-3.5" />
                ตกแต่งโปรไฟล์ของคุณ
              </Link>
            )}
          </div>

          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={`text-xl sm:text-2xl font-bold ${NAME_COLOR_CLASSES[profile.name_color]}`}>
                {profile.display_name}
              </h1>
              {profile.custom_badge && (
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-300">
                  {profile.custom_badge}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-zinc-400">
              <span className="font-mono">@{profile.username}</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                เข้าร่วมเมื่อ {new Date(profile.created_at).toLocaleDateString('th-TH')}
              </span>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-3 text-sm text-slate-700 dark:text-zinc-300 leading-relaxed max-w-2xl">
              {profile.bio}
            </p>
          )}

          {/* Stats row */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-white/[0.06] flex flex-wrap gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" />
              <span className="text-xs text-slate-600 dark:text-zinc-300">
                <strong className="text-slate-900 dark:text-white">{stats.thread_count}</strong> กระทู้ที่ยังเปิดอยู่
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-500" />
              <span className="text-xs text-slate-600 dark:text-zinc-300">
                <strong className="text-slate-900 dark:text-white">{stats.comment_count}</strong> ความคิดเห็น
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.06] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-slate-600 dark:text-zinc-300">
                <strong className="text-slate-900 dark:text-white">{stats.total_score}</strong> คะแนนโหวต
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User's Threads */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
          กระทู้ล่าสุดโดย {profile.display_name} ({threads.length})
        </h2>

        {threads.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#111216] p-8 text-center text-sm text-slate-500 dark:text-zinc-400">
            ยังไม่มีกระทู้ที่แสดงอยู่ (กระทู้อาจหมดอายุหรือถูกโพสต์แบบไม่ระบุตัวตน)
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((t) => (
              <ThreadCard
                key={t.id}
                thread={t}
                onThreadUpdated={loadProfile}
                onThreadDeleted={loadProfile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
