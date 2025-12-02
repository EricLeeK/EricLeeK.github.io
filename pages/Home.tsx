import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { getPosts } from '../services/blogService';
import { BlogPost } from '../types';

const Home: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    setPosts(getPosts());
  }, []);

  return (
    <div className="space-y-16 animate-fade-in">
      <div className="space-y-4 py-8 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-main dark:text-white font-serif">
              Thoughts & Ideas
            </h1>
            <p className="text-lg text-text-muted dark:text-gray-400 max-w-2xl leading-relaxed mx-auto md:mx-0">
              A collection of writings on development, design, and minimalism.
            </p>
          </div>
          <Link
            to="/musings"
            className="inline-flex items-center px-6 py-3 rounded-full border border-sage-200 dark:border-gray-700 text-sm font-bold text-sage-600 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-sage-50 dark:hover:bg-primary-900/20 hover:border-sage-300 dark:hover:border-primary-500 transition-all shadow-[0_4px_0_#e5e7eb] dark:shadow-[0_4px_0_#374151] active:translate-y-1 active:shadow-none"
          >
            进入碎碎念区
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-main dark:text-white font-serif">
            正式推文区
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {posts.map((post, index) => (
            <Link
              to={`/post/${post.id}`}
              key={post.id}
              className={`group flex flex-col bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${index === 0 ? 'md:col-span-2 md:flex-row md:items-center' : ''}`}
            >
              <div className={`relative overflow-hidden ${index === 0 ? 'md:w-1/2 md:h-full' : 'h-52'}`}>
                <div className="absolute inset-0 bg-sage-100 dark:bg-gray-700 animate-pulse" />
                <img
                  src={post.coverImage || `https://picsum.photos/seed/${post.id}/800/400?grayscale`}
                  alt={post.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 relative z-10"
                  loading="lazy"
                />
              </div>

              <div className={`p-8 flex flex-col justify-between ${index === 0 ? 'md:w-1/2 md:p-10 md:h-full' : 'flex-grow'}`}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs font-bold text-sage-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(post.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.readTime}
                    </div>
                  </div>

                  <h3 className="text-xl md:text-2xl font-bold text-text-main dark:text-white group-hover:text-salmon-400 dark:group-hover:text-salmon-400 transition-colors font-serif">
                    {post.title}
                  </h3>

                  <p className="text-text-muted dark:text-gray-300 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex gap-2">
                    {post.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sage-50 text-sage-600 dark:bg-gray-700 dark:text-gray-300 border border-sage-100 dark:border-gray-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="flex items-center text-sm font-bold text-salmon-400 dark:text-salmon-400 group-hover:gap-2 transition-all">
                    Read Article <ArrowRight size={16} className="ml-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;