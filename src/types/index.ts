export type Category = string; // Dynamic z/community slug, e.g. 'tech', 'breaking', 'gaming', 'memes', etc.

export type RedditSort = 'hot' | 'new' | 'top' | 'rising' | 'breaking';

export type MediaType = 'image' | 'video';

export interface Thread {
  id: string;
  title: string;
  content: string;
  category: string; // z/{category}
  flair?: string | null;
  source_url?: string | null;
  media_url?: string | null;
  media_type?: MediaType | null;
  author_alias: string;
  author_avatar: string;
  upvotes: number;
  downvotes: number;
  score: number; // upvotes - downvotes
  comment_count: number;
  report_count: number;
  is_hidden: number; // 0 or 1
  is_pinned?: number; // 0 or 1 for pinned breaking news
  is_edited?: number; // 0 or 1
  edited_at?: string | null;
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
  media_url?: string | null;
  author_alias: string;
  author_avatar: string;
  upvotes: number;
  downvotes: number;
  score: number;
  report_count: number;
  is_hidden: number;
  is_edited?: number; // 0 or 1
  edited_at?: string | null;
  created_at: string;
}

export interface CommentNode extends Comment {
  children: CommentNode[];
}

export interface ChatMessage {
  id: string;
  room_id: string;
  content: string;
  author_alias: string;
  author_avatar: string;
  report_count: number;
  is_hidden: number;
  is_edited?: number; // 0 or 1
  edited_at?: string | null;
  created_at: string;
}

export type ReportReason = 'spam' | 'fake_news' | 'illegal' | 'harassment' | 'other';

export interface CaptchaChallenge {
  token: string;
  question: string;
}

export interface Community {
  name: string; // e.g. 'tech', 'breaking', 'crypto' (slug without z/)
  title: string; // e.g. 'z/tech - ข่าวเทคโนโลยี & ซอฟต์แวร์'
  description: string;
  icon: string;
  post_count: number;
  created_at: string;
}

export interface GhostRoom {
  id: string;
  name: string; // unique slug e.g. 'ghost-alpha-492'
  title: string;
  topic?: string | null;
  creator_alias: string;
  active_users: number;
  last_active_at: string;
  is_destroyed: number;
  created_at: string;
}
