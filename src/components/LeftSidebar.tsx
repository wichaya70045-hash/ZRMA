'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home,
  Flame,
  Radio,
  TrendingUp,
  Award,
  Clock,
  MessageSquare,
  Plus,
  Ghost,
  Layers,
  Terminal,
  Cpu,
  Radar,
  Globe,
  Shield,
  Key,
  Binary,
  EyeOff,
  Zap,
  Atom,
  AlertCircle,
  Settings as SettingsIcon,
  Palette,
  User as UserIcon,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import type { Community } from '@/types';
import { useAuth } from '@/lib/authContext';
import IdentityAvatar, { NAME_COLOR_CLASSES } from './IdentityAvatar';
import CreateCommunityModal from './CreateCommunityModal';

interface LeftSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const COMMUNITY_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  terminal: Terminal,
  flame: Flame,
  zap: Zap,
  cpu: Cpu,
  radar: Radar,
  globe: Globe,
  shield: Shield,
  key: Key,
  binary: Binary,
  'eye-off': EyeOff,
  atom: Atom,
  trending: TrendingUp,
  chat: MessageSquare,
  alert: AlertCircle,
};

const COLLAPSE_STORAGE_KEY = 'zrma_left_sidebar_collapsed';

function LeftSidebarContent({ mobileOpen, onCloseMobile }: LeftSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, openAuthModal } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const currentCategory = (searchParams.get('category') || '').replace(/^[zr]\//i, '').toLowerCase();
  const currentSort = (searchParams.get('sort') || '').toLowerCase();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (saved === 'true') setCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    onCloseMobile();
  }, [pathname, searchParams, onCloseMobile]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) onCloseMobile();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mobileOpen, onCloseMobile]);

  useEffect(() => {
    let active = true;
    const loadCommunities = async () => {
      try {
        const res = await fetch('/api/communities');
        const data = await res.json();
        if (active && Array.isArray(data.communities)) {
          setCommunities(data.communities);
        }
      } catch {
        // ignore
      }
    };
    loadCommunities();
    return () => {
      active = false;
    };
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleCommunityCreated = (newComm: Community) => {
    setCommunities((prev) => [newComm, ...prev.filter((c) => c.name !== newComm.name)]);
  };

  const feedLinks = [
    {
      label: 'หน้าแรก (ฟีดรวม)',
      href: '/',
      icon: Home,
      active: pathname === '/' && !currentCategory && (!currentSort || currentSort === 'hot'),
      iconClass: 'text-zinc-600 dark:text-zinc-300',
    },
    {
      label: 'มาแรง (Hot)',
      href: '/?sort=hot',
      icon: Flame,
      active: pathname === '/' && currentSort === 'hot' && !currentCategory,
      iconClass: 'text-orange-500',
    },
    {
      label: 'ข่าวด่วน (Breaking)',
      href: '/?sort=breaking',
      icon: Radio,
      active: pathname === '/' && (currentSort === 'breaking' || currentCategory === 'breaking'),
      iconClass: 'text-red-500',
      liveDot: true,
    },
    {
      label: 'กำลังพุ่งสูง (Rising)',
      href: '/?sort=rising',
      icon: TrendingUp,
      active: pathname === '/' && currentSort === 'rising',
      iconClass: 'text-amber-500',
    },
    {
      label: 'ยอดนิยม (Top)',
      href: '/?sort=top',
      icon: Award,
      active: pathname === '/' && currentSort === 'top',
      iconClass: 'text-yellow-500',
    },
    {
      label: 'ใหม่ล่าสุด (New)',
      href: '/?sort=new',
      icon: Clock,
      active: pathname === '/' && currentSort === 'new',
      iconClass: 'text-sky-500',
    },
  ];

  const renderSidebarBody = (isMobileDrawer: boolean) => {
    const isCompact = !isMobileDrawer && collapsed;

    return (
      <div className="flex flex-col h-full">
        {/* Top Bar inside Sidebar */}
        <div
          className={`flex items-center ${
            isCompact ? 'justify-center px-2' : 'justify-between px-3'
          } py-2.5 border-b border-zinc-200 dark:border-white/[0.06] shrink-0`}
        >
          {!isCompact && (
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              เมนูนำทาง
            </span>
          )}
          {isMobileDrawer ? (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
              aria-label="ปิดแถบเมนู"
            >
              <X size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
              title={isCompact ? 'ขยายแถบด้านซ้าย' : 'ย่อแถบด้านซ้าย'}
              aria-label={isCompact ? 'Expand left sidebar' : 'Collapse left sidebar'}
            >
              {isCompact ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          )}
        </div>

        {/* Scrollable Nav Body */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
          {/* Section 1: Feeds */}
          <div className="space-y-1">
            {!isCompact && (
              <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                ฟีดกระทู้
              </div>
            )}
            {feedLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCompact ? item.label : undefined}
                  className={`flex items-center ${
                    isCompact ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-2.5 py-2'
                  } rounded-xl text-xs font-medium transition-colors ${
                    item.active
                      ? 'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 font-semibold border border-red-500/20'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <Icon size={15} className={`shrink-0 ${item.active ? 'text-red-500' : item.iconClass}`} />
                  {!isCompact && (
                    <>
                      <span className="truncate flex-1">{item.label}</span>
                      {item.liveDot && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Section 2: Spaces & Actions */}
          <div className="space-y-1 pt-2 border-t border-zinc-200/80 dark:border-white/[0.06]">
            {!isCompact && (
              <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                ห้องสนทนา & โพสต์
              </div>
            )}
            <Link
              href="/new"
              title={isCompact ? 'สร้างโพสต์ใหม่' : undefined}
              className={`flex items-center ${
                isCompact ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-2.5 py-2'
              } rounded-xl text-xs font-medium transition-colors ${
                pathname === '/new'
                  ? 'bg-red-600 text-white font-semibold'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <Plus size={15} className="shrink-0 text-red-500" />
              {!isCompact && <span className="truncate">สร้างกระทู้ใหม่</span>}
            </Link>

            <Link
              href="/chat"
              title={isCompact ? 'ห้องแชทสด & Ghost Rooms' : undefined}
              className={`flex items-center ${
                isCompact ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-2.5 py-2'
              } rounded-xl text-xs font-medium transition-colors ${
                pathname === '/chat'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-yellow-400 font-semibold border border-amber-500/25'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] border border-transparent'
              }`}
            >
              <MessageSquare size={15} className="shrink-0 text-amber-500" />
              {!isCompact && (
                <>
                  <span className="truncate flex-1">แชทสดส่วนกลาง</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                </>
              )}
            </Link>

            <Link
              href="/chat?mode=ghost"
              title={isCompact ? 'Ghost Rooms' : undefined}
              className={`flex items-center ${
                isCompact ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-2.5 py-2'
              } rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-colors`}
            >
              <Ghost size={15} className="shrink-0 text-orange-500" />
              {!isCompact && <span className="truncate">ห้องลับ Ghost Rooms</span>}
            </Link>
          </div>

          {/* Section 3: z/ Communities */}
          <div className="space-y-1 pt-2 border-t border-zinc-200/80 dark:border-white/[0.06]">
            {!isCompact && (
              <div className="px-2 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  ชุมชน z/
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-[10px] font-mono font-semibold text-amber-600 dark:text-yellow-400 hover:underline flex items-center gap-0.5"
                  title="สร้างห้อง z/ ใหม่"
                >
                  <Plus size={11} />
                  สร้างห้อง
                </button>
              </div>
            )}

            <Link
              href="/"
              title={isCompact ? 'z/all (รวมทั้งหมด)' : undefined}
              className={`flex items-center ${
                isCompact ? 'justify-center px-2 py-2' : 'justify-between px-2.5 py-1.5'
              } rounded-lg text-xs transition-colors ${
                pathname === '/' && !currentCategory
                  ? 'bg-zinc-100 dark:bg-white/[0.07] text-zinc-900 dark:text-white font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Layers size={14} className="shrink-0 text-amber-500" />
                {!isCompact && <span className="font-mono truncate">z/all</span>}
              </span>
            </Link>

            {communities.map((comm) => {
              const IconComp = COMMUNITY_ICON_MAP[comm.icon] || Terminal;
              const isSelected = pathname === '/' && currentCategory === comm.name.toLowerCase();
              return (
                <Link
                  key={comm.name}
                  href={`/?category=${encodeURIComponent(comm.name)}`}
                  title={isCompact ? `z/${comm.name}` : comm.description || `z/${comm.name}`}
                  className={`flex items-center ${
                    isCompact ? 'justify-center px-2 py-2' : 'justify-between px-2.5 py-1.5'
                  } rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-amber-500/10 text-amber-700 dark:text-yellow-400 font-semibold border border-amber-500/20'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <IconComp
                      size={14}
                      className={`shrink-0 ${
                        isSelected ? 'text-amber-600 dark:text-yellow-400' : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    />
                    {!isCompact && <span className="font-mono truncate">z/{comm.name}</span>}
                  </span>
                  {!isCompact && (
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0 ml-1">
                      {comm.post_count || 0}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Account / Settings Footer */}
        <div className="p-2.5 border-t border-zinc-200 dark:border-white/[0.06] space-y-1.5 shrink-0 bg-zinc-50/60 dark:bg-white/[0.01]">
          {user ? (
            isCompact ? (
              <Link
                href="/account"
                title={`ตกแต่งบัญชี (@${user.username})`}
                className="flex items-center justify-center p-1.5 rounded-xl hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
              >
                <IdentityAvatar
                  iconKey={user.avatar_icon}
                  avatarUrl={user.avatar_url}
                  frame={user.avatar_frame}
                  theme={user.avatar_frame !== 'none' ? 'amber' : 'zinc'}
                  size="sm"
                />
              </Link>
            ) : (
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#12141b] border border-zinc-200 dark:border-white/[0.08] space-y-2 shadow-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <IdentityAvatar
                    iconKey={user.avatar_icon}
                    avatarUrl={user.avatar_url}
                    frame={user.avatar_frame}
                    theme={user.avatar_frame !== 'none' ? 'amber' : 'zinc'}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-bold truncate ${NAME_COLOR_CLASSES[user.name_color]}`}>
                      {user.display_name}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 truncate">@{user.username}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    href={`/u/${encodeURIComponent(user.username)}`}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200/70 dark:hover:bg-white/[0.09] text-[11px] font-medium text-zinc-700 dark:text-zinc-200 transition-colors"
                  >
                    <UserIcon size={11} />
                    โปรไฟล์
                  </Link>
                  <Link
                    href="/account"
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[11px] font-medium text-red-600 dark:text-red-400 transition-colors"
                  >
                    <Palette size={11} />
                    ตกแต่ง
                  </Link>
                </div>
              </div>
            )
          ) : isCompact ? (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              title="เข้าสู่ระบบ (ไม่บังคับ)"
              className="w-full flex items-center justify-center p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
            >
              <LogIn size={15} className="text-red-500" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#12141b] hover:border-red-500/40 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <LogIn size={14} className="text-red-500" />
                <span>เข้าสู่ระบบ / ตกแต่ง</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-400">Guest</span>
            </button>
          )}

          <Link
            href="/settings"
            title={isCompact ? 'ตั้งค่าระบบ' : undefined}
            className={`flex items-center ${
              isCompact ? 'justify-center px-2 py-2' : 'gap-2.5 px-2.5 py-1.5'
            } rounded-xl text-xs font-medium transition-colors ${
              pathname === '/settings'
                ? 'bg-zinc-200/80 dark:bg-white/[0.08] text-zinc-900 dark:text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            <SettingsIcon size={14} className="shrink-0" />
            {!isCompact && <span>ตั้งค่าระบบ</span>}
          </Link>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sticky Left Sidebar */}
      <aside
        aria-label="แถบนำทางด้านซ้าย"
        className={`hidden lg:flex flex-col shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-zinc-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#0b0c10]/90 backdrop-blur-md transition-[width] duration-200 ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile Slide-Over Left Sidebar Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="เมนูด้านซ้าย"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full bg-white dark:bg-[#0b0c10] border-r border-zinc-200 dark:border-white/[0.08] shadow-2xl flex flex-col">
            {renderSidebarBody(true)}
          </aside>
        </div>
      )}

      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCommunityCreated={handleCommunityCreated}
      />
    </>
  );
}

export default function LeftSidebar(props: LeftSidebarProps) {
  return (
    <Suspense fallback={null}>
      <LeftSidebarContent {...props} />
    </Suspense>
  );
}
