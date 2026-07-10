import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 允许在 MDX 中使用本地 SVG 封面（next/image 默认禁止 SVG）
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
