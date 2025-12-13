# ZenBlog Copilot Instructions

## Project Overview

ZenBlog is a bilingual (Chinese/English) personal blog built with React + TypeScript + Vite, designed for GitHub Pages deployment. It's a static site that supports both inline content and external Markdown files, with localStorage for draft management.

## Architecture Pattern

### Content Management Strategy
- **Permanent content**: Defined in [constants.ts](constants.ts) as `INITIAL_POSTS` array (hardcoded)
- **Draft content**: Stored in browser localStorage via [services/blogService.ts](services/blogService.ts)
- **External Markdown**: Loaded from `/public/posts/*.md` using `contentPath` or `contentPathEn` properties
- Posts merge local + hardcoded, sorted by date descending

### Data Flow
1. `constants.ts` defines permanent `BlogPost[]` and `Musing[]` arrays
2. Services (`blogService.ts`, `musingsService.ts`) merge localStorage with constants
3. Pages fetch via services and render using `react-markdown` with math (`remark-math`, `rehype-katex`)

### Bilingual Support
- Context: [contexts/LanguageContext.tsx](contexts/LanguageContext.tsx) provides `language`, `toggleLanguage()`, `t()`
- Translations: Inline dictionary in LanguageContext (not i18n files)
- Content fields: BlogPost has `title`/`titleEn`, `content`/`contentEn`, `contentPath`/`contentPathEn`
- Loading priority: Check `language === 'en'` → use `*En` field → fallback to Chinese

### Special Features
- **Tab-based posts**: Markdown files can use `<!-- TAB_BREAK: Title -->` comments to split content into tabs (see [Post.tsx](pages/Post.tsx) lines 61-82)
- **Math rendering**: Uses KaTeX via `remark-math` + `rehype-katex`
- **Dark mode**: Tailwind's `class` strategy, persisted in localStorage, toggled via [Layout.tsx](components/Layout.tsx)

## Key Conventions

### Content Location Rules
- Blog posts: `/public/posts/*.md` (referenced via `contentPath: '/posts/filename.md'`)
- Musings: `/public/musings/*.md` (shorter, unstructured notes)
- Images: `/public/images/*.avif` (prefer AVIF format)

### Type Definitions
All content types defined in [types.ts](types.ts):
- `BlogPost`: Supports both inline `content` and external `contentPath`
- `Musing`: Similar structure for lightweight posts
- Both support dual-language fields (`*En` variants)

### Styling Pattern
- Tailwind utility classes with custom color palette in [tailwind.config.js](tailwind.config.js)
- Custom colors: `sage` (green), `bg-primary` (warm cream), `text-muted`
- Dark mode: `dark:*` variants throughout
- Typography: `@tailwindcss/typography` for prose rendering

## Development Workflow

### Build & Deploy
```bash
npm run dev          # Local development (Vite)
npm run build        # TypeScript check + Vite build
npm run deploy       # Build + gh-pages deployment
```

### Adding New Content

**Inline post** (draft or short content):
1. Add to `INITIAL_POSTS` in [constants.ts](constants.ts)
2. Include both `title`/`titleEn`, `content`/`contentEn` fields

**External markdown post**:
1. Create `/public/posts/your-post.md`
2. Add entry to `INITIAL_POSTS` with `contentPath: '/posts/your-post.md'`
3. For bilingual: add `contentPathEn: '/posts/your-post.en.md'`

**With tabs** (for long articles):
```markdown
# Intro content here

<!-- TAB_BREAK: Section 1 Title -->
Section 1 content...

<!-- TAB_BREAK: Section 2 Title -->
Section 2 content...
```

### Router Configuration
- Uses `HashRouter` (required for GitHub Pages)
- Routes: `/`, `/post/:id`, `/musings`, `/musing/:id`, `/editor`, `/about`
- ScrollToTop component resets scroll on route change

## Critical Dependencies
- `react-markdown`: Markdown → React (with plugins for GFM, math)
- `react-syntax-highlighter`: Code blocks with Dracula theme
- `lucide-react`: Icon library (replace imports from here)
- `gh-pages`: GitHub Pages deployment helper

## Common Pitfalls
1. **Base path**: [vite.config.ts](vite.config.ts) `base: '/'` assumes repo is `username.github.io` (change for project repos)
2. **Content loading**: Always check `language === 'en'` before defaulting to Chinese fields
3. **LocalStorage**: Services use `'zenblog_local_posts'` key - don't conflict with other storage
4. **Markdown paths**: Must start with `/` (relative to public folder), not `./`
5. **Tab breaks**: Case-sensitive `<!-- TAB_BREAK: ... -->` (uppercase, with space)

## When Editing
- **Navigation**: Update both [Layout.tsx](components/Layout.tsx) nav array AND translations in LanguageContext
- **New page**: Add route in [App.tsx](App.tsx), create in `/pages`, update nav
- **Translations**: Add key to `translations` object in [LanguageContext.tsx](contexts/LanguageContext.tsx)
- **Styles**: Check Tailwind config for custom colors before adding arbitrary values
