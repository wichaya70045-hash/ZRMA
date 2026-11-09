'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LiveChatBox from '@/components/LiveChatBox';
import CreateGhostRoomModal from '@/components/CreateGhostRoomModal';
import { GhostRoom } from '@/types';
import {
  ArrowLeft,
  Shield,
  Ghost,
  Radio,
  Plus,
  Users,
  Flame,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function GlobalChatPage() {
  const [activeTab, setActiveTab] = useState<'global' | 'ghost'>('global');
  const [ghostRooms, setGhostRooms] = useState<GhostRoom[]>([]);
  const [currentGhostRoom, setCurrentGhostRoom] = useState<GhostRoom | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  const fetchGhostRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/chat/ghost');
      const data = await res.json();
      if (data.rooms) {
        setGhostRooms(data.rooms);
      }
    } catch (err) {
      console.error('Error fetching ghost rooms:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ghost') {
      fetchGhostRooms();
    }
  }, [activeTab]);

  const handleRoomCreated = (room: GhostRoom) => {
    setGhostRooms((prev) => [room, ...prev.filter((r) => r.name !== room.name)]);
    setCurrentGhostRoom(room);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-yellow-400 transition-colors"
        >
          <ArrowLeft size={13} />
          <span>กลับหน้าบอร์ดข่าว ZRMA</span>
        </Link>

        {/* Tab Switcher */}
        <div className="inline-flex items-center bg-black/50 border border-white/[0.08] p-1 rounded-xl text-xs">
          <button
            onClick={() => {
              setActiveTab('global');
              setCurrentGhostRoom(null);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors font-semibold ${
              activeTab === 'global'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio size={13} />
            <span>ห้องแชทสดส่วนกลาง (z/lounge)</span>
          </button>

          <button
            onClick={() => setActiveTab('ghost')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors font-semibold ${
              activeTab === 'ghost'
                ? 'bg-orange-500 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Ghost size={13} className={activeTab === 'ghost' ? 'text-zinc-950' : 'text-orange-400'} />
            <span>ห้องหายไปเมื่อไม่มีคน (Ghost Rooms)</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      {activeTab === 'global' ? (
        <div className="h-[calc(100dvh-150px)] sm:h-[75vh] sm:min-h-[520px]">
          <LiveChatBox
            roomId="global"
            title="ห้องสนทนาสดส่วนกลาง (z/lounge)"
          />
        </div>
      ) : currentGhostRoom ? (
        <div className="h-[calc(100dvh-150px)] sm:h-[75vh] sm:min-h-[520px] space-y-2">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setCurrentGhostRoom(null)}
              className="text-xs text-zinc-400 hover:text-yellow-400 flex items-center gap-1 font-mono"
            >
              <ArrowLeft size={12} />
              <span>ดูรายชื่อห้องหายไปเมื่อไม่มีคนทั้งหมด</span>
            </button>
          </div>
          <div className="h-[calc(100%-32px)]">
            <LiveChatBox
              roomId={`ghost_${currentGhostRoom.name}`}
              title={`ห้องระเหย: ${currentGhostRoom.title}`}
              isGhostRoom={true}
              onLeaveGhostRoom={() => {
                setCurrentGhostRoom(null);
                fetchGhostRooms();
              }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Ghost Room Feature Explainer Banner */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-orange-500/40 bg-gradient-to-r from-red-950/40 via-zinc-950 to-[#101217] p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                  </span>
                  <span className="text-[10px] font-mono text-orange-400 uppercase font-black tracking-widest flex items-center gap-1">
                    <Ghost size={12} />
                    <span>VANISHING GHOST ROOM ARCHITECTURE</span>
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  โหมด "ห้องหายไปเมื่อไม่มีคน" (Ghost Rooms)
                </h2>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  ห้องแชทชั่วคราวที่จะลบทำลายตัวเองและข้อความทั้งหมดทันทีเมื่อทุกคนออกจากห้อง (Active Users = 0) ไร้รอยเท้าดิจิทัล 100% เหมาะสำหรับเสวนาเรื่องลับหรือข่าวกรองเฉพาะกิจ
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary !bg-orange-600 hover:!bg-orange-500 !py-2.5 !px-4 text-xs font-bold shrink-0 self-start sm:self-auto shadow-lg shadow-orange-950/40"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>+ เปิดห้องหายไปเมื่อไม่มีคนใหม่</span>
              </button>
            </div>
          </div>

          {/* Active Ghost Rooms Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono px-1">
              <span>ห้องระเหยที่กำลังใช้งาน ({ghostRooms.length})</span>
              <button
                onClick={fetchGhostRooms}
                className="text-[11px] hover:text-yellow-400"
              >
                รีเฟรชรายชื่อ
              </button>
            </div>

            {isLoadingRooms ? (
              <div className="py-12 text-center text-xs font-mono text-zinc-500">
                SCANNING ACTIVE GHOST ROOMS...
              </div>
            ) : ghostRooms.length === 0 ? (
              <div className="bg-[#101217] border border-white/[0.08] rounded-2xl p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/25">
                  <Ghost size={24} />
                </div>
                <h3 className="text-sm font-bold text-zinc-200">ยังไม่มีห้องระเหยที่เปิดอยู่ขณะนี้</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  ห้องทั้งหมดที่สร้างก่อนหน้านี้ได้สลายตัวทำลายตัวเองไปเรียบร้อยแล้วหลังจากทุกคนออกจากห้อง
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-secondary text-xs !py-1.5 !px-3.5 hover:border-orange-500/40"
                >
                  <Plus size={13} className="text-orange-400" />
                  <span>เปิดห้องแรกเลย</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ghostRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setCurrentGhostRoom(room)}
                    className="group bg-[#101217] border border-white/[0.08] hover:border-orange-500/50 rounded-xl p-4 transition-all cursor-pointer shadow-sm hover:shadow-orange-950/20 space-y-2.5 relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/25 shrink-0">
                          <Ghost size={14} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-zinc-100 group-hover:text-orange-400 transition-colors">
                            {room.title}
                          </h3>
                          <span className="text-[10px] font-mono text-zinc-500">
                            ghost_{room.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20 shrink-0">
                        <Users size={11} />
                        <span>{room.active_users} คนในห้อง</span>
                      </div>
                    </div>

                    {room.topic && (
                      <p className="text-xs text-zinc-400 line-clamp-1 leading-relaxed">
                        {room.topic}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[11px] font-mono text-zinc-500">
                      <span>สร้างโดย: {room.creator_alias}</span>
                      <span className="text-orange-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>เข้าร่วมห้อง</span>
                        <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Footnote */}
      <div className="p-3 bg-[#101217] border border-white/[0.06] rounded-xl text-xs text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-red-400 shrink-0" />
          <p className="text-[11px] text-zinc-400">
            ห้องสนทนาทั้งหมดบน ZRMA ไม่มีการบันทึก IP และห้องแบบ Ghost Room จะสลายตัวทันทีเมื่อคนสุดท้ายออกจากห้อง
          </p>
        </div>
        <span className="text-[10px] font-mono text-yellow-500/80">
          ZERO-LOG • SSE REAL-TIME
        </span>
      </div>

      <CreateGhostRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={handleRoomCreated}
      />
    </div>
  );
}
