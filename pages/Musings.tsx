import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getMusings } from '../services/musingsService';
import { Musing } from '../types';

const Musings: React.FC = () => {
  const [musings, setMusings] = useState<Musing[]>([]);

  useEffect(() => {
    setMusings(getMusings());
  }, []);

  return (
    <div className="space-y-16 animate-fade-in">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
          碎碎念区
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          这里专门放那些没有结构的小想法，只是当下的一闪而过。
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {musings.map((musing, index) => (
          <Link
            to={`/musing/${musing.id}`}
            key={musing.id}
            className={`group flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-primary-500/30 dark:hover:border-primary-500/30 transition-all duration-300 transform hover:-translate-y-1 ${index === 0 ? 'md:col-span-2 md:flex-row md:items-center' : ''}`}
          >
            <div className={`p-6 flex flex-col justify-between ${index === 0 ? 'md:p-8 md:h-full' : 'flex-grow'}`}>
              <div className="space-y-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {musing.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed whitespace-pre-line">
                  {musing.content || '点击查看这条碎碎念全文'}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end">
                <span className="flex items-center text-sm font-semibold text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
                  Read More <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Musings;
