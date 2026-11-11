'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Plus,
  Users,
  Radio,
  Clock,
  Layers,
  FileText,
  AlertCircle,
  ExternalLink,
  Lock,
  Terminal,
  Flame,
  Zap,
  Globe,
  Cpu,
  Radar,
  MessageSquare,
  Atom,
  TrendingUp,
  Ghost,
} from 'lucide-react';
import { Community } from '@/types';
import CreateCommunityModal from './CreateCommunityModal';

interface CommunitySidebarProps {
  currentCategory?: string;
  onSelectCategory?: (cat: string) => void;
}

const ICON_MAP: Record<string, any> = {
  terminal: Terminal,
  flame: Flame,
  zap: Zap,
  cpu: Cpu,
  radar: Radar,
  globe: Globe,
  atom: Atom,
  trending: TrendingUp,
  chat: MessageSquare,
  alert: AlertCircle,
};

export default function CommunitySidebar({
  currentCategory = 'all',
  onSelectCategory,
}: CommunitySidebarProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCommunities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/communities');
      const data = await res.json();
      if (data.communities) {
        setCommunities(data.communities);
      }
    } catch (err) {
      console.error('Error fetching communities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleCommunityCreated = (newComm: Community) => {
    setCommunities((prev) => {
      const filtered = prev.filter((c) => c.name !== newComm.name);
      return [newComm, ...filtered];
    });
    if (onSelectCategory) {
      onSelectCategory(newComm.name);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* About Community Card (Reddit Style) */}
      <div className="bg-white dark:bg-[#0e1015]/90 border border-zinc-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-sm dark:shadow-lg backdrop-blur-sm">
        {/* Banner Top */}
        <div className="h-10 bg-gradient-to-r from-red-50 via-zinc-50 to-white dark:from-red-950/40 dark:via-black dark:to-black p-3 flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06]">
          <span className="text-[11px] font-mono font-semibold text-zinc-600 dark:text-zinc-400">
            ข้อมูลชุมชน
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>

        <div className="p-4 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-b from-red-500/15 to-red-600/25 dark:from-red-600/20 dark:to-red-950/60 border border-red-500/30 text-red-600 dark:text-red-500 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm dark:shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>ZRMA Community</span>
              </h2>
              <span className="text-[11px] font-mono text-zinc-500">z/ZRMA • Zero-Trace Architecture</span>
            </div>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            ชุมชนแลกเปลี่ยนข่าวสารและเสวนาแบบไร้ตัวตน 100% สุ่มรหัสใหม่ทุกกระทู้ ไม่บันทึก IP Address และมีระบบทำลายตัวเองอัตโนมัติ
          </p>

          {/* Genuine Telemetry */}
          <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-black/20 rounded-lg px-2">
            <div>
              <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {communities.length || 8} ห้อง
              </div>
              <div className="text-[10px] text-zinc-500">หมวดหมู่ z/ ทั้งหมด</div>
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-amber-600 dark:text-yellow-400 flex items-center gap-1.5 tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-green-500"></span>
                <span>ZERO-LOG</span>
              </div>
              <div className="text-[10px] text-zinc-500">ไร้ฐานข้อมูลบุคคล</div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/new"
              className="w-full btn-primary text-xs justify-center"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>สร้างโพสต์ใหม่</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full btn-secondary text-xs justify-center hover:border-amber-500/40 dark:hover:border-yellow-500/40"
            >
              <Plus size={13} className="text-amber-600 dark:text-yellow-400" />
              <span>+ สร้างห้อง z/ ชุมชนใหม่</span>
            </button>

            <Link
              href="/chat"
              className="w-full inline-flex items-center justify-center gap-1.5 p-2 rounded-lg bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 text-xs font-semibold transition-colors"
            >
              <Ghost size={13} />
              <span>ห้องหายไปเมื่อไม่มีคน (Ghost)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Sub-communities list */}
      <div className="bg-white dark:bg-[#0e1015]/90 border border-zinc-200 dark:border-white/[0.08] rounded-xl p-3.5 space-y-3 backdrop-blur-sm shadow-sm dark:shadow-md">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/[0.06]">
          <h3 className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-300">
            ห้องชุมชน z/ ทั้งหมด
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">
            {communities.length} ห้อง
          </span>
        </div>

        <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
          {/* All option */}
          <button
            onClick={() => onSelectCategory && onSelectCategory('all')}
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
              currentCategory === 'all'
                ? 'bg-amber-50 dark:bg-yellow-500/10 text-amber-800 dark:text-yellow-400 font-semibold border border-amber-200 dark:border-yellow-500/25'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.03] hover:text-zinc-950 dark:hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-amber-600 dark:text-yellow-400" />
              <div>
                <div className="font-mono text-xs font-bold">z/all</div>
                <div className="text-[10px] text-zinc-500">ฟีดรวมกระทู้ทั้งหมด</div>
              </div>
            </div>
          </button>

          {communities.map((sub) => {
            const isSelected = currentCategory === sub.name;
            const IconComponent = ICON_MAP[sub.icon] || Terminal;
            return (
              <button
                key={sub.name}
                onClick={() => onSelectCategory && onSelectCategory(sub.name)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-yellow-500/10 text-amber-800 dark:text-yellow-400 font-semibold border border-amber-200 dark:border-yellow-500/25'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.03] hover:text-zinc-950 dark:hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <IconComponent size={14} className={isSelected ? 'text-amber-600 dark:text-yellow-400' : 'text-zinc-500 dark:text-zinc-400 shrink-0'} />
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold truncate">z/{sub.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{sub.description}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 tabular-nums shrink-0 ml-1">
                  {sub.post_count || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <CreateCommunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCommunityCreated={handleCommunityCreated}
      />
    </div>
  );
}
