# 🛡️ ZRMA Community

เว็บแอปพลิเคชัน **"ชุมชนข่าวสาร กระทู้พูดคุย และห้องสนทนาสด สไตล์ Reddit"** ที่ออกแบบตามหลักการ **Privacy by Design**, **Anti-Slop Design** และ **Zero-Trace Architecture** เพื่อมอบความเป็นส่วนตัวสูงสุดและไม่เปิดเผยตัวตนของผู้ใช้งาน 100%

---

## 🌟 ฟีเจอร์สไตล์ Reddit (Reddit-Style Mechanics)

1. **โครงสร้างชุมชนและหมวดหมู่ย่อย (Subreddits / r/communities)**:
   - `r/all` — รวมโพสต์ทั้งหมด
   - `r/breaking` — ข่าวด่วนและสถานการณ์สำคัญ
   - `r/tech` — เทคโนโลยี, ไอที, CyberSec, AI, และความเป็นส่วนตัว
   - `r/finance` — เศรษฐกิจ, คริปโทเคอร์เรนซี และการเงิน
   - `r/society` — สังคมและการเมือง, นโยบายสาธารณะ
   - `r/general` — เสวนาแลกเปลี่ยนความคิดเห็นทั่วไป
   - `r/science` — วิทยาศาสตร์, นวัตกรรม และอวกาศ
2. **ระบบจัดเรียงฟีดโพสต์แบบ Reddit (Reddit Ranking Algorithm)**:
   - **Hot (🔥 มาแรง)**: คำนวณคะแนนตามสูตร Decay Algorithm (คะแนนโหวตผสานกับค่าความสดใหม่ของเวลา)
   - **New (✨ ล่าสุด)**: แสดงตามลำดับเวลาล่าสุด
   - **Top (🏆 ยอดนิยม)**: แสดงโพสต์ที่มีคะแนน Upvote สุทธิสูงสุด
   - **Rising (📈 กำลังพุ่ง)**: โพสต์ที่มีอัตราการตอบกลับและโหวตเพิ่มขึ้นอย่างรวดเร็ว
3. **การ์ดโพสต์สไตล์ Reddit (Reddit Post Card)**:
   - คอลัมน์โหวตซ้ายมือ (`▲ score ▼`) สีส้ม/เหลือง (Upvote) และแดง (Downvote)
   - ข้อมูลโพสต์: `r/community • โพสต์โดย u/author • time ago`
   - แถบเมนูด้านล่าง: 💬 ความคิดเห็น, 🔗 แชร์ (คัดลอกลิงก์), 🔖 บันทึกโพสต์ (Saved), 🚩 รายงาน
4. **ระบบความคิดเห็นแบบลูกโซ่จัดลำดับ (Threaded Nested Comment Tree)**:
   - แสดงผลแบบต้นไม้แบบ Reddit แท้จริง (Parent-Child Hierarchy)
   - เส้นแนวดิ่ง (`Threadline`) แสดงลำดับชั้น พร้อมปุ่ม `[-]` เพื่อย่อ/ขยายบทสนทนาย่อยได้อิสระ
   - ป้ายระบุผู้เขียนกระทู้ **`OP` (Original Poster)** อัตโนมัติ
   - ปุ่ม "ตอบกลับ" แทรกฟอร์มพิมพ์ใต้ความคิดเห็นนั้นๆ ได้โดยตรง
5. **แถบข้างชุมชน (Community Sidebar)**:
   - กล่องข้อมูล `About r/ZRMA`: คำอธิบายชุมชน, จำนวนสมาชิกนิรนาม, จำนวนผู้กำลังออนไลน์สด
   - กฎระเบียบชุมชน 4 ข้อ
   - ทางลัดเข้าสู่ห้องย่อย (Subreddits)
