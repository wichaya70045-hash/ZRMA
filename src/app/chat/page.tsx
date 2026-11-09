'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LiveChatBox from '@/components/LiveChatBox';
import CreateGhostRoomModal from '@/components/CreateGhostRoomModal';
import { GhostRoom } from '@/types';
import {
  ArrowLeft,
  Radio,
  Ghost,
  Plus,
  Users,
  Shield,
  Clock,
  Sparkles,
  ChevronRight,
  Hash,
  MessageSquare,
  Lock,
} from 'lucide-react';

export default function ChatPage() {
  const [activeChannel, setActiveChannel] = useState<'global' | string>('global');
  const [ghostRooms, setGhostRooms] = useState<GhostRoom[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [showMobileRoomList, setShowMobileRoomList] = useState(false);

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
    fetchGhostRooms();
  }, []);

  const handleRoomCreated = (room: GhostRoom) => {
    setGhostRooms((prev) => [room, ...prev.filter((r) => r.name !== room.name)]);
    setActiveChannel(room.name);
    setShowMobileRoomList(false);
  };

  const selectedGhostRoom = ghostRooms.find((r) => r.name === activeChannel);
  const isGhostActive = activeChannel !== 'global';

  return (
    <div className="max-w-6xl w-full mx-auto space-y-4 overflow-hidden">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-yellow-400 transition-colors mb-1.5"
          >
            <ArrowLeft size={13} />
            <span>กลับหน้าบอร์ด (z/all)</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
              <MessageSquare size={18} className="text-red-500" />
              <span>ห้องสนทนาสด (Live Chat Channels)</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.08]">
              Zero-Log
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            แลกเปลี่ยนข้อมูลแบบเรียลไทม์ ไร้การบันทึก IP และเลือกคุยในห้องสลายตัวอัตโนมัติได้
          </p>
        </div>

        {/* Action Button: Create Vanishing Room */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary text-xs !py-2 !px-3.5 self-start sm:self-auto font-semibold shrink-0"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>+ เปิดห้องชั่วคราวใหม่</span>
        </button>
      </div>

      {/* Mobile Channel Switcher Pill Bar */}
      <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1 text-xs max-w-full scrollbar-none">
        <button
          onClick={() => {
            setActiveChannel('global');
            setShowMobileRoomList(false);
          }}
          className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
            activeChannel === 'global' && !showMobileRoomList
              ? 'bg-red-600 text-white font-semibold shadow-sm'
              : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
          }`}
        >
          <Radio size={12} className={activeChannel === 'global' && !showMobileRoomList ? 'text-white' : 'text-zinc-400'} />
          <span>z/lounge (ห้องหลัก)</span>
        </button>

        <button
          onClick={() => setShowMobileRoomList(!showMobileRoomList)}
          className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
            showMobileRoomList || isGhostActive
              ? 'bg-orange-500 text-zinc-950 font-bold shadow-sm'
              : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
          }`}
        >
          <Ghost size={12} />
          <span>ห้องชั่วคราว ({ghostRooms.length})</span>
        </button>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 shrink-0 bg-white/[0.03] text-zinc-400 hover:text-yellow-400 border border-dashed border-white/20 ml-auto"
        >
          <Plus size={12} />
          <span>สร้างห้อง</span>
        </button>
      </div>

      {/* Main Channel Layout: Dual Pane on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full max-w-full">
        
        {/* Left Pane: Channels Directory */}
        <aside
          className={`lg:col-span-4 space-y-4 ${
            showMobileRoomList ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Public Channels Card */}
          <div className="bg-[#101217] border border-white/[0.08] rounded-xl p-3 space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 px-1.5 flex items-center justify-between">
              <span>ห้องสาธารณะทั่วไป</span>
              <span className="text-[10px] text-zinc-600">FIFO 100</span>
            </div>

            <button
              onClick={() => {
                setActiveChannel('global');
                setShowMobileRoomList(false);
              }}
              className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2.5 ${
                activeChannel === 'global' && !showMobileRoomList
                  ? 'border-red-500/50 bg-red-950/20 text-white shadow-sm ring-1 ring-red-500/30'
                  : 'border-white/[0.06] bg-black/30 text-zinc-300 hover:border-white/[0.12] hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                  <Radio size={13} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5">
                    <span>z/lounge</span>
                    {activeChannel === 'global' && !showMobileRoomList && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    ห้องสนทนาสดส่วนกลางสำหรับทุกคน
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                สาธารณะ
              </span>
            </button>
          </div>

          {/* Ephemeral Ghost Rooms Card */}
          <div className="bg-[#101217] border border-white/[0.08] rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between px-1.5 text-[11px] font-mono font-bold text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Ghost size={13} className="text-orange-400" />
                <span>ห้องสลายตัวอัตโนมัติ ({ghostRooms.length})</span>
              </div>
              <button
                onClick={fetchGhostRooms}
                className="text-[10px] text-zinc-500 hover:text-yellow-400 transition-colors font-sans"
              >
                รีเฟรช
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 px-1.5 leading-relaxed">
              ข้อความและห้องจะถูกลบทำลายถาวร 100% ทันทีเมื่อทุกคนออกจากห้อง
            </p>

            {isLoadingRooms ? (
              <div className="py-6 text-center text-xs font-mono text-zinc-500">
                กำลังโหลดรายชื่อห้อง...
              </div>
            ) : ghostRooms.length === 0 ? (
              <div className="p-4 bg-black/30 border border-white/[0.06] rounded-lg text-center space-y-2">
                <p className="text-xs text-zinc-400">ยังไม่มีห้องชั่วคราวที่เปิดอยู่</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-secondary !py-1 !px-3 text-xs text-orange-400 hover:border-orange-500/40"
                >
                  <Plus size={12} />
                  <span>เปิดห้องแรกเลย</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-0.5">
                {ghostRooms.map((room) => {
                  const isCurrent = activeChannel === room.name && !showMobileRoomList;

                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        setActiveChannel(room.name);
                        setShowMobileRoomList(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'border-orange-500/60 bg-orange-950/20 text-white shadow-sm ring-1 ring-orange-500/30'
                          : 'border-white/[0.06] bg-black/30 text-zinc-300 hover:border-white/[0.12] hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                          <Ghost size={12} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-zinc-100 truncate flex items-center gap-1">
                            <span>{room.title}</span>
                          </div>
                          {room.topic && (
                            <div className="text-[10px] text-zinc-400 truncate">
                              {room.topic}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 font-mono text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 shrink-0">
                        <Users size={10} />
                        <span>{room.active_users}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Security & Anti-Trace Guarantee */}
          <div className="bg-[#101217] border border-white/[0.06] rounded-xl p-3 text-xs space-y-1.5 text-zinc-400">
            <div className="flex items-center gap-1.5 font-medium text-zinc-200 text-xs">
              <Shield size={13} className="text-red-400" />
              <span>การันตีความเป็นส่วนตัว 100%</span>
            </div>
            <ul className="text-[11px] text-zinc-400 space-y-1 pl-4 list-disc list-outside">
              <li>ไม่บันทึก IP Address และข้อมูลเบราว์เซอร์</li>
              <li>สุ่มรหัสผู้ส่งแยกเซสชัน ไม่ผูกกับกระทู้</li>
              <li>ระบบส่งข้อมูลสดผ่าน SSE Real-Time ปลอดภัย</li>
            </ul>
          </div>
        </aside>

        {/* Right Pane: Live Active Chat Arena */}
        <main
          className={`lg:col-span-8 ${
            showMobileRoomList ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="h-[calc(100dvh-170px)] sm:h-[620px] max-h-[720px] min-h-[480px]">
            {isGhostActive && selectedGhostRoom ? (
              <LiveChatBox
                roomId={`ghost_${selectedGhostRoom.name}`}
                title={`ห้องระเหย: ${selectedGhostRoom.title}`}
                isGhostRoom={true}
                onLeaveGhostRoom={() => {
                  setActiveChannel('global');
                  fetchGhostRooms();
                }}
              />
            ) : isGhostActive ? (
              <LiveChatBox
                roomId={`ghost_${activeChannel}`}
                title={`ห้องระเหย: ${activeChannel}`}
                isGhostRoom={true}
                onLeaveGhostRoom={() => {
                  setActiveChannel('global');
                  fetchGhostRooms();
                }}
              />
            ) : (
              <LiveChatBox
                roomId="global"
                title="ห้องสนทนาสดส่วนกลาง (z/lounge)"
              />
            )}
          </div>
        </main>

      </div>

      <CreateGhostRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={handleRoomCreated}
      />
    </div>
  );
}
