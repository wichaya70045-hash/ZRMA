'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Tag,
  Banknote,
  Truck,
  MapPin,
  CheckCircle2,
  PackageCheck,
  PackageX,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Phone,
  Copy,
  Check,
} from 'lucide-react';
import type { MarketData, MarketCondition, MarketDelivery } from '@/types';
import { getAuthoredThreadToken } from '@/lib/privacy';

interface ThreadMarketBoxProps {
  threadId: string;
  market: MarketData;
  isInteractive?: boolean;
  isAuthor?: boolean;
  onMarketUpdated?: (nextMarket: MarketData) => void;
}

const CONDITION_INFO: Record<MarketCondition, { label: string; color: string; icon: string }> = {
  new: { label: 'มือ 1 (ของใหม่ยังไม่แกะ)', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/30', icon: '✨' },
  like_new: { label: 'มือ 2 สภาพดีเหมือนใหม่', color: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/30', icon: '📦' },
  used: { label: 'มือ 2 มีร่องรอยตามการใช้งาน', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30', icon: '🛠️' },
  digital: { label: 'ดิจิทัล / ซอฟต์แวร์ / คีย์', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30', icon: '💾' },
};

const DELIVERY_INFO: Record<MarketDelivery, { label: string; icon: any }> = {
  shipping: { label: 'จัดส่งพัสดุด่วน (Flash / EMS / Kerry)', icon: Truck },
  meetup: { label: 'นัดรับมือ', icon: MapPin },
  online: { label: 'ส่งมอบออนไลน์ / ทันที', icon: Sparkles },
};

export default function ThreadMarketBox({
  threadId,
  market: initialMarket,
  isInteractive = false,
  isAuthor = false,
  onMarketUpdated,
}: ThreadMarketBoxProps) {
  const [market, setMarket] = useState<MarketData>(initialMarket);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [copiedContact, setCopiedContact] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    setMarket(initialMarket);
  }, [initialMarket]);

  const isSold = market.status === 'sold';
  const condInfo = CONDITION_INFO[market.condition || 'used'] || CONDITION_INFO.used;
  const DeliveryIcon = DELIVERY_INFO[market.delivery || 'shipping']?.icon || Truck;
  const deliveryLabel = DELIVERY_INFO[market.delivery || 'shipping']?.label || 'จัดส่งพัสดุ';

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    setFeedback(null);
    const nextStatus = isSold ? 'available' : 'sold';
    const editToken = getAuthoredThreadToken(threadId);

    try {
      const res = await fetch(`/api/threads/${threadId}/market`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          status: nextStatus,
          edit_token: editToken || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.market) {
        setFeedback({ type: 'error', text: data.error || 'ไม่สามารถเปลี่ยนสถานะสินค้าได้' });
        return;
      }

      setMarket(data.market);
      onMarketUpdated?.(data.market);
      setFeedback({
        type: 'success',
        text: nextStatus === 'sold' ? 'อัปเดตสถานะเป็น "ขายแล้ว" เรียบร้อย' : 'เปิดขายสินค้าอีกครั้งเรียบร้อย',
      });
    } catch {
      setFeedback({ type: 'error', text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' });
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleCopyContact = (text: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedContact(true);
    setTimeout(() => setCopiedContact(false), 2000);
  };

  return (
    <div
      id={isInteractive ? 'market-panel' : undefined}
      onClick={(e) => {
        if (!isInteractive) e.stopPropagation();
      }}
      className={`rounded-xl border p-3.5 space-y-3 transition-colors ${
        isSold
          ? 'bg-zinc-100/80 dark:bg-zinc-900/40 border-zinc-300 dark:border-white/[0.08] opacity-90'
          : 'bg-amber-50/50 dark:bg-amber-950/15 border-amber-200/90 dark:border-yellow-500/25'
      }`}
    >
      {/* Header Row: Category Badge + Status Badge + Author Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-600 dark:bg-yellow-500 text-white dark:text-zinc-950 shadow-xs">
            <Tag size={11} />
            <span>ตลาดซื้อขาย / ปล่อยของ</span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-semibold border ${
              isSold
                ? 'bg-zinc-200/90 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSold ? 'bg-zinc-400' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            {isSold ? 'ขายแล้ว (Sold Out)' : 'กำลังวางขาย (Available)'}
          </span>
        </div>

        {isInteractive && isAuthor && (
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
              isSold
                ? 'bg-white dark:bg-black/40 border-zinc-300 dark:border-white/[0.12] text-zinc-700 dark:text-zinc-200 hover:border-amber-500'
                : 'bg-zinc-800 dark:bg-zinc-700 border-zinc-700 text-white hover:bg-zinc-900'
            }`}
          >
            {isSold ? <PackageCheck size={12} /> : <PackageX size={12} />}
            <span>{isSold ? 'เปิดขายใหม่อีกครั้ง' : 'ทำเครื่องหมายว่า "ขายแล้ว"'}</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300'
          }`}
        >
          <CheckCircle2 size={13} className="shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Info: Price + Condition + Delivery Pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Price Tag */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-black/50 border border-amber-300 dark:border-yellow-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base shadow-xs font-mono">
          <Banknote size={15} className="text-amber-500 shrink-0" />
          <span>{market.price || 'ราคาตามตกลง'}</span>
        </span>

        {/* Condition Badge */}
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium ${condInfo.color}`}
        >
          <span>{condInfo.icon}</span>
          <span>{condInfo.label}</span>
        </span>

        {/* Delivery Mode */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 text-xs">
          <DeliveryIcon size={12} className="text-amber-600 dark:text-yellow-400 shrink-0" />
          <span>{deliveryLabel}</span>
        </span>

        {/* Location (if meetup) */}
        {market.location && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 text-xs">
            <MapPin size={12} className="text-red-500 shrink-0" />
            <span>นัดรับ: {market.location}</span>
          </span>
        )}
      </div>

      {/* Interactive Contact & Actions */}
      {isInteractive ? (
        <div className="pt-2 border-t border-zinc-200/80 dark:border-white/[0.08] space-y-2">
          {market.contact_info ? (
            <div className="p-3 rounded-xl bg-white dark:bg-[#0c0e12] border border-zinc-200 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-amber-500 shrink-0" />
                <div className="text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[10.5px]">
                    ช่องทางติดต่อผู้ขายโดยตรง:
                  </span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 selection:bg-amber-200">
                    {market.contact_info}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleCopyContact(market.contact_info || '')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 dark:bg-white/[0.04] text-[11px] font-mono text-zinc-700 dark:text-zinc-200 hover:border-amber-500 transition-colors"
                >
                  {copiedContact ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  <span>{copiedContact ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <MessageCircle size={13} className="text-amber-500 shrink-0" />
              <span>สามารถพิมพ์สอบถามหรือต่อรองราคาได้ในช่องแชทสดหรือความคิดเห็นด้านล่าง</span>
            </div>
          )}
        </div>
      ) : (
        /* Card Preview CTA */
        <div className="pt-1 flex items-center justify-end">
          <Link
            href={`/thread/${threadId}#market-panel`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition-all ${
              isSold
                ? 'bg-zinc-500 hover:bg-zinc-600'
                : 'bg-amber-600 hover:bg-amber-500 dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:text-zinc-950 font-bold'
            }`}
          >
            <span>{isSold ? 'ดูรายละเอียดสินค้า (ขายแล้ว)' : 'ดูรายละเอียด & ติดต่อผู้ขาย'}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
