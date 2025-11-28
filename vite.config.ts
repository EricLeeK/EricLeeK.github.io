import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Replace 'zen-blog' with your repository name if it's not the root user site
  // If your repo is https://github.com/user/my-blog, this should be '/my-blog/'
  // If your repo is https://github.com/user/user.github.io, this should be '/'
  base: './', 
});