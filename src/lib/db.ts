import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { Thread, Comment, CommentNode, ChatMessage, Category, RedditSort, Community, MediaType, GhostRoom } from '@/types';

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
    try { db.exec('ALTER TABLE chat_messages ADD COLUMN is_edited INTEGER DEFAULT 0;'); } catch {}
    try { db.exec('ALTER TABLE chat_messages ADD COLUMN edited_at TEXT;'); } catch {}
    try { db.exec('ALTER TABLE chat_messages ADD COLUMN edit_token TEXT;'); } catch {}

    // Seed default communities and sample threads if empty
    try {
      seedDefaultCommunities(db);
      const countRow = db.prepare(`SELECT COUNT(*) as count FROM threads`).get() as any;
      if (!countRow || countRow.count === 0) {
        seedInitialData(db);
      }
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

export function purgeExpiredData(): void {
  try {
    const database = getDatabase();
    const nowIso = new Date().toISOString();
    database.prepare(`DELETE FROM threads WHERE expires_at <= ?`).run(nowIso);
    database.prepare(`DELETE FROM comments WHERE thread_id NOT IN (SELECT id FROM threads)`).run();
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

export function getThreads(category?: string, sort: RedditSort = 'hot'): Thread[] {
  purgeExpiredData();
  const database = getDatabase();

  let query = `
    SELECT 
      t.*,
      (t.upvotes - t.downvotes) as score,
      (SELECT COUNT(*) FROM comments c WHERE c.thread_id = t.id) as comment_count
    FROM threads t
    WHERE 1=1
  `;
  const params: any[] = [];

  if (category && category !== 'all') {
    const cleanCat = category.replace(/^[zr]\//i, '');
    query += ` AND t.category = ?`;
    params.push(cleanCat);
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
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    category: r.category,
    flair: r.flair || null,
    source_url: r.source_url,
    media_url: r.media_url || null,
    media_type: (r.media_type as MediaType) || null,
    author_alias: r.author_alias,
    author_avatar: r.author_avatar,
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
  }));
}

export function getThreadById(id: string): Thread | null {
  purgeExpiredData();
  const database = getDatabase();
  const row = database.prepare(`
    SELECT 
      t.*,
      (t.upvotes - t.downvotes) as score,
      (SELECT COUNT(*) FROM comments c WHERE c.thread_id = t.id) as comment_count
    FROM threads t
    WHERE t.id = ?
  `).get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    flair: row.flair || null,
    source_url: row.source_url,
    media_url: row.media_url || null,
    media_type: (row.media_type as MediaType) || null,
    author_alias: row.author_alias,
    author_avatar: row.author_avatar,
    upvotes: Number(row.upvotes),
    downvotes: Number(row.downvotes),
    score: Number(row.score),
    comment_count: Number(row.comment_count),
    report_count: Number(row.report_count),
    is_hidden: Number(row.is_hidden),
    is_pinned: Number(row.is_pinned || 0),
    is_edited: Number(row.is_edited || 0),
    edited_at: row.edited_at || null,
    expires_at: row.expires_at,
    created_at: row.created_at,
  };
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
  author_alias: string;
  author_avatar: string;
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
    INSERT INTO threads (id, title, content, category, flair, source_url, media_url, media_type, author_alias, author_avatar, is_pinned, edit_token, is_edited, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    data.id,
    data.title,
    data.content,
    cleanCat,
    data.flair || null,
    data.source_url || null,
    data.media_url || null,
    data.media_type || null,
    data.author_alias,
    data.author_avatar,
    data.is_pinned ? 1 : 0,
    data.edit_token || null,
    expiresAt,
    createdAt
  );

  return getThreadById(data.id)!;
}

export function updateThread(id: string, data: {
  title: string;
  content: string;
  category?: string;
  flair?: string | null;
  source_url?: string | null;
  edit_token?: string | null;
}): { success: boolean; thread?: Thread; error?: string } {
  const database = getDatabase();
  const existing = database.prepare(`SELECT * FROM threads WHERE id = ?`).get(id) as any;
  if (!existing) {
    return { success: false, error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุแล้ว' };
  }

  // Check edit token
  if (existing.edit_token && data.edit_token && existing.edit_token !== data.edit_token) {
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

export function deleteThread(id: string, edit_token?: string | null): { success: boolean; error?: string } {
  const database = getDatabase();
  const existing = database.prepare(`SELECT * FROM threads WHERE id = ?`).get(id) as any;
  if (!existing) {
    return { success: false, error: 'ไม่พบกระทู้นี้ หรือกระทู้อาจหมดอายุแล้ว' };
  }

  if (existing.edit_token && edit_token && existing.edit_token !== edit_token) {
    return { success: false, error: 'รหัสยืนยันการลบ (Delete Passcode) ไม่ถูกต้อง' };
  }

  database.prepare(`DELETE FROM comments WHERE thread_id = ?`).run(id);
  database.prepare(`DELETE FROM threads WHERE id = ?`).run(id);

  return { success: true };
}

export function voteThread(id: string, type: 'up' | 'down'): { upvotes: number; downvotes: number; score: number } | null {
  const database = getDatabase();
  if (type === 'up') {
    database.prepare(`UPDATE threads SET upvotes = upvotes + 1 WHERE id = ?`).run(id);
  } else {
    database.prepare(`UPDATE threads SET downvotes = downvotes + 1 WHERE id = ?`).run(id);
  }

  const row = database.prepare(`SELECT upvotes, downvotes, (upvotes - downvotes) as score FROM threads WHERE id = ?`).get(id) as any;
  if (!row) return null;
  return {
    upvotes: Number(row.upvotes),
    downvotes: Number(row.downvotes),
    score: Number(row.score),
  };
}

export function getCommentsByThread(threadId: string): Comment[] {
  const database = getDatabase();
  const rows = database.prepare(`
    SELECT 
      c.*,
      (c.upvotes - c.downvotes) as score
    FROM comments c
    WHERE c.thread_id = ?
    ORDER BY c.created_at ASC
  `).all(threadId) as any[];

  return rows.map((r) => ({
    id: r.id,
    thread_id: r.thread_id,
    parent_id: r.parent_id,
    quote_text: r.quote_text,
    quote_author: r.quote_author,
    content: r.content,
    media_url: r.media_url || null,
    author_alias: r.author_alias,
    author_avatar: r.author_avatar,
    upvotes: Number(r.upvotes),
    downvotes: Number(r.downvotes),
    score: Number(r.score),
    report_count: Number(r.report_count),
    is_hidden: Number(r.is_hidden),
    created_at: r.created_at,
  }));
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
}): Comment {
  const database = getDatabase();
  const createdAt = new Date().toISOString();

  database.prepare(`
    INSERT INTO comments (id, thread_id, parent_id, quote_text, quote_author, content, media_url, author_alias, author_avatar, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    createdAt
  );

  const row = database.prepare(`SELECT *, (upvotes - downvotes) as score FROM comments WHERE id = ?`).get(data.id) as any;
  return {
    id: row.id,
    thread_id: row.thread_id,
    parent_id: row.parent_id,
    quote_text: row.quote_text,
    quote_author: row.quote_author,
    content: row.content,
    media_url: row.media_url || null,
    author_alias: row.author_alias,
    author_avatar: row.author_avatar,
    upvotes: Number(row.upvotes),
    downvotes: Number(row.downvotes),
    score: Number(row.score),
    report_count: Number(row.report_count),
    is_hidden: Number(row.is_hidden),
    created_at: row.created_at,
  };
}

export function voteComment(id: string, type: 'up' | 'down'): { upvotes: number; downvotes: number; score: number } | null {
  const database = getDatabase();
  if (type === 'up') {
    database.prepare(`UPDATE comments SET upvotes = upvotes + 1 WHERE id = ?`).run(id);
  } else {
    database.prepare(`UPDATE comments SET downvotes = downvotes + 1 WHERE id = ?`).run(id);
  }

  const row = database.prepare(`SELECT upvotes, downvotes, (upvotes - downvotes) as score FROM comments WHERE id = ?`).get(id) as any;
  if (!row) return null;
  return {
    upvotes: Number(row.upvotes),
    downvotes: Number(row.downvotes),
    score: Number(row.score),
  };
}

export function getChatMessages(roomId: string = 'global'): ChatMessage[] {
  pruneChatRoom(roomId);
  const database = getDatabase();
  const rows = database.prepare(`
    SELECT * FROM chat_messages 
    WHERE room_id = ? 
    ORDER BY created_at ASC
    LIMIT 100
  `).all(roomId) as any[];

  return rows.map((r) => ({
    id: r.id,
    room_id: r.room_id,
    content: r.content,
    author_alias: r.author_alias,
    author_avatar: r.author_avatar,
    report_count: Number(r.report_count),
    is_hidden: Number(r.is_hidden),
    is_edited: Number(r.is_edited || 0),
    edited_at: r.edited_at || null,
    created_at: r.created_at,
  }));
}

export function sendChatMessage(data: {
  id: string;
  room_id: string;
  content: string;
  author_alias: string;
  author_avatar: string;
  edit_token?: string | null;
}): ChatMessage {
  const database = getDatabase();
  const createdAt = new Date().toISOString();

  database.prepare(`
    INSERT INTO chat_messages (id, room_id, content, author_alias, author_avatar, edit_token, is_edited, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    data.id,
    data.room_id || 'global',
    data.content,
    data.author_alias,
    data.author_avatar,
    data.edit_token || null,
    createdAt
  );

  pruneChatRoom(data.room_id || 'global');

  return {
    id: data.id,
    room_id: data.room_id || 'global',
    content: data.content,
    author_alias: data.author_alias,
    author_avatar: data.author_avatar,
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
}): { success: boolean; message?: ChatMessage; error?: string } {
  const database = getDatabase();
  const existing = database.prepare(`SELECT * FROM chat_messages WHERE id = ?`).get(id) as any;
  if (!existing) {
    return { success: false, error: 'ไม่พบข้อความแชทนี้' };
  }

  // Validate ownership
  if (existing.edit_token && data.edit_token && existing.edit_token !== data.edit_token) {
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

  const updated = database.prepare(`SELECT * FROM chat_messages WHERE id = ?`).get(id) as any;
  return {
    success: true,
    message: {
      id: updated.id,
      room_id: updated.room_id,
      content: updated.content,
      author_alias: updated.author_alias,
      author_avatar: updated.author_avatar,
      report_count: Number(updated.report_count),
      is_hidden: Number(updated.is_hidden),
      is_edited: Number(updated.is_edited || 0),
      edited_at: updated.edited_at || null,
      created_at: updated.created_at,
    },
  };
}

export function deleteChatMessage(id: string, author_alias?: string, edit_token?: string): { success: boolean; error?: string } {
  const database = getDatabase();
  const existing = database.prepare(`SELECT * FROM chat_messages WHERE id = ?`).get(id) as any;
  if (!existing) {
    return { success: false, error: 'ไม่พบข้อความแชทนี้' };
  }

  if (existing.edit_token && edit_token && existing.edit_token !== edit_token) {
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
