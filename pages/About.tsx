import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const About: React.FC = () => {
  const { language, t } = useLanguage();
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-10 animate-fade-in">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="w-32 h-32 bg-sage-100 dark:bg-gray-700 rounded-full mx-auto overflow-hidden ring-4 ring-white dark:ring-gray-800 shadow-lg transition-transform hover:scale-105 duration-300">
          <img src="/images/头像.jpg" alt="Lishiyao" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-bold text-text-main dark:text-white font-serif">
          {t('about.title')}
        </h1>
        <p className="text-lg text-text-muted dark:text-gray-300 font-medium">
          {t('about.subtitle')}
        </p>
      </div>

      {/* Bio Section */}
      <div className="prose dark:prose-invert mx-auto text-text-main dark:text-gray-300">
        {language === 'zh' ? (
          <>
            <p>
              欢迎来到我的数字花园！🌱
            </p>
            <p>
              我目前是 <strong>中南大学 (CSU)</strong> 的研究生，专业为岩土工程。
              现在，我正身处北国之境，在 <strong>北海道大学</strong> 做交换生，一边研究FEM反问题，一边享受札幌的雪景。
            </p>
            <p>
              虽然主修工程，但我致力于打破学科边界。我对 <strong>AI for Science</strong>（特别是 AI 求解 PDE）充满热情，
              同时也热衷于探索各种 AI 工具来提升效率。作为一个 <code>Python</code> 熟手和JAX新手，我正在努力点亮更多的技能树。
            </p>
            <p>
              在代码之外，我是一个<strong>设计迷</strong>。我喜欢研究平面设计的逻辑，也沉迷于在 <strong>Minecraft</strong> 中搭建理想的建筑空间。
            </p>
            <p className="text-lg font-semibold text-text-main dark:text-white border-l-4 border-salmon-400 pl-4 italic bg-salmon-50 dark:bg-gray-800 py-2 rounded-r">
              “我热爱生活，喜欢创意，爱T绝对！” 🧣
            </p>
          </>
        ) : (
          <>
            <p>
              Welcome to my digital garden! 🌱
            </p>
            <p>
              I am currently a graduate student at <strong>Central South University (CSU)</strong>, majoring in Geotechnical Engineering.
              Now, I am in the northern land, as an exchange student at <strong>Hokkaido University</strong>, researching FEM inverse problems while enjoying the snow in Sapporo.
            </p>
            <p>
              Although majoring in engineering, I am committed to breaking disciplinary boundaries. I am passionate about <strong>AI for Science</strong> (especially AI for solving PDEs),
              and also keen on exploring various AI tools to improve efficiency. As a <code>Python</code> user and JAX novice, I am working hard to unlock more skills.
            </p>
            <p>
              Outside of code, I am a <strong>design enthusiast</strong>. I like to study the logic of graphic design and am also addicted to building ideal architectural spaces in <strong>Minecraft</strong>.
            </p>
            <p className="text-lg font-semibold text-text-main dark:text-white border-l-4 border-salmon-400 pl-4 italic bg-salmon-50 dark:bg-gray-800 py-2 rounded-r">
              "I love life, love creativity, and love it absolutely!" 🧣
            </p>
          </>
        )}

        {/* Tech Stack Section */}
        <h3 className="text-xl font-bold mt-8 mb-4 font-serif">Built With</h3>
        <p>
          这个博客是我学习开发的试验田，它简洁、快速且纯粹：
          <br />
          <br />

        </p>
        <ul className="grid grid-cols-2 gap-2 list-none pl-0">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-sage-400 rounded-full"></span> Python
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-sage-400 rounded-full"></span> JAX
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-sage-400 rounded-full"></span> LLM
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-sage-400 rounded-full"></span> AI & Creativity
          </li>
        </ul>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p>
            {language === 'zh' ? 'Feel free to discuss Research, Design, or AI with me!' : 'Feel free to discuss Research, Design, or AI with me!'}
            <br />
            {language === 'zh' ? 'I also like to play Minecraft and balatro.' : 'I also like to play Minecraft and balatro.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
