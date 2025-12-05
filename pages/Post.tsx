import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { getPostById } from '../services/blogService';
import { BlogPost } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const Post: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const [post, setPost] = useState<BlogPost | undefined>(undefined);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [tabs, setTabs] = useState<{ title: string, content: string }[] | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [introContent, setIntroContent] = useState<string>('');
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
      // Check for English content if language is English
      if (language === 'en' && post.contentEn) {
        setMarkdownContent(post.contentEn);
        return;
      }
      if (post.content) {
        setMarkdownContent(post.content);
        return;
      }

      // Priority 2: External file (for large permanent posts)
      // Check for English content path if language is English
      const path = (language === 'en' && post.contentPathEn) ? post.contentPathEn : post.contentPath;

      if (path) {
        setIsLoadingContent(true);
        try {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`Failed to load content from ${path}`);
          }
          const text = await response.text();

          // Check for tabs
          const tabRegex = /<!-- TAB_BREAK: (.*?) -->/g;
          const parts = text.split(tabRegex);

          if (parts.length > 1) {
            // Format: [Intro, Title1, Content1, Title2, Content2, ...]
            const newTabs = [];
            setIntroContent(parts[0]);

            for (let i = 1; i < parts.length; i += 2) {
              newTabs.push({
                title: parts[i].trim(),
                content: parts[i + 1]
              });
            }
            setTabs(newTabs);
            setActiveTab(0);
            setMarkdownContent('');
          } else {
            setMarkdownContent(text);
            setTabs(null);
          }
        } catch (error) {
          console.error(error);
          setMarkdownContent("# Error\n\nFailed to load post content. Please check if the markdown file exists in the public folder.");
        } finally {
          setIsLoadingContent(false);
        }
      }
    };

    loadContent();
  }, [post, language]);

  const markdownComponents = {
    h1: ({ node, ...props }: any) => <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-900 dark:text-sage-400" {...props} />,
    h2: ({ node, ...props }: any) => <h2 className="text-2xl font-bold mt-10 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-sage-400" {...props} />,
    h3: ({ node, ...props }: any) => <h3 className="text-xl font-bold mt-8 mb-3 text-gray-900 dark:text-sage-400" {...props} />,
    p: ({ node, ...props }: any) => <p className="mb-6 leading-relaxed text-gray-700 dark:text-gray-300" {...props} />,
    blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-primary-500 pl-4 italic my-6 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 py-2 pr-4 rounded-r" {...props} />,
    pre: ({ children }: any) => <>{children}</>,
    code: ({ node, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match && !String(children).includes('\n');

      return !isInline && match ? (
        <div className="rounded-xl overflow-hidden my-6">
          <SyntaxHighlighter
            style={dracula}
            language={match[1]}
            PreTag="div"
            className="scrollbar-dark"
            customStyle={{ margin: 0, padding: '1.5rem' }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono text-primary-700 dark:text-primary-300" {...props}>
          {children}
        </code>
      );
    }
  };

  if (!post) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <article className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-16">
      <Link to="/" className="inline-flex items-center text-sm text-text-muted hover:text-sage-600 transition-colors mb-4 font-bold">
        <ArrowLeft size={16} className="mr-1" /> {t('post.back')}
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
          {language === 'en' && post.titleEn ? post.titleEn : post.title}
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
        ) : tabs ? (
          <div>
            {/* Intro Section */}
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[[rehypeKatex, { trust: true, strict: false, leqno: false, globalGroup: true }]]}
              components={markdownComponents}
            >
              {introContent}
            </ReactMarkdown>

            {/* Tab Navigation */}
            <div id="tab-navigation" className="flex flex-wrap gap-3 mb-8 scroll-mt-24">
              {tabs.map((tab, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border-2 ${activeTab === index
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-500 shadow-md transform scale-105'
                    : 'border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                >
                  {tab.title}
                </button>
              ))}
            </div>

            {/* Active Tab Content */}
            <div className="animate-fade-in">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[[rehypeKatex, { trust: true, strict: false, leqno: false, globalGroup: true }]]}
                components={markdownComponents}
              >
                {tabs[activeTab].content}
              </ReactMarkdown>

              {/* Back to Tabs Button */}
              <div className="mt-8 flex justify-center">
                <a
                  href="#tab-navigation"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('tab-navigation')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  ↑ {t('post.backToTabs')}
                </a>
              </div>
            </div>
          </div>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[[rehypeKatex, { trust: true, strict: false, leqno: false, globalGroup: true }]]}
            components={markdownComponents}
          >
            {markdownContent}
          </ReactMarkdown>
        )}
      </div>

      <div className="pt-12 border-t border-gray-200 dark:border-gray-800 mt-12 flex flex-col items-center gap-6">
        <p className="italic text-gray-500">
          Thanks for reading.
        </p>
      </div>
    </article>
  );
};

export default Post;