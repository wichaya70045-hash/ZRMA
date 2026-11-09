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
  { key: 'breaking', label: 'ข่าวด่วน', icon: AlertCircle },
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
      {/* Category Horizontal Filter (Scrollable on small viewports) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
                isActive
                  ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 border-white/[0.06]'
              }`}
            >
              <Icon size={13} strokeWidth={isActive ? 2 : 1.75} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sort Bar (Clean minimal row) */}
      <div className="flex items-center justify-between py-1 text-xs border-b border-white/[0.06]">
        <span className="text-[11px] font-mono uppercase text-zinc-500">
          ลำดับการแสดงผล:
        </span>

        <div className="inline-flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-md border border-white/[0.06]">
          <button
            onClick={() => onSelectSort('latest')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
              selectedSort === 'latest'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock size={12} />
            <span>ล่าสุด</span>
          </button>

          <button
            onClick={() => onSelectSort('hot')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
              selectedSort === 'hot'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame size={12} />
            <span>มาแรง</span>
          </button>

          <button
            onClick={() => onSelectSort('breaking')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
              selectedSort === 'breaking'
                ? 'bg-zinc-800 text-rose-400 font-medium'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap size={12} />
            <span>ข่าวด่วน</span>
          </button>
        </div>
      </div>
    </div>
  );
}
