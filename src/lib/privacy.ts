// Privacy & Anonymity Helpers

export interface AnonymousIdentity {
  alias: string;
  avatar: string;
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
  'ใบไม้ต้องสายลม'
];

const AVATAR_COLORS = [
  { name: 'emerald', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  { name: 'cyan', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40' },
  { name: 'violet', bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/40' },
  { name: 'amber', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  { name: 'rose', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40' },
  { name: 'fuchsia', bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400', border: 'border-fuchsia-500/40' },
  { name: 'teal', bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/40' },
  { name: 'sky', bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/40' },
];

export function generateRandomIdentity(): AnonymousIdentity {
  const prefix = ALIAS_PREFIXES[Math.floor(Math.random() * ALIAS_PREFIXES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  const colorIndex = Math.floor(Math.random() * AVATAR_COLORS.length);
  const color = AVATAR_COLORS[colorIndex].name;
  
  // Choose avatar emoji / badge
  const icons = ['🥷', '🦊', '🦉', '🐱', '🕶️', '⚡', '🌙', '🌊', '🍃', '🔥', '🛡️', '🎲'];
  const avatar = icons[Math.floor(Math.random() * icons.length)];

  return {
    alias: `${prefix} #${num}`,
    avatar,
    color,
  };
}

/**
 * Gets or creates an ephemeral identity specifically scoped to a thread or room.
 * Stored exclusively in sessionStorage so it resets when browser closes,
 * and different threads have DIFFERENT identities to prevent cross-correlation.
 */
export function getScopedIdentity(scopeKey: string): AnonymousIdentity {
  if (typeof window === 'undefined') {
    return generateRandomIdentity();
  }

  const storageKey = `zrma_anon_${scopeKey}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      // ignore
    }
  }

  const newIdentity = generateRandomIdentity();
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(newIdentity));
  } catch {
    // sessionStorage might be disabled in private mode
  }
  return newIdentity;
}

export function rerollScopedIdentity(scopeKey: string): AnonymousIdentity {
  if (typeof window === 'undefined') {
    return generateRandomIdentity();
  }
  const storageKey = `zrma_anon_${scopeKey}`;
  const newIdentity = generateRandomIdentity();
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(newIdentity));
  } catch {
    // ignore
  }
  return newIdentity;
}

export function getAvatarColorClasses(colorName: string) {
  const match = AVATAR_COLORS.find(c => c.name === colorName);
  return match || AVATAR_COLORS[0];
}