6. **ห้องแชทสด (Reddit Live Chat / r/lounge)**:
   - ห้องแชทส่วนกลาง `r/lounge` และห้องแชทสดประจำข่าวใหญ่ๆ สตรีมมิ่งแบบเรียลไทม์ด้วย Server-Sent Events (SSE) จำกัด 100 ข้อความล่าสุด (FIFO)

---

## 🔒 สถาปัตยกรรมความปลอดภัยและความเป็นส่วนตัว (Zero-Trace Architecture)

| จุดเด่น | การทำงาน |
|---|---|
| **ไม่ต้องสมัครสมาชิก / ไม่ขอข้อมูลใดๆ** | เข้าอ่าน โหวต และโพสต์ได้ทันที ไม่ขออีเมลหรือเบอร์โทรศัพท์ |
| **Zero-Log Database** | ฐานข้อมูลไม่มีฟิลด์ `ip_address` หรือ `user_agent` แม้แต่คอลัมน์เดียว |
| **สุ่มชื่อชั่วคราวแยกรายกระทู้ (u/alias)** | ชื่อสุ่มเก็บไว้เฉพาะใน `sessionStorage` และเปลี่ยนรหัสใหม่ทุกครั้งเมื่อไปตอบในกระทู้อื่น ป้องกันการแกะรอยข้ามกระทู้ |
| **ลบข้อมูลอัตโนมัติ (Self-Destruct TTL)** | ผู้ตั้งกระทู้เลือกเวลาลบข้อมูลได้ (24 ชั่วโมง, 3 วัน, 7 วัน) เมื่อครบกำหนด ข้อมูลจะถูกลบถาวรจาก Disk ทันที |
| **ป้องกันสแปมไร้การติดตาม (Stateless Captcha)** | ใช้การคำนวณเลขสุ่มแบบไร้สถานะ (HMAC Token) ผสาน Cooldown Timer แทนการแบน IP |
| **ดูแลความเรียบร้อยโดยชุมชน** | หากโพสต์หรือความคิดเห็นใดถูกรายงานครบ 5 ครั้ง ระบบจะซ่อนอัตโนมัติทันที |

---

## 🎨 ธีมสี (Color Palette)
- **ดำ (Black)**: `#090a0d`, `#101217`, `#161922`
- **แดง (Vivid Crimson Red)**: `#dc2626`, `#ef4444` (ปุ่มหลัก, โลโก้, ป้ายข่าวด่วน, Downvote)
- **เหลือง (Signal Yellow)**: `#facc15` (Upvote, สถานะออนไลน์, ป้าย OP, แท็ก Zero-Log)
- **ส้ม (Warm Amber/Orange)**: `#f97316` (เวลานับถอยหลัง TTL, ป้าย Hot, เส้นขอบ Quote)

---

## 🧱 เทคโนโลยีหลัก (Tech Stack)

- **Frontend / Fullstack Framework**: Next.js 15 (App Router, React 19, TypeScript, Tailwind CSS)
- **ORM**: Prisma (`@prisma/client` & `prisma`)
- **Database**: PostgreSQL 16 (รันผ่าน `docker-compose.yml` หรือ Cloud PostgreSQL)
- **Real-time**: Server-Sent Events (SSE)

---

## 💻 วิธีการรันโปรเจกต์ (Quickstart)

```bash
# 1. ติดตั้ง Dependencies และสร้าง Prisma Client
npm install

# 2. ตั้งค่า Environment (.env)
cp .env.example .env

# 3. เปิดฐานข้อมูล PostgreSQL 16 ด้วย Docker Desktop
docker compose up -d

# 4. ซิงก์ตารางเข้าสู่ PostgreSQL และเพิ่มข้อมูลเริ่มต้น
npx prisma db push
npm run prisma:seed

# 5. รันโหมด Production (แนะนำ)
npm run build
npm start

# หรือรันโหมด Development
npm run dev
```

เปิดใช้งานที่เบราว์เซอร์: **`http://localhost:3000`**
หรือดูตารางข้อมูลผ่าน GUI ได้ที่: **`npm run prisma:studio`**
