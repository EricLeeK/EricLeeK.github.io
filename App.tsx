import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Post from './pages/Post';
import Editor from './pages/Editor';
import About from './pages/About';
import Musings from './pages/Musings';
import Musing from './pages/Musing';

// Helper component to scroll to top on route change
const ScrollToTop = () => {
    const { pathname } = useLocation();
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:id" element={<Post />} />
          <Route path="/musings" element={<Musings />} />
          <Route path="/musing/:id" element={<Musing />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;