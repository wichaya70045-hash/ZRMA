/**
 * Shared idempotent PostgreSQL seed routine used by both `prisma/seed.mjs`
 * and runtime initialization in `src/lib/db.ts`.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {typeof import('@prisma/client').Prisma} Prisma
 */
export async function seedInitialDatabaseWithClient(prisma, Prisma) {
  const defaultCommunities = [
    { name: 'breaking', title: 'z/breaking', description: 'ข่าวด่วน เหตุการณ์สำคัญ และสถานการณ์สด', icon: 'radar' },
    { name: 'jobs', title: 'z/jobs', description: 'กระดานจ้างงาน ลงเสนองาน และเสนอตัวรับงานอิสระ', icon: 'briefcase' },
    { name: 'market', title: 'z/market', description: 'ตลาดซื้อขายของ ปล่อยของมือสอง สินค้าไอที และบริการ', icon: 'tag' },
    { name: 'tech', title: 'z/tech', description: 'เทคโนโลยี, AI, ซอฟต์แวร์, และความปลอดภัยไซเบอร์', icon: 'terminal' },
    { name: 'finance', title: 'z/finance', description: 'เศรษฐกิจ, การลงทุน, หุ้น, และคริปโทเคอร์เรนซี', icon: 'cpu' },
    { name: 'society', title: 'z/society', description: 'ประเด็นสังคม กฎหมาย และนโยบายสาธารณะ', icon: 'globe' },
    { name: 'general', title: 'z/general', description: 'แลกเปลี่ยนความคิดเห็นทั่วไป เสวนาเรื่องรอบตัว', icon: 'shield' },
    { name: 'gaming', title: 'z/gaming', description: 'วิดีโอเกม อีสปอร์ต คอนโซล และเกมพีซี', icon: 'key' },
    { name: 'science', title: 'z/science', description: 'วิทยาศาสตร์ นวัตกรรม อวกาศ และธรรมชาติ', icon: 'binary' },
    { name: 'memes', title: 'z/memes', description: 'มีม มุกตลก และเรื่องบันเทิงแบบนิรนาม', icon: 'eye-off' },
  ];

  await prisma.community.createMany({
    data: defaultCommunities,
    skipDuplicates: true,
  });

  const existingThreadsCount = await prisma.thread.count();
  const now = new Date();
  const d1 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const d3 = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const d7 = new Date(now.getTime() + 168 * 60 * 60 * 1000);

  if (existingThreadsCount === 0) {
    await prisma.thread.createMany({
      data: [
        {
          id: 'seed-thread-1',
          title: '🚨 ข่าวด่วน: มาตรการรักษาความปลอดภัยข้อมูลและความเป็นส่วนตัวดิจิทัลใหม่ ประกาศใช้แล้ววันนี้',
          content:
            'คณะกรรมการคุ้มครองข้อมูลฯ ได้ประกาศกรอบการกำกับดูแลใหม่ที่เข้มงวด มุ่งเน้นการลดการเก็บข้อมูลที่เกินความจำเป็น (Data Minimization) โดยสนับสนุนแพลตฟอร์มที่ไม่เปิดเผยตัวตน (Pseudonymous & Zero-Log Systems) เพื่อคืนสิทธิความเป็นส่วนตัวให้กับประชาชน\n\nหัวใจสำคัญคือการห้ามผู้ให้บริการเก็บ IP Address และประวัติการท่องเว็บโดยไม่จำเป็น เพื่อป้องกันการรั่วไหลและการสอดแนมทางไซเบอร์ที่กำลังเพิ่มขึ้นในปัจจุบัน',
          category: 'breaking',
          flair: 'ข่าวด่วน',
          sourceUrl: 'https://www.thaigov.go.th',
          authorAlias: 'u/เหยี่ยวราตรี #2041',
          authorAvatar: 'shield',
          isPinned: true,
          upvotes: 14,
          expiresAt: d3,
          createdAt: now,
        },
        {
          id: 'seed-thread-2',
          title: '💻 ทำไมระบบ Zero-Log และ Ephemeral Sessions ถึงเป็นอนาคตของการสื่อสารบนโลกอินเทอร์เน็ต?',
          content:
            'หลายปีที่ผ่านมา ข้อมูลส่วนบุคคลของผู้ใช้ทั่วโลกถูกนำไปขาย ยิงโฆษณา และตกเป็นเป้าหมายของมัลแวร์เรียกค่าไถ่\n\nการออกแบบระบบที่ไม่เก็บ Log เลยตั้งแต่ต้น (Zero-Log Architecture) ควบคู่กับชื่อสุ่มหรือชื่อตั้งเองแบบชั่วคราว ที่เปลี่ยนใหม่ทุกห้อง ทำให้ผู้ใช้สามารถพูดคุย แลกเปลี่ยนข้อมูลเชิงลึก และแสดงความคิดเห็นได้อย่างเสรีโดยไม่ต้องหวาดระแวงการถูก Digital Footprint เล่นงานย้อนหลัง\n\nทุกคนมีความเห็นอย่างไรกับการสื่อสารรูปแบบนี้?',
          category: 'tech',
          flair: 'บทวิเคราะห์',
          sourceUrl: 'https://eff.org',
          authorAlias: 'u/นักรหัสลับ #8812',
          authorAvatar: 'terminal',
          upvotes: 52,
          pollData: {
            question: 'คุณคิดว่าระบบ Zero-Log จำเป็นต่อการใช้อินเทอร์เน็ตในปัจจุบันมากน้อยเพียงใด?',
            options: [
              { id: 1, text: 'จำเป็นอย่างยิ่ง ข้อมูลและ IP ไม่ควรถูกบันทึก', votes: 42 },
              { id: 2, text: 'มีประโยชน์เฉพาะบางกรณีหรือข่าวสารที่อ่อนไหว', votes: 16 },
              { id: 3, text: 'ไม่จำเป็น แพลตฟอร์มทั่วไปก็เพียงพอแล้ว', votes: 3 },
            ],
            total_votes: 61,
            closed: false,
          },
          expiresAt: d7,
          createdAt: now,
        },
        {
          id: 'seed-thread-3',
          title: '💬 พูดคุยทั่วไป: วิธีจัดการความเครียดจากข้อมูลข่าวสารท่วมท้น (Information Overload)',
          content:
            'ทุกวันนี้เปิดโซเชียลมีเดียมีแต่ข่าวด่วน ข่าวเครียด อัลกอริทึมพยายามดึงเวลาและความสนใจของเราตลอด 24 ชม.\n\nมีใครมีวิธีตัดการเชื่อมต่อ (Digital Detox) หรือเลือกเสพเฉพาะข้อมูลที่จำเป็นโดยไม่ต้องเอาตัวตนจริงไปผูกกับแพลตฟอร์มบ้างไหมครับ?',
          category: 'general',
          flair: 'เสวนา',
          authorAlias: 'u/ก้อนเมฆลอยละล่อง #4159',
          authorAvatar: 'globe',
          upvotes: 9,
          expiresAt: d1,
          createdAt: now,
        },
      ],
      skipDuplicates: true,
    });

    await prisma.comment.createMany({
      data: [
        {
          id: 'seed-c-1',
          threadId: 'seed-thread-2',
          content:
            'เห็นด้วยมากๆ ครับ ปกติไปโพสต์ในบอร์ดอื่นจะกังวลเรื่องคนตามส่องประวัติย้อนหลัง ระบบเปลี่ยนชื่อทุกกระทู้นี่ตอบโจทย์มาก!',
          authorAlias: 'u/แมวส้มหลงทาง #1240',
          authorAvatar: 'cpu',
          upvotes: 6,
          createdAt: now,
        },
        {
          id: 'seed-c-2',
          threadId: 'seed-thread-2',
          parentId: 'seed-c-1',
          quoteText: 'ระบบเปลี่ยนชื่อทุกกระทู้นี่ตอบโจทย์มาก!',
          quoteAuthor: 'u/แมวส้มหลงทาง #1240',
          content:
            'ใช่เลยครับ ทำให้เราโฟกัสกับ "เนื้อหาของสาร" มากกว่า "ใครเป็นคนพูด" บอร์ดแบบนี้หาได้ยากมากในยุคปัจจุบัน',
          authorAlias: 'u/สายลมแปรปรวน #9931',
          authorAvatar: 'radar',
          upvotes: 4,
          createdAt: now,
        },
      ],
      skipDuplicates: true,
    });

    await prisma.chatMessage.createMany({
      data: [
        {
          id: 'seed-chat-1',
          roomId: 'global',
          content: 'ยินดีต้อนรับสู่ ZRMA Community Live Chat 🛡️ แลกเปลี่ยนแบบนิรนาม 100% ไม่มีการบันทึก IP ใดๆ',
          authorAlias: 'u/ระบบนิรนาม #0000',
          authorAvatar: 'shield',
          createdAt: now,
        },
      ],
      skipDuplicates: true,
    });
  }

  const jobsCount = await prisma.thread.count({
    where: { OR: [{ category: 'jobs' }, { jobData: { not: Prisma.DbNull } }] },
  });
  if (jobsCount === 0) {
    await prisma.thread.createMany({
      data: [
        {
          id: 'seed-job-hiring-1',
          title: '[จ้างงาน] หาผู้พัฒนา Next.js / TypeScript ทำเว็บแอปแดชบอร์ด (งาน Remote)',
          content:
            'ต้องการนักพัฒนาช่วยสร้างหน้า Dashboard พร้อมเชื่อม API และระบบ Chart ใช้เวลาทำงานประมาณ 1-2 สัปดาห์ กดปุ่ม "รับงาน / เสนอตัว" ด้านล่างเพื่อส่งรายละเอียดและเรทราคาได้เลยครับ',
          category: 'jobs',
          flair: 'เสนองาน',
          authorAlias: 'ProjectLead #8821',
          authorAvatar: 'cpu',
          upvotes: 12,
          jobData: {
            job_type: 'hiring',
            budget: '15,000 - 25,000 บาท',
            work_mode: 'remote',
            skills: ['Next.js', 'TypeScript', 'Tailwind CSS'],
            contact_info: 'แจ้งผ่านช่องรับงานหรือแชทสดของกระทู้',
            status: 'open',
            applications: [],
            application_count: 0,
          },
          expiresAt: d7,
          createdAt: new Date(now.getTime() - 25 * 60 * 1000),
        },
        {
          id: 'seed-job-seeking-1',
          title: '[รับงาน] รับตัดต่อวิดีโอสั้น Reels/TikTok, ออกแบบปก และกราฟิกแบนเนอร์ ส่งไวใน 24 ชม.',
          content:
            'มีประสบการณ์ตัดต่อและทำ Motion Graphic มากกว่า 3 ปี รับงานด่วน งานประจำ หรือเป็นโปรเจกต์ สามารถกดปุ่ม "ติดต่องาน / ยื่นข้อเสนอ" เพื่อแจ้งบรีฟงานได้เลยครับ',
          category: 'jobs',
          flair: 'รับงาน',
          authorAlias: 'PixelCraft #4109',
          authorAvatar: 'terminal',
          upvotes: 9,
          jobData: {
            job_type: 'seeking',
            budget: 'เริ่มต้น 500 - 2,500 บาท/ชิ้น',
            work_mode: 'remote',
            skills: ['Premiere Pro', 'After Effects', 'Graphic Design'],
            contact_info: 'แจ้งผ่านแบบฟอร์มเสนองานในกระทู้นี้',
            status: 'open',
            applications: [],
            application_count: 0,
          },
          expiresAt: d7,
          createdAt: new Date(now.getTime() - 55 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });
  }

  const marketCount = await prisma.thread.count({
    where: { OR: [{ category: 'market' }, { marketData: { not: Prisma.DbNull } }] },
  });
  if (marketCount === 0) {
    await prisma.thread.createMany({
      data: [
        {
          id: 'seed-market-1',
          title: '[ขาย] iPad Air 5 (M1) 64GB Wi-Fi สีสเปซเกรย์ สภาพ 98% กล่องครบ มีเคสแถม',
          content:
            'อุปกรณ์ครบกล่อง หัวชาร์จและสายชาร์จแท้ยังใหม่มาก ใช้งานเรียนและจดโน้ตเป็นหลัก แบตอึด สุขภาพแบต 94% ไม่เคยตกหล่นใดๆ นัดรับตามแนว BTS หรือจัดส่งพัสดุด่วนได้ครับ',
          category: 'market',
          flair: 'ไอที/มือถือ',
          authorAlias: 'TechTrader #1994',
          authorAvatar: 'cpu',
          upvotes: 15,
          isPinned: false,
          marketData: {
            item_name: 'iPad Air 5 64GB Wi-Fi',
            price: '฿12,900',
            condition: 'like_new',
            delivery: 'meetup',
            location: 'กทม. / BTS สยาม หรือ อารีย์',
            contact_info: 'Line ID: @anon_trader หรือทักแชทกระทู้',
            status: 'available',
          },
          expiresAt: d7,
          createdAt: new Date(now.getTime() - 30 * 60 * 1000),
        },
        {
          id: 'seed-market-2',
          title: '[ขาย] คีย์บอร์ด Keychron K2 Wireless Mechanical Switch Brown สภาพสวยพร้อมใช้',
          content:
            'ใช้งานทำงานเขียนโค้ด กดนุ่ม เสียงเพราะ เชื่อมบลูทูธได้ 3 อุปกรณ์ มีสาย USB-C ให้ อัปเกรดคีย์แคป PBT เรียบร้อย จัดส่งด่วน Flash Express ทั่วประเทศ',
          category: 'market',
          flair: 'คอมพิวเตอร์',
          authorAlias: 'KeebGeek #5520',
          authorAvatar: 'terminal',
          upvotes: 8,
          isPinned: false,
          marketData: {
            item_name: 'Keychron K2 Brown Switch',
            price: '฿2,200',
            condition: 'used',
            delivery: 'shipping',
            location: 'เชียงใหม่ (ส่งพัสดุฟรี)',
            contact_info: 'Line หรือพิมพ์ในห้องแชทสดประจำโพสต์',
            status: 'available',
          },
          expiresAt: d7,
          createdAt: new Date(now.getTime() - 65 * 60 * 1000),
        },
      ],
      skipDuplicates: true,
    });
  }
}
