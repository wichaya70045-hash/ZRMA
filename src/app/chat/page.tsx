'use client';

import React from 'react';
import Link from 'next/link';
import LiveChatBox from '@/components/LiveChatBox';
import { ArrowLeft, Shield, Radio, Sparkles } from 'lucide-react';

export default function GlobalChatPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าบอร์ดหลัก</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Zero-Log Real-Time Chat Hub</span>
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="h-[75vh] min-h-[500px]">
        <LiveChatBox
          roomId="global"
          title="ห้องสนทนาสดส่วนกลาง (Central Live Chat)"
        />
      </div>

      {/* Privacy explanation footnote */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <p>
            ข้อความทั้งหมดจะถูกหมุนเวียนลบอัตโนมัติ (FIFO) โดยจำกัดไว้ที่ <strong>100 ข้อความล่าสุด</strong> เท่านั้น และไม่มีการจัดเก็บข้อมูลส่วนบุคคลใดๆ
          </p>
        </div>
        <div className="text-[11px] text-slate-500 whitespace-nowrap">
          อัปเดตแบบ Real-time ด้วย Server-Sent Events (SSE)
        </div>
      </div>
    </div>
  );
}
