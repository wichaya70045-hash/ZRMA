'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Plus,
  Radio,
  Info,
  X,
  Lock,
  EyeOff,
  Clock,
  Ghost,
  Settings as SettingsIcon,
} from 'lucide-react';
import SettingsModal from './SettingsModal';
import { useSettings } from '@/lib/settings';

export default function Navbar() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { settings } = useSettings();

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#090a0d]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2 sm:gap-6">
          
          {/* Brand Identity: ZRMA Community */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 rounded-md"
            >
              <div className="w-8 h-8 rounded-lg bg-red-950/50 border border-red-500/40 flex items-center justify-center text-red-500 group-hover:border-red-500/70 group-hover:bg-red-950/70 transition-colors shadow-sm shrink-0">
                <Shield size={16} strokeWidth={2.4} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-white group-hover:text-yellow-400 transition-colors">
                    ZRMA Community
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    z/all
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="p-1.5 text-zinc-400 hover:text-yellow-400 hover:bg-white/[0.04] rounded-md border border-transparent hover:border-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              title="สถาปัตยกรรมความเป็นส่วนตัวของชุมชน"
              aria-label="Privacy architecture details"
            >
              <Info size={16} strokeWidth={1.75} />
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 text-zinc-400 hover:text-yellow-400 hover:bg-white/[0.04] rounded-md border border-transparent hover:border-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 relative"
              title="ตั้งค่าระบบ (Preferences)"
              aria-label="Settings and preferences"
            >
              <SettingsIcon size={16} strokeWidth={1.75} />
              {settings.strictZeroTrace && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </button>

            <Link
              href="/chat"
              className="btn-secondary !py-1.5 !px-2.5 sm:!px-3 text-xs shrink-0"
              title="ห้องสนทนาสดส่วนกลาง"
            >
              <Radio size={13} className="text-yellow-400 shrink-0" />
              <span className="hidden sm:inline">ห้องแชทสด</span>
            </Link>

            <Link
              href="/new"
              className="btn-primary !py-1.5 !px-2.5 sm:!px-3 text-xs shrink-0"
            >
              <Plus size={14} strokeWidth={2.5} className="shrink-0" />
              <span className="hidden sm:inline">สร้างโพสต์</span>
              <span className="sm:hidden">โพสต์</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Privacy Architecture Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#101217] border border-white/[0.1] rounded-xl max-w-lg w-full p-6 shadow-2xl relative text-zinc-200">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/25">
                <Shield size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">ZRMA Community (Zero-Trace Architecture)</h3>
                <p className="text-xs text-zinc-400">สร้างขึ้นบนหลักการคุ้มครองความเป็นส่วนตัวขั้นสูงสุด</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="p-3 bg-zinc-950/60 rounded-lg border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-2 font-medium text-zinc-100">
                  <Lock size={13} className="text-yellow-400 shrink-0" />
                  <span>ไร้การขอข้อมูลและการลงทะเบียน</span>
                </div>
                <p className="text-zinc-400 text-[11px] pl-5 leading-relaxed">
                  ไม่ต้องใช้อีเมล เบอร์โทร หรือชื่อจริง สามารถเข้าอ่านและแสดงความเห็นได้ทันที
                </p>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-lg border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-2 font-medium text-zinc-100">
                  <EyeOff size={13} className="text-red-400 shrink-0" />
                  <span>ไม่บันทึก IP และไม่ฝังคุกกี้สอดแนม</span>
                </div>
                <p className="text-zinc-400 text-[11px] pl-5 leading-relaxed">
                  ฐานข้อมูลไม่มีฟิลด์ `ip_address` หรือ `user_agent` แม้แต่คอลัมน์เดียว ข้อมูลเครือข่ายจะไม่ถูกจัดเก็บลง Disk
                </p>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-lg border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-2 font-medium text-zinc-100">
                  <span className="text-orange-400 text-xs font-mono font-bold shrink-0">#ID</span>
                  <span>ระบบสุ่มชื่อชั่วคราวแยกรายกระทู้ (u/alias)</span>
                </div>
                <p className="text-zinc-400 text-[11px] pl-5 leading-relaxed">
                  ชื่อสุ่มจะผูกอยู่เฉพาะใน `sessionStorage` ของแต่ละกระทู้ เมื่อไปตอบในกระทู้อื่น คุณจะได้รหัสใหม่โดยอัตโนมัติ ไม่สามารถแกะรอยข้ามกระทู้ได้
                </p>
              </div>

              <div className="p-3 bg-zinc-950/60 rounded-lg border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-2 font-medium text-zinc-100">
                  <Clock size={13} className="text-yellow-400 shrink-0" />
                  <span>ลบข้อมูลอัตโนมัติ (Self-Destruct TTL & FIFO)</span>
                </div>
                <p className="text-zinc-400 text-[11px] pl-5 leading-relaxed">
                  กระทู้จะถูกลบถาวรเมื่อครบอายุที่กำหนด (24 ชม. - 7 วัน) และห้องแชทสดจำกัดเพียง 100 ข้อความล่าสุดเท่านั้น
                </p>
              </div>

              <div className="p-3 bg-orange-950/20 rounded-lg border border-orange-500/30 space-y-1">
                <div className="flex items-center gap-2 font-medium text-orange-300">
                  <Ghost size={14} className="text-orange-400 shrink-0" />
                  <span>ห้องหายไปเมื่อไม่มีคน (Ghost Vanishing Lounges)</span>
                </div>
                <p className="text-zinc-400 text-[11px] pl-5 leading-relaxed">
                  ห้องแชทชั่วคราวที่จะลบทำลายตัวเองและข้อความทั้งหมดทันที 100% เมื่อทุกคนออกจากห้อง
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="btn-primary text-xs"
              >
                เข้าใจแล้ว เข้าใช้งานต่อ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
