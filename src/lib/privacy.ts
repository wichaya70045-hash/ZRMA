// Privacy & Anonymity Engine
// Zero logs, zero tracking, ephemeral sessionStorage-scoped identities
// Allows randomized aliases or user-customized nicknames per session

export interface AnonymousIdentity {
  alias: string;
  avatarIcon: string;
  color: string;
}

const ALIAS_PREFIXES = [
  'ผู้ไม่ประสงค์ออกนาม',
  'เงาไร้ตัวตน',
  'เหยี่ยวราตรี',
  'สายนทีลึกลับ',
  'นักท่องราตรี',
  'นักรหัสลับ',
  'แมวส้มหลงทาง',
  'อินทรีซุ่มเงียบ',
  'สายลมแปรปรวน',
  'ดาวตกไร้ทิศ',
  'สหายไร้ชื่อ',
  'นักปราชญ์พรางตัว',
  'หิ่งห้อยส่องทาง',
  'กิ้งก่าพรางกาย',
  'สิงโตเงาจันทร์',
  'หมอกยามเช้า',
  'นักดำน้ำนิรนาม',
  'ก้อนเมฆลอยละล่อง',
  'จิ้งจอกสายฟ้า',
  'ใบไม้ต้องสายลม',
];

export const AVATAR_ICON_KEYS = [
  'shield',
  'terminal',
  'cpu',
  'radar',
  'key',
  'lock',
  'fingerprint',
  'eye-off',
  'binary',
  'globe',
];

export const IDENTITY_THEMES = [
  { name: 'red', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  { name: 'yellow', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  { name: 'orange', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  { name: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  { name: 'zinc', bg: 'bg-white/[0.04]', text: 'text-zinc-300', border: 'border-white/[0.08]' },
];

export function generateRandomIdentity(): AnonymousIdentity {
  const prefix = ALIAS_PREFIXES[Math.floor(Math.random() * ALIAS_PREFIXES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  const icon = AVATAR_ICON_KEYS[Math.floor(Math.random() * AVATAR_ICON_KEYS.length)];
  const theme = IDENTITY_THEMES[Math.floor(Math.random() * IDENTITY_THEMES.length)];

  return {
    alias: `${prefix} #${num}`,
    avatarIcon: icon,
    color: theme.name,
  };
}

export function getScopedIdentity(scopeKey: string): AnonymousIdentity {
  if (typeof window === 'undefined') {
    return generateRandomIdentity();
  }

  const storageKey = `zrma_v4_anon_${scopeKey}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (parsed.alias) {
        return {
          alias: parsed.alias,
          avatarIcon: parsed.avatarIcon || 'shield',
          color: parsed.color || 'red',
        };
      }
    } catch {
      // ignore
    }
  }

  const newIdentity = generateRandomIdentity();
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(newIdentity));
  } catch {
    // ignore
  }
  return newIdentity;
}

export function setCustomScopedIdentity(
  scopeKey: string,
  customAlias: string,
  avatarIcon?: string
): AnonymousIdentity {
  if (typeof window === 'undefined') {
    return generateRandomIdentity();
  }

  const storageKey = `zrma_v4_anon_${scopeKey}`;
  const cleanAlias = customAlias.trim();
  const existing = getScopedIdentity(scopeKey);

  const updated: AnonymousIdentity = {
    alias: cleanAlias || existing.alias,
    avatarIcon: avatarIcon || existing.avatarIcon || 'shield',
    color: existing.color || 'red',
  };

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function rerollScopedIdentity(scopeKey: string): AnonymousIdentity {
  if (typeof window === 'undefined') {
    return generateRandomIdentity();
  }
  const storageKey = `zrma_v4_anon_${scopeKey}`;
  const newIdentity = generateRandomIdentity();
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(newIdentity));
  } catch {
    // ignore
  }
  return newIdentity;
}

// ----------------------------------------------------
// Thread Ownership & Edit Token Management (Browser-only, Zero-Log)
// ----------------------------------------------------

export function saveAuthoredThread(threadId: string, editToken: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('zrma_authored_threads') || '{}';
    const parsed = JSON.parse(raw);
    parsed[threadId] = editToken;
    localStorage.setItem('zrma_authored_threads', JSON.stringify(parsed));
  } catch {}
}

export function getAuthoredThreadToken(threadId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('zrma_authored_threads');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed[threadId] || null;
  } catch {
    return null;
  }
}

export function isThreadAuthor(threadId: string): boolean {
  return !!getAuthoredThreadToken(threadId);
}

export function removeAuthoredThread(threadId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('zrma_authored_threads');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    delete parsed[threadId];
    localStorage.setItem('zrma_authored_threads', JSON.stringify(parsed));
  } catch {}
}

// ----------------------------------------------------
// Chat Message Ownership & Edit Token Management (Session-scoped, Zero-Log)
// ----------------------------------------------------

export function saveAuthoredChatMessage(msgId: string, editToken: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem('zrma_authored_chat_msgs') || '{}';
    const parsed = JSON.parse(raw);
    parsed[msgId] = editToken;
    sessionStorage.setItem('zrma_authored_chat_msgs', JSON.stringify(parsed));
  } catch {}
}

export function getAuthoredChatMessageToken(msgId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('zrma_authored_chat_msgs');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed[msgId] || null;
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// Community Poll Voting Tracking (Local Device, Zero-Log)
// ----------------------------------------------------

export function getVotedPollOption(threadId: string): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(`zrma_poll_${threadId}`);
    return val ? parseInt(val, 10) : null;
  } catch {
    return null;
  }
}

export function setVotedPollOption(threadId: string, optionId: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`zrma_poll_${threadId}`, String(optionId));
  } catch {
    // ignore
  }
}
