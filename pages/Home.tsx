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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              Thoughts & Ideas
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed mx-auto md:mx-0">
              A collection of writings on development, design, and minimalism.
            </p>
          </div>
          <Link
            to="/musings"
            className="inline-flex items-center px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/80 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
          >
            进入碎碎念区
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            正式推文区
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {posts.map((post, index) => (
            <Link
              to={`/post/${post.id}`}
              key={post.id}
              className={`group flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-primary-500/30 dark:hover:border-primary-500/30 transition-all duration-300 transform hover:-translate-y-1 ${index === 0 ? 'md:col-span-2 md:flex-row md:items-center' : ''}`}
            >
              <div className={`relative overflow-hidden ${index === 0 ? 'md:w-1/2 md:h-full' : 'h-48'}`}>
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <img
                  src={post.coverImage || `https://picsum.photos/seed/${post.id}/800/400?grayscale`}
                  alt={post.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 relative z-10"
                  loading="lazy"
                />
              </div>
              
              <div className={`p-6 flex flex-col justify-between ${index === 0 ? 'md:w-1/2 md:p-8 md:h-full' : 'flex-grow'}`}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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

                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex gap-2">
                    {post.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="flex items-center text-sm font-semibold text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
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