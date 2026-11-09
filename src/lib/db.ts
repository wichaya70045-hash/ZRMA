import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { Thread, Comment, CommentNode, ChatMessage, Category, RedditSort } from '@/types';

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
      CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        flair TEXT,
        source_url TEXT,
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
    `);

    // Safely ensure flair column exists if table was created in an older build
    try {
      db.exec('ALTER TABLE threads ADD COLUMN flair TEXT;');
    } catch {
      // column already exists
    }

    try {
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
      INSERT OR IGNORE INTO threads (id, title, content, category, flair, source_url, author_alias, author_avatar, expires_at, created_at, upvotes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertThread.run(
      thread1Id,
      '🚨 ข่าวด่วน: มาตรการรักษาความปลอดภัยข้อมูลและความเป็นส่วนตัวดิจิทัลใหม่ ประกาศใช้แล้ววันนี้',
      'คณะกรรมการคุ้มครองข้อมูลฯ ได้ประกาศกรอบการกำกับดูแลใหม่ที่เข้มงวด มุ่งเน้นการลดการเก็บข้อมูลที่เกินความจำเป็น (Data Minimization) โดยสนับสนุนแพลตฟอร์มที่ไม่เปิดเผยตัวตน (Pseudonymous & Zero-Log Systems) เพื่อคืนสิทธิความเป็นส่วนตัวให้กับประชาชน\n\nหัวใจสำคัญคือการห้ามผู้ให้บริการเก็บ IP Address และประวัติการท่องเว็บโดยไม่จำเป็น เพื่อป้องกันการรั่วไหลและการสอดแนมทางไซเบอร์ที่กำลังเพิ่มขึ้นในปัจจุบัน',
      'breaking',
      'ข่าวด่วน',
      'https://www.thaigov.go.th',
      'เหยี่ยวราตรี #2041',
      'shield',
      d3,
      nowIso,
      12
    );

    insertThread.run(
      thread2Id,
      '💻 ทำไมระบบ Zero-Log และ Ephemeral Sessions ถึงเป็นอนาคตของการสื่อสารบนโลกอินเทอร์เน็ต?',
      'หลายปีที่ผ่านมา ข้อมูลส่วนบุคคลของผู้ใช้ทั่วโลกถูกนำไปขาย ยิงโฆษณา และตกเป็นเป้าหมายของมัลแวร์เรียกค่าไถ่\n\nการออกแบบระบบที่ไม่เก็บ Log เลยตั้งแต่ต้น (Zero-Log Architecture) ควบคู่กับชื่อสุ่มแบบชั่วคราว (Ephemeral Identity) ที่เปลี่ยนใหม่ทุกห้อง ทำให้ผู้ใช้สามารถพูดคุย แลกเปลี่ยนข้อมูลเชิงลึก และแสดงความคิดเห็นได้อย่างเสรีโดยไม่ต้องหวาดระแวงการถูก Digital Footprint เล่นงานย้อนหลัง\n\nทุกคนมีความเห็นอย่างไรกับการสื่อสารรูปแบบนี้?',
      'tech',
      'บทวิเคราะห์',
      'https://eff.org',
      'นักรหัสลับ #8812',
      'terminal',
      d7,
      nowIso,
      48
    );

    insertThread.run(
      thread3Id,
      '💬 พูดคุยทั่วไป: วิธีจัดการความเครียดจากข้อมูลข่าวสารท่วมท้น (Information Overload)',
      'ทุกวันนี้เปิดโซเชียลมีเดียมีแต่ข่าวด่วน ข่าวเครียด อัลกอริทึมพยายามดึงเวลาและความสนใจของเราตลอด 24 ชม.\n\nมีใครมีวิธีตัดการเชื่อมต่อ (Digital Detox) หรือเลือกเสพเฉพาะข้อมูลที่จำเป็นโดยไม่ต้องเอาตัวตนจริงไปผูกกับแพลตฟอร์มบ้างไหมครับ?',
      'general',
      'เสวนา',
      null,
      'ก้อนเมฆลอยละล่อง #4159',
      'globe',
      d1,
      nowIso,
      8
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
      'แมวส้มหลงทาง #1240',
      'cpu',
      nowIso,
      5
    );

    insertComment.run(
      'seed-c-2',
      thread2Id,
      'seed-c-1',
      'ระบบเปลี่ยนชื่อทุกกระทู้นี่ตอบโจทย์มาก!',
      'แมวส้มหลงทาง #1240',
      'ใช่เลยครับ ทำให้เราโฟกัสกับ "เนื้อหาของสาร" มากกว่า "ใครเป็นคนพูด" บอร์ดแบบนี้หาได้ยากมากในยุคปัจจุบัน',
      'สายลมแปรปรวน #9931',
      'radar',
      nowIso,
      3
    );

    const insertChat = database.prepare(`
      INSERT OR IGNORE INTO chat_messages (id, room_id, content, author_alias, author_avatar, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertChat.run(
      'seed-chat-1',
      'global',
      'ยินดีต้อนรับสู่ ZRMA Community Live Chat 🛡️ แลกเปลี่ยนแบบนิรนาม 100% ไม่มีการบันทึก IP ใดๆ',
      'ระบบนิรนาม #0000',
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

/**
 * Thread operations with Reddit-grade sorting:
 * - 'hot': Score weighted by time decay
 * - 'new': Chronological (latest)
 * - 'top': Highest net upvotes
 * - 'rising': High comment & vote velocity
 * - 'breaking': Breaking news
 */
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
    query += ` AND t.category = ?`;
    params.push(category);
  }

  // Reddit Sorting Engine
  if (sort === 'hot') {
    // Reddit-style decay formula: score weighted with timestamp in seconds
    query += ` ORDER BY ((t.upvotes - t.downvotes) * 1000 + unixepoch(t.created_at) / 100) DESC, t.created_at DESC`;
  } else if (sort === 'new') {
    query += ` ORDER BY t.created_at DESC`;
  } else if (sort === 'top') {
    query += ` ORDER BY score DESC, t.created_at DESC`;
  } else if (sort === 'rising') {
    query += ` ORDER BY comment_count DESC, score DESC, t.created_at DESC`;
  } else if (sort === 'breaking') {
    query += ` AND t.category = 'breaking' ORDER BY t.created_at DESC`;
  } else {
    query += ` ORDER BY t.created_at DESC`;
  }

  query += ` LIMIT 50`;

  const rows = database.prepare(query).all(...params) as any[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    category: r.category as Category,
    flair: r.flair || null,
    source_url: r.source_url,
    author_alias: r.author_alias,
    author_avatar: r.author_avatar,
    upvotes: Number(r.upvotes),
    downvotes: Number(r.downvotes),
    score: Number(r.score),
    comment_count: Number(r.comment_count),
    report_count: Number(r.report_count),
    is_hidden: Number(r.is_hidden),
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
    category: row.category as Category,
    flair: row.flair || null,
    source_url: row.source_url,
    author_alias: row.author_alias,
    author_avatar: row.author_avatar,
    upvotes: Number(row.upvotes),
    downvotes: Number(row.downvotes),
    score: Number(row.score),
    comment_count: Number(row.comment_count),
    report_count: Number(row.report_count),
    is_hidden: Number(row.is_hidden),
    expires_at: row.expires_at,
    created_at: row.created_at,
  };
}

