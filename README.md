# 🛡️ นิรนามบอร์ด (ZRMA Anonymous Board & Live Chat)

เว็บแอปพลิเคชัน **"บอร์ดข่าว กระทู้พูดคุย และห้องสนทนาสด"** ที่ออกแบบตามหลักการ **Privacy by Design** และ **Zero-Trace Architecture** เพื่อมอบความเป็นส่วนตัวสูงสุดและไม่เปิดเผยตัวตนของผู้ใช้งาน 100%

---

## 🔒 1. สถาปัตยกรรมความปลอดภัยและความเป็นส่วนตัว (Privacy First)

| จุดเด่น | รายละเอียดทางเทคนิค |
|---|---|
| **ไม่ต้องสมัครสมาชิก / ไม่ขอข้อมูลใดๆ** | เข้าถึงและใช้งานได้ทันที ไม่ขอชื่อ อีเมล เบอร์โทร หรือข้อมูลระบุตัวตนใดๆ ทั้งสิ้น |
| **Zero-Log Database (ไม่มีการเก็บ IP)** | ในสคีมาฐานข้อมูล **ไม่มีฟิลด์ `ip_address` หรือ `user_agent` แม้แต่คอลัมน์เดียว** รวมถึงไม่ฝัง Tracking Cookie ใดๆ ลงในเบราว์เซอร์ |
| **สุ่มชื่อชั่วคราวแยกรายกระทู้ (Per-Thread Alias)** | ชื่อผู้ใช้จะถูกสุ่ม (เช่น `เหยี่ยวราตรี #2041`, `นักรหัสลับ #8812`) และจัดเก็บเฉพาะใน `sessionStorage` **โดยจะเปลี่ยนรหัสสุ่มใหม่ทุกครั้งเมื่อไปตอบในกระทู้อื่น** เพื่อป้องกันการแกะรอยข้ามกระทู้โดยสมบูรณ์ พร้อมปุ่มทอยสุ่มชื่อใหม่ได้ตลอดเวลา (🎲) |
| **ระบบทำลายข้อมูลอัตโนมัติ (Self-Destruct TTL)** | ผู้ตั้งกระทู้สามารถเลือกระยะเวลาลบกระทู้และข้อความอัตโนมัติ (24 ชั่วโมง, 3 วัน, 7 วัน) เมื่อครบกำหนด ข้อมูลจะถูกลบถาวรจากฐานข้อมูลทันที |
| **ป้องกันสแปมแบบไร้การติดตาม (Zero-Knowledge Anti-Spam)** | ใช้การคำนวณคณิตศาสตร์แบบไร้สถานะ (Stateless HMAC Math Challenge) ผสานกับการหน่วงเวลาฝั่งหน้าบ้าน (Client Cooldown Timer) แทนการบันทึก IP เพื่อแบน |

---

## 🚀 2. ฟีเจอร์หลักของระบบ

### 📰 บอร์ดข่าวและกระทู้เสวนา
- **ตั้งกระทู้ข่าวใหม่ได้ทันที**: ระบุหัวข้อ, หมวดหมู่, และลิงก์ข่าวต้นทาง (Source Link) พร้อมปุ่มเปิดไปยังแหล่งข่าวต้นฉบับอย่างปลอดภัย (`rel="noopener noreferrer"`)
- **หมวดหมู่ครอบคลุม**: 🚨 ข่าวด่วน (Breaking News), 💻 เทคโนโลยี, 🏛️ สังคมและการเมือง, 📈 เศรษฐกิจและการเงิน, 💬 ทั่วไป, 🔬 วิทยาศาสตร์
- **ระบบโหวต (Upvote / Downvote)**: ให้คะแนนกระทู้และความคิดเห็นแบบตอบสนองทันที
- **ตอบกลับแบบอ้างอิงข้อความ (Quote Reply)**: กดปุ่ม "อ้างอิงข้อความนี้" บนความคิดเห็นใดๆ ระบบจะดึงข้อความมาแสดงเป็น Quote Card ด้านบนช่องพิมพ์ตอบกลับ ช่วยให้ติดตามบทสนทนาที่ซับซ้อนได้อย่างชัดเจน

