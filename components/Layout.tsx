import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { Moon, Sun, Menu, X, PenTool, Github } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check system preference or saved preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Write', path: '/editor' }, 
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white text-sm">Z</span>
            {APP_NAME}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary-600 dark:hover:text-primary-400 ${
                  location.pathname === link.path ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
             <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-400"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-base font-medium ${
                    location.pathname === link.path ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-8 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} {APP_NAME}. Built with React & Tailwind.</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/EricLeeK" target="_blank" rel="noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              <Github size={20} />
            </a>
            <Link to="/editor" className="flex items-center gap-1 hover:text-primary-600 transition-colors">
              <PenTool size={16} />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;