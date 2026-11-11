'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';
import {
  getScopedIdentity,
  rerollScopedIdentity,
  setCustomScopedIdentity,
  saveAuthoredChatMessage,
  getAuthoredChatMessageToken,
  AnonymousIdentity,
} from '@/lib/privacy';
import { useSettings } from '@/lib/settings';
import { useAuth } from '@/lib/authContext';
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
  Volume2,
} from 'lucide-react';
import IdentityAvatar, { NAME_COLOR_CLASSES } from './IdentityAvatar';
import ReportModal from './ReportModal';
import Link from 'next/link';

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
  const { settings, playChatChime } = useSettings();
  const { user } = useAuth();
  const [postAnonymously, setPostAnonymously] = useState(false);
  const usingAccount = Boolean(user && !postAnonymously);
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

  // Message Editing State
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgText, setEditingMsgText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Ghost Room Presence & Destruction
  const [ghostPresenceCount, setGhostPresenceCount] = useState<number>(1);
  const [isRoomDestroyed, setIsRoomDestroyed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const identityRef = useRef<AnonymousIdentity | null>(null);
  const customAliasRef = useRef<string>('');

  useEffect(() => {
    identityRef.current = identity;
  }, [identity]);

  useEffect(() => {
    customAliasRef.current = customAlias;
  }, [customAlias]);

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

        // Play chime if message came from another user
        const currentEffectiveAlias = customAliasRef.current.trim() || identityRef.current?.alias;
        if (newMsg.author_alias !== currentEffectiveAlias) {
          playChatChime();
        }
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

    eventSource.addEventListener('chat_edited', (event) => {
      try {
        const editedMsg: ChatMessage = JSON.parse(event.data);
        setMessages((prev) =>
          prev.map((m) => (m.id === editedMsg.id ? { ...m, ...editedMsg } : m))
        );
      } catch (err) {
        console.error('Error parsing chat_edited event:', err);
      }
    });

    eventSource.addEventListener('chat_deleted', (event) => {
      try {
        const { id } = JSON.parse(event.data);
        setMessages((prev) => prev.filter((m) => m.id !== id));
      } catch (err) {
        console.error('Error parsing chat_deleted event:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [roomId]);

  useEffect(() => {
    if (settings.autoScrollChat) {
      messagesEndRef.current?.scrollIntoView({
        behavior: settings.reduceMotion ? 'auto' : 'smooth',
      });
    }
  }, [messages, settings.autoScrollChat, settings.reduceMotion]);

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
          post_anonymously: postAnonymously,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.message && data.edit_token) {
          saveAuthoredChatMessage(data.message.id, data.edit_token);
        }
        setInputText('');
        setCooldown(3);
        if (settings.strictZeroTrace) {
          handleRerollIdentity();
        }
      } else {
        alert(data.error || 'ไม่สามารถส่งข้อความได้');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveEditMessage = async (msgId: string) => {
    if (!editingMsgText.trim() || isSavingEdit) return;
    setIsSavingEdit(true);

    const token = getAuthoredChatMessageToken(msgId) || undefined;
    const effectiveAlias = customAlias.trim() || identity?.alias;

    try {
      const res = await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: msgId,
          room_id: roomId,
          content: editingMsgText.trim(),
          author_alias: effectiveAlias,
          edit_token: token,
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, ...data.message } : m))
        );
        setEditingMsgId(null);
        setEditingMsgText('');
      } else {
        alert(data.error || 'ไม่สามารถแก้ไขข้อความได้');
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSavingEdit(false);
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
      className={`rounded-2xl flex flex-col h-full w-full max-w-full overflow-hidden shadow-sm dark:shadow-xl border transition-colors ${
        isGhost
          ? 'bg-orange-50/40 dark:bg-[#0d0f14] border-orange-300 dark:border-orange-500/50 dark:shadow-orange-950/20'
          : 'bg-white dark:bg-[#0e1015]/95 border-zinc-200 dark:border-white/[0.08] backdrop-blur-md'
      }`}
    >
      {/* Ghost Room Warning Banner */}
      {isGhost && (
        <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-500/30 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-red-700 dark:text-red-300">
              <Ghost size={13} className="text-red-600 dark:text-red-400 shrink-0" />
              <strong className="text-red-700 dark:text-red-300 uppercase tracking-wide">ห้องหายไปเมื่อไม่มีคน:</strong>
              <span className="text-zinc-600 dark:text-zinc-400 hidden sm:inline">ข้อความจะสลายตัวทันทีเมื่อทุกคนออก</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <div className="flex items-center gap-1 font-mono text-[11px] text-amber-700 dark:text-yellow-400 bg-amber-100 dark:bg-yellow-400/10 px-2 py-0.5 rounded border border-amber-300 dark:border-yellow-400/25">
              <Users size={11} />
              <span>{ghostPresenceCount} คนในห้อง</span>
            </div>

            {onLeaveGhostRoom && (
              <button
                onClick={handleLeaveAndDestroy}
                className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-red-100 dark:hover:bg-white/[0.04] transition-colors"
                title="ออกจากห้องนี้"
              >
                <LogOut size={11} />
                <span>ออกจากห้อง</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modern Terminal Header */}
      <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-zinc-50/90 dark:bg-black/60 backdrop-blur-sm border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              settings.reduceMotion ? '' : 'animate-pulse'
            } ${isGhost ? 'bg-orange-500' : 'bg-emerald-500 dark:bg-green-500'}`}
          />
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate">
              {isGhost && <Ghost size={13} className="text-orange-600 dark:text-orange-400 shrink-0" />}
              <span>{title}</span>
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 tabular-nums">
              <span className="text-emerald-600 dark:text-green-400 font-semibold">● LIVE</span>
              <span>•</span>
              <span>{messages.length} ข้อความ</span>
            </div>
          </div>
        </div>

        {/* Identity with Account / Anonymous Mode Toggle */}
        {usingAccount && user ? (
          <div className="flex items-center gap-2 bg-white dark:bg-[#141721] border border-zinc-200 dark:border-white/[0.08] px-2 py-1 rounded-xl text-xs shrink-0 shadow-sm">
            <IdentityAvatar
              iconKey={user.avatar_icon}
              avatarUrl={user.avatar_url}
              frame={user.avatar_frame}
              theme={user.avatar_frame !== 'none' ? 'amber' : 'zinc'}
              size="xs"
            />
            <span className={`text-[11px] font-semibold truncate max-w-[95px] sm:max-w-[130px] ${NAME_COLOR_CLASSES[user.name_color]}`}>
              {user.display_name}
            </span>
            <button
              type="button"
              onClick={() => setPostAnonymously(true)}
              className="p-1 text-zinc-400 hover:text-amber-600 dark:hover:text-yellow-400 rounded transition-colors"
              title="สลับเป็นโหมดไม่ระบุตัวตนชั่วคราว (Guest Mode)"
            >
              <EyeOff size={12} />
            </button>
          </div>
        ) : identity && (
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#141721] border border-zinc-200 dark:border-white/[0.08] px-2 py-1 rounded-xl text-xs shrink-0 shadow-sm">
            {user && postAnonymously && (
              <button
                type="button"
                onClick={() => setPostAnonymously(false)}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 shrink-0"
                title="กลับไปใช้บัญชีของคุณ"
              >
                ใช้บัญชี
              </button>
            )}
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
                  className="w-20 bg-zinc-50 dark:bg-black/60 border border-amber-500 dark:border-yellow-400 rounded px-1.5 py-0.5 text-[11px] text-amber-700 dark:text-yellow-400 font-mono focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveAlias}
                  className="p-0.5 text-amber-600 dark:text-yellow-400 hover:text-zinc-900 dark:hover:text-white"
                  title="บันทึกชื่อ"
                >
                  <Check size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span
                  onClick={() => setIsEditingAlias(true)}
                  className="text-zinc-800 dark:text-zinc-200 text-[11px] font-mono font-medium truncate max-w-[85px] sm:max-w-[120px] cursor-pointer hover:text-amber-600 dark:hover:text-yellow-400 transition-colors"
                  title="คลิกเพื่อแก้ไขชื่อ"
                >
                  {effectiveAlias}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingAlias(true)}
                  className="p-0.5 text-zinc-400 dark:text-zinc-500 hover:text-amber-600 dark:hover:text-yellow-400 transition-colors"
                  title="แก้ไขชื่อตัวเอง"
                >
                  <Edit2 size={10} />
                </button>
              </div>
            )}

            <button
              onClick={handleRerollIdentity}
              className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-yellow-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors active:scale-95 ml-0.5"
              title="สุ่มชื่อใหม่"
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
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 flex items-center justify-center">
            <Ghost size={26} />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            ห้องสนทนานี้สลายตัวแล้ว (Room Vaporized)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
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
          {/* Message Feed: Spacious, eye-friendly layout for mobile */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-[380px] max-h-[calc(100dvh-260px)] sm:max-h-[520px] scroll-smooth bg-zinc-50/40 dark:bg-transparent">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-xs font-mono text-zinc-500">
                CONNECTING STREAM...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-zinc-500">
                {isGhost ? (
                  <>
                    <Ghost size={32} className="text-orange-500 dark:text-orange-400 mb-1 animate-pulse" />
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">ห้องสนทนาชั่วคราวเริ่มต้นแล้ว</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                      พิมพ์ข้อความเพื่อเริ่มคุย ข้อมูลทั้งหมดจะถูกลบทำลายทันทีเมื่อทุกคนออกจากห้อง
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-center mx-auto text-zinc-400">
                      <Radio size={20} className="text-amber-600 dark:text-yellow-400" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">ยังไม่มีข้อความในห้องนี้</p>
                    <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                      เริ่มบทสนทนาแบบนิรนาม 100% ไม่เก็บประวัติส่วนบุคคลใดๆ
                    </p>
                  </>
                )}
              </div>
            ) : (
              messages.map((msg) => {
                const isSelf = Boolean(
                  (user && msg.author_user_id && msg.author_user_id === user.id) ||
                    (!usingAccount && effectiveAlias === msg.author_alias)
                );
                const isMsgHidden = msg.is_hidden === 1 && !revealedIds[msg.id];

                return (
                  <div
                    key={msg.id}
                    className={`group flex items-start gap-2.5 ${isSelf ? 'flex-row-reverse' : ''}`}
                  >
                    <IdentityAvatar
                      iconKey={msg.author_avatar}
                      avatarUrl={msg.author_avatar_url}
                      frame={msg.author_frame}
                      theme={isSelf ? 'red' : isGhost ? 'orange' : 'yellow'}
                      size="xs"
                    />

                    <div
                      className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs relative transition-all shadow-sm ${
                        isMsgHidden
                          ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300'
                          : isSelf
                          ? 'bg-gradient-to-br from-red-600 to-red-700 dark:from-red-950/80 dark:via-red-900/60 dark:to-red-950/70 text-white border border-red-500/60 dark:border-red-500/40 rounded-tr-xs'
                          : 'bg-white dark:bg-[#131620] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/[0.08] rounded-tl-xs hover:border-zinc-300 dark:hover:border-white/[0.14]'
                      }`}
                    >
                      {/* Alias & Timestamp Header */}
                      <div
                        className={`flex items-center justify-between gap-2 text-[10.5px] mb-1 font-mono ${
                          isSelf ? 'text-red-100 dark:text-red-300' : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5 min-w-0">
                          {msg.author_username ? (
                            <Link
                              href={`/u/${encodeURIComponent(msg.author_username)}`}
                              className={`font-semibold truncate max-w-[130px] sm:max-w-[160px] hover:underline ${
                                isSelf ? 'text-white' : (msg.author_name_color ? NAME_COLOR_CLASSES[msg.author_name_color] : 'text-zinc-800 dark:text-zinc-200')
                              }`}
                            >
                              {isSelf ? `u/${msg.author_alias} (คุณ)` : `u/${msg.author_alias}`}
                            </Link>
                          ) : (
                            <span className={`font-semibold truncate max-w-[130px] sm:max-w-[160px] ${isSelf ? 'text-white' : 'text-zinc-800 dark:text-zinc-200'}`}>
                              {isSelf ? `u/${msg.author_alias} (คุณ)` : `u/${msg.author_alias}`}
                            </span>
                          )}
                          {msg.author_badge && (
                            <span className="px-1 py-0.2 rounded bg-amber-400/20 text-[9px] font-bold text-amber-200 dark:text-amber-300 leading-none shrink-0">
                              {msg.author_badge}
                            </span>
                          )}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`tabular-nums ${isSelf ? 'text-red-100/80 dark:text-zinc-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {msg.is_edited === 1 && (
                            <span className={`text-[9.5px] font-mono italic ${isSelf ? 'text-red-100/80' : 'text-zinc-500'}`}>
                              (แก้ไขแล้ว)
                            </span>
                          )}

                          {isSelf && editingMsgId !== msg.id && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMsgId(msg.id);
                                setEditingMsgText(msg.content);
                              }}
                              className="text-red-100 dark:text-zinc-500 hover:text-yellow-300 dark:hover:text-yellow-400 p-0.5 rounded transition-colors ml-0.5"
                              title="แก้ไขข้อความ"
                            >
                              <Edit2 size={10} />
                            </button>
                          )}

                          {/* Mobile-friendly Report Button (No hover required on touch) */}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => setReportTarget(msg)}
                              className="text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 p-0.5 rounded transition-colors ml-0.5"
                              title="รายงานข้อความนี้"
                              aria-label="Report message"
                            >
                              <Flag size={10} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Message Content: Clean typography, comfortable line spacing for Thai text */}
                      {isMsgHidden ? (
                        <div className="flex items-center justify-between gap-2 text-[11px] text-red-700 dark:text-red-300 pt-0.5">
                          <span>[ข้อความถูกซ่อนเนื่องจากถูกรายงาน 5 ครั้ง]</span>
                          <button
                            onClick={() => toggleRevealHidden(msg.id)}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-white/[0.06] rounded text-zinc-700 dark:text-zinc-200 transition-colors"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      ) : editingMsgId === msg.id ? (
                        <div className="pt-1 space-y-1.5">
                          <input
                            type="text"
                            value={editingMsgText}
                            onChange={(e) => setEditingMsgText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditMessage(msg.id);
                              if (e.key === 'Escape') setEditingMsgId(null);
                            }}
                            maxLength={500}
                            className="w-full bg-white dark:bg-black/60 border border-amber-500 dark:border-yellow-400 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-white focus:outline-none font-sans"
                            autoFocus
                          />
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingMsgId(null)}
                              className="text-[10px] text-white/80 dark:text-zinc-400 hover:text-white px-2 py-0.5 rounded border border-white/25 dark:border-white/[0.1] hover:bg-white/10 dark:hover:bg-white/[0.04]"
                            >
                              ยกเลิก
                            </button>
                            <button
                              type="button"
                              disabled={isSavingEdit || !editingMsgText.trim()}
                              onClick={() => handleSaveEditMessage(msg.id)}
                              className="text-[10px] bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-bold px-2.5 py-0.5 rounded transition-colors disabled:opacity-50"
                            >
                              {isSavingEdit ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`break-words leading-relaxed whitespace-pre-wrap text-[13.5px] sm:text-xs font-sans ${isSelf ? 'text-white' : 'text-zinc-800 dark:text-zinc-100'}`}>
                          {msg.content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form: Mobile Ergonomic Touch Targets */}
          <form
            onSubmit={handleSendMessage}
            className="p-2 sm:p-2.5 bg-zinc-50/95 dark:bg-[#0d0f14]/95 backdrop-blur-md border-t border-zinc-200 dark:border-white/[0.08] flex items-center gap-2 sticky bottom-0 z-10"
          >
            {/* Quick 1-tap Identity Reroll on Mobile */}
            <button
              type="button"
              onClick={handleRerollIdentity}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-yellow-400 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] rounded-xl border border-zinc-200 dark:border-white/[0.08] transition-colors shrink-0 active:scale-95"
              title="สุ่มชื่อและตัวตนใหม่ทันที"
              aria-label="Reroll identity"
            >
              <Dices size={16} />
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    if (settings.enterToSend) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }
                }}
                placeholder={
                  cooldown > 0
                    ? `หน่วงเวลา: รออีก ${cooldown}s...`
                    : isGhost
                    ? 'พิมพ์ในห้องระเหย (ทำลายเมื่อทุกคนออก)...'
                    : 'พิมพ์ข้อความแบบนิรนาม...'
                }
                disabled={cooldown > 0 || isSending}
                maxLength={500}
                className="w-full bg-white dark:bg-[#141721] border border-zinc-300 dark:border-white/[0.1] focus:border-red-500 rounded-xl px-3.5 py-2 text-sm sm:text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50 transition-colors font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || cooldown > 0 || isSending}
              className={`h-9 px-3.5 sm:px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-md active:scale-95 ${
                isGhost
                  ? 'bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold disabled:opacity-40'
                  : 'bg-red-600 hover:bg-red-500 text-white disabled:opacity-40'
              }`}
            >
              <Send size={13} />
              <span className="hidden sm:inline">ส่ง</span>
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
