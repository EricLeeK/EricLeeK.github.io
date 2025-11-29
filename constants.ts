import { BlogPost, Musing } from './types';

export const APP_NAME = "ChirsV Blog";
export const AUTHOR_NAME = "Eric Lee";

// This is the "Hardcoded" content that serves as the permanent blog on GitHub Pages.
// Users can edit this file to add new posts permanently.
export const INITIAL_POSTS: BlogPost[] = [
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
    coverImage: "https://picsum.photos/800/400?grayscale"
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
    coverImage: "https://picsum.photos/800/401?grayscale"
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
    content: `
今天先把这个小角落搭好，等哪天灵感突然路过，就把它们轻轻放在这里。

不需要结构，也不一定要有结论，只记录那一瞬间的念头：也许是路上的一句话，也许是实验里一个奇怪的小现象，也许只是某个工具带来的小小惊喜。
    `,
  },
  {
    id: "example-markdown-musing",
    title: "示例碎碎念：来自 markdown 文件",
    content: "", // 实际内容从 markdown 文件加载
    contentPath: "/musings/example-musing.md",
  },
];