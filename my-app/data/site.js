// data/site.js
// 本文件只负责"显示什么内容"——所有站点级文案与配置集中在此。
// 组件 / 页面只负责"怎么显示"（结构、样式、排版），从本文件读取数据。
// 文章正文数据由 content/posts/*.mdx + lib/posts.ts 负责，不在此处。

// 注意：本文件以 CommonJS 导出（module.exports），便于运行时被 lib/site.ts
// 每次重新 require 并清除缓存，从而实现"修改即生效、无需重启服务"。
const site = {
  // 站点名称：导航栏品牌、<title> 默认名、页脚都会用到
  name: "MCTR",

  // 导航栏链接
  nav: [
    { href: "/", label: "首页" },
    { href: "/tags", label: "标签" },
    { href: "/about", label: "关于" },
  ],

  // SEO 默认描述
  description: "一个用 Next.js + MDX 搭建的内容驱动个人博客。",

  // 页脚文案（显示在版权年后面）
  footer: "Built with Next.js & MDX",

  // 首页
  home: {
    title: "最新文章",
    emptyHint: "还没有文章，去 content/posts 添加一篇 .mdx 吧。",
  },

  // 标签页
  tags: {
    title: "标签云",
    emptyHint: "暂无标签。",
    backHint: "返回标签总览",
  },

  // 文章详情页的前后篇导航
  postNav: {
    newer: "← 上一篇",
    older: "下一篇 →",
  },

  // 关于页
  about: {
    title: "关于",
    paragraphs: [
      "这是我的个人博客，我会分享我很认可的知识，观点。我在这里留下我自己的痕迹",
    ],
    contactTitle: "联系方式",
    contacts: [{ label: "邮箱", value: "ybk314579680@qq.com" }],
  },
};

module.exports = { site };
