'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';
import { getScopedIdentity, rerollScopedIdentity, AnonymousIdentity } from '@/lib/privacy';
import {
  Send,
  Dices,
  Flag,
  AlertTriangle,
  Radio,
  Clock,
  Trash2,
  Smile,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import ReportModal from './ReportModal';

interface LiveChatBoxProps {
  roomId?: string; // 'global' or thread id
  title?: string;
  isCompact?: boolean;
}

export default function LiveChatBox({
  roomId = 'global',
  title = 'ห้องสนทนาสดส่วนกลาง (Real-time)',
  isCompact = false,
}: LiveChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [identity, setIdentity] = useState<AnonymousIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0); // Cooldown countdown in seconds
  const [reportTarget, setReportTarget] = useState<ChatMessage | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch identity from sessionStorage
  useEffect(() => {
    const id = getScopedIdentity(`chat_${roomId}`);
    setIdentity(id);
  }, [roomId]);

  // Load initial messages
  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat?room=${encodeURIComponent(roomId)}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Connect to Server-Sent Events (SSE) for Real-Time live updates
    const eventSource = new EventSource(`/api/chat/stream?room=${encodeURIComponent(roomId)}`);

    eventSource.addEventListener('chat_message', (event) => {
      try {
        const newMsg: ChatMessage = JSON.parse(event.data);
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          // Keep strictly at most 100 messages in memory FIFO
          const updated = [...prev, newMsg];
          if (updated.length > 100) {
            return updated.slice(updated.length - 100);
          }
          return updated;
        });
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    });

    eventSource.addEventListener('message_hidden', (event) => {
      try {
        const { id } = JSON.parse(event.data);
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, is_hidden: 1 } : m))
        );
      } catch (err) {
        console.error('Error parsing hidden event:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [roomId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRerollIdentity = () => {
    const newId = rerollScopedIdentity(`chat_${roomId}`);
    setIdentity(newId);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending || cooldown > 0 || !identity) return;

    setIsSending(true);
    const content = inputText.trim();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          content,
          author_alias: identity.alias,
          author_avatar: identity.avatar,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setInputText('');
        // Enforce anti-spam 4-second client cooldown
        setCooldown(4);
      } else {
        alert(data.error || 'ไม่สามารถส่งข้อความได้');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSending(false);
    }
  };

  const toggleRevealHidden = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{title}</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              ⚡ ถ่ายทอดสดแบบเรียลไทม์ • เก็บ 100 ข้อความล่าสุด (FIFO)
            </p>
          </div>
        </div>

        {/* Current Anonymous Identity & Reroll button */}
        {identity && (
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-xs">
            <span className="text-sm">{identity.avatar}</span>
            <span className="text-slate-300 font-medium max-w-[120px] truncate hidden sm:inline">
              {identity.alias}
            </span>
            <button
              onClick={handleRerollIdentity}
              className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors ml-1"
              title="สุ่มชื่อและตัวตนใหม่ทันที"
            >
              <Dices className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[350px] max-h-[500px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-500">
            กำลังเชื่อมต่อห้องแชทสด...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-slate-500">
            <Shield className="w-8 h-8 text-emerald-500/40" />
            <p className="text-xs">ยังไม่มีข้อความในห้องนี้</p>
            <p className="text-[11px] text-slate-600">เป็นคนแรกที่เริ่มเปิดบทสนทนาแบบนิรนามได้เลย</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = identity?.alias === msg.author_alias;
            const isMsgHidden = msg.is_hidden === 1 && !revealedIds[msg.id];

            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-2.5 ${isSelf ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-sm border shadow-sm ${
                    isSelf
                      ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                      : 'bg-slate-800/80 border-slate-700/50 text-slate-300'
                  }`}
                >
                  {msg.author_avatar}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs relative transition-all ${
                    isMsgHidden
                      ? 'bg-rose-950/30 border border-rose-900/40 text-rose-300'
                      : isSelf
                      ? 'bg-emerald-600 text-slate-950 rounded-tr-none font-medium'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-tl-none'
                  }`}
                >
                  {/* Sender Alias & Time */}
                  <div
                    className={`flex items-center gap-1.5 text-[10px] mb-1 font-semibold ${
                      isSelf ? 'text-emerald-950' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.author_alias}</span>
                    <span>•</span>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Body Content */}
                  {isMsgHidden ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="italic text-[11px]">
                        [ข้อความนี้ถูกซ่อนโดยอัตโนมัติ เนื่องจากถูกรายงานจากชุมชนครบ 5 ครั้ง]
                      </span>
                      <button
                        onClick={() => toggleRevealHidden(msg.id)}
                        className="p-1 hover:bg-rose-900/50 rounded"
                        title="คลิกเพื่อดูเนื้อหาเดิม"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="break-words leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  )}

                  {/* Report action on hover */}
                  {!isSelf && (
                    <div className="absolute top-1 -right-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setReportTarget(msg)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        title="รายงานข้อความนี้"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            cooldown > 0
              ? `⏳ หน่วงเวลาป้องกันสแปม: รออีก ${cooldown} วินาที...`
              : 'พิมพ์ข้อความแบบนิรนาม (ส่งปุ๊บ สดปั๊บ)...'
          }
          disabled={cooldown > 0 || isSending}
          maxLength={500}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 disabled:opacity-60 transition-colors"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || cooldown > 0 || isSending}
          className="p-2.5 sm:px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
          title="ส่งข้อความ"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">ส่ง</span>
        </button>
      </form>

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTarget(null)}
          targetType="chat"
          targetId={reportTarget.id}
          targetTitle={reportTarget.content}
          onReportSuccess={(newCount, hidden) => {
            if (hidden) {
              setMessages((prev) =>
                prev.map((m) => (m.id === reportTarget.id ? { ...m, is_hidden: 1 } : m))
              );
            }
          }}
        />
      )}
    </div>
  );
}
