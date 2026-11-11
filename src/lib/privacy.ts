// Privacy & Anonymity Engine
// Zero logs, zero tracking, ephemeral sessionStorage-scoped identities
// Allows randomized aliases or user-customized nicknames per session

export interface AnonymousIdentity {
  alias: string;
  avatarIcon: string;
  color: string;
}

// ----------------------------------------------------
// Word Sets for Combinatory Alias Synthesis
// เซ็ตของคำสำหรับนำมาสุ่มผสมรวมกันเพื่อสร้างชื่อปลอม/นามแฝงได้หลากหลายนับล้านแบบ
// ----------------------------------------------------

export const ALIAS_SUBJECTS = [
  // สัตว์ & สิ่งมีชีวิต
  'แมวส้ม', 'แมวสามสี', 'หมาป่า', 'จิ้งจอก', 'เป็ดเหลือง', 'นกฮูก', 'คาปิบารา', 'แพนด้า',
  'สิงโต', 'เสือดำ', 'ปลาวาฬ', 'นากทะเล', 'โลมา', 'กระต่าย', 'ชิบะ', 'กิ้งก่า',
  'หิ่งห้อย', 'ไดโนเสาร์', 'เพนกวิน', 'สลอธ', 'นกกระจอก', 'อินทรี', 'หมีขาว', 'หมึกยักษ์',
  'มังกร', 'กริฟฟิน', 'ฟีนิกซ์', 'แรคคูน', 'บีเวอร์', 'กระรอก', 'เต่าตนุ', 'กบเขียว',
  'ปลาทอง', 'แมงกะพรุน', 'ตัวตุ่น', 'แฮมสเตอร์', 'ม้าป่า', 'ฟลามิงโก', 'เหยี่ยวราตรี', 'ค้างคาว',
  'กวางดาว', 'หมีกริซลีย์', 'ช้างพลาย', 'ฉลามวาฬ', 'ปิรันย่า', 'จิ้งหรีด', 'อีกา', 'ปลาคาร์ป',
  // สายไอที / ชุมชน / อาชีพ / ตัวละคร
  'นักสืบ', 'แฮกเกอร์', 'โปรแกรมเมอร์', 'สายลับ', 'จอมยุทธ์', 'นักทดลอง', 'ผู้พิทักษ์', 'พ่อมด',
  'นักท่องเวลา', 'ชาวเน็ต', 'ตัวตึง', 'เด็กฝึกงาน', 'ฟรีแลนซ์', 'นักเขียนโค้ด', 'นักล่าบั๊ก',
  'ซามูไร', 'นินจา', 'อัศวิน', 'สายปั่น', 'สตรีมเมอร์', 'เกมเมอร์', 'ดีไซเนอร์', 'แอดมิน',
  'ไรเดอร์', 'คนขับยาน', 'นักสำรวจ', 'จอมเวท', 'ช่างซ่อมคอม', 'สายโค้ด', 'นักดนตรีจร', 'หน่วยซุ่ม', 'เซียนกราฟิก'
];

export const ALIAS_ADJECTIVES = [
  'นอนน้อย', 'ซุ่มเงียบ', 'บินเดี่ยว', 'คลั่งโค้ด', 'สายชิล', 'ตาค้าง', 'ติดสปีด', 'ล่องหน',
  'ไร้ตัวตน', 'ท่องราตรี', 'เรืองแสง', 'ขี้เซา', 'รักอิสระ', 'สายเปย์', 'จอมป่วน', 'สู้ชีวิต',
  'ผู้ตื่นรู้', 'กาแฟเข้ม', 'ช่างสงสัย', 'รักสงบ', 'หลบมุม', 'กวนโอ๊ย', 'ใจฟู', 'สายบวก',
  'หัวจะปวด', 'มือฉมัง', 'ฟอร์มจัด', 'แก้บั๊กไว', 'พเนจร', 'สดใส', 'สายดึก', 'เทอร์โบ',
  'ขาจร', 'ติดแกลม', 'แอบมอง', 'ใจบาง', 'ชอบปั่น', 'ไม่หลับไม่นอน', 'ตาสว่าง', 'หลุดโลก',
  'สายเทค', 'ไฟแรง', 'พลังงานสูง', 'ใจเย็น', 'สายลุย', 'พูดน้อย', 'เน็ตหลุด', 'บั๊กเยอะ',
  'ร่างทอง', 'สายหวาน', 'หน้าตาย', 'รักความสงบ', 'บ้าพลัง', 'กินจุ', 'สายมู', 'จอมขยัน',
  'สายเงียบ', 'สุดปัง', 'ไม่สนโลก', 'หลงทาง', 'ตาหวาน', 'สายซัพ'
];

