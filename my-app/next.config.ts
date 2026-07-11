import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 让 Turbopack 自行转译打包 MDX 渲染链相关包，避免被外部化后
  // 出现 "Failed to load external module <pkg>-<hash>" 错误
  transpilePackages: [
    "next-mdx-remote",
    "shiki",
    "rehype-pretty-code",
    "@mdx-js/mdx",
    "@mdx-js/react",
  ],
  images: {
    // 允许在 MDX 中使用本地 SVG 封面（next/image 默认禁止 SVG）
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
