'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  AlertCircle,
  Terminal,
  Flame,
  Zap,
  Award,
  Sparkles,
  Plus,
  Cpu,
  Radar,
  Globe,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { RedditSort, Community } from '@/types';
import CreateCommunityModal from './CreateCommunityModal';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedSort: RedditSort;
  onSelectSort: (sort: RedditSort) => void;
}

const ICON_MAP: Record<string, any> = {
  terminal: Terminal,
  flame: Flame,
  zap: Zap,
  cpu: Cpu,
  radar: Radar,
  globe: Globe,
  trending: TrendingUp,
  chat: MessageSquare,
  alert: AlertCircle,
};

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  selectedSort,
  onSelectSort,
}: CategoryFilterProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/communities')
      .then((res) => res.json())
      .then((data) => {
        if (data.communities) setCommunities(data.communities);
      })
      .catch(() => {});
  }, []);

  const handleCreated = (newComm: Community) => {
    setCommunities((prev) => [newComm, ...prev.filter((c) => c.name !== newComm.name)]);
    onSelectCategory(newComm.name);
  };

  return (
    <div className="space-y-3">
      {/* Subreddit Horizontal Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
        {/* r/all */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border active:scale-95 ${
            selectedCategory === 'all'
              ? 'bg-yellow-400 text-zinc-950 border-yellow-400 font-bold shadow-sm'
              : 'bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 border-white/[0.06] hover:border-yellow-500/30'
          }`}
        >
          <Layers size={13} strokeWidth={selectedCategory === 'all' ? 2.5 : 1.75} />
          <span>r/all</span>
        </button>

        {/* Dynamic subreddits */}
        {communities.map((comm) => {
          const isActive = selectedCategory === comm.name;
          const IconComp = ICON_MAP[comm.icon] || Terminal;
          const isBreaking = comm.name === 'breaking';

          let activeClasses = 'bg-yellow-400 text-zinc-950 border-yellow-400 font-bold shadow-sm';
          if (isBreaking && isActive) {
            activeClasses = 'bg-red-600 text-white border-red-500 font-bold shadow-sm';
          }

          return (
            <button
              key={comm.name}
              onClick={() => onSelectCategory(comm.name)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border active:scale-95 ${
                isActive
                  ? activeClasses
                  : 'bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 border-white/[0.06] hover:border-yellow-500/30'
              }`}
            >
              <IconComp
                size={13}
                strokeWidth={isActive ? 2.2 : 1.75}
                className={
                  isActive
                    ? ''
                    : isBreaking
                    ? 'text-red-400'
                    : 'text-zinc-400'
                }
              />
              <span>r/{comm.name}</span>
            </button>
          );
        })}

        {/* Create new r/ button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border border-dashed border-white/20 hover:border-yellow-400 text-zinc-400 hover:text-yellow-400 hover:bg-yellow-400/[0.05]"
          title="สร้างห้อง r/ ใหม่"
        >
          <Plus size={13} />
          <span>+ สร้าง r/</span>
        </button>
      </div>

      {/* Reddit Sort Bar: Hot, New, Top, Rising */}
      <div className="bg-[#101217] border border-white/[0.06] rounded-xl p-1.5 flex items-center justify-between gap-2 text-xs">
        <div className="inline-flex items-center gap-1">
          {/* Hot */}
          <button
            onClick={() => onSelectSort('hot')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
              selectedSort === 'hot'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <Flame size={14} className={selectedSort === 'hot' ? 'text-orange-400' : ''} />
            <span>Hot 🔥</span>
          </button>

          {/* New */}
          <button
            onClick={() => onSelectSort('new')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
              selectedSort === 'new'
                ? 'bg-yellow-400 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <Sparkles size={14} />
            <span>New ✨</span>
          </button>

          {/* Top */}
          <button
            onClick={() => onSelectSort('top')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
              selectedSort === 'top'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <Award size={14} className={selectedSort === 'top' ? 'text-yellow-400' : ''} />
            <span>Top 🏆</span>
          </button>

          {/* Rising */}
          <button
            onClick={() => onSelectSort('rising')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 ${
              selectedSort === 'rising'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
            }`}
          >
            <Zap size={14} className={selectedSort === 'rising' ? 'text-red-400' : ''} />
            <span>Rising 📈</span>
          </button>
        </div>

        {/* Current r/ badge */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-zinc-500 pr-2">
          <span>Viewing:</span>
          <span className="text-zinc-200 font-bold">
            {selectedCategory === 'all' ? 'r/all' : `r/${selectedCategory}`}
          </span>
        </div>
      </div>

      <CreateCommunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCommunityCreated={handleCreated}
      />
    </div>
  );
}
