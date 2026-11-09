'use client';

import React, { useState } from 'react';
import { GhostRoom } from '@/types';
import {
  X,
  Ghost,
  ShieldAlert,
  Flame,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface CreateGhostRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (room: GhostRoom) => void;
  creatorAlias?: string;
}

export default function CreateGhostRoomModal({
  isOpen,
  onClose,
  onRoomCreated,
  creatorAlias,
}: CreateGhostRoomModalProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('กรุณาระบุชื่อห้องสนทนาชั่วคราว');
      return;
    }

    const cleanSlug = (slug.trim() || `ghost-${Math.floor(Math.random() * 9000 + 1000)}`)
      .toLowerCase()
      .replace(/[^a-z0-9_\-]/g, '');

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/chat/ghost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanSlug,
          title: title.trim(),
          topic: topic.trim() || null,
          creator_alias: creatorAlias || 'u/วิญญาณนิรนาม',
        }),
      });

      const data = await res.json();
      if (res.ok && data.room) {
        onRoomCreated(data.room);
        onClose();
      } else {
        setErrorMsg(data.error || 'เกิดข้อผิดพลาดในการสร้างห้องระเหย');
      }
    } catch {
      setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#101217] border-2 border-red-500/40 rounded-2xl w-full max-w-md p-5 sm:p-6 text-zinc-200 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 p-1 rounded-md hover:bg-white/[0.04] transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-mono text-orange-400 uppercase font-bold tracking-wider flex items-center gap-1">
              <Ghost size={12} />
              <span>GHOST VANISHING ROOM</span>
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100">
            สร้าง "ห้องหายไปเมื่อไม่มีคน"
          </h2>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            ห้องสนทนาชั่วคราวระดับ Zero-Trace: ห้องและข้อความทั้งหมดจะถูกลบทำลายทันทีเมื่อไม่มีคนอยู่ในห้อง
          </p>
        </div>

        {/* Warning Callout */}
        <div className="p-3 mb-4 bg-red-950/30 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
          <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>กลไกการระเหยอัตโนมัติ:</strong> เมื่อผู้ใช้ทุกคนปิดหน้าจอหรือออกจากห้อง ข้อมูลจะถูกลบทันที ไม่มีบันทึกสำรองใดๆ ทั้งสิ้น
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 bg-red-950/20 border border-red-900/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
              ชื่อห้องสนทนา (Room Title)
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น คุยเจาะลึกข่าวด่วน, เสวนานิรนาม 007"
              maxLength={60}
              className="w-full bg-black/50 border border-white/[0.08] focus:border-red-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
              รหัสห้อง / Slug (ไม่บังคับ)
            </label>
            <div className="flex items-center bg-black/50 border border-white/[0.08] focus-within:border-yellow-400 rounded-lg px-3 py-2 text-xs">
              <span className="text-zinc-500 font-mono font-bold mr-1">ghost_</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, ''))}
                placeholder="สุ่มให้อัตโนมัติ หรือตั้งเอง"
                maxLength={30}
                className="bg-transparent text-zinc-100 focus:outline-none w-full font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
              หัวข้อคุยโดยย่อ / Topic (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="เช่น แลกเปลี่ยนข้อมูลเชิงลึกเฉพาะกลุ่ม"
              maxLength={100}
              className="w-full bg-black/50 border border-white/[0.08] focus:border-red-500 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="btn-primary !py-1.5 !px-4 text-xs font-bold !bg-red-600 hover:!bg-red-500"
            >
              <Check size={13} />
              <span>{isSubmitting ? 'กำลังสร้าง...' : 'เปิดห้องระเหยทันที'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
