'use client';

import React from 'react';
import {
  Layers,
  AlertCircle,
  Terminal,
  Landmark,
  TrendingUp,
  MessageSquare,
  Atom,
  Clock,
  Flame,
  Zap,
} from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedSort: 'latest' | 'hot' | 'breaking';
  onSelectSort: (sort: 'latest' | 'hot' | 'breaking') => void;
}

const CATEGORIES = [
  { key: 'all', label: 'ทั้งหมด', icon: Layers },
  { key: 'breaking', label: 'ข่าวด่วน', icon: AlertCircle, isBreaking: true },
  { key: 'tech', label: 'เทคโนโลยี', icon: Terminal },
  { key: 'society', label: 'สังคม & การเมือง', icon: Landmark },
  { key: 'finance', label: 'เศรษฐกิจ', icon: TrendingUp },
  { key: 'general', label: 'ทั่วไป', icon: MessageSquare },
  { key: 'science', label: 'วิทยาศาสตร์', icon: Atom },
];

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  selectedSort,
  onSelectSort,
}: CategoryFilterProps) {
  return (
    <div className="space-y-3">
      {/* Category Horizontal Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.key;
          
          let activeClasses = 'bg-yellow-400 text-zinc-950 border-yellow-400 font-bold shadow-sm';
          if (cat.isBreaking && isActive) {
            activeClasses = 'bg-red-600 text-white border-red-500 font-bold shadow-sm';
          }

          return (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors border active:scale-95 ${
                isActive
                  ? activeClasses
                  : 'bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 border-white/[0.06] hover:border-orange-500/30'
              }`}
            >
              <Icon
                size={13}
                strokeWidth={isActive ? 2.2 : 1.75}
                className={
                  isActive
                    ? ''
                    : cat.isBreaking
                    ? 'text-red-400'
                    : 'text-zinc-400'
                }
              />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sort Bar */}
      <div className="flex items-center justify-between py-1 text-xs border-b border-white/[0.06]">
        <span className="text-[11px] font-mono uppercase text-zinc-500">
          ลำดับการแสดงผล:
        </span>

        <div className="inline-flex items-center gap-1 bg-black/40 p-0.5 rounded-md border border-white/[0.06]">
          <button
            onClick={() => onSelectSort('latest')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors active:scale-95 ${
              selectedSort === 'latest'
                ? 'bg-yellow-500/15 text-yellow-400 font-semibold border border-yellow-500/25'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock size={12} className={selectedSort === 'latest' ? 'text-yellow-400' : ''} />
            <span>ล่าสุด</span>
          </button>

          <button
            onClick={() => onSelectSort('hot')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors active:scale-95 ${
              selectedSort === 'hot'
                ? 'bg-orange-500/15 text-orange-400 font-semibold border border-orange-500/25'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame size={12} className={selectedSort === 'hot' ? 'text-orange-400' : ''} />
            <span>มาแรง</span>
          </button>

          <button
            onClick={() => onSelectSort('breaking')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors active:scale-95 ${
              selectedSort === 'breaking'
                ? 'bg-red-500/15 text-red-400 font-semibold border border-red-500/25'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap size={12} className={selectedSort === 'breaking' ? 'text-red-400' : ''} />
            <span>ข่าวด่วน</span>
          </button>
        </div>
      </div>
    </div>
  );
}
