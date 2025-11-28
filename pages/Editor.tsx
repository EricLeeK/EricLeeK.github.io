import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Layout as LayoutIcon, AlertCircle } from 'lucide-react';
import { saveLocalPost } from '../services/blogService';
import { BlogPost } from '../types';
import { AUTHOR_NAME } from '../constants';

const Editor: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('# New Post\n\nStart writing here...');
  const [tags, setTags] = useState('');
  
  const handleSave = () => {
    if (!title || !content) {
        alert("Title and Content are required");
        return;
    }

    const newId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const wordCount = content.trim().split(/\s+/).length;
    const readTime = `${Math.ceil(wordCount / 200)} min read`;

    const newPost: BlogPost = {
        id: newId,
        title,
        excerpt: excerpt || content.substring(0, 150) + "...",
        content,
        date: new Date().toISOString(),
        readTime,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        author: AUTHOR_NAME,
        coverImage: `https://picsum.photos/seed/${newId}/800/400?grayscale`
    };

    saveLocalPost(newPost);
    navigate(`/post/${newId}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <LayoutIcon className="text-primary-600" />
            Post Editor
        </h1>
        <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary-500/30"
        >
            <Save size={18} />
            Publish Locally
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex gap-3 text-sm text-blue-800 dark:text-blue-200">
         <AlertCircle className="shrink-0" size={20} />
         <p>
            <strong>Note:</strong> Posts created here are saved to your browser's Local Storage. 
            They are perfect for drafting. To publish permanently to GitHub Pages, 
            add the JSON object to <code>constants.ts</code> in your code.
         </p>
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