export const ALIAS_EPITHETS = [
  'แห่งรัตติกาล', 'ในเงามืด', 'แดนไซเบอร์', 'ประจำซอย', 'ไร้ร่องรอย', 'ยุคดิจิทัล', 'ใต้แสงจันทร์',
  'จากดาวอังคาร', 'ในมิติที่สี่', 'ประจำตึก', 'แดนลับแล', 'ไร้พิกัด', 'แห่งสายลม', 'บนก้อนเมฆ',
  'แห่งขุนเขา', 'ใต้ทะเลลึก', 'ห้องเซิร์ฟเวอร์', 'ร้านกาแฟ', 'กะดึก', 'ระดับตำนาน', 'ผู้ไร้พ่าย',
  'ฉบับปรับปรุง', 'เวอร์ชันเบต้า', 'สายฟ้าแลบ', 'แดนสยาม', 'ก้นครัว', 'แห่งอนาคต', 'แดนสนธยา',
  'เมืองหลวง', 'ริมระเบียง', 'แถวหลัง', 'ห้องใต้หลังคา', 'แห่งจักรวาล', 'จากต่างมิติ', 'สายใยแก้ว',
  'ขอบจักรวาล', 'แดนทวยเทพ'
];

export const ALIAS_PREFIXES = [
  'ยอด', 'จอม', 'เจ้า', 'คุณ', 'สหาย', 'กัปตัน', 'เซียน', 'ท่าน', 'หัวหน้า', 'บอส',
  'ลุง', 'พี่', 'น้อง', 'หมอ', 'อาจารย์', 'ปรมาจารย์', 'น้า', 'ช่าง', 'โปร', 'จอมราชันย์'
];

/**
 * สร้างชื่อสุ่ม (Random Alias) โดยนำเซ็ตของคำมารวมกันได้หลากหลายรูปแบบนับล้านชื่อ
 */
export function generateRandomAlias(): string {
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const style = Math.random();
  let baseName = '';

  if (style < 0.35) {
    // Style 1 (35%): [Subject] + [Adjective] (เช่น แมวส้มนอนน้อย, คาปิบาราสายชิล)
    baseName = `${pick(ALIAS_SUBJECTS)}${pick(ALIAS_ADJECTIVES)}`;
  } else if (style < 0.65) {
    // Style 2 (30%): [Subject] + [Adjective] + [Epithet] (เช่น แมวส้มนอนน้อยแห่งรัตติกาล, หมาป่าบินเดี่ยวใต้แสงจันทร์)
    baseName = `${pick(ALIAS_SUBJECTS)}${pick(ALIAS_ADJECTIVES)}${pick(ALIAS_EPITHETS)}`;
  } else if (style < 0.85) {
    // Style 3 (20%): [Prefix] + [Subject] + [Adjective] (เช่น ยอดนักสืบซุ่มเงียบ, เจ้าแมวส้มจอมป่วน)
    baseName = `${pick(ALIAS_PREFIXES)}${pick(ALIAS_SUBJECTS)}${pick(ALIAS_ADJECTIVES)}`;
  } else {
    // Style 4 (15%): [Prefix] + [Subject] + [Epithet] (เช่น กัปตันเป็ดเหลืองแดนไซเบอร์, ยอดนกฮูกแห่งรัตติกาล)
    baseName = `${pick(ALIAS_PREFIXES)}${pick(ALIAS_SUBJECTS)}${pick(ALIAS_EPITHETS)}`;
  }

  const num = Math.floor(100 + Math.random() * 900);
  return `${baseName} #${num}`;
}

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
  const alias = generateRandomAlias();
  const icon = AVATAR_ICON_KEYS[Math.floor(Math.random() * AVATAR_ICON_KEYS.length)];
  const theme = IDENTITY_THEMES[Math.floor(Math.random() * IDENTITY_THEMES.length)];

  return {
    alias,
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
