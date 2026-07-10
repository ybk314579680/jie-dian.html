import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import type { MDXComponents } from "mdx/types";

/**
 * 提供给 MDX 正文使用的自定义组件映射。
 * - img  -> next/image（自动图片优化 + 响应式）
 * - a    -> 站内链接使用 next/link（前端路由），外链新开标签页
 */
export function mdxComponents(): MDXComponents {
  return {
    img: (props) => (
      <Image
        src={props.src as string}
        alt={props.alt ?? ""}
        // 占位尺寸，实际显示由 style 控制（100% 宽、高度自动，避免变形）
        width={1200}
        height={630}
        sizes="(max-width: 768px) 100vw, 700px"
        className="rounded-lg"
        style={{ width: "100%", height: "auto" }}
      />
    ),
    a: ({ href = "", children, ...rest }) => {
      if (href.startsWith("/") || href.startsWith("#")) {
        return (
          <Link href={href} {...rest}>
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noreferrer" {...rest}>
          {children}
        </a>
      );
    },
  };
}
