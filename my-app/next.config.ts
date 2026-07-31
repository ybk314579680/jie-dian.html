import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出：整站预渲染为纯静态文件到 out/
  output: "export",
  images: {
    // 静态导出无图片优化服务，关闭优化以兼容 next/image
    unoptimized: true,
    // 允许在 MDX 中使用本地 SVG 封面
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // 让 Turbopack 自行转译打包 MDX 渲染链相关包
  transpilePackages: [
    "next-mdx-remote",
    "shiki",
    "rehype-pretty-code",
    "@mdx-js/mdx",
    "@mdx-js/react",
  ],
};

export default nextConfig;
