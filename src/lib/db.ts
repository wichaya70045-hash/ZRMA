import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import {
  Thread,
  Comment,
  CommentNode,
  ChatMessage,
  Category,
  RedditSort,
  Community,
  MediaType,
  GhostRoom,
  PollData,
  PollOption,
  JobData,
  JobApplication,
  JobType,
  JobStatus,
  JobWorkMode,
  TickerItem,
  UserProfile,
  AvatarFrame,
  BannerTheme,
  NameColor,
} from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'privacy_board.sqlite');

declare global {
  // eslint-disable-next-line no-var
  var __privacyDb: DatabaseSync | undefined;
  // eslint-disable-next-line no-var
  var __dbInitialized: boolean | undefined;
}

export function getDatabase(): DatabaseSync {
  if (global.__privacyDb) {
    return global.__privacyDb;
  }

  const db = new DatabaseSync(DB_PATH);
  
  db.exec('PRAGMA busy_timeout = 5000;');
  try {
    db.exec('PRAGMA journal_mode = WAL;');
  } catch {
    // ignore
  }
  db.exec('PRAGMA foreign_keys = ON;');

  if (!global.__dbInitialized) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS communities (
        name TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT DEFAULT 'terminal',
        post_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        flair TEXT,
        source_url TEXT,
        media_url TEXT,
        media_type TEXT,
        author_alias TEXT NOT NULL,
        author_avatar TEXT NOT NULL,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        report_count INTEGER DEFAULT 0,
        is_hidden INTEGER DEFAULT 0,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_threads_expires ON threads(expires_at);
      CREATE INDEX IF NOT EXISTS idx_threads_category ON threads(category);
      CREATE INDEX IF NOT EXISTS idx_threads_created ON threads(created_at DESC);

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL,
        parent_id TEXT,
        quote_text TEXT,
        quote_author TEXT,
        content TEXT NOT NULL,
        media_url TEXT,
        author_alias TEXT NOT NULL,
        author_avatar TEXT NOT NULL,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        report_count INTEGER DEFAULT 0,
        is_hidden INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_comments_thread ON comments(thread_id);
      CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at ASC);

      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL DEFAULT 'global',
        content TEXT NOT NULL,
        author_alias TEXT NOT NULL,
        author_avatar TEXT NOT NULL,
        report_count INTEGER DEFAULT 0,
        is_hidden INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_chat_room ON chat_messages(room_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ghost_rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        topic TEXT,
        creator_alias TEXT NOT NULL,
        active_users INTEGER DEFAULT 1,
        last_active_at TEXT NOT NULL,
        is_destroyed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_ghost_rooms ON ghost_rooms(is_destroyed, last_active_at DESC);

      CREATE TABLE IF NOT EXISTS used_captchas (
        token_hash TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_used_captchas_exp ON used_captchas(expires_at);

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        bio TEXT DEFAULT '',
        avatar_icon TEXT DEFAULT 'shield',
        avatar_url TEXT,
        avatar_frame TEXT DEFAULT 'none',
        banner_theme TEXT DEFAULT 'obsidian',
        name_color TEXT DEFAULT 'default',
        custom_badge TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Migrations for columns in existing databases
    try { db.exec('ALTER TABLE threads ADD COLUMN flair TEXT;'); } catch {}
    try { db.exec('ALTER TABLE threads ADD COLUMN media_url TEXT;'); } catch {}
    try { db.exec('ALTER TABLE threads ADD COLUMN media_type TEXT;'); } catch {}
    try { db.exec('ALTER TABLE threads ADD COLUMN is_pinned INTEGER DEFAULT 0;'); } catch {}
    try { db.exec('ALTER TABLE comments ADD COLUMN media_url TEXT;'); } catch {}
    try { db.exec("UPDATE threads SET is_pinned = 1 WHERE category = 'breaking' AND id = 'seed-thread-1';"); } catch {}
    try { db.exec("UPDATE communities SET title = REPLACE(title, 'r/', 'z/'), description = REPLACE(description, 'r/', 'z/');"); } catch {}
    try { db.exec("UPDATE threads SET title = REPLACE(title, 'r/', 'z/'), content = REPLACE(content, 'r/', 'z/');"); } catch {}
    try { db.exec('ALTER TABLE threads ADD COLUMN is_edited INTEGER DEFAULT 0;'); } catch {}
    try { db.exec('ALTER TABLE threads ADD COLUMN edited_at TEXT;'); } catch {}
    try { db.exec('ALTER TABLE threads ADD COLUMN edit_token TEXT;'); } catch {}
    try { db.exec('ALTER TABLE threads ADD COLUMN poll_data TEXT;'); } catch {}
    try {
      db.prepare(`
        UPDATE threads
        SET poll_data = ?
        WHERE id = 'seed-thread-2' AND (poll_data IS NULL OR poll_data = '')
      `).run(JSON.stringify({
        question: 'คุณคิดว่าระบบ Zero-Log จำเป็นต่อการใช้อินเทอร์เน็ตในปัจจุบันมากน้อยเพียงใด?',
        options: [
          { id: 1, text: 'จำเป็นอย่างยิ่ง ข้อมูลและ IP ไม่ควรถูกบันทึก', votes: 42 },
          { id: 2, text: 'มีประโยชน์เฉพาะบางกรณีหรือข่าวสารที่อ่อนไหว', votes: 16 },
          { id: 3, text: 'ไม่จำเป็น แพลตฟอร์มทั่วไปก็เพียงพอแล้ว', votes: 3 }
        ],
        total_votes: 61,
        closed: false
      }));
    } catch {}
    try { db.exec('ALTER TABLE chat_messages ADD COLUMN is_edited INTEGER DEFAULT 0;'); } catch {}
    try { db.exec('ALTER TABLE chat_messages ADD COLUMN edited_at TEXT;'); } catch {}
    try { db.exec('ALTER TABLE chat_messages ADD COLUMN edit_token TEXT;'); } catch {}
    try { db.exec('ALTER TABLE threads ADD COLUMN author_user_id TEXT;'); } catch {}
    try { db.exec('ALTER TABLE comments ADD COLUMN author_user_id TEXT;'); } catch {}
    try { db.exec('ALTER TABLE chat_messages ADD COLUMN author_user_id TEXT;'); } catch {}
    try { db.exec('ALTER TABLE threads ADD COLUMN job_data TEXT;'); } catch {}

    // Seed default communities and sample threads if empty
    try {
      seedDefaultCommunities(db);
      const countRow = db.prepare(`SELECT COUNT(*) as count FROM threads`).get() as any;
      if (!countRow || countRow.count === 0) {
        seedInitialData(db);
      }
      seedInitialJobs(db);
    } catch {
      // ignore
    }

    global.__dbInitialized = true;
  }

  global.__privacyDb = db;
  return db;
}

function seedDefaultCommunities(database: DatabaseSync) {
  const defaults = [
    { name: 'breaking', title: 'z/breaking', description: 'ข่าวด่วน เหตุการณ์สำคัญ และสถานการณ์สด', icon: 'radar' },
    { name: 'jobs', title: 'z/jobs', description: 'กระดานจ้างงาน ลงเสนองาน และเสนอตัวรับงานอิสระ', icon: 'briefcase' },
    { name: 'tech', title: 'z/tech', description: 'เทคโนโลยี, AI, ซอฟต์แวร์, และความปลอดภัยไซเบอร์', icon: 'terminal' },
    { name: 'finance', title: 'z/finance', description: 'เศรษฐกิจ, การลงทุน, หุ้น, และคริปโทเคอร์เรนซี', icon: 'cpu' },
    { name: 'society', title: 'z/society', description: 'ประเด็นสังคม กฎหมาย และนโยบายสาธารณะ', icon: 'globe' },
    { name: 'general', title: 'z/general', description: 'แลกเปลี่ยนความคิดเห็นทั่วไป เสวนาเรื่องรอบตัว', icon: 'shield' },
    { name: 'gaming', title: 'z/gaming', description: 'วิดีโอเกม อีสปอร์ต คอนโซล และเกมพีซี', icon: 'key' },
    { name: 'science', title: 'z/science', description: 'วิทยาศาสตร์ นวัตกรรม อวกาศ และธรรมชาติ', icon: 'binary' },
    { name: 'memes', title: 'z/memes', description: 'มีม มุกตลก และเรื่องบันเทิงแบบนิรนาม', icon: 'eye-off' },
  ];

  const now = new Date().toISOString();
  const insert = database.prepare(`
    INSERT OR IGNORE INTO communities (name, title, description, icon, post_count, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `);

  for (const c of defaults) {
    try {
      insert.run(c.name, c.title, c.description, c.icon, now);
    } catch {
      // ignore
    }
  }
}

export function getCommunities(): Community[] {
  const database = getDatabase();
  const rows = database.prepare(`
    SELECT 
      c.name,
      c.title,
      c.description,
      c.icon,
      (SELECT COUNT(*) FROM threads t WHERE t.category = c.name) as post_count,
      c.created_at
    FROM communities c
    ORDER BY post_count DESC, c.created_at ASC
  `).all() as any[];

  return rows.map((r) => ({
    name: r.name,
    title: r.title,
    description: r.description || '',
    icon: r.icon || 'terminal',
    post_count: Number(r.post_count),
    created_at: r.created_at,
  }));
}

export function createOrUpdateCommunity(data: {
  name: string;
  title: string;
  description?: string;
  icon?: string;
}): Community {
  const database = getDatabase();
  const now = new Date().toISOString();

  database.prepare(`
    INSERT INTO communities (name, title, description, icon, post_count, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
    ON CONFLICT(name) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      icon = excluded.icon
  `).run(
    data.name.toLowerCase().trim(),
    data.title.trim(),
    data.description || '',
    data.icon || 'terminal',
    now
  );

  const row = database.prepare(`SELECT * FROM communities WHERE name = ?`).get(data.name.toLowerCase().trim()) as any;
  return {
    name: row.name,
    title: row.title,
    description: row.description || '',
    icon: row.icon || 'terminal',
    post_count: Number(row.post_count || 0),
    created_at: row.created_at,
  };
}

function seedInitialData(database: DatabaseSync) {
  try {
    const thread1Id = 'seed-thread-1';
    const thread2Id = 'seed-thread-2';
    const thread3Id = 'seed-thread-3';
    const now = new Date();
    const d3 = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();
    const d7 = new Date(now.getTime() + 168 * 60 * 60 * 1000).toISOString();
    const d1 = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    const insertThread = database.prepare(`
      INSERT OR IGNORE INTO threads (id, title, content, category, flair, source_url, media_url, media_type, author_alias, author_avatar, expires_at, created_at, upvotes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertThread.run(
      thread1Id,
      '🚨 ข่าวด่วน: มาตรการรักษาความปลอดภัยข้อมูลและความเป็นส่วนตัวดิจิทัลใหม่ ประกาศใช้แล้ววันนี้',
      'คณะกรรมการคุ้มครองข้อมูลฯ ได้ประกาศกรอบการกำกับดูแลใหม่ที่เข้มงวด มุ่งเน้นการลดการเก็บข้อมูลที่เกินความจำเป็น (Data Minimization) โดยสนับสนุนแพลตฟอร์มที่ไม่เปิดเผยตัวตน (Pseudonymous & Zero-Log Systems) เพื่อคืนสิทธิความเป็นส่วนตัวให้กับประชาชน\n\nหัวใจสำคัญคือการห้ามผู้ให้บริการเก็บ IP Address และประวัติการท่องเว็บโดยไม่จำเป็น เพื่อป้องกันการรั่วไหลและการสอดแนมทางไซเบอร์ที่กำลังเพิ่มขึ้นในปัจจุบัน',
      'breaking',
      'ข่าวด่วน',
      'https://www.thaigov.go.th',
      null,
      null,
      'u/เหยี่ยวราตรี #2041',
      'shield',
      d3,
      nowIso,
      14
    );

    insertThread.run(
      thread2Id,
      '💻 ทำไมระบบ Zero-Log และ Ephemeral Sessions ถึงเป็นอนาคตของการสื่อสารบนโลกอินเทอร์เน็ต?',
      'หลายปีที่ผ่านมา ข้อมูลส่วนบุคคลของผู้ใช้ทั่วโลกถูกนำไปขาย ยิงโฆษณา และตกเป็นเป้าหมายของมัลแวร์เรียกค่าไถ่\n\nการออกแบบระบบที่ไม่เก็บ Log เลยตั้งแต่ต้น (Zero-Log Architecture) ควบคู่กับชื่อสุ่มหรือชื่อตั้งเองแบบชั่วคราว ที่เปลี่ยนใหม่ทุกห้อง ทำให้ผู้ใช้สามารถพูดคุย แลกเปลี่ยนข้อมูลเชิงลึก และแสดงความคิดเห็นได้อย่างเสรีโดยไม่ต้องหวาดระแวงการถูก Digital Footprint เล่นงานย้อนหลัง\n\nทุกคนมีความเห็นอย่างไรกับการสื่อสารรูปแบบนี้?',
      'tech',
      'บทวิเคราะห์',
      'https://eff.org',
      null,
      null,
      'u/นักรหัสลับ #8812',
      'terminal',
      d7,
      nowIso,
      52
    );

    insertThread.run(
      thread3Id,
      '💬 พูดคุยทั่วไป: วิธีจัดการความเครียดจากข้อมูลข่าวสารท่วมท้น (Information Overload)',
      'ทุกวันนี้เปิดโซเชียลมีเดียมีแต่ข่าวด่วน ข่าวเครียด อัลกอริทึมพยายามดึงเวลาและความสนใจของเราตลอด 24 ชม.\n\nมีใครมีวิธีตัดการเชื่อมต่อ (Digital Detox) หรือเลือกเสพเฉพาะข้อมูลที่จำเป็นโดยไม่ต้องเอาตัวตนจริงไปผูกกับแพลตฟอร์มบ้างไหมครับ?',
      'general',
      'เสวนา',
      null,
      null,
      null,
      'u/ก้อนเมฆลอยละล่อง #4159',
      'globe',
      d1,
      nowIso,
      9
    );

    const insertComment = database.prepare(`
      INSERT OR IGNORE INTO comments (id, thread_id, parent_id, quote_text, quote_author, content, author_alias, author_avatar, created_at, upvotes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertComment.run(
      'seed-c-1',
      thread2Id,
      null,
      null,
      null,
      'เห็นด้วยมากๆ ครับ ปกติไปโพสต์ในบอร์ดอื่นจะกังวลเรื่องคนตามส่องประวัติย้อนหลัง ระบบเปลี่ยนชื่อทุกกระทู้นี่ตอบโจทย์มาก!',
      'u/แมวส้มหลงทาง #1240',
      'cpu',
      nowIso,
      6
    );

    insertComment.run(
      'seed-c-2',
      thread2Id,
      'seed-c-1',
      'ระบบเปลี่ยนชื่อทุกกระทู้นี่ตอบโจทย์มาก!',
      'u/แมวส้มหลงทาง #1240',
      'ใช่เลยครับ ทำให้เราโฟกัสกับ "เนื้อหาของสาร" มากกว่า "ใครเป็นคนพูด" บอร์ดแบบนี้หาได้ยากมากในยุคปัจจุบัน',
      'u/สายลมแปรปรวน #9931',
      'radar',
      nowIso,
      4
    );

    const insertChat = database.prepare(`
      INSERT OR IGNORE INTO chat_messages (id, room_id, content, author_alias, author_avatar, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertChat.run(
      'seed-chat-1',
      'global',
      'ยินดีต้อนรับสู่ ZRMA Community Live Chat 🛡️ แลกเปลี่ยนแบบนิรนาม 100% ไม่มีการบันทึก IP ใดๆ',
      'u/ระบบนิรนาม #0000',
      'shield',
      nowIso
    );
  } catch (err) {
    console.error('Seed error:', err);
  }
}

export function purgeExpiredCaptchas(): void {
  try {
    const database = getDatabase();
    const now = Date.now();
    database.prepare(`DELETE FROM used_captchas WHERE expires_at < ?`).run(now);
  } catch (err) {
    console.error('Error in purgeExpiredCaptchas:', err);
  }
}

export function isCaptchaUsed(tokenHash: string): boolean {
  try {
    const database = getDatabase();
    const row = database.prepare(`SELECT 1 FROM used_captchas WHERE token_hash = ?`).get(tokenHash);
    return Boolean(row);
  } catch {
    return false;
  }
}

export function markCaptchaUsed(tokenHash: string, expiresAt: number): void {
  try {
    const database = getDatabase();
    database.prepare(`
      INSERT OR REPLACE INTO used_captchas (token_hash, expires_at)
      VALUES (?, ?)
    `).run(tokenHash, expiresAt);
  } catch (err) {
    console.error('Error marking captcha used:', err);
  }
}

export function purgeExpiredData(): void {
  try {
    const database = getDatabase();
    const nowIso = new Date().toISOString();
    database.prepare(`DELETE FROM threads WHERE expires_at <= ?`).run(nowIso);
    database.prepare(`DELETE FROM comments WHERE thread_id NOT IN (SELECT id FROM threads)`).run();
    purgeExpiredCaptchas();
  } catch (err) {
    console.error('Error in purgeExpiredData:', err);
  }
}

export function pruneChatRoom(roomId: string): void {
  try {
    const database = getDatabase();
    database.prepare(`
      DELETE FROM chat_messages 
      WHERE room_id = ? 
      AND id NOT IN (
        SELECT id FROM chat_messages 
        WHERE room_id = ? 
        ORDER BY created_at DESC 
        LIMIT 100
      )
    `).run(roomId, roomId);
  } catch (err) {
    console.error('Error in pruneChatRoom:', err);
  }
}

export function parsePoll(raw: any): PollData | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.options) && parsed.options.length > 0) {
      return {
        question: parsed.question || null,
        options: parsed.options.map((opt: any, idx: number) => ({
          id: Number(opt.id ?? idx + 1),
          text: String(opt.text || ''),
          votes: Number(opt.votes || 0),
        })),
        total_votes: Number(parsed.total_votes || 0),
        closed: Boolean(parsed.closed),
      };
    }
  } catch {}
  return null;
}

export function parseJob(raw: any): JobData | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.job_type === 'hiring' || parsed.job_type === 'seeking')) {
      const apps: JobApplication[] = Array.isArray(parsed.applications)
        ? parsed.applications.map((a: any) => ({
            id: String(a.id || ''),
            applicant_alias: String(a.applicant_alias || 'ผู้สนใจนิรนาม'),
            applicant_avatar: String(a.applicant_avatar || 'shield'),
            applicant_user_id: a.applicant_user_id || null,
            applicant_username: a.applicant_username || null,
            pitch: String(a.pitch || ''),
            contact: a.contact || null,
            proposed_budget: a.proposed_budget || null,
            created_at: String(a.created_at || ''),
          }))
        : [];
      return {
        job_type: parsed.job_type as JobType,
        budget: parsed.budget || null,
        work_mode: (parsed.work_mode as JobWorkMode) || 'remote',
        skills: Array.isArray(parsed.skills) ? parsed.skills.map((s: any) => String(s)).filter(Boolean) : [],
        contact_info: parsed.contact_info || null,
        status: parsed.status === 'closed' ? 'closed' : 'open',
        applications: apps,
        application_count: Number(parsed.application_count ?? apps.length),
      };
    }
  } catch {}
  return null;
}

function seedInitialJobs(database: DatabaseSync) {
  try {
    const existingCount = database
      .prepare(`SELECT COUNT(*) as count FROM threads WHERE category = 'jobs' OR job_data IS NOT NULL`)
      .get() as any;
    if (existingCount && existingCount.count > 0) return;

    const now = new Date();
    const created1 = new Date(now.getTime() - 25 * 60 * 1000).toISOString();
    const created2 = new Date(now.getTime() - 55 * 60 * 1000).toISOString();
    const expires = new Date(now.getTime() + 168 * 60 * 60 * 1000).toISOString();

    const insert = database.prepare(`
      INSERT OR IGNORE INTO threads (
        id, title, content, category, flair, author_alias, author_avatar,
        upvotes, downvotes, job_data, expires_at, created_at
      ) VALUES (?, ?, ?, 'jobs', ?, ?, ?, ?, 0, ?, ?, ?)
    `);

    insert.run(
      'seed-job-hiring-1',
      '[จ้างงาน] หาผู้พัฒนา Next.js / TypeScript ทำเว็บแอปแดชบอร์ด (งาน Remote)',
      'ต้องการนักพัฒนาช่วยสร้างหน้า Dashboard พร้อมเชื่อม API และระบบ Chart ใช้เวลาทำงานประมาณ 1-2 สัปดาห์ กดปุ่ม "รับงาน / เสนอตัว" ด้านล่างเพื่อส่งรายละเอียดและเรทราคาได้เลยครับ',
      'เสนองาน',
      'ProjectLead #8821',
      'cpu',
      12,
      JSON.stringify({
        job_type: 'hiring',
        budget: '15,000 - 25,000 บาท',
        work_mode: 'remote',
        skills: ['Next.js', 'TypeScript', 'Tailwind CSS'],
        contact_info: 'แจ้งผ่านช่องรับงานหรือแชทสดของกระทู้',
        status: 'open',
        applications: [],
        application_count: 0,
      }),
      expires,
      created1
    );

    insert.run(
      'seed-job-seeking-1',
      '[รับงาน] รับตัดต่อวิดีโอสั้น Reels/TikTok, ออกแบบปก และกราฟิกแบนเนอร์ ส่งไวใน 24 ชม.',
      'มีประสบการณ์ตัดต่อและทำ Motion Graphic มากกว่า 3 ปี รับงานด่วน งานประจำ หรือเป็นโปรเจกต์ สามารถกดปุ่ม "ติดต่องาน / ยื่นข้อเสนอ" เพื่อแจ้งบรีฟงานได้เลยครับ',
      'รับงาน',
      'PixelCraft #4109',
      'terminal',
      9,
      JSON.stringify({
        job_type: 'seeking',
        budget: 'เริ่มต้น 500 - 2,500 บาท/ชิ้น',
        work_mode: 'remote',
        skills: ['Premiere Pro', 'After Effects', 'Graphic Design'],
        contact_info: 'แจ้งผ่านแบบฟอร์มเสนองานในกระทู้นี้',
        status: 'open',
        applications: [],
        application_count: 0,
      }),
      expires,
      created2
    );
  } catch {
    // ignore
  }
}

export function getTickerItems(): TickerItem[] {
  purgeExpiredData();
  const database = getDatabase();

  const rows = database.prepare(`
    SELECT 
      t.id,
      t.title,
      t.category,
      t.is_pinned,
      t.created_at,
      (t.upvotes - t.downvotes) as score,
      (SELECT COUNT(*) FROM comments c WHERE c.thread_id = t.id) as comment_count
    FROM threads t
    WHERE t.is_hidden = 0
    ORDER BY 
      t.is_pinned DESC,
      CASE WHEN t.category = 'breaking' THEN 1 ELSE 0 END DESC,
      (t.upvotes - t.downvotes) DESC,
      t.created_at DESC
    LIMIT 12
  `).all() as any[];

  return rows.map((r) => {
    let badge: 'PINNED' | 'BREAKING' | 'RISING' | 'HOT' = 'HOT';
    if (Number(r.is_pinned) === 1) {
      badge = 'PINNED';
    } else if (r.category === 'breaking') {
      badge = 'BREAKING';
    } else if (Number(r.score) >= 5 || Number(r.comment_count) >= 3) {
      badge = 'RISING';
    }

    return {
      id: r.id,
      title: r.title,
      category: r.category,
      score: Number(r.score || 0),
      comment_count: Number(r.comment_count || 0),
      is_pinned: Number(r.is_pinned || 0),
      created_at: r.created_at,
      badge,
    };
  });
}

function mapThreadRow(r: any): Thread {
  const hasUser = Boolean(r.u_username);
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    category: r.category,
    flair: r.flair || null,
    source_url: r.source_url,
    media_url: r.media_url || null,
    media_type: (r.media_type as MediaType) || null,
    poll_data: r.poll_data || null,
    poll: parsePoll(r.poll_data),
    job_data: r.job_data || null,
    job: parseJob(r.job_data),
    author_alias: hasUser ? (r.u_display_name || r.author_alias) : r.author_alias,
    author_avatar: hasUser ? (r.u_avatar_icon || r.author_avatar) : r.author_avatar,
    author_user_id: r.author_user_id || null,
    author_username: r.u_username || null,
    author_avatar_url: r.u_avatar_url || null,
    author_frame: (r.u_avatar_frame as AvatarFrame) || null,
    author_name_color: (r.u_name_color as NameColor) || null,
    author_badge: r.u_custom_badge || null,
    upvotes: Number(r.upvotes),
    downvotes: Number(r.downvotes),
    score: Number(r.score),
    comment_count: Number(r.comment_count),
    report_count: Number(r.report_count),
    is_hidden: Number(r.is_hidden),
    is_pinned: Number(r.is_pinned || 0),
    is_edited: Number(r.is_edited || 0),
    edited_at: r.edited_at || null,
    expires_at: r.expires_at,
    created_at: r.created_at,
  };
}

const THREAD_SELECT_SQL = `
  SELECT 
    t.*,
    (t.upvotes - t.downvotes) as score,
    (SELECT COUNT(*) FROM comments c WHERE c.thread_id = t.id) as comment_count,
    u.username as u_username,
    u.display_name as u_display_name,
    u.avatar_icon as u_avatar_icon,
    u.avatar_url as u_avatar_url,
    u.avatar_frame as u_avatar_frame,
    u.name_color as u_name_color,
    u.custom_badge as u_custom_badge
  FROM threads t
  LEFT JOIN users u ON t.author_user_id = u.id
`;

export function getThreads(
  category?: string,
  sort: RedditSort = 'hot',
  jobFilter?: { onlyJobs?: boolean; jobType?: JobType }
): Thread[] {
  purgeExpiredData();
  const database = getDatabase();

  let query = `${THREAD_SELECT_SQL} WHERE 1=1`;
  const params: any[] = [];

  if (category && category !== 'all') {
    const cleanCat = category.replace(/^[zr]\//i, '');
    query += ` AND t.category = ?`;
    params.push(cleanCat);
  }

  if (jobFilter?.onlyJobs) {
    query += ` AND t.job_data IS NOT NULL`;
  }

  if (jobFilter?.jobType === 'hiring' || jobFilter?.jobType === 'seeking') {
    query += ` AND json_extract(t.job_data, '$.job_type') = ?`;
    params.push(jobFilter.jobType);
  }

  if (sort === 'hot') {
    query += ` ORDER BY t.is_pinned DESC, ((t.upvotes - t.downvotes) * 1000 + unixepoch(t.created_at) / 100) DESC, t.created_at DESC`;
  } else if (sort === 'new') {
    query += ` ORDER BY t.is_pinned DESC, t.created_at DESC`;
  } else if (sort === 'top') {
    query += ` ORDER BY t.is_pinned DESC, score DESC, t.created_at DESC`;
  } else if (sort === 'rising') {
    query += ` ORDER BY t.is_pinned DESC, comment_count DESC, score DESC, t.created_at DESC`;
  } else if (sort === 'breaking') {
    query += ` AND t.category = 'breaking' ORDER BY t.is_pinned DESC, t.created_at DESC`;
  } else {
    query += ` ORDER BY t.is_pinned DESC, t.created_at DESC`;
  }

  query += ` LIMIT 50`;

  const rows = database.prepare(query).all(...params) as any[];
  return rows.map(mapThreadRow);
}

export function getThreadById(id: string): Thread | null {
  purgeExpiredData();
  const database = getDatabase();
  const row = database.prepare(`
    ${THREAD_SELECT_SQL}
    WHERE t.id = ?
  `).get(id) as any;

  if (!row) return null;
  return mapThreadRow(row);
}

export function createThread(data: {
  id: string;
  title: string;
  content: string;
  category: string;
  flair?: string | null;
  source_url?: string | null;
  media_url?: string | null;
  media_type?: MediaType | null;
  poll_data?: string | null;
  job_data?: string | null;
  author_alias: string;
  author_avatar: string;
  author_user_id?: string | null;
  is_pinned?: number;
  expires_hours: number;
  edit_token?: string | null;
}): Thread {
  const database = getDatabase();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + data.expires_hours * 60 * 60 * 1000).toISOString();
  const createdAt = now.toISOString();
  const cleanCat = data.category.toLowerCase().trim().replace(/^[zr]\//i, '');

  // Auto-register community in communities table if new
  try {
    database.prepare(`
      INSERT OR IGNORE INTO communities (name, title, description, icon, post_count, created_at)
      VALUES (?, ?, ?, 'terminal', 0, ?)
    `).run(cleanCat, `z/${cleanCat}`, `ชุมชนแลกเปลี่ยนข่าวสาร z/${cleanCat}`, createdAt);
  } catch {
    // ignore
  }

  database.prepare(`
    INSERT INTO threads (id, title, content, category, flair, source_url, media_url, media_type, poll_data, job_data, author_alias, author_avatar, author_user_id, is_pinned, edit_token, is_edited, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    data.id,
    data.title,
    data.content,
    cleanCat,
    data.flair || null,
    data.source_url || null,
    data.media_url || null,
    data.media_type || null,
    data.poll_data || null,
    data.job_data || null,
    data.author_alias,
    data.author_avatar,
    data.author_user_id || null,
    data.is_pinned ? 1 : 0,
    data.edit_token || null,
    expiresAt,
    createdAt
  );

  return getThreadById(data.id)!;
}

export function applyToJobThread(
  threadId: string,
  application: JobApplication
): { success: boolean; job?: JobData; error?: string } {
  const database = getDatabase();
  const existing = database.prepare(`SELECT * FROM threads WHERE id = ?`).get(threadId) as any;
  if (!existing) {
    return { success: false, error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุแล้ว' };
  }

  const job = parseJob(existing.job_data);
  if (!job) {
    return { success: false, error: 'กระทู้นี้ไม่ใช่ประกาศจ้างงานหรือรับงาน' };
  }

  if (job.status === 'closed') {
    return { success: false, error: 'ประกาศงานนี้ปิดรับสมัคร/ปิดรับงานแล้ว' };
  }

  const nextApps = [application, ...(job.applications || [])].slice(0, 50);
  const updatedJob: JobData = {
    ...job,
    applications: nextApps,
    application_count: Number(job.application_count || 0) + 1,
  };

  database
    .prepare(`UPDATE threads SET job_data = ? WHERE id = ?`)
    .run(JSON.stringify(updatedJob), threadId);

  return { success: true, job: updatedJob };
}

export function toggleJobStatus(
  threadId: string,
  status: JobStatus,
  edit_token?: string | null,
  current_user_id?: string | null
): { success: boolean; job?: JobData; error?: string } {
  const database = getDatabase();
  const existing = database.prepare(`SELECT * FROM threads WHERE id = ?`).get(threadId) as any;
  if (!existing) {
    return { success: false, error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุแล้ว' };
  }

  const job = parseJob(existing.job_data);
  if (!job) {
    return { success: false, error: 'กระทู้นี้ไม่ใช่ประกาศงาน' };
  }

  if (existing.author_user_id) {
    const isOwner = Boolean(current_user_id && existing.author_user_id === current_user_id);
    const hasToken = Boolean(existing.edit_token && edit_token && existing.edit_token === edit_token);
    if (!isOwner && !hasToken) {
      return { success: false, error: 'คุณไม่มีสิทธิ์เปลี่ยนสถานะประกาศงานนี้' };
    }
  } else if (existing.edit_token && edit_token && existing.edit_token !== edit_token) {
    return { success: false, error: 'รหัสยืนยันการแก้ไขไม่ถูกต้อง' };
  }

  const updatedJob: JobData = {
    ...job,
    status,
  };

  database
    .prepare(`UPDATE threads SET job_data = ? WHERE id = ?`)
    .run(JSON.stringify(updatedJob), threadId);

  return { success: true, job: updatedJob };
}

export function voteThreadPoll(
  threadId: string,
  optionId: number
): { success: boolean; poll?: PollData; error?: string } {
  const database = getDatabase();
  const existing = database.prepare(`SELECT * FROM threads WHERE id = ?`).get(threadId) as any;
  if (!existing) {
    return { success: false, error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุแล้ว' };
  }
  if (!existing.poll_data) {
    return { success: false, error: 'กระทู้นี้ไม่มีโพลให้โหวต' };
  }

  let poll: PollData;
  try {
    poll = JSON.parse(existing.poll_data);
  } catch {
    return { success: false, error: 'ข้อมูลโพลในระบบไม่ถูกต้อง' };
  }

  if (poll.closed) {
    return { success: false, error: 'โพลนี้ปิดรับการลงคะแนนแล้ว' };
  }

  const targetOption = poll.options.find((o) => Number(o.id) === Number(optionId));
  if (!targetOption) {
    return { success: false, error: 'ไม่พบตัวเลือกที่ระบุ' };
  }

  targetOption.votes = (Number(targetOption.votes) || 0) + 1;
  poll.total_votes = poll.options.reduce((sum, o) => sum + (Number(o.votes) || 0), 0);

  const updatedJson = JSON.stringify(poll);
  database.prepare(`UPDATE threads SET poll_data = ? WHERE id = ?`).run(updatedJson, threadId);

  return { success: true, poll };
}

export function updateThread(id: string, data: {
  title: string;
  content: string;
  category?: string;
  flair?: string | null;
  source_url?: string | null;
  edit_token?: string | null;
  current_user_id?: string | null;
}): { success: boolean; thread?: Thread; error?: string } {
  const database = getDatabase();
  const existing = database.prepare(`SELECT * FROM threads WHERE id = ?`).get(id) as any;
  if (!existing) {
    return { success: false, error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุแล้ว' };
  }

  // Check authorization: account owner OR matching edit token
  if (existing.author_user_id) {
    const isOwner = Boolean(data.current_user_id && existing.author_user_id === data.current_user_id);
    const hasToken = Boolean(existing.edit_token && data.edit_token && existing.edit_token === data.edit_token);
    if (!isOwner && !hasToken) {
      return { success: false, error: 'คุณไม่มีสิทธิ์แก้ไขกระทู้นี้ กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าของโพสต์หรือใช้รหัสยืนยัน' };
    }
  } else if (existing.edit_token && data.edit_token && existing.edit_token !== data.edit_token) {
    return { success: false, error: 'รหัสยืนยันการแก้ไข (Edit Passcode) ไม่ถูกต้อง' };
  }

  const now = new Date().toISOString();
  const cleanCat = (data.category || existing.category).toLowerCase().trim().replace(/^[zr]\//i, '');

  database.prepare(`
    UPDATE threads
    SET title = ?,
        content = ?,
        category = ?,
        flair = ?,
        source_url = ?,
        is_edited = 1,
        edited_at = ?
    WHERE id = ?
  `).run(
    data.title.trim(),
    data.content.trim(),
    cleanCat,
    data.flair !== undefined ? (data.flair?.trim() || null) : existing.flair,
    data.source_url !== undefined ? (data.source_url?.trim() || null) : existing.source_url,
    now,
    id
  );

  const updated = getThreadById(id);
  return { success: true, thread: updated || undefined };
}

export function deleteThread(
  id: string,
  edit_token?: string | null,
  current_user_id?: string | null
): { success: boolean; error?: string } {
  const database = getDatabase();
  const existing = database.prepare(`SELECT * FROM threads WHERE id = ?`).get(id) as any;
  if (!existing) {
    return { success: false, error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุแล้ว' };
  }

  if (existing.author_user_id) {
    const isOwner = Boolean(current_user_id && existing.author_user_id === current_user_id);
    const hasToken = Boolean(existing.edit_token && edit_token && existing.edit_token === edit_token);
    if (!isOwner && !hasToken) {
      return { success: false, error: 'คุณไม่มีสิทธิ์ลบกระทู้นี้ กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าของโพสต์หรือใช้รหัสยืนยัน' };
    }
  } else if (existing.edit_token && edit_token && existing.edit_token !== edit_token) {
    return { success: false, error: 'รหัสยืนยันการลบ (Delete Passcode) ไม่ถูกต้อง' };
  }

  database.prepare(`DELETE FROM comments WHERE thread_id = ?`).run(id);
  database.prepare(`DELETE FROM threads WHERE id = ?`).run(id);

  return { success: true };
}

export function voteThread(
  id: string,
  type: 'up' | 'down' | 'cancel',
  prevVote?: 'up' | 'down' | null
): { upvotes: number; downvotes: number; score: number } | null {
  const database = getDatabase();
  const existing = database.prepare(`SELECT upvotes, downvotes FROM threads WHERE id = ?`).get(id) as any;
  if (!existing) return null;

  let up = Number(existing.upvotes || 0);
  let down = Number(existing.downvotes || 0);

  if (type === 'cancel') {
    if (prevVote === 'up') up = Math.max(0, up - 1);
    else if (prevVote === 'down') down = Math.max(0, down - 1);
  } else if (type === 'up') {
    if (prevVote === 'down') {
      down = Math.max(0, down - 1);
      up += 1;
    } else if (prevVote !== 'up') {
      up += 1;
    }
  } else if (type === 'down') {
    if (prevVote === 'up') {
      up = Math.max(0, up - 1);
      down += 1;
    } else if (prevVote !== 'down') {
      down += 1;
    }
  }

  database.prepare(`UPDATE threads SET upvotes = ?, downvotes = ? WHERE id = ?`).run(up, down, id);

  return {
    upvotes: up,
    downvotes: down,
    score: up - down,
  };
}

function mapCommentRow(r: any): Comment {
  const hasUser = Boolean(r.u_username);
  return {
    id: r.id,
    thread_id: r.thread_id,
    parent_id: r.parent_id,
    quote_text: r.quote_text,
    quote_author: r.quote_author,
    content: r.content,
    media_url: r.media_url || null,
    author_alias: hasUser ? (r.u_display_name || r.author_alias) : r.author_alias,
    author_avatar: hasUser ? (r.u_avatar_icon || r.author_avatar) : r.author_avatar,
    author_user_id: r.author_user_id || null,
    author_username: r.u_username || null,
    author_avatar_url: r.u_avatar_url || null,
    author_frame: (r.u_avatar_frame as AvatarFrame) || null,
    author_name_color: (r.u_name_color as NameColor) || null,
    author_badge: r.u_custom_badge || null,
    upvotes: Number(r.upvotes),
    downvotes: Number(r.downvotes),
    score: Number(r.score),
    report_count: Number(r.report_count),
    is_hidden: Number(r.is_hidden),
    created_at: r.created_at,
  };
}

const COMMENT_SELECT_SQL = `
  SELECT 
    c.*,
    (c.upvotes - c.downvotes) as score,
    u.username as u_username,
    u.display_name as u_display_name,
    u.avatar_icon as u_avatar_icon,
    u.avatar_url as u_avatar_url,
    u.avatar_frame as u_avatar_frame,
    u.name_color as u_name_color,
    u.custom_badge as u_custom_badge
  FROM comments c
  LEFT JOIN users u ON c.author_user_id = u.id
`;

export function getCommentsByThread(threadId: string): Comment[] {
  const database = getDatabase();
  const rows = database.prepare(`
    ${COMMENT_SELECT_SQL}
    WHERE c.thread_id = ?
    ORDER BY c.created_at ASC
  `).all(threadId) as any[];

  return rows.map(mapCommentRow);
}

export function createComment(data: {
  id: string;
  thread_id: string;
  parent_id?: string | null;
  quote_text?: string | null;
  quote_author?: string | null;
  content: string;
  media_url?: string | null;
  author_alias: string;
  author_avatar: string;
  author_user_id?: string | null;
}): Comment {
  const database = getDatabase();
  const createdAt = new Date().toISOString();

  database.prepare(`
    INSERT INTO comments (id, thread_id, parent_id, quote_text, quote_author, content, media_url, author_alias, author_avatar, author_user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id,
    data.thread_id,
    data.parent_id || null,
    data.quote_text || null,
    data.quote_author || null,
    data.content,
    data.media_url || null,
    data.author_alias,
    data.author_avatar,
    data.author_user_id || null,
    createdAt
  );

  const row = database.prepare(`${COMMENT_SELECT_SQL} WHERE c.id = ?`).get(data.id) as any;
  return mapCommentRow(row);
}

export function voteComment(
  id: string,
  type: 'up' | 'down' | 'cancel',
  prevVote?: 'up' | 'down' | null
): { upvotes: number; downvotes: number; score: number } | null {
  const database = getDatabase();
  const existing = database.prepare(`SELECT upvotes, downvotes FROM comments WHERE id = ?`).get(id) as any;
  if (!existing) return null;

  let up = Number(existing.upvotes || 0);
  let down = Number(existing.downvotes || 0);

  if (type === 'cancel') {
    if (prevVote === 'up') up = Math.max(0, up - 1);
    else if (prevVote === 'down') down = Math.max(0, down - 1);
  } else if (type === 'up') {
    if (prevVote === 'down') {
      down = Math.max(0, down - 1);
      up += 1;
    } else if (prevVote !== 'up') {
      up += 1;
    }
  } else if (type === 'down') {
    if (prevVote === 'up') {
      up = Math.max(0, up - 1);
      down += 1;
    } else if (prevVote !== 'down') {
      down += 1;
    }
  }

  database.prepare(`UPDATE comments SET upvotes = ?, downvotes = ? WHERE id = ?`).run(up, down, id);

  return {
    upvotes: up,
    downvotes: down,
    score: up - down,
  };
}

function mapChatMessageRow(r: any): ChatMessage {
  const hasUser = Boolean(r.u_username);
  return {
    id: r.id,
    room_id: r.room_id,
    content: r.content,
    author_alias: hasUser ? (r.u_display_name || r.author_alias) : r.author_alias,
    author_avatar: hasUser ? (r.u_avatar_icon || r.author_avatar) : r.author_avatar,
    author_user_id: r.author_user_id || null,
    author_username: r.u_username || null,
    author_avatar_url: r.u_avatar_url || null,
    author_frame: (r.u_avatar_frame as AvatarFrame) || null,
    author_name_color: (r.u_name_color as NameColor) || null,
    author_badge: r.u_custom_badge || null,
    report_count: Number(r.report_count),
    is_hidden: Number(r.is_hidden),
    is_edited: Number(r.is_edited || 0),
    edited_at: r.edited_at || null,
    created_at: r.created_at,
  };
}

const CHAT_SELECT_SQL = `
  SELECT
    m.*,
    u.username as u_username,
    u.display_name as u_display_name,
    u.avatar_icon as u_avatar_icon,
    u.avatar_url as u_avatar_url,
    u.avatar_frame as u_avatar_frame,
    u.name_color as u_name_color,
    u.custom_badge as u_custom_badge
  FROM chat_messages m
  LEFT JOIN users u ON m.author_user_id = u.id
`;

export function getChatMessages(roomId: string = 'global'): ChatMessage[] {
  pruneChatRoom(roomId);
  const database = getDatabase();
  const rows = database.prepare(`
    ${CHAT_SELECT_SQL}
    WHERE m.room_id = ? 
    ORDER BY m.created_at ASC
    LIMIT 100
  `).all(roomId) as any[];

  return rows.map(mapChatMessageRow);
}

export function sendChatMessage(data: {
  id: string;
  room_id: string;
  content: string;
  author_alias: string;
  author_avatar: string;
  author_user_id?: string | null;
  edit_token?: string | null;
}): ChatMessage {
  const database = getDatabase();
  const createdAt = new Date().toISOString();

  database.prepare(`
    INSERT INTO chat_messages (id, room_id, content, author_alias, author_avatar, author_user_id, edit_token, is_edited, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    data.id,
    data.room_id || 'global',
    data.content,
    data.author_alias,
    data.author_avatar,
    data.author_user_id || null,
    data.edit_token || null,
    createdAt
  );

  pruneChatRoom(data.room_id || 'global');

  const row = database.prepare(`${CHAT_SELECT_SQL} WHERE m.id = ?`).get(data.id) as any;
  if (row) return mapChatMessageRow(row);

  return {
    id: data.id,
    room_id: data.room_id || 'global',
    content: data.content,
    author_alias: data.author_alias,
    author_avatar: data.author_avatar,
    author_user_id: data.author_user_id || null,
    report_count: 0,
    is_hidden: 0,
    is_edited: 0,
    edited_at: null,
    created_at: createdAt,
  };
}

export function updateChatMessage(id: string, data: {
  content: string;
  author_alias?: string;
  edit_token?: string;
  current_user_id?: string | null;
}): { success: boolean; message?: ChatMessage; error?: string } {
  const database = getDatabase();
  const existing = database.prepare(`SELECT * FROM chat_messages WHERE id = ?`).get(id) as any;
  if (!existing) {
    return { success: false, error: 'ไม่พบข้อความแชทนี้' };
  }

  // Validate ownership
  if (existing.author_user_id) {
    const isOwner = Boolean(data.current_user_id && existing.author_user_id === data.current_user_id);
    const hasToken = Boolean(existing.edit_token && data.edit_token && existing.edit_token === data.edit_token);
    if (!isOwner && !hasToken) {
      return { success: false, error: 'คุณไม่มีสิทธิ์แก้ไขข้อความนี้' };
    }
  } else if (existing.edit_token && data.edit_token && existing.edit_token !== data.edit_token) {
    return { success: false, error: 'คุณไม่มีสิทธิ์แก้ไขข้อความนี้' };
  } else if (!existing.edit_token && data.author_alias && existing.author_alias !== data.author_alias) {
    return { success: false, error: 'คุณสามารถแก้ไขได้เฉพาะข้อความของตัวเองเท่านั้น' };
  }

  const now = new Date().toISOString();
  database.prepare(`
    UPDATE chat_messages
    SET content = ?,
        is_edited = 1,
        edited_at = ?
    WHERE id = ?
  `).run(data.content.trim(), now, id);

  const updated = database.prepare(`${CHAT_SELECT_SQL} WHERE m.id = ?`).get(id) as any;
  return {
    success: true,
    message: mapChatMessageRow(updated),
  };
}

export function deleteChatMessage(
  id: string,
  author_alias?: string,
  edit_token?: string,
  current_user_id?: string | null
): { success: boolean; error?: string } {
  const database = getDatabase();
  const existing = database.prepare(`SELECT * FROM chat_messages WHERE id = ?`).get(id) as any;
  if (!existing) {
    return { success: false, error: 'ไม่พบข้อความแชทนี้' };
  }

  if (existing.author_user_id) {
    const isOwner = Boolean(current_user_id && existing.author_user_id === current_user_id);
    const hasToken = Boolean(existing.edit_token && edit_token && existing.edit_token === edit_token);
    if (!isOwner && !hasToken) {
      return { success: false, error: 'คุณไม่มีสิทธิ์ลบข้อความนี้' };
    }
  } else if (existing.edit_token && edit_token && existing.edit_token !== edit_token) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ลบข้อความนี้' };
  } else if (!existing.edit_token && author_alias && existing.author_alias !== author_alias) {
    return { success: false, error: 'คุณสามารถลบได้เฉพาะข้อความของตัวเองเท่านั้น' };
  }

  database.prepare(`DELETE FROM chat_messages WHERE id = ?`).run(id);
  return { success: true };
}

export function reportContent(data: {
  id: string;
  target_type: 'thread' | 'comment' | 'chat';
  target_id: string;
  reason: string;
}): { newReportCount: number; isHidden: boolean } {
  const database = getDatabase();
  const createdAt = new Date().toISOString();

  database.prepare(`
    INSERT INTO reports (id, target_type, target_id, reason, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.id, data.target_type, data.target_id, data.reason, createdAt);

  let newReportCount = 0;
  let isHidden = false;

  if (data.target_type === 'thread') {
    database.prepare(`UPDATE threads SET report_count = report_count + 1 WHERE id = ?`).run(data.target_id);
    const row = database.prepare(`SELECT report_count FROM threads WHERE id = ?`).get(data.target_id) as any;
    newReportCount = row ? Number(row.report_count) : 0;
    if (newReportCount >= 5) {
      database.prepare(`UPDATE threads SET is_hidden = 1 WHERE id = ?`).run(data.target_id);
      isHidden = true;
    }
  } else if (data.target_type === 'comment') {
    database.prepare(`UPDATE comments SET report_count = report_count + 1 WHERE id = ?`).run(data.target_id);
    const row = database.prepare(`SELECT report_count FROM comments WHERE id = ?`).get(data.target_id) as any;
    newReportCount = row ? Number(row.report_count) : 0;
    if (newReportCount >= 5) {
      database.prepare(`UPDATE comments SET is_hidden = 1 WHERE id = ?`).run(data.target_id);
      isHidden = true;
    }
  } else if (data.target_type === 'chat') {
    database.prepare(`UPDATE chat_messages SET report_count = report_count + 1 WHERE id = ?`).run(data.target_id);
    const row = database.prepare(`SELECT report_count FROM chat_messages WHERE id = ?`).get(data.target_id) as any;
    newReportCount = row ? Number(row.report_count) : 0;
    if (newReportCount >= 5) {
      database.prepare(`UPDATE chat_messages SET is_hidden = 1 WHERE id = ?`).run(data.target_id);
      isHidden = true;
    }
  }

  return { newReportCount, isHidden };
}

// ----------------------------------------------------
// GHOST ROOMS ("ห้องหายไปเมื่อไม่มีคน")
// ----------------------------------------------------

export function createGhostRoom(data: {
  id: string;
  name: string;
  title: string;
  topic?: string | null;
  creator_alias: string;
}): GhostRoom {
  const database = getDatabase();
  const now = new Date().toISOString();
  const cleanName = data.name.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '') || `ghost-${Math.floor(Math.random() * 9000 + 1000)}`;

  database.prepare(`
    INSERT INTO ghost_rooms (id, name, title, topic, creator_alias, active_users, last_active_at, is_destroyed, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, 0, ?)
    ON CONFLICT(name) DO UPDATE SET
      is_destroyed = 0,
      active_users = active_users + 1,
      last_active_at = excluded.last_active_at
  `).run(
    data.id,
    cleanName,
    data.title.trim(),
    data.topic ? data.topic.trim() : null,
    data.creator_alias,
    now,
    now
  );

  return getGhostRoom(cleanName)!;
}

export function getGhostRooms(): GhostRoom[] {
  purgeInactiveGhostRooms();
  const database = getDatabase();
  const rows = database.prepare(`
    SELECT * FROM ghost_rooms 
    WHERE is_destroyed = 0 
    ORDER BY active_users DESC, last_active_at DESC
  `).all() as any[];

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    title: r.title,
    topic: r.topic || null,
    creator_alias: r.creator_alias,
    active_users: Number(r.active_users || 0),
    last_active_at: r.last_active_at,
    is_destroyed: Number(r.is_destroyed || 0),
    created_at: r.created_at,
  }));
}

export function getGhostRoom(idOrName: string): GhostRoom | null {
  const database = getDatabase();
  const row = database.prepare(`
    SELECT * FROM ghost_rooms 
    WHERE id = ? OR name = ?
  `).get(idOrName, idOrName) as any;

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    topic: row.topic || null,
    creator_alias: row.creator_alias,
    active_users: Number(row.active_users || 0),
    last_active_at: row.last_active_at,
    is_destroyed: Number(row.is_destroyed || 0),
    created_at: row.created_at,
  };
}

export function updateGhostRoomPresence(roomIdOrName: string, activeCount: number): boolean {
  const database = getDatabase();
  const now = new Date().toISOString();
  if (activeCount <= 0) {
    destroyGhostRoom(roomIdOrName);
    return false;
  }

  database.prepare(`
    UPDATE ghost_rooms 
    SET active_users = ?, last_active_at = ?
    WHERE id = ? OR name = ?
  `).run(activeCount, now, roomIdOrName, roomIdOrName);
  return true;
}

export function destroyGhostRoom(roomIdOrName: string): boolean {
  const database = getDatabase();
  const room = database.prepare(`SELECT id, name FROM ghost_rooms WHERE id = ? OR name = ?`).get(roomIdOrName, roomIdOrName) as any;
  if (!room) return false;

  // Vaporize all chat messages associated with this ghost room
  database.prepare(`DELETE FROM chat_messages WHERE room_id = ? OR room_id = ?`).run(room.id, `ghost_${room.name}`);
  
  // Mark room as destroyed and set active users to 0
  database.prepare(`UPDATE ghost_rooms SET is_destroyed = 1, active_users = 0 WHERE id = ?`).run(room.id);
  return true;
}

export function purgeInactiveGhostRooms() {
  try {
    const database = getDatabase();
    const cutoff = new Date(Date.now() - 90 * 1000).toISOString(); // 90 seconds of total inactivity
    const inactive = database.prepare(`
      SELECT id, name FROM ghost_rooms 
      WHERE is_destroyed = 0 AND (active_users <= 0 OR last_active_at < ?)
    `).all(cutoff) as any[];

    for (const r of inactive) {
      destroyGhostRoom(r.id);
    }
  } catch {
    // ignore
  }
}

export { buildCommentTree } from './commentTree';

// ----------------------------------------------------
// OPTIONAL ACCOUNTS & DECORATION SYSTEM (Zero-Log: No Email/IP/Phone)
// ----------------------------------------------------

function mapUserProfile(row: any): UserProfile {
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio || '',
    avatar_icon: row.avatar_icon || 'shield',
    avatar_url: row.avatar_url || null,
    avatar_frame: (row.avatar_frame as AvatarFrame) || 'none',
    banner_theme: (row.banner_theme as BannerTheme) || 'obsidian',
    name_color: (row.name_color as NameColor) || 'default',
    custom_badge: row.custom_badge || null,
    created_at: row.created_at,
  };
}

export function createUser(data: {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  avatar_icon?: string;
}): UserProfile {
  const database = getDatabase();
  const createdAt = new Date().toISOString();
  const cleanUsername = data.username.trim().toLowerCase();

  database.prepare(`
    INSERT INTO users (
      id, username, display_name, password_hash, bio, avatar_icon,
      avatar_url, avatar_frame, banner_theme, name_color, custom_badge, created_at
    )
    VALUES (?, ?, ?, ?, '', ?, NULL, 'none', 'obsidian', 'default', NULL, ?)
  `).run(
    data.id,
    cleanUsername,
    data.display_name.trim(),
    data.password_hash,
    data.avatar_icon || 'shield',
    createdAt
  );

  return getUserById(data.id)!;
}

export function getUserWithPasswordByUsername(
  username: string
): (UserProfile & { password_hash: string }) | null {
  const database = getDatabase();
  const row = database
    .prepare(`SELECT * FROM users WHERE username = ?`)
    .get(username.trim().toLowerCase()) as any;
  if (!row) return null;
  return {
    ...mapUserProfile(row),
    password_hash: row.password_hash,
  };
}

export function getUserWithPasswordById(
  id: string
): (UserProfile & { password_hash: string }) | null {
  const database = getDatabase();
  const row = database
    .prepare(`SELECT * FROM users WHERE id = ?`)
    .get(id) as any;
  if (!row) return null;
  return {
    ...mapUserProfile(row),
    password_hash: row.password_hash,
  };
}

export function getUserById(id: string): UserProfile | null {
  const database = getDatabase();
  const row = database
    .prepare(`SELECT * FROM users WHERE id = ?`)
    .get(id) as any;
  if (!row) return null;
  return mapUserProfile(row);
}

export function getUserByUsername(username: string): UserProfile | null {
  const database = getDatabase();
  const row = database
    .prepare(`SELECT * FROM users WHERE username = ?`)
    .get(username.trim().toLowerCase()) as any;
  if (!row) return null;
  return mapUserProfile(row);
}

export function updateUserProfile(
  id: string,
  data: {
    display_name?: string;
    bio?: string;
    avatar_icon?: string;
    avatar_url?: string | null;
    avatar_frame?: AvatarFrame;
    banner_theme?: BannerTheme;
    name_color?: NameColor;
    custom_badge?: string | null;
  }
): UserProfile | null {
  const database = getDatabase();
  const existing = getUserById(id);
  if (!existing) return null;

  database.prepare(`
    UPDATE users
    SET display_name = ?,
        bio = ?,
        avatar_icon = ?,
        avatar_url = ?,
        avatar_frame = ?,
        banner_theme = ?,
        name_color = ?,
        custom_badge = ?
    WHERE id = ?
  `).run(
    data.display_name !== undefined ? data.display_name.trim() : existing.display_name,
    data.bio !== undefined ? data.bio.trim() : (existing.bio ?? ''),
    data.avatar_icon !== undefined ? data.avatar_icon : existing.avatar_icon,
    data.avatar_url !== undefined ? (data.avatar_url || null) : (existing.avatar_url ?? null),
    data.avatar_frame !== undefined ? data.avatar_frame : existing.avatar_frame,
    data.banner_theme !== undefined ? data.banner_theme : existing.banner_theme,
    data.name_color !== undefined ? data.name_color : existing.name_color,
    data.custom_badge !== undefined ? (data.custom_badge?.trim() || null) : (existing.custom_badge ?? null),
    id
  );

  return getUserById(id);
}

export function updateUserPassword(id: string, password_hash: string): boolean {
  const database = getDatabase();
  const res = database
    .prepare(`UPDATE users SET password_hash = ? WHERE id = ?`)
    .run(password_hash, id);
  return Number(res.changes || 0) > 0;
}

export function getThreadsByUserId(userId: string): Thread[] {
  purgeExpiredData();
  const database = getDatabase();
  const rows = database
    .prepare(`
      ${THREAD_SELECT_SQL}
      WHERE t.author_user_id = ? AND t.is_hidden = 0
      ORDER BY t.created_at DESC
      LIMIT 50
    `)
    .all(userId) as any[];
  return rows.map(mapThreadRow);
}

export function getPublicProfileByUsername(username: string): {
  profile: UserProfile;
  stats: { thread_count: number; comment_count: number; total_score: number };
  threads: Thread[];
} | null {
  purgeExpiredData();
  const database = getDatabase();
  const profile = getUserByUsername(username);
  if (!profile) return null;

  const threads = getThreadsByUserId(profile.id);
  const threadStats = database
    .prepare(`
      SELECT
        COUNT(*) as thread_count,
        COALESCE(SUM(upvotes - downvotes), 0) as total_score
      FROM threads
      WHERE author_user_id = ? AND is_hidden = 0
    `)
    .get(profile.id) as any;

  const commentStats = database
    .prepare(`SELECT COUNT(*) as comment_count FROM comments WHERE author_user_id = ?`)
    .get(profile.id) as any;

  return {
    profile,
    stats: {
      thread_count: Number(threadStats?.thread_count || 0),
      comment_count: Number(commentStats?.comment_count || 0),
      total_score: Number(threadStats?.total_score || 0),
    },
    threads,
  };
}
