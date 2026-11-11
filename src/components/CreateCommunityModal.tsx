'use client';

import React, { useState } from 'react';
import { Community } from '@/types';
import {
  X,
  Plus,
  Terminal,
  Flame,
  Zap,
  Globe,
  Cpu,
  Radar,
  MessageSquare,
  Atom,
  TrendingUp,
  AlertCircle,
  Check,
} from 'lucide-react';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommunityCreated: (community: Community) => void;
  initialName?: string;
}

const AVAILABLE_ICONS = [
  { key: 'terminal', icon: Terminal, label: 'Terminal' },
  { key: 'flame', icon: Flame, label: 'Flame' },
  { key: 'zap', icon: Zap, label: 'Zap' },
  { key: 'cpu', icon: Cpu, label: 'CPU' },
  { key: 'radar', icon: Radar, label: 'Radar' },
  { key: 'globe', icon: Globe, label: 'Globe' },
  { key: 'atom', icon: Atom, label: 'Atom' },
  { key: 'trending', icon: TrendingUp, label: 'Trending' },
  { key: 'chat', icon: MessageSquare, label: 'Chat' },
];

export default function CreateCommunityModal({
  isOpen,
  onClose,
  onCommunityCreated,
  initialName = '',
}: CreateCommunityModalProps) {
  const [name, setName] = useState(initialName.replace(/^[zr]\//i, ''));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('terminal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = name.trim().toLowerCase().replace(/^[zr]\//i, '').replace(/[^a-z0-9_]/g, '');
    if (!cleanName || cleanName.length < 2 || cleanName.length > 30) {
      setErrorMsg('ชื่อห้องต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือขีดล่าง ความยาว 2-30 ตัวอักษร');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          title: title.trim() || `z/${cleanName}`,
          description: description.trim() || `ชุมชนแลกเปลี่ยนข่าวสาร z/${cleanName}`,
          icon: selectedIcon,
        }),
      });

      const data = await res.json();
      if (res.ok && data.community) {
        onCommunityCreated(data.community);
        onClose();
      } else {
        setErrorMsg(data.error || 'ไม่สามารถสร้างชุมชนได้');
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#101217] border border-zinc-200 dark:border-white/[0.1] rounded-2xl w-full max-w-md max-w-full p-4 sm:p-6 text-zinc-800 dark:text-zinc-200 shadow-2xl relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors"
        >
          <X size={18} />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-yellow-400 uppercase font-bold tracking-wider">
              ZRMA Subreddit Creator
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
            สร้างหรือแก้ไขชุมชน z/
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            สร้างชุมชนย่อยของคุณเอง ทุกคนสามารถร่วมตั้งกระทู้และแลกเปลี่ยนความเห็นได้ทันที
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-600 dark:text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 mb-1">
              ชื่อห้อง (Subreddit Slug)
            </label>
            <div className="flex items-center bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] focus-within:border-red-500 rounded-lg px-3 py-2 text-xs">
              <span className="text-zinc-500 font-mono font-bold mr-1">z/</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="crypto, ai, thailand, meme"
                maxLength={30}
                className="bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none w-full font-mono font-semibold"
              />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
              ใช้ตัวอักษร a-z, 0-9 และ _ (ความยาว 2-30 ตัว)
            </span>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 mb-1">
              ชื่อทางการของชุมชน (Community Title)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`z/${name || 'name'} - ชุมชน...`}
              maxLength={60}
              className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] focus:border-amber-500 dark:focus:border-yellow-400 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-yellow-400 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 mb-1">
              คำอธิบายชุมชน (Description)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="จุดประสงค์หรือเนื้อหาของห้องนี้..."
              maxLength={200}
              className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] focus:border-red-500 rounded-lg p-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-600 dark:text-zinc-400 mb-1.5">
              เลือกไอคอนชุมชน
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedIcon === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedIcon(item.key)}
                    className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                      isSelected
                        ? 'border-amber-500 dark:border-yellow-400 bg-amber-50 dark:bg-yellow-400/10 text-amber-700 dark:text-yellow-400'
                        : 'border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.02] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-[9px] font-mono">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="btn-primary !py-1.5 !px-4 text-xs font-semibold"
            >
              <Check size={13} />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'สร้างชุมชน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
