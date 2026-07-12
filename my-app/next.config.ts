import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出：npm run build 会把整站预渲染为纯静态文件到 out/ 目录
  // 注意：静态导出不支持运行时按需渲染，修改 data/site.js 或文章后需重新 npm run build
  output: "export",
  images: {
    // 静态导出没有图片优化服务，关闭优化以兼容 next/image
    unoptimized: true,
    // 允许在 MDX 中使用本地 SVG 封面（next/image 默认禁止 SVG）
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // 让 Turbopack 自行转译打包 MDX 渲染链相关包，避免被外部化后
  // 出现 "Failed to load external module <pkg>-<hash>" 错误
  transpilePackages: [
    "next-mdx-remote",
    "shiki",
    "rehype-pretty-code",
    "@mdx-js/mdx",
    "@mdx-js/react",
  ],
};

export default nextConfig;
