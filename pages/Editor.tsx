import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Layout as LayoutIcon, AlertCircle, Copy, Check, Trash2 } from 'lucide-react';
import { saveLocalPost } from '../services/blogService';
import { BlogPost } from '../types';
import { AUTHOR_NAME } from '../constants';

const DRAFT_KEY = 'zenblog_editor_draft';

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('# New Post\n\nStart writing here...');
  const [tags, setTags] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setTitle(draft.title || '');
        setExcerpt(draft.excerpt || '');
        setContent(draft.content || '# New Post\n\nStart writing here...');
        setTags(draft.tags || '');
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save draft on change
  useEffect(() => {
    if (!isLoaded) return;
    const draft = { title, excerpt, content, tags };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [title, excerpt, content, tags, isLoaded]);

  const clearDraft = () => {
    if (window.confirm("Are you sure you want to clear the editor?")) {
      setTitle('');
      setExcerpt('');
      setContent('# New Post\n\nStart writing here...');
      setTags('');
      localStorage.removeItem(DRAFT_KEY);
    }
  };
  
  const generatePostObject = (): BlogPost | null => {
    if (!title) {
        alert("Title is required");
        return null;
    }

    const newId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const wordCount = (content || '').trim().split(/\s+/).length;
    const readTime = `${Math.ceil(wordCount / 200)} min read`;

    return {
        id: newId,
        title,
        excerpt: excerpt || (content || '').substring(0, 150) + "...",
        content: content || '',
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        readTime,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        author: AUTHOR_NAME,
        // Optional: you can manually change this later
        coverImage: `https://picsum.photos/seed/${newId}/800/400?grayscale` 
    };
  };

  const handleSave = () => {
    const newPost = generatePostObject();
    if (newPost) {
        saveLocalPost(newPost);
        // Note: We do NOT clear the draft here, so user can come back and edit/copy if needed.
        navigate(`/post/${newPost.id}`);
    }
  };

  const handleCopyJson = () => {
    const newPost = generatePostObject();
    if (newPost) {
        const jsonString = JSON.stringify(newPost, null, 2);
        navigator.clipboard.writeText(jsonString + ",");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <LayoutIcon className="text-primary-600" />
            Post Editor
        </h1>
        <div className="flex flex-wrap gap-2">
            <button
                onClick={clearDraft}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Clear Draft"
            >
                <Trash2 size={18} />
            </button>
            <button
                onClick={handleCopyJson}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                title="Copy JSON to paste into constants.ts"
            >
                {copied ? <Check size={18} className="text-green-500"/> : <Copy size={18} />}
                {copied ? "Copied!" : "Copy Code"}
            </button>
            <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary-500/30"
            >
                <Save size={18} />
                Preview / Publish Local
            </button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex gap-3 text-sm text-blue-800 dark:text-blue-200">
         <AlertCircle className="shrink-0 mt-0.5" size={20} />
         <div>
            <p className="font-semibold mb-1">Auto-save Enabled</p>
            <p>Your content is saved to your browser automatically. You can safely leave this page and come back.</p>
         </div>
      </div>

      <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter post title..."
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Excerpt</label>
            <input
                type="text"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="Brief summary for the home page..."
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma separated)</label>
            <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="Design, Tech, Life..."
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content (Markdown)</label>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-mono text-sm leading-relaxed"
                placeholder="# Write your masterpiece..."
            />
        </div>
      </div>
    </div>
  );
};

export default Editor;