import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { getPosts } from '../services/blogService';
import { BlogPost } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const Home: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const { language, t } = useLanguage();

  useEffect(() => {
    setPosts(getPosts());
  }, []);

  const [activeCategory, setActiveCategory] = useState<'Personal Thoughts' | 'Hardcore Learning'>('Personal Thoughts');

  const filteredPosts = posts.filter(post => {
    if (activeCategory === 'Personal Thoughts') {
      return post.category === 'Personal Thoughts' || !post.category;
    }
    return post.category === 'Hardcore Learning';
  });

  return (
    <div className="space-y-16 animate-fade-in">
      <div className="space-y-4 py-8 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text-main dark:text-white font-serif">
              {t('home.hero.title')}
            </h1>
            <p className="text-lg text-text-muted dark:text-gray-400 max-w-2xl leading-relaxed mx-auto md:mx-0">
              {t('home.hero.subtitle')}
            </p>
          </div>
          <Link
            to="/musings"
            className="inline-flex items-center px-6 py-3 rounded-full border border-sage-200 dark:border-gray-700 text-sm font-bold text-sage-600 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-sage-50 dark:hover:bg-primary-900/20 hover:border-sage-300 dark:hover:border-primary-500 transition-all shadow-[0_4px_0_#e5e7eb] dark:shadow-[0_4px_0_#374151] active:translate-y-1 active:shadow-none"
          >
            {t('home.enterMusings')}
            <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>

        {/* Category Navigation (Small Tags) */}
        <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
          <button
            onClick={() => setActiveCategory('Personal Thoughts')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 border ${activeCategory === 'Personal Thoughts'
              ? 'bg-salmon-400 text-white border-salmon-400 shadow-md'
              : 'bg-white text-gray-500 border-gray-200 hover:border-salmon-300 hover:text-salmon-400 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
              }`}
          >
            {t('category.personal')}
          </button>
          <button
            onClick={() => setActiveCategory('Hardcore Learning')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 border ${activeCategory === 'Hardcore Learning'
              ? 'bg-primary-600 text-white border-primary-600 shadow-md'
              : 'bg-white text-gray-500 border-gray-200 hover:border-primary-500 hover:text-primary-600 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
              }`}
          >
            {t('category.hardcore')}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="min-h-[500px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className={`text-2xl font-bold font-serif border-l-4 pl-4 ${activeCategory === 'Personal Thoughts' ? 'border-salmon-400 text-text-main dark:text-white' : 'border-primary-500 text-text-main dark:text-white'
            }`}>
            {activeCategory === 'Personal Thoughts' ? t('category.personal') : t('category.hardcore')}
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {filteredPosts.map((post, index) => (
            <Link
              to={`/post/${post.id}`}
              key={post.id}
              className={`group flex flex-col bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${index === 0 ? 'md:col-span-2 md:flex-row md:items-center' : ''
                }`}
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
                    {language === 'en' && post.titleEn ? post.titleEn : post.title}
                  </h3>

                  <p className="text-text-muted dark:text-gray-300 line-clamp-3 leading-relaxed">
                    {language === 'en' && post.excerptEn ? post.excerptEn : post.excerpt}
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

        {filteredPosts.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <p className="text-xl font-medium">No posts found in this category yet.</p>
          </div>
        )}
      </main>
    </div >
  );
};

export default Home;