In today's AI era, I believe that not knowing how to use AI tools for work and study is a significant loss. This article mainly introduces tools related to LLMs (Large Language Models) and applications related to text-to-image generation.

Therefore, how to use AI tools to complete work and study tasks efficiently, along with some of my own thoughts, are very worth thinking about and summarizing. So, I want to write this article to summarize my approach to using AI, some small tips, and new insights and techniques gained during the process of searching for information and discussing with AI while writing this article.

# AI Usage Scenarios

## 1. Website Creation Series 💻

*   **First of all, I have been using website creation prompts frequently recently.** I refer to HTML files. The main areas where they can be used are some lightweight small applications and visualization schemes. For example, some small animations needed for display in my scientific research, and some small specific applications for data analysis, can all use HTML file prompts.

*   **Additionally, regarding the aesthetic requirements of web pages**, you can specify the CSS style. Also, if you see a web page style you like, you can bookmark it, take a screenshot, or save the HTML, let the LLM summarize the style report, and then when you want a web design in this style, just add this report to the prompt.

## 2. Emotion and Sentiment Series 🧠

*   **I found that LLMs are very accurate in analyzing and reporting on emotional and sentimental issues.** They hit the nail on the head and can give very important advice. I feel that sometimes when encountering things I can't figure out, telling it the whole story will get me very clear advice and specifically targeted comfort. Moreover, when you are narrating to it, you naturally shift into a rational identity. Even if not, it allows you to examine the matter again as much as possible. At this time, your emotions have likely diminished a lot.

*   **Furthermore, because everyone's personality is different**, habits are different, and sensitivity to various things is different, the more you chat with an LLM, the better it understands you. However, surely someone will ask, what to do since LLMs currently lack memory? This is also something I am thinking about. I was inspired by one thing: user profiling in the internet industry. User profiling can accurately recommend videos users like to watch and things they like to buy just by categorizing users with tags. I don't understand the specific internal mechanism; it might have undergone vectorization processing, similar to word vectors, but definitely with fewer dimensions and simpler than word vectors.
*   
*   From this, I am wondering if human personality and emotional types can also be vectorized. How to do it? What I currently think of is to create an assistant, give a system prompt, and the instruction roughly means: based on various life experiences and mental activities I explain to you, please summarize my emotional type, as well as some pros and cons, and various highly condensed tags you can think of. Please use Korean (it is best to use a language you don't know, because I think it's better not to see the labeled nature of yourself, which creates a psychological suggestion). I need to form a detailed personality report belonging to me, so that when I chat with you again, I only need to input this report to form the plan and advice most targeted at me. The advice and plan are not to cater to me, but the best plan to help me grow. Also, unless I mention in the instruction that this is the first generation, you do not need to generate a complete report, just generate atomic items that I can keep adding to the original text. So if I specify the first report, you need a complete format and leave enough space to continue adding.

## 3. Drawing Series 🎨

*   **Currently, the most commonly used is generating some simple icons for project identification in PPTs.** In addition, Nano Banana does a really good job on replicating some simple pattern styles. However, making complete logical flowcharts is still not perfect, so I am still thinking about a solution for this. Maybe I should go and discuss it with AI. Mainly, every time I need to do this, time is tight, so I don't have time to research this. But after finishing it, I'm too lazy to think about it again.

## 4. Code Series

*   **I won't say much about code.** I use Github Copilot in conjunction with VS Code for "Vibe coding." This aspect is too personalized, so I'll add to it when I figure out how to write about it.

## 5. Writing Work

*   **I don't think this needs much explanation either.** For me, various reports and papers, I will let it write a first draft, and I will think about the ideas and so on. Its structural logic is still very good, but sometimes academic rigor is insufficient, and occasionally there are hallucinations, so it still needs human optimization and iteration before it can be used. But for less important writing work, I think it doesn't matter, direct output is fine.

## 6. PPT 📊

*   **In this part, I have tried many AI tools for direct PPT generation**, but they are barely satisfactory and not ideal. Therefore, I still need to do it myself. It is divided into having text materials and not having text materials. If there are already text materials, such as having an opening report and needing to make an opening defense PPT, we just need to feed the opening report to it. Note that the first prompt should ask it to provide an outline, and then later ask for specific design and layout for each page according to the outline, and then do it step by step according to its requirements. In this way, the output is relatively good, and the efficiency is the highest I can think of at present. By the way, when generating content for each page, you can append a request: "Please suggest a suitable visual element (such as an icon, chart type, or photo style) for the content of this page, and generate keywords for finding that image."

# AI Usage Precautions 💡

## 1. Formatting Aspects

Because I often ask academic questions, there are often many mathematical formulas that need explanation. However, the native output results use text format output, similar to using underscores to represent subscripts, rather than true subscripts. At this time, I suggest asking the LLM to use Latex display or inline formulas when outputting mathematical expressions. Since most LLM editors come with markdown format compilation, using Latex display or inline formulas for output can automatically compile into the most standard mathematical format. Additionally, I use it in combination with Obsidian, because sometimes the web end or application end (I use Cherry Studio) has display bugs, but after copying to Obsidian, it compiles very beautifully.

## 2. Prompt Aspects

I believe that in using AI, the stronger the user, the stronger the AI. Questioning is a discipline. Indeed, in the AI era, the saying is truly verified: a good question is greater than ten mediocre answers. Moreover, if you don't know how to refine a prompt, you can ask AI first: "What details of my prompt can be improved?" Discuss the prompt design for this problem with AI first and polish it. This initial discussion might save a lot of tokens wasted later.

## Topics I want to discuss later 🚀

*   Exploration of Dify-like workflow Agents

*   Text-to-image workflows, such as the use of ComfyUI.

*   How to use AI to help explore AI

*   Intensive reading of papers, etc.
