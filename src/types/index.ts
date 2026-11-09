export type Category = 'breaking' | 'tech' | 'society' | 'finance' | 'general' | 'science';

export interface Thread {
  id: string;
  title: string;
  content: string;
  category: Category;
  source_url?: string | null;
  author_alias: string;
  author_avatar: string;
  upvotes: number;
  downvotes: number;
  score: number; // upvotes - downvotes
  comment_count: number;
  report_count: number;
  is_hidden: number; // 0 or 1
  expires_at: string;
  created_at: string;
}

export interface Comment {
  id: string;
  thread_id: string;
  parent_id?: string | null;
  quote_text?: string | null;
  quote_author?: string | null;
  content: string;
  author_alias: string;
  author_avatar: string;
  upvotes: number;
  downvotes: number;
  score: number;
  report_count: number;
  is_hidden: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string; // 'global' or threadId
  content: string;
  author_alias: string;
  author_avatar: string;
  report_count: number;
  is_hidden: number;
  created_at: string;
}

export type ReportReason = 'spam' | 'fake_news' | 'illegal' | 'harassment' | 'other';

export interface CaptchaChallenge {
  token: string;
  question: string;
}
