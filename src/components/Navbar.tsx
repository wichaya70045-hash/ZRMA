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
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#090a0d]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          
          {/* Brand Identity: Black & Crimson Red with Yellow Tag */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 rounded-md"
            >
              <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:border-red-500/60 group-hover:bg-red-950/60 transition-colors shadow-sm">
                <Shield size={16} strokeWidth={2.2} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                    นิรนามบอร์ด
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    Zero-Log
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Center Subtle Telemetry: Signal Yellow & Orange Accents */}
          <div className="hidden md:flex items-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
              <span>NO IP / NO LOGS</span>
            </div>
            <span className="text-zinc-700">|</span>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <EyeOff size={13} className="text-orange-400" />
              <span>ชื่อสุ่มแยกรายกระทู้</span>
            </div>
          </div>

          {/* Primary & Secondary Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] rounded-md border border-transparent hover:border-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              title="อ่านนโยบายความเป็นส่วนตัว"
              aria-label="Privacy architecture details"
            >
              <Info size={16} strokeWidth={1.75} />
            </button>

            <Link
              href="/chat"
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              <Radio size={13} className="text-yellow-400" />
              <span>ห้องแชทสด</span>
            </Link>

            <Link
              href="/new"
              className="btn-primary !py-1.5 !px-3 text-xs"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>ตั้งกระทู้</span>
            </Link>
          </div>
        </div>
      </header>

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
                <h3 className="text-sm font-semibold text-zinc-100">สถาปัตยกรรมความเป็นส่วนตัวสูงสุด (Zero-Trace)</h3>
                <p className="text-xs text-zinc-400">หลักการทำงานด้านความปลอดภัยและคุ้มครองข้อมูล</p>
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
                  <span>ระบบสุ่มชื่อชั่วคราวแยกรายกระทู้</span>
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
