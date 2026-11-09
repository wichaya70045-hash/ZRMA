-- ==============================================================================
-- 🛡️ ZRMA Privacy First Anonymous News Board & Real-Time Chat
-- Supabase Schema (Zero-Log, Zero-IP, Zero Personal Data Architecture)
-- ==============================================================================

-- 1. THREADS TABLE (กระทู้และข่าวสาร)
CREATE TABLE IF NOT EXISTS public.threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'breaking', 'tech', 'society', 'finance', 'general', 'science'
    source_url TEXT,               -- แหล่งข่าวต้นทาง (ถ้ามี)
    author_alias VARCHAR(100) NOT NULL, -- ชื่อสุ่ม เช่น "ผู้ไม่ประสงค์ออกนาม #8392"
    author_avatar VARCHAR(50) NOT NULL, -- ไอคอนสุ่ม
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL, -- ลบอัตโนมัติตามระยะเวลา (TTL) เช่น 24 ชม., 3 วัน, 7 วัน
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for auto-cleanup and sorting
CREATE INDEX IF NOT EXISTS idx_threads_expires_at ON public.threads (expires_at);
CREATE INDEX IF NOT EXISTS idx_threads_category ON public.threads (category);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON public.threads (created_at DESC);

-- 2. COMMENTS TABLE (ความคิดเห็นและตอบกลับแบบอ้างอิง)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,
    quote_text TEXT,               -- ข้อความที่อ้างอิง
    quote_author VARCHAR(100),     -- ผู้ที่ถูกอ้างอิง
    content TEXT NOT NULL,
    author_alias VARCHAR(100) NOT NULL, -- ชื่อสุ่มประจำกระทู้ (เปลี่ยนใหม่ทุกกระทู้)
    author_avatar VARCHAR(50) NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON public.comments (thread_id);

-- 3. CHAT MESSAGES TABLE (ห้องแชทสด จำกัดประวัติ 100 ข้อความล่าสุด)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(50) NOT NULL DEFAULT 'global',
    content TEXT NOT NULL,
    author_alias VARCHAR(100) NOT NULL,
    author_avatar VARCHAR(50) NOT NULL,
    report_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_room_created ON public.chat_messages (room_id, created_at DESC);

-- 4. REPORTS TABLE (ระบบรายงานเพื่อดูแลความเรียบร้อย)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(20) NOT NULL, -- 'thread', 'comment', 'chat'
    target_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL,     -- 'spam', 'fake_news', 'illegal', 'harassment', 'other'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FUNCTION & TRIGGER: ลบข้อความแชทเกิน 100 ข้อความอัตโนมัติ (FIFO Queue)
CREATE OR REPLACE FUNCTION prune_old_chat_messages()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.chat_messages
    WHERE room_id = NEW.room_id
    AND id NOT IN (
        SELECT id FROM public.chat_messages
        WHERE room_id = NEW.room_id
        ORDER BY created_at DESC
        LIMIT 100
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prune_chat ON public.chat_messages;
CREATE TRIGGER trigger_prune_chat
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION prune_old_chat_messages();

-- 6. FUNCTION & TRIGGER: ซ่อนเนื้อหาอัตโนมัติเมื่อถูกรายงานครบ 5 ครั้ง
CREATE OR REPLACE FUNCTION auto_hide_reported_content()
RETURNS TRIGGER AS $$
DECLARE
    curr_reports INT;
BEGIN
    IF NEW.target_type = 'thread' THEN
        UPDATE public.threads 
        SET report_count = report_count + 1,
            is_hidden = CASE WHEN report_count + 1 >= 5 THEN TRUE ELSE is_hidden END
        WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'comment' THEN
        UPDATE public.comments 
        SET report_count = report_count + 1,
            is_hidden = CASE WHEN report_count + 1 >= 5 THEN TRUE ELSE is_hidden END
        WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'chat' THEN
        UPDATE public.chat_messages 
        SET report_count = report_count + 1,
            is_hidden = CASE WHEN report_count + 1 >= 5 THEN TRUE ELSE is_hidden END
        WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_hide ON public.reports;
CREATE TRIGGER trigger_auto_hide
AFTER INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION auto_hide_reported_content();

-- 7. FUNCTION: ล้างกระทู้ที่หมดอายุ (สามารถเรียกผ่าน pg_cron ได้)
CREATE OR REPLACE FUNCTION purge_expired_threads()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.threads WHERE expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. Row Level Security (RLS) - เปิดให้ทุกคนอ่านและเขียนได้โดยไม่ต้องล็อกอิน
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read threads" ON public.threads FOR SELECT USING (true);
CREATE POLICY "Allow public insert threads" ON public.threads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update threads vote" ON public.threads FOR UPDATE USING (true);

CREATE POLICY "Allow public read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update comments vote" ON public.comments FOR UPDATE USING (true);

CREATE POLICY "Allow public read chat" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert chat" ON public.chat_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert reports" ON public.reports FOR INSERT WITH CHECK (true);

-- Enable Realtime for Chat and Threads
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.threads;
