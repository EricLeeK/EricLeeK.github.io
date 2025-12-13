import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getMusingById } from '../services/musingsService';
import { Musing } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const MusingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const [musing, setMusing] = useState<Musing | undefined>(undefined);
  const [content, setContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const navigate = useNavigate();
  const formatMusingDate = (date?: string) => {
    if (!date) return '';
    const locale = language === 'en' ? 'en-US' : 'zh-CN';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(date));
  };

  useEffect(() => {
    if (id) {
      const found = getMusingById(id);
      if (found) {
        setMusing(found);
      } else {
        navigate('/musings');
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!musing) return;

    const loadContent = async () => {
      // Check for English content if language is English
      if (language === 'en' && musing.contentEn) {
        setContent(musing.contentEn);
        return;
      }
      if (musing.content) {
        setContent(musing.content);
        return;
      }

      // Check for English content path if language is English
      const path = (language === 'en' && musing.contentPathEn) ? musing.contentPathEn : musing.contentPath;

      if (path) {
        setIsLoadingContent(true);
        try {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`Failed to load content from ${path}`);
          }
          const text = await response.text();
          setContent(text);
        } catch (error) {
          console.error(error);
          setContent('加载碎碎念内容失败，请检查 markdown 文件是否存在。');
        } finally {
          setIsLoadingContent(false);
        }
      }
    };

    loadContent();
  }, [musing, language]);

  if (!musing) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-16">
      <Link to="/musings" className="inline-flex items-center text-sm text-text-muted hover:text-sage-600 transition-colors mb-4 font-bold">
        <ArrowLeft size={16} className="mr-1" /> {t('musings.back')}
      </Link>

      <header className="space-y-6 text-center">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-main dark:text-white leading-tight font-serif">
          {language === 'en' && musing.titleEn ? musing.titleEn : musing.title}
        </h1>
        {musing.date && (
          <p className="text-sm uppercase tracking-widest text-text-muted dark:text-gray-400">
            {formatMusingDate(musing.date)}
          </p>
        )}
      </header>

      <div className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary-600 hover:prose-a:text-primary-500 mx-auto min-h-[200px]">
        {isLoadingContent && !content ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12 opacity-60">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Loading content...</p>
          </div>
        ) : (
          <p className="mb-6 leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {content || musing.content}
          </p>
        )}
      </div>
    </article>
  );
};

export default MusingPage;
