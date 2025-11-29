# 这是一篇使用 contentPath 的示例正式推文

你现在看到的这段文字，并没有写在 `constants.ts` 里，而是保存在 `public/posts/example-markdown-post.md` 这个文件中。

这样做的好处是：

- 不会让 TypeScript 常量文件变得特别长；
- 可以在 Markdown 编辑器里单独编辑这篇文章；
- 构建出来的静态页面依然可以正常从这个路径读取内容。

你可以把这篇文章当成模板，复制一份改文件名和内容，就能创建新的长文文章。
