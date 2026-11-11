export type Category = string; // Dynamic z/community slug, e.g. 'tech', 'breaking', 'gaming', 'memes', etc.

export type RedditSort = 'hot' | 'new' | 'top' | 'rising' | 'breaking';

export type MediaType = 'image' | 'video';

export type AvatarFrame = 'none' | 'crimson' | 'amber' | 'emerald' | 'rainbow' | 'neon';

export type BannerTheme = 'obsidian' | 'crimson-grid' | 'amber-cyber' | 'aurora' | 'sunset';

export type NameColor = 'default' | 'red' | 'amber' | 'emerald' | 'cyan' | 'purple' | 'pink';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_icon: string;
  avatar_url?: string | null;
  avatar_frame: AvatarFrame;
  banner_theme: BannerTheme;
  name_color: NameColor;
  custom_badge?: string | null;
  created_at: string;
  post_count?: number;
  comment_count?: number;
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export interface PollData {
  question?: string | null;
  options: PollOption[];
  total_votes: number;
  closed?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  category: string; // z/{category}
  flair?: string | null;
  source_url?: string | null;
  media_url?: string | null;
  media_type?: MediaType | null;
  poll_data?: string | null;
  poll?: PollData | null;
  author_alias: string;
  author_avatar: string;
  author_user_id?: string | null;
  author_username?: string | null;
  author_avatar_url?: string | null;
  author_frame?: AvatarFrame | null;
  author_name_color?: NameColor | null;
  author_badge?: string | null;
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
  author_user_id?: string | null;
  author_username?: string | null;
  author_avatar_url?: string | null;
  author_frame?: AvatarFrame | null;
  author_name_color?: NameColor | null;
  author_badge?: string | null;
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
  author_user_id?: string | null;
  author_username?: string | null;
  author_avatar_url?: string | null;
  author_frame?: AvatarFrame | null;
  author_name_color?: NameColor | null;
  author_badge?: string | null;
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

export interface TickerItem {
  id: string;
  title: string;
  category: string;
  score: number;
  comment_count: number;
  is_pinned: number;
  created_at: string;
  badge: 'PINNED' | 'BREAKING' | 'RISING' | 'HOT';
}
