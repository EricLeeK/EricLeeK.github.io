import React from 'react';

const About: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-10 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden">
            <img src="https://picsum.photos/200/200?grayscale" alt="Profile" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hi, I'm Alex.</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
           Welcome to my digital garden.
        </p>
      </div>

      <div className="prose dark:prose-invert mx-auto">
        <p>
            I am a software engineer passionate about building clean, efficient, and accessible web applications. 
            This blog serves as a repository for my thoughts, tutorials, and experiments in the world of technology.
        </p>
        <p>
            The goal of this site is to strip away the noise and focus on content. It is built with 
            React and Tailwind CSS, deployed statically to keep things fast and simple.
        </p>
        <h3>Tech Stack</h3>
        <ul>
            <li>React 18</li>
            <li>TypeScript</li>
            <li>Tailwind CSS</li>
            <li>Lucide Icons</li>
        </ul>
        <p>
            Feel free to browse the posts or check out the project on GitHub.
        </p>
      </div>
    </div>
  );
};

export default About;