import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, Clock, User} from 'lucide-react';
import { getPostById } from '../services/blogService';
import { BlogPost } from '../types';

const Post: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | undefined>(undefined);
  const navigate = useNavigate();

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

  if (!post) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <article className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-16">
      <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 transition-colors mb-4">
        <ArrowLeft size={16} className="mr-1" /> Back to Home
      </Link>

      <header className="space-y-6 text-center">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {post.tags.map(tag => (
            <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              {tag}
            </span>
          ))}
        </div>
        
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-8">
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
      <div className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary-600 hover:prose-a:text-primary-500 prose-img:rounded-xl mx-auto">
        <ReactMarkdown
          components={{
             h1: ({node, ...props}) => <h2 className="text-3xl font-bold mt-12 mb-6" {...props} />, // Demote h1 to h2 in body
             h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-10 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />,
             p: ({node, ...props}) => <p className="mb-6 leading-relaxed text-gray-700 dark:text-gray-300" {...props} />,
             blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary-500 pl-4 italic my-6 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 py-2 pr-4 rounded-r" {...props} />,
             code: ({node, ...props}) => {
                const isInline = !String(props.children).includes('\n');
                return isInline 
                 ? <code className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono text-primary-700 dark:text-primary-300" {...props} />
                 : <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto my-6 text-sm font-mono shadow-inner"><code {...props} /></pre>
             }
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      <div className="pt-12 border-t border-gray-200 dark:border-gray-800 mt-12">
          <p className="text-center italic text-gray-500">
             Thanks for reading.
          </p>
      </div>
    </article>
  );
};

export default Post;