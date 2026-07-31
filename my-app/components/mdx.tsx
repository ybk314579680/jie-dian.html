import Link from "next/link";
import type { MDXComponents } from "mdx/types";

/**
 * 提供给 MDX 正文使用的自定义组件映射。
 * - img  -> 原生 img（静态导出无图片优化服务）
 * - a    -> 站内链接使用 next/link（前端路由），外链新开标签页
 */
export function mdxComponents(): MDXComponents {
  return {
    img: (props) => (
      <img
        src={props.src as string}
        alt={props.alt ?? ""}
        className="rounded-lg"
        style={{ width: "100%", height: "auto" }}
        loading="lazy"
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