export function createThread(data: {
  id: string;
  title: string;
  content: string;
  category: Category;
  flair?: string | null;
  source_url?: string | null;
  author_alias: string;
  author_avatar: string;
  expires_hours: number;
}): Thread {
  const database = getDatabase();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + data.expires_hours * 60 * 60 * 1000).toISOString();
  const createdAt = now.toISOString();

  database.prepare(`
    INSERT INTO threads (id, title, content, category, flair, source_url, author_alias, author_avatar, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id,
    data.title,
    data.content,
    data.category,
    data.flair || null,
    data.source_url || null,
    data.author_alias,
    data.author_avatar,
    expiresAt,
    createdAt
  );

  return getThreadById(data.id)!;
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

/**
 * Comments operations
 */
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

export { buildCommentTree } from './commentTree';

export function createComment(data: {
  id: string;
  thread_id: string;
  parent_id?: string | null;
  quote_text?: string | null;
  quote_author?: string | null;
  content: string;
  author_alias: string;
  author_avatar: string;
}): Comment {
  const database = getDatabase();
  const createdAt = new Date().toISOString();

  database.prepare(`
    INSERT INTO comments (id, thread_id, parent_id, quote_text, quote_author, content, author_alias, author_avatar, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id,
    data.thread_id,
    data.parent_id || null,
    data.quote_text || null,
    data.quote_author || null,
    data.content,
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

/**
 * Chat operations
 */
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
    created_at: r.created_at,
  }));
}

export function sendChatMessage(data: {
  id: string;
  room_id: string;
  content: string;
  author_alias: string;
  author_avatar: string;
}): ChatMessage {
  const database = getDatabase();
  const createdAt = new Date().toISOString();

  database.prepare(`
    INSERT INTO chat_messages (id, room_id, content, author_alias, author_avatar, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.id,
    data.room_id || 'global',
    data.content,
    data.author_alias,
    data.author_avatar,
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
    created_at: createdAt,
  };
}

/**
 * Community Reports
 */
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
