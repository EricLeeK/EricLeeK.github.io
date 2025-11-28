import { BlogPost } from '../types';
import { INITIAL_POSTS } from '../constants';

const STORAGE_KEY = 'zenblog_local_posts';

export const getPosts = (): BlogPost[] => {
  // Combine hardcoded posts with local storage posts (for drafting)
  const localPostsJson = localStorage.getItem(STORAGE_KEY);
  const localPosts: BlogPost[] = localPostsJson ? JSON.parse(localPostsJson) : [];
  
  // Return all posts, sorted by date descending
  return [...localPosts, ...INITIAL_POSTS].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const getPostById = (id: string): BlogPost | undefined => {
  const allPosts = getPosts();
  return allPosts.find(post => post.id === id);
};

export const saveLocalPost = (post: BlogPost): void => {
  const localPostsJson = localStorage.getItem(STORAGE_KEY);
  let localPosts: BlogPost[] = localPostsJson ? JSON.parse(localPostsJson) : [];
  
  // Check if updating or creating
  const existingIndex = localPosts.findIndex(p => p.id === post.id);
  if (existingIndex >= 0) {
    localPosts[existingIndex] = post;
  } else {
    localPosts.push(post);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localPosts));
};

export const deleteLocalPost = (id: string): void => {
  const localPostsJson = localStorage.getItem(STORAGE_KEY);
  if (!localPostsJson) return;
  
  let localPosts: BlogPost[] = JSON.parse(localPostsJson);
  localPosts = localPosts.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localPosts));
};