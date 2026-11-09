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
    <div className="space-y-4">
      {/* About Community Card (Reddit Style) */}
      <div className="bg-[#101217] border border-white/[0.08] rounded-xl overflow-hidden shadow-lg">
        {/* Banner Top */}
        <div className="h-12 bg-gradient-to-r from-red-950 via-zinc-900 to-black p-3 flex items-center justify-between border-b border-white/[0.06]">
          <span className="text-[11px] font-mono font-bold text-yellow-400 tracking-wider">
            ABOUT COMMUNITY
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
        </div>

        <div className="p-4 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-500/30 text-red-500 flex items-center justify-center font-bold text-sm shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <span>ZRMA Community</span>
              </h2>
              <span className="text-[11px] font-mono text-zinc-500">z/ZRMA • Zero-Trace Reddit</span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            ชุมชนข่าวสารและเสวนาแบบไร้ตัวตน 100% สุ่มรหัสใหม่ทุกกระทู้ ไม่เก็บ IP Address ทำลายตัวเองอัตโนมัติตามกำหนด (TTL) และรองรับรูปภาพ/วิดีโอ
          </p>

          {/* Reddit-style Community Stats */}
          <div className="grid grid-cols-2 gap-2 py-2 border-y border-white/[0.06]">
            <div>
              <div className="text-xs font-mono font-bold text-zinc-100 tabular-nums">1.4k</div>
              <div className="text-[10px] text-zinc-500">สมาชิกนิรนาม</div>
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-yellow-400 flex items-center gap-1 tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                <span>52</span>
              </div>
              <div className="text-[10px] text-zinc-500">กำลังคุยสด</div>
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
              className="w-full btn-secondary text-xs justify-center hover:border-yellow-500/40"
            >
              <Plus size={13} className="text-yellow-400" />
              <span>+ สร้างห้อง z/ ชุมชนใหม่</span>
            </button>

            <Link
              href="/chat"
              className="w-full inline-flex items-center justify-center gap-1.5 p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-semibold transition-colors"
            >
              <Ghost size={13} />
              <span>ห้องหายไปเมื่อไม่มีคน (Ghost)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Sub-communities list */}
      <div className="bg-[#101217] border border-white/[0.08] rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <h3 className="text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">
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
                ? 'bg-yellow-500/10 text-yellow-400 font-semibold border border-yellow-500/25'
                : 'text-zinc-300 hover:bg-white/[0.03] hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-yellow-400" />
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
                    ? 'bg-yellow-500/10 text-yellow-400 font-semibold border border-yellow-500/25'
                    : 'text-zinc-300 hover:bg-white/[0.03] hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <IconComponent size={14} className={isSelected ? 'text-yellow-400' : 'text-zinc-400 shrink-0'} />
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
