import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, Clock, User, Copy, Check, Terminal } from 'lucide-react';
import { getPostById } from '../services/blogService';
import { BlogPost } from '../types';

const Post: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | undefined>(undefined);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // 1. Fetch Post Metadata
  useEffect(() => {
    if (id) {
      const foundPost = getPostById(id);
      if (foundPost) {
        setPost(foundPost);
      } else {
        navigate('/');
      }
    }
  }, [id, navigate]);

  // 2. Fetch Content (Inline or External)
  useEffect(() => {
    if (!post) return;

    const loadContent = async () => {
      // Priority 1: Inline content (Drafts or short posts)
      if (post.content) {
        setMarkdownContent(post.content);
        return;
      }

      // Priority 2: External file (for large permanent posts)
      if (post.contentPath) {
        setIsLoadingContent(true);
        try {
          const response = await fetch(post.contentPath);
          if (!response.ok) {
            throw new Error(`Failed to load content from ${post.contentPath}`);
          }
          const text = await response.text();
          setMarkdownContent(text);
        } catch (error) {
          console.error(error);
          setMarkdownContent("# Error\n\nFailed to load post content. Please check if the markdown file exists in the public folder.");
        } finally {
          setIsLoadingContent(false);
        }
      }
    };

    loadContent();
  }, [post]);

  const handleCopyJson = () => {
    if (post) {
      const postToCopy = {
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        // We give the user a hint if they want to use external files
        content: post.content ? post.content : undefined,
        contentPath: post.contentPath ? post.contentPath : undefined,
        date: post.date,
        readTime: post.readTime,
        tags: post.tags,
        author: post.author,
        coverImage: post.coverImage
      };

      // Remove undefined keys for cleaner JSON
      const cleanPost = JSON.parse(JSON.stringify(postToCopy));

      const jsonString = JSON.stringify(cleanPost, null, 2);
      navigator.clipboard.writeText(jsonString + ",");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!post) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <article className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-16">
      <Link to="/" className="inline-flex items-center text-sm text-text-muted hover:text-sage-600 transition-colors mb-4 font-bold">
        <ArrowLeft size={16} className="mr-1" /> Back to Home
      </Link>

      <header className="space-y-6 text-center">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {post.tags.map(tag => (
            <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold bg-sage-50 text-sage-600 dark:bg-primary-900/30 dark:text-primary-300 border border-sage-100">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-main dark:text-white leading-tight font-serif">
          {post.title}
        </h1>

        <div className="flex items-center justify-center gap-6 text-sm text-text-muted dark:text-gray-400 border-b border-sage-100 dark:border-gray-800 pb-8 font-medium">
          <div className="flex items-center gap-2">
            <User size={16} />
            <span>{post.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{new Date(post.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{post.readTime}</span>
          </div>
        </div>
      </header>

      {post.coverImage && (
        <div className="rounded-2xl overflow-hidden shadow-lg mb-10">
          <img src={post.coverImage} alt={post.title} className="w-full h-auto object-cover max-h-[500px]" />
        </div>
      )}

      {/* Markdown Content Area */}
      <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary-600 hover:prose-a:text-primary-500 prose-img:rounded-xl mx-auto min-h-[200px] font-serif">
        {isLoadingContent ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12 opacity-60">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Loading content...</p>
          </div>
        ) : (
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900 dark:text-sage-400" {...props} />, // Demote h1 to h2 in body
              h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-10 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-sage-400" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-8 mb-3 text-gray-900 dark:text-sage-400" {...props} />,
              p: ({ node, ...props }) => <p className="mb-6 leading-relaxed text-gray-700 dark:text-gray-300" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary-500 pl-4 italic my-6 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 py-2 pr-4 rounded-r" {...props} />,
              code: ({ node, ...props }) => {
                const isInline = !String(props.children).includes('\n');
                return isInline
                  ? <code className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono text-primary-700 dark:text-primary-300" {...props} />
                  : <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto my-6 text-sm font-mono shadow-inner"><code {...props} /></pre>
              }
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        )}
      </div>

      <div className="pt-12 border-t border-gray-200 dark:border-gray-800 mt-12 flex flex-col items-center gap-6">
        <p className="italic text-gray-500">
          Thanks for reading.
        </p>

        {/* Admin / Developer Tools */}
        <div className="w-full max-w-lg bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <Terminal size={14} />
              <span>Developer Config</span>
            </div>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600 transition-colors"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy JSON"}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            To reduce file size, you can save the content to a <code>.md</code> file in <code>/public</code> and use <code>contentPath</code> instead of <code>content</code>.
          </p>
        </div>
      </div>
    </article>
  );
};

export default Post;