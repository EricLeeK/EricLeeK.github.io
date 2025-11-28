export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // Markdown content
  date: string; // ISO date string
  readTime: string;
  tags: string[];
  coverImage?: string;
  author: string;
}

export interface NavigationItem {
  label: string;
  path: string;
}