### 💬 ห้องแชทสด (Real-Time Live Chat)
- **ห้องสนทนาสดส่วนกลาง (Central Live Chat)**: หน้าคุยสดเฉพาะทางที่ `/chat` และ Sidebar สำหรับแลกเปลี่ยนข่าวสารแบบเรียลไทม์
- **ห้องแชทสดประจำกระทู้ (Thread-Specific Live Chat)**: สลับหน้าจอในกระทู้เพื่อเปิดห้องคุยสดเฉพาะประเด็นข่าวนั้นๆ ได้
- **จำกัด 100 ข้อความล่าสุด (FIFO Queue)**: เมื่อมีข้อความที่ 101 เข้ามา ระบบจะลบข้อความที่เก่าที่สุดออกทันทีอัตโนมัติ เพื่อป้องกันการสะสมของประวัติการสนทนา
- **เทคโนโลยี Real-Time**: ขับเคลื่อนด้วย Server-Sent Events (SSE) ร่วมกับ In-Memory Broadcaster เพื่อความเร็วสูงสุดและไม่ต้อง Polling

### ⚖️ ระบบดูแลความเรียบร้อยโดยชุมชน (Community Moderation)
- ทุกกระทู้, ความคิดเห็น และข้อความแชทสด มีปุ่มกด **"รายงาน" (Report)**
- เลือกระบุสาเหตุ: สแปม/โฆษณา, ข้อมูลเท็จ (Fake News), ผิดกฎหมาย, คุกคาม/Hate Speech
- **กฎเกณฑ์ชุมชนอัตโนมัติ**: หากข้อความใดได้รับการรายงานครบ **5 ครั้ง** ระบบจะซ่อนเนื้อหานั้นออกจากหน้าเว็บทันที (`is_hidden = 1`) โดยยังคงเปิดให้ผู้ใช้กดยืนยันเพื่อเปิดดูเนื้อหาเดิมได้หากต้องการ

---

## 🛠️ 3. โครงสร้างฐานข้อมูล (Database Schema)

### SQLite ในตัว (Node.js Native `node:sqlite`)
ระบบใช้ฐานข้อมูล SQLite ประสิทธิภาพสูงที่ติดมากับ Node.js v22+ โดยไฟล์ถูกจัดเก็บไว้ที่ `data/privacy_board.sqlite`:

```sql
-- 1. ตารางกระทู้ (ไร้ฟิลด์ระบุตัวตน / มีระบบ TTL)
CREATE TABLE threads (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
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

-- 2. ตารางความคิดเห็น (รองรับการอ้างอิงข้อความ Quote Reply)
CREATE TABLE comments (
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

-- 3. ตารางแชทสด (FIFO 100 ข้อความล่าสุด)
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL DEFAULT 'global',
  content TEXT NOT NULL,
  author_alias TEXT NOT NULL,
  author_avatar TEXT NOT NULL,
  report_count INTEGER DEFAULT 0,
  is_hidden INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- 4. ตารางรายงานเพื่อการดูแลชุมชน
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL, -- 'thread', 'comment', 'chat'
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### การปรับใช้กับ Supabase (Optional)
หากต้องการนำไประบบ Cloud ของ Supabase สามารถใช้ไฟล์ [supabase_schema.sql](supabase_schema.sql) ที่เตรียมไว้ให้ โดยมีฟังก์ชัน Trigger อัตโนมัติ:
- `prune_old_chat_messages()`: ลบข้อความที่เกิน 100 ข้อความอัตโนมัติ
- `auto_hide_reported_content()`: ซ่อนเนื้อหาอัตโนมัติเมื่อครบ 5 รายงาน
- Row Level Security (RLS) แบบ Public Anonymous

---

## 💻 4. วิธีการติดตั้งและรันโปรเจกต์ (Quickstart)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. รันโหมด Development (Hot-Reload)
npm run dev

# หรือ 3. บิลด์และรันโหมด Production (แนะนำสำหรับความเร็วสูงสุด)
npm run build
npm start
```

เข้าใช้งานผ่านเบราว์เซอร์ได้ที่: **`http://localhost:3000`**

---

## 📱 5. การออกแบบ (Design System)
- **ธีมหลัก Dark Mode**: ใช้โทนสีมืด (`#090d16` และ `#111726`) พร้อมเฉดสีมรกต (`Emerald`) สื่อถึงความปลอดภัยและความเป็นส่วนตัว
- **Mobile Responsive**: รองรับการใช้งานบนมือถืออย่างสมบูรณ์แบบ มีแท็บสลับระหว่าง "บอร์ดกระทู้" กับ "ห้องแชทสด" และแถบเลื่อนหมวดหมู่แนวนอน
- **Typography**: รองรับภาษาไทยอย่างสวยงามด้วย Fallback Fonts ที่อ่านสบายตา
