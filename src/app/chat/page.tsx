'use client';

import React from 'react';
import Link from 'next/link';
import LiveChatBox from '@/components/LiveChatBox';
import { ArrowLeft, Shield } from 'lucide-react';

export default function GlobalChatPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={13} />
          <span>กลับบอร์ดข่าว</span>
        </Link>

        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>LIVE • ZERO-LOG TERMINAL</span>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="h-[75vh] min-h-[480px]">
        <LiveChatBox
          roomId="global"
          title="ห้องสนทนาสดส่วนกลาง"
        />
      </div>

      {/* Footnote */}
      <div className="p-3 bg-[#101216] border border-white/[0.06] rounded-xl text-xs text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-emerald-400 shrink-0" />
          <p className="text-[11px] text-zinc-400">
            ระบบจำกัดประวัติแชทสูงสุด 100 ข้อความล่าสุด (FIFO) และไม่มีการบันทึก IP ใดๆ ทั้งสิ้น
          </p>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">
          SSE REAL-TIME
        </span>
      </div>
    </div>
  );
}
