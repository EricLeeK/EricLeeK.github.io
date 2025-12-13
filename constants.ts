import { BlogPost, Musing } from './types';

export const APP_NAME = "ChirsV Blog";
export const AUTHOR_NAME = "Eric Lee";

// This is the "Hardcoded" content that serves as the permanent blog on GitHub Pages.
// Users can edit this file to add new posts permanently.
export const INITIAL_POSTS: BlogPost[] = [
  {
    id: "karpathy-interview-agents-decade",
    title: "Andrej Karpathy 访谈：智能体的十年",
    excerpt: "Andrej Karpathy 提出了“智能体的十年”这一核心观点，反驳了当下关于“智能体元年”的过度炒作。他认为，尽管 Claude 和 Codex 等早期形态令人印象深刻，但要打造出真正如实习生般可靠的自主智能体，我们仍需十年的技术积淀。",
    contentPath: '/posts/Andrej_Karpathy_interview.md',
    date: "2025-12-13",
    readTime: "90 min read",
    tags: ["AI", "Agents", "Interview", "Deep Learning"],
    author: AUTHOR_NAME,
    coverImage: "/images/karpathy简要版信息图.avif",
    category: "Personal Thoughts",
    titleEn: "Andrej Karpathy Interview: The Decade of Agents",
    excerptEn: "Andrej Karpathy argues that we are entering the 'Decade of Agents', predicting a 10-year journey to reliable autonomous AI agents.",
    contentPathEn: '/posts/Andrej_Karpathy_interview.md',
  },
  {
    id: "welcome-to-shiyao-blog",
    title: "欢迎来到我的思维实验室",
    excerpt: "Welcome to my personal blog!",
    content: `
# 你好，世界：我的思维实验室

在这个信息过载的时代，我选择在这里按下暂停键。今天，我的个人博客正式启动。

作为一个岩土工程专业的研究生，我的日常往往与复杂的物理模型和方程为伴。但在学术之外，我希望这里是一个更加自由的**思维实验室**。这不是一个严肃的学术期刊，而是一个整理我琐碎想法（scattered thoughts）和系统性思考的笔记本。

## 我会在这里记录什么？

这个空间不仅仅是关于代码或工程，它是我所有兴趣的交汇点：

*   **🧠 AI + Science**: 探索 AI 在科学领域的应用，特别是 AI for PDE（偏微分方程）和 AI for Geotechnical Engineering（岩土工程）。
*   **效率工具探索**: 分享我在寻找和折腾各种 AI 效率工具过程中的发现。
*   **🎨 设计美学**: 记录我对设计的观察，从平面设计的排版思路到 Minecraft 中建筑的空间美学。
*   **编程学习之路**: 作为一个 Python 熟练但正在努力学习更多代码技能的新手（Code Newbie），这里也会有我的学习笔记。

## 为什么是现在？

> "The palest ink is better than the best memory." —— 俗语

很多灵感和思考如果不记录下来，就像未保存的代码一样，关机即逝。我希望通过书写，将那些零散的**碎片化想法**（trivial thoughts）编织成有价值的知识网络。

欢迎来到我的世界，让我们开始吧。

    `,
    date: "2025-11-28",
    readTime: "1 min read",
    tags: ["AI", "Science", "Efficiency", "Design", "Programming"],
    author: AUTHOR_NAME,
    coverImage: "https://picsum.photos/800/400?grayscale",
    category: "Personal Thoughts",
    titleEn: "Welcome to My Mind Lab",
    excerptEn: "Welcome to my personal blog! A place for scattered thoughts and systematic thinking.",
    contentEn: `
# Hello World: My Mind Lab

In this era of information overload, I choose to press the pause button here. Today, my personal blog is officially launched.

As a graduate student in Geotechnical Engineering, my daily life is often accompanied by complex physical models and equations. But outside of academia, I hope this place can be a freer **Mind Lab**. This is not a serious academic journal, but a notebook for organizing my scattered thoughts and systematic thinking.

## What will I record here?

This space is not just about code or engineering; it is the intersection of all my interests:

*   **🧠 AI + Science**: Exploring the application of AI in science, especially AI for PDE (Partial Differential Equations) and AI for Geotechnical Engineering.
*   **Efficiency Tool Exploration**: Sharing my discoveries in finding and tinkering with various AI efficiency tools.
*   **🎨 Design Aesthetics**: Recording my observations on design, from layout ideas in graphic design to the spatial aesthetics of architecture in Minecraft.
*   **Programming Learning Path**: As a Python user who is proficient but striving to learn more coding skills (Code Newbie), there will also be my learning notes here.

## Why now?

> "The palest ink is better than the best memory."

Many inspirations and thoughts, if not recorded, are like unsaved code—gone when the power is off. I hope that by writing, I can weave those **trivial thoughts** into a valuable knowledge network.

Welcome to my world, let's get started.
    `
  },
  {
    id: "typescript-best-practices",
    title: "Nano Banana Pro：那个彻底改变世界观的AI生图模型",
    excerpt: "我以为我已经了解AI绘画的极限，或者说我觉得短期内很难突破了，直到我遇见了它。游戏规则已经改变",
    content: `
# AI绘画的旧世界已经死去

我曾在 Midjourney 和 Stable Diffusion 上花费了数百小时，自认为对 AI 图像生成了如指掌——我知道它的优点、怪癖，也知道它对画好手指的执着。我以为这便是极限了。直到我上手了 Nano Banana Pro。

![Nano Banana Pro 生成的画面](/images/Nanobana.png)

## 第一次提示词的“心灵震撼”

我的测试提示词并不复杂，是我用来衡量不同模型能力的标准句式：“A detailed portrait of a geologist in Hokkaido, examining a volcanic rock, soft morning light, snow on the ground.”（一位在北海道的地质学家，正在检查一块火山岩，柔和的晨光，地上有积雪。）

几秒钟后返回的结果，不是一张“图”，而是一张“照片”。岩石的纹理细节、夹克上的霜花、以及北海道冬季独有的那种清冷光线——一切都无可挑剔。AI 不只是*执行*了我的指令，它*理解*了场景、情感和物理规律。

## 它为何是“划时代”的？

1.  **恐怖的语义理解能力：** 它能完美消化包含多个复杂概念的长句，而不会出现元素错乱或概念混淆。你再也看不到“一个由雪组成的地质学家”这种荒谬结果。
2.  **解剖学和物理学的完美渲染：** 无论是人物的手指、背景里的文字，还是统一注视着某个方向的眼神，那些长期困扰 AI 的“恐怖谷”细节几乎消失了。
3.  **大师级的光影运用：** 它不仅仅是“加个光源”。它精确模拟了光线与不同材质的互动，从皮肤下微妙的次表面散射（subsurface scattering），到一杯水产生的焦散效果，都极为逼真。

Nano Banana Pro 不只是又一个模型迭代，它是一次根本性的范式转移。从一个创意想法到一张可用的、甚至能以假乱真的图像，中间的距离被无限缩短了。如果你身处任何一个创意领域，请密切关注。一切都将改变。
    `,
    date: "2025-11-29",
    readTime: "2 min read",
    tags: ["AI", "Image Generation", "Technology"],
    author: AUTHOR_NAME,
    coverImage: "https://picsum.photos/800/401?grayscale",
    category: "Personal Thoughts",
    titleEn: "Nano Banana Pro: The AI Image Model That Changed My Worldview",
    excerptEn: "I thought I knew the limits of AI painting, until I met it. The rules of the game have changed.",
    contentEn: `
# The Old World of AI Painting is Dead

I spent hundreds of hours on Midjourney and Stable Diffusion, thinking I knew AI image generation inside out—I knew its strengths, quirks, and its obsession with drawing fingers correctly. I thought that was the limit. Until I got my hands on Nano Banana Pro.

![Nano Banana Pro Generated Image](/images/Nanobana.png)

## The First "Mind-Blowing" Prompt

My test prompt wasn't complicated; it was my standard sentence for measuring different model capabilities: "A detailed portrait of a geologist in Hokkaido, examining a volcanic rock, soft morning light, snow on the ground."

The result returned a few seconds later wasn't a "picture," but a "photo." The texture details of the rock, the frost on the jacket, and that unique cold light of Hokkaido winter—everything was impeccable. The AI didn't just *execute* my instructions; it *understood* the scene, emotion, and physical laws.

## Why is it "Epoch-Making"?

1.  **Terrifying Semantic Understanding:** It can perfectly digest long sentences containing multiple complex concepts without element confusion or conceptual mix-ups. You'll never see absurd results like "a geologist made of snow" again.
2.  **Perfect Rendering of Anatomy and Physics:** Whether it's fingers, text in the background, or eyes looking in a unified direction, those "Uncanny Valley" details that long plagued AI have almost disappeared.
3.  **Master-Level Lighting:** It's not just "adding a light source." It accurately simulates the interaction of light with different materials, from subtle subsurface scattering under the skin to the caustic effects produced by a glass of water—all extremely realistic.

Nano Banana Pro is not just another model iteration; it's a fundamental paradigm shift. The distance from a creative idea to a usable, even photorealistic image has been infinitely shortened. If you are in any creative field, please pay close attention. Everything is about to change.
    `
  },
  {
    id: "example-markdown-post",
    title: "使用 Markdown 文件的示例推文",
    excerpt: "这篇文章的正文存放在 public/posts/example-markdown-post.md 中，通过 contentPath 加载。",
    contentPath: "/posts/example-markdown-post.md",
    date: "2025-11-29",
    readTime: "1 min read",
    tags: ["Demo", "Markdown"],
    author: AUTHOR_NAME,
    coverImage: "https://picsum.photos/800/402?grayscale",
    category: "Personal Thoughts",
    titleEn: "Example Markdown Post",
    excerptEn: "This post's content is stored in public/posts/example-markdown-post.md and loaded via contentPath.",
    contentPathEn: "/posts/example-markdown-post.md" // We can reuse the same file if it's just a demo, or create a new one. For now, let's assume we reuse it or it doesn't matter much for a demo.
  },
  {
    id: "ai-tools-thinking",
    title: "AI工具的使用思考",
    excerpt: "在如今的AI时代，不会使用AI工具进行工作学习我认为是一个非常大的亏损，本文主要介绍的是LLM相关的工具，以及文生图相关的应用。",
    contentPath: "/posts/AI工具的使用思考.md",
    date: "2025-11-30",
    readTime: "3 min read",
    tags: ["AI", "Tools", "Productivity"],
    author: AUTHOR_NAME,
    coverImage: "/images/Ai_tools-en.jpg",
    category: "Personal Thoughts",
    titleEn: "Thoughts on Using AI Tools",
    excerptEn: "In today's AI era, I believe not using AI tools for work and study is a huge loss. This article mainly introduces LLM-related tools and text-to-image applications.",
    contentPathEn: "/posts/AI-tools-thoughts.en.md"
  },
  {
    id: "jax-fem-comprehensive",
    title: "JAX-FEM 深度解析：从核设计到弹塑性",
    excerpt: "深入解析 JAX-FEM 的核心设计理念，并详细讲解线弹性、超弹性及弹塑性问题的数学原理与代码实现。",
    contentPath: "/posts/jax-fem-comprehensive.md",
    date: "2025-12-04",
    readTime: "20 min read",
    tags: ["JAX-FEM", "Finite Element", "Python", "Physics"],
    author: AUTHOR_NAME,
    coverImage: "/images/JAX-FEM Cover.avif",
    category: "Hardcore Learning",
    titleEn: "JAX-FEM Deep Dive: From Kernel Design to Elastoplasticity",
    excerptEn: "In-depth analysis of JAX-FEM's core design philosophy, and detailed explanation of mathematical principles and code implementation for linear elasticity, hyperelasticity, and elastoplasticity.",
    contentPathEn: "/posts/jax-fem-comprehensive-en.md"
  },
  {
    id: "j2-to-drucker-prager",
    title: "从 J2 到 Drucker-Prager，一文看懂塑性力学的\"圆与锥\"",
    excerpt: "如果你曾经打开过任何一款有限元分析软件，你一定见过 von Mises 和 Drucker-Prager。本文将带你从几何直观出发，穿越数学公式的丛林，最终抵达数值算法的彼岸，帮你构建一个关于塑性本构模型的完整认知框架。",
    contentPath: "/posts/J2 to Drucker-Prager.md",
    date: "2025-12-10",
    readTime: "80 min read",
    tags: ["Plasticity", "Math", "JAX-FEM"],
    author: AUTHOR_NAME,
    coverImage: "https://picsum.photos/800/403?grayscale",
    category: "Hardcore Learning",
    titleEn: "From J2 to Drucker-Prager: Understanding the 'Circle and Cone' of Plasticity Mechanics",
    excerptEn: "Deep dive into the geometric intuition, mathematical formulation, and numerical implementation of J2 and Drucker-Prager plasticity models.",
    contentPathEn: "/posts/J2 to Drucker-Prager.md"
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

export const INITIAL_MUSINGS: Musing[] = [
  {
    id: "first-musing-placeholder",
    title: "碎碎念 #1：先把小角落搭起来",
    date: "2025-11-15T10:00:00Z",
    content: `
今天先把这个小角落搭好，等哪天灵感突然路过，就把它们轻轻放在这里。

不需要结构，也不一定要有结论，只记录那一瞬间的念头：也许是路上的一句话，也许是实验里一个奇怪的小现象，也许只是某个工具带来的小小惊喜。
    `,
    titleEn: "Musing #1: Setting up this little corner",
    contentEn: `
Today, I'm setting up this little corner. When inspiration passes by someday, I'll gently place it here.

No structure needed, no conclusion required, just recording the thought of that moment: maybe a sentence heard on the road, maybe a strange little phenomenon in an experiment, or maybe just a small surprise brought by a tool.
    `,
  },
  {
    id: "example-markdown-musing",
    title: "示例碎碎念：来自 markdown 文件",
    date: "2025-11-01T15:30:00Z",
    content: "", // 实际内容从 markdown 文件加载
    contentPath: "/musings/example-musing.md",
    titleEn: "Example Musing: From Markdown File",
    contentEn: "",
    contentPathEn: "/musings/example-musing.md", // Assuming same file or create a new one if needed
  },
  {
    id: "pending-learning-motivation",
    title: "待写ing：学习动机的边界",
    date: "2025-12-13T14:00:00Z",
    content: `
- 重新梳理我对“学习是为了功利”与“学习是天生渴望”之间的感受与冲突。
- 提出自己在现实场景中难以察觉的“边界线”：哪些时刻我真的在为目标而学习？哪些时刻只是不可控的好奇？
- 记录可能的切入点：生活中的一段对话、某次刷新的技能曲线、跨领域联系的灵感闪回。
- 设想几种读者共鸣的场景，把这种自省拆成可以展开的章节。

> 提示：完整版可能会调整顺序或添加细节，这里只是提纲式待写草案。
    `,
    contentEn: `
- Map out the tension between learning for utility and learning driven by a deeper curiosity urge.
- Flag the blind spots in my self-reflection: when am I truly learning for a goal, and when am I just following a craving to understand?
- List possible entry points (a conversation, a surprising skill spike, a cross-domain insight) that could anchor each section.
- Sketch how to turn these notes into reader-friendly vignettes or prompts for deeper exploration.

> Note: the final piece might shift sequence or add new dimensions; treat this as an outline draft.
    `,
  },
  {
    id: "pending-language-culture",
    title: "待写ing：语言原生产生的文化差异",
    date: "2025-12-12T10:00:00Z",
    content: `
- 列出几个语言差异引发的认知裂缝：比如某些文化词汇带来的思维路径差异。
- 拟定真实案例（如阅读、讨论或翻译时遇到的断层）作为后续展开的起点。
- 讨论如何用写作或工具同步感知这种差异，是否需要图表/例句/对照。
- 规划与读者的互动：提出哪些问题可以让大家反思自己语言中的文化负载？

> 提示：正式文章不一定照这个顺序，欢迎在写作过程中重排。
    `,
    contentEn: `
- Enumerate the cognitive gaps born from language-specific cultural differences (e.g., how certain words steer thought in subtle ways).
- Pick lived instances—reading, conversations, or translations—where I felt the mismatch and could dive deeper later.
- Consider visuals, example sentences, or side-by-side comparisons to make the difference tangible.
- Outline reader-facing prompts: what questions can invite them to notice the cultural weight in their own language use?

> Note: this is just a skeletal plan; the final essay may reorder or expand the points.
    `,
  },
];