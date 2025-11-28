import { BlogPost } from './types';

export const APP_NAME = "ChirsV Blog";
export const AUTHOR_NAME = "Eric Lee";

// This is the "Hardcoded" content that serves as the permanent blog on GitHub Pages.
// Users can edit this file to add new posts permanently.
export const INITIAL_POSTS: BlogPost[] = [
  {
    id: "welcome-to-zenblog",
    title: "The Art of Simplicity in Web Design",
    excerpt: "Why minimalism isn't just a visual style, but a functional necessity in modern web development.",
    content: `
# The Art of Simplicity

In a world cluttered with information, simplicity is the ultimate sophistication. When building web applications, we often get caught up in the latest frameworks, animations, and complex state management solutions. But what does the user actually want?

## Clarity over Cleverness

Users visit a website to solve a problem or consume content. Every extra pixel, every delayed animation, and every confusing navigation menu stands in the way of that goal.

> "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away." - Antoine de Saint-Exupéry

## Technical Minimalism

From a code perspective, minimalism means:
*   **Less code:** Fewer bugs, easier maintenance.
*   **Fewer dependencies:** Better security, faster load times.
*   **Clear intent:** Code that explains itself.

This blog itself is built on these principles. No database, no complex CMS, just React and Markdown.
    `,
    date: "2023-10-24",
    readTime: "3 min read",
    tags: ["Design", "Minimalism", "React"],
    author: AUTHOR_NAME,
    coverImage: "https://picsum.photos/800/400?grayscale"
  },
  {
    id: "typescript-best-practices",
    title: "Why I Switched to TypeScript for Everything",
    excerpt: "A journey from chaotic JavaScript to the structured safety of strict typing.",
    content: `
# Embracing the Type System

I used to think TypeScript was just overhead. Extra typing? Interfaces? compiling? It seemed like a lot of work for little return. I was wrong.

## The Turning Point

It happened during a large refactor. I changed the shape of a user object in the backend. In JavaScript, I would have had to manually hunt down every usage, likely missing one and causing a crash in production. 

In TypeScript? **Red squiggly lines everywhere.**

It was beautiful. The compiler told me exactly what I broke.

## Key Benefits

1.  **Self-documenting code:** The types *are* the documentation.
2.  **Autocomplete:** IntelliSense becomes a superpower.
3.  **Refactoring confidence:** Change things without fear.

If you haven't made the switch yet, give it a week. You won't go back.
    `,
    date: "2023-11-02",
    readTime: "5 min read",
    tags: ["Engineering", "TypeScript"],
    author: AUTHOR_NAME,
    coverImage: "https://picsum.photos/800/401?grayscale"
  },
  // Example of using an external file to keep constants.ts small:
  /*
  {
    id: "external-content-demo",
    title: "Example of External Content",
    excerpt: "This post loads its content from a markdown file in the public folder, keeping the main bundle size small.",
    contentPath: "/posts/example.md", // You would create 'public/posts/example.md'
    date: "2024-03-21",
    readTime: "1 min read",
    tags: ["Demo", "Optimization"],
    author: AUTHOR_NAME,
  }
  */
];