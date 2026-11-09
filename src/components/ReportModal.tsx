'use client';

import React, { useState } from 'react';
import { AlertCircle, X, Check, ShieldAlert } from 'lucide-react';
import { ReportReason } from '@/types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'thread' | 'comment' | 'chat';
  targetId: string;
  targetTitle?: string;
  onReportSuccess?: (newCount: number, isHidden: boolean) => void;
}

const REASONS: { key: ReportReason; label: string; desc: string }[] = [
  { key: 'spam', label: 'สแปมหรือโฆษณาหลอกลวง', desc: 'ข้อความซ้ำซาก ลิงก์ขายของ หรือโปรโมตที่ไม่เกี่ยวข้อง' },
  { key: 'fake_news', label: 'ข้อมูลเท็จ / ข่าวปลอม', desc: 'จงใจบิดเบือนข้อมูลเพื่อสร้างความตื่นตระหนก' },
  { key: 'illegal', label: 'เนื้อหาผิดกฎหมายหรืออันตราย', desc: 'สิ่งผิดกฎหมาย หรือการข่มขู่ทำร้าย' },
  { key: 'harassment', label: 'คุกคาม / คำสร้างความเกลียดชัง', desc: 'กลั่นแกล้ง ละเมิดสิทธิผู้อื่น หรือ Hate Speech' },
  { key: 'other', label: 'อื่นๆ ที่ขัดต่อความเรียบร้อย', desc: 'พฤติกรรมไม่เหมาะสมต่อชุมชน' },
];

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  onReportSuccess,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('spam');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason: selectedReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        if (onReportSuccess) {
          onReportSuccess(data.newReportCount, data.isHidden);
        }
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการส่งรายงาน');
      }
    } catch {
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-[#101216] border border-white/[0.1] rounded-xl max-w-md w-full max-w-full p-4 sm:p-5 shadow-2xl relative text-zinc-200 my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {submitted ? (
          <div className="text-center py-5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <Check size={18} strokeWidth={2.5} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">บันทึกรายงานแล้ว</h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
              ระบบตรวจสอบโดยชุมชน: หากข้อความนี้มีผู้รายงานครบ 5 ครั้ง จะถูกซ่อนอัตโนมัติทันที
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="btn-secondary text-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">รายงานเนื้อหา</h3>
                <p className="text-xs text-zinc-400 truncate max-w-[280px]">
                  {targetTitle ? `"${targetTitle}"` : 'ข้อความที่ไม่เหมาะสม'}
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-zinc-950/60 border border-white/[0.06] rounded-lg text-xs text-zinc-400 flex items-start gap-2">
              <AlertCircle size={14} className="text-zinc-400 shrink-0 mt-0.5" />
              <span>
                เมื่อรายงานครบ <strong className="text-zinc-200">5 ครั้ง</strong> ระบบจะซ่อนข้อความนี้จากสายตาสาธารณะโดยอัตโนมัติ
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase text-zinc-500 block">
                เลือกเหตุผลในการรายงาน:
              </span>
              <div className="space-y-1.5">
                {REASONS.map((r) => (
                  <label
                    key={r.key}
                    onClick={() => setSelectedReason(r.key)}
                    className={`block p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedReason === r.key
                        ? 'border-emerald-500/50 bg-emerald-500/[0.04]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="reportReason"
                        checked={selectedReason === r.key}
                        onChange={() => setSelectedReason(r.key)}
                        className="accent-emerald-500 h-3.5 w-3.5"
                      />
                      <span className="text-xs font-medium text-zinc-200">{r.label}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 ml-5.5 mt-0.5">{r.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.97] rounded-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังส่ง...' : 'ยืนยันรายงาน'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
