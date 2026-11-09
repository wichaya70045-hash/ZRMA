'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';
import { getScopedIdentity, rerollScopedIdentity, setCustomScopedIdentity, AnonymousIdentity } from '@/lib/privacy';
import {
  Send,
  Dices,
  Flag,
  Radio,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Edit2,
  Check,
  Ghost,
  LogOut,
  AlertTriangle,
  Users,
} from 'lucide-react';
import IdentityAvatar from './IdentityAvatar';
import ReportModal from './ReportModal';

interface LiveChatBoxProps {
  roomId?: string;
  title?: string;
  isCompact?: boolean;
  isGhostRoom?: boolean;
  onLeaveGhostRoom?: () => void;
}

export default function LiveChatBox({
  roomId = 'global',
  title = 'ห้องสนทนาสดส่วนกลาง',
  isCompact = false,
  isGhostRoom = false,
  onLeaveGhostRoom,
}: LiveChatBoxProps) {
  const isGhost = isGhostRoom || roomId.startsWith('ghost_');
  const ghostName = roomId.replace(/^ghost_/, '');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [identity, setIdentity] = useState<AnonymousIdentity | null>(null);
  const [customAlias, setCustomAlias] = useState('');
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [reportTarget, setReportTarget] = useState<ChatMessage | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Ghost Room Presence & Destruction
  const [ghostPresenceCount, setGhostPresenceCount] = useState<number>(1);
  const [isRoomDestroyed, setIsRoomDestroyed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = getScopedIdentity(`chat_${roomId}`);
    setIdentity(id);
    setCustomAlias(id.alias);
  }, [roomId]);

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
    setIsRoomDestroyed(false);
    fetchMessages();

    const eventSource = new EventSource(`/api/chat/stream?room=${encodeURIComponent(roomId)}`);

    eventSource.addEventListener('chat_message', (event) => {
      try {
        const newMsg: ChatMessage = JSON.parse(event.data);
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
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

    eventSource.addEventListener('presence_update', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (typeof data.active_users === 'number') {
          setGhostPresenceCount(data.active_users);
        }
      } catch (err) {
        console.error('Error parsing presence:', err);
      }
    });

    eventSource.addEventListener('room_destroyed', () => {
      setIsRoomDestroyed(true);
      setMessages([]);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setCustomAlias(newId.alias);
  };

  const handleSaveAlias = () => {
    if (!customAlias.trim()) return;
    const finalAlias = customAlias.trim();
    setCustomScopedIdentity(`chat_${roomId}`, finalAlias);
    setIdentity((prev) => (prev ? { ...prev, alias: finalAlias } : null));
    setIsEditingAlias(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending || cooldown > 0 || !identity || isRoomDestroyed) return;

    setIsSending(true);
    const content = inputText.trim();
    const effectiveAlias = customAlias.trim() || identity.alias;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          content,
          author_alias: effectiveAlias,
          author_avatar: identity.avatarIcon,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setInputText('');
        setCooldown(3);
      } else {
        alert(data.error || 'ไม่สามารถส่งข้อความได้');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSending(false);
    }
  };

  const handleLeaveAndDestroy = async () => {
    if (confirm('คุณต้องการออกจากห้องแชทชั่วคราวนี้หรือไม่? (หากคุณเป็นคนสุดท้าย ห้องและข้อความทั้งหมดจะถูกทำลายทันที)')) {
      if (isGhost) {
        try {
          await fetch(`/api/chat/ghost/${ghostName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'leave', active_count: Math.max(0, ghostPresenceCount - 1) }),
          });
        } catch {}
      }
      if (onLeaveGhostRoom) {
        onLeaveGhostRoom();
      }
    }
  };

  const toggleRevealHidden = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const effectiveAlias = customAlias.trim() || identity?.alias || '';

  return (
    <div
      className={`rounded-xl flex flex-col h-full overflow-hidden shadow-lg border transition-colors ${
        isGhost
          ? 'bg-[#0e0f14] border-red-500/50 shadow-red-950/20'
          : 'bg-[#101217] border-white/[0.08]'
      }`}
    >
      {/* Ghost Room Warning Banner */}
      {isGhost && (
        <div className="bg-red-950/40 border-b border-red-500/30 px-3.5 py-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-red-300">
              <Ghost size={13} className="text-red-400" />
              <strong className="text-red-300 uppercase tracking-wide">ห้องหายไปเมื่อไม่มีคน:</strong>
              <span className="text-zinc-400 hidden sm:inline">ข้อความจะสลายตัวทันทีเมื่อทุกคนออก</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-mono text-[11px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/25">
              <Users size={11} />
              <span>{ghostPresenceCount} คนในห้อง</span>
            </div>

            {onLeaveGhostRoom && (
              <button
                onClick={handleLeaveAndDestroy}
                className="text-[10px] font-mono text-zinc-400 hover:text-red-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/[0.04] transition-colors"
                title="ออกจากห้องนี้"
              >
                <LogOut size={11} />
                <span>ออกจากห้อง</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Terminal Header */}
      <div className="px-3.5 py-2.5 bg-black/50 border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${
              isGhost ? 'bg-orange-500' : 'bg-red-500'
            }`}
          />
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5 truncate">
              {isGhost && <Ghost size={12} className="text-orange-400 shrink-0" />}
              <span>{title}</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
              {isGhost ? 'EPHEMERAL GHOST STREAM' : 'LIVE STREAM • FIFO 100'}
            </span>
          </div>
        </div>

        {/* Identity with Editable Name & Dice Reroll */}
        {identity && (
          <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-md text-xs shrink-0">
            <IdentityAvatar iconKey={identity.avatarIcon} theme={isGhost ? 'orange' : 'yellow'} size="xs" />
            
            {isEditingAlias ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveAlias()}
                  placeholder="ชื่อ..."
                  maxLength={30}
                  className="w-20 bg-black/60 border border-yellow-400 rounded px-1.5 py-0.5 text-[11px] text-yellow-400 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveAlias}
                  className="p-0.5 text-yellow-400 hover:text-white"
                  title="บันทึกชื่อ"
                >
                  <Check size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span
                  onClick={() => setIsEditingAlias(true)}
                  className="text-zinc-300 text-[11px] font-mono truncate max-w-[100px] cursor-pointer hover:text-yellow-400"
                  title="คลิกเพื่อตั้งชื่อเอง"
                >
                  {effectiveAlias}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingAlias(true)}
                  className="p-0.5 text-zinc-500 hover:text-yellow-400"
                  title="แก้ไขชื่อตัวเอง"
                >
                  <Edit2 size={10} />
                </button>
              </div>
            )}

            <button
              onClick={handleRerollIdentity}
              className="p-1 text-zinc-500 hover:text-yellow-400 hover:bg-white/[0.06] rounded transition-colors active:scale-95 ml-0.5"
              title="สุ่มชื่อและตัวตนใหม่"
              aria-label="Reroll anonymous identity"
            >
              <Dices size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Destruction Alert Overlay */}
      {isRoomDestroyed ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center text-3xl">
            👻
          </div>
          <h3 className="text-base font-bold text-zinc-100">
            ห้องสนทนานี้สลายตัวแล้ว (Room Vaporized)
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
            เนื่องจากไม่มีผู้ใช้อยู่ในห้อง ระบบ Zero-Trace ได้ทำการลบทำลายห้องและประวัติข้อความทั้งหมดถาวร 100% เรียบร้อยแล้ว
          </p>
          {onLeaveGhostRoom && (
            <button onClick={onLeaveGhostRoom} className="btn-primary text-xs !py-1.5 !px-4 mt-2">
              กลับไปห้องแชทหลัก
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Message Feed */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 min-h-[360px] max-h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-xs font-mono text-zinc-500">
                CONNECTING STREAM...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-1.5 text-zinc-500">
                {isGhost ? (
                  <>
                    <Ghost size={28} className="text-red-400 mb-1 animate-pulse" />
                    <p className="text-xs font-medium text-zinc-300">ห้องสนทนาชั่วคราวเริ่มต้นแล้ว</p>
                    <p className="text-[11px] text-zinc-500 max-w-xs">
                      พิมพ์ข้อความเพื่อเริ่มคุย ข้อมูลทั้งหมดจะถูกลบทำลายทันทีเมื่อทุกคนออกจากห้อง
                    </p>
                  </>
                ) : (
                  <>
                    <Shield size={24} className="text-zinc-600 mb-1" />
                    <p className="text-xs font-medium text-zinc-400">ยังไม่มีข้อความในห้องนี้</p>
                    <p className="text-[11px] text-zinc-600">ข้อความทั้งหมดไม่ถูกบันทึก IP และจำกัด 100 ล่าสุด</p>
                  </>
                )}
              </div>
            ) : (
              messages.map((msg) => {
                const isSelf = effectiveAlias === msg.author_alias;
                const isMsgHidden = msg.is_hidden === 1 && !revealedIds[msg.id];

                return (
                  <div
                    key={msg.id}
                    className={`group flex items-start gap-2 ${isSelf ? 'flex-row-reverse' : ''}`}
                  >
                    <IdentityAvatar
                      iconKey={msg.author_avatar}
                      theme={isSelf ? 'red' : isGhost ? 'orange' : 'yellow'}
                      size="xs"
                    />

                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-xs relative transition-colors ${
                        isMsgHidden
                          ? 'bg-red-950/20 border border-red-900/40 text-red-300'
                          : isSelf
                          ? 'bg-red-950/50 text-zinc-100 border border-red-500/30 shadow-sm'
                          : 'bg-white/[0.03] text-zinc-200 border border-white/[0.06]'
                      }`}
                    >
                      {/* Alias & Timestamp */}
                      <div
                        className={`flex items-center gap-1.5 text-[10px] mb-1 font-mono ${
                          isSelf ? 'text-red-300' : 'text-zinc-500'
                        }`}
                      >
                        <span className="font-semibold text-zinc-300 truncate max-w-[120px]">
                          {msg.author_alias}
                        </span>
                        <span>•</span>
                        <span className="tabular-nums">
                          {new Date(msg.created_at).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Content */}
                      {isMsgHidden ? (
                        <div className="flex items-center justify-between gap-2 text-[11px] text-red-300">
                          <span>[ข้อความถูกซ่อนเนื่องจากถูกรายงาน 5 ครั้ง]</span>
                          <button
                            onClick={() => toggleRevealHidden(msg.id)}
                            className="p-0.5 hover:bg-white/[0.06] rounded"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="break-words leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      )}

                      {/* Report Button on Hover */}
                      {!isSelf && (
                        <div className="absolute top-1 -right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setReportTarget(msg)}
                            className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors"
                            title="รายงานข้อความนี้"
                          >
                            <Flag size={11} />
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

          {/* Input Form with Red/Orange Submit and Orange Cooldown */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 bg-black/50 border-t border-white/[0.06] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                cooldown > 0
                  ? `หน่วงเวลาป้องกันสแปม: รออีก ${cooldown}s...`
                  : isGhost
                  ? 'พิมพ์ข้อความในห้องระเหย (ทำลายเมื่อทุกคนออก)...'
                  : 'พิมพ์ข้อความแบบนิรนาม...'
              }
              disabled={cooldown > 0 || isSending}
              maxLength={500}
              className="flex-1 bg-white/[0.03] border border-white/[0.08] focus:border-red-500 rounded-md px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50 transition-colors font-sans"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || cooldown > 0 || isSending}
              className={`btn-primary !py-1.5 !px-3 text-xs shrink-0 ${
                isGhost ? '!bg-orange-600 hover:!bg-orange-500' : ''
              }`}
            >
              <Send size={12} />
              <span>ส่ง</span>
            </button>
          </form>
        </>
      )}

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
