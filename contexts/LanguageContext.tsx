import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

interface LanguageProviderProps {
    children: ReactNode;
}

const translations: Record<string, Record<Language, string>> = {
    'nav.home': { zh: '首页', en: 'Home' },
    'nav.about': { zh: '关于', en: 'About' },
    'nav.write': { zh: '写作', en: 'Write' },
    'footer.builtWith': { zh: 'Built with React & Tailwind.', en: 'Built with React & Tailwind.' },
    'home.hero.title': { zh: '思维实验室', en: 'Mind Lab' },
    'home.hero.subtitle': { zh: '记录灵感，探索未知', en: 'Recording inspiration, exploring the unknown.' },
    'post.back': { zh: '返回首页', en: 'Back to Home' },
    'post.readTime': { zh: '阅读时间', en: 'Read Time' },
    'post.copyJson': { zh: '复制 JSON', en: 'Copy JSON' },
    'post.copied': { zh: '已复制!', en: 'Copied!' },
    'about.title': { zh: '你好，我是李世尧。', en: "Hi, I'm Lishiyao." },
    'about.subtitle': { zh: '中南大学研究生 ✈️ 北海道大学交换生', en: 'CSU Graduate ✈️ Hokkaido Univ Exchange' },
    'home.enterMusings': { zh: '进入碎碎念区', en: 'Enter Musings' },
    'category.personal': { zh: '个人思考类', en: 'Personal Thoughts' },
    'category.hardcore': { zh: '硬核学习类', en: 'Hardcore Learning' },
    'musings.title': { zh: '碎碎念区', en: 'Musings' },
    'musings.subtitle': { zh: '这里专门放那些没有结构的小想法，只是当下的一闪而过。', en: 'A place for unstructured thoughts, just fleeting moments of inspiration.' },
    'musings.readMore': { zh: '阅读全文', en: 'Read More' },
    'musings.clickToView': { zh: '点击查看这条碎碎念全文', en: 'Click to view full musing' },
    'musings.back': { zh: '返回碎碎念列表', en: 'Back to Musings' },
    'post.backToTabs': { zh: '返回导航', en: 'Back to Navigation' },
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('zh');

    useEffect(() => {
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang) {
            setLanguage(savedLang);
        }
    }, []);

    const toggleLanguage = () => {
        const newLang = language === 'zh' ? 'en' : 'zh';
        setLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    const t = (key: string): string => {
        const translation = translations[key];
        if (!translation) {
            console.warn(`Translation key not found: ${key}`);
            return key;
        }
        return translation[language];
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};
