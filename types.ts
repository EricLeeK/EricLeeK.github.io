export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string; // Optional: use this for short posts
  contentPath?: string; // Optional: path to .md file in public folder (e.g., '/posts/my-story.md')
  date: string; // ISO date string
  readTime: string;
  tags: string[];
  coverImage?: string;
  author: string;
  category?: 'Personal Thoughts' | 'Hardcore Learning';
  // English Content
  titleEn?: string;
  excerptEn?: string;
  contentEn?: string;
  contentPathEn?: string;
}

export interface Musing {
  id: string;
  title: string;
  content: string;
  contentPath?: string; // Optional: path to .md file in public folder (e.g., '/musings/my-note.md')
  // English Content
  titleEn?: string;
  contentEn?: string;
  contentPathEn?: string;
}

export interface NavigationItem {
  label: string;
  path: string;
}