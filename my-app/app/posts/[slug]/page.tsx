import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { mdxComponents } from "@/components/mdx";
import { site } from "@/data/site";

// 预渲染所有文章路由
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

// 动态生成 Meta（SEO）：标题 / 描述
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
  };
}

// rehype-pretty-code 的语法高亮配置（浅色 / 深色双主题）
const prettyCodeOptions = {
  theme: { light: "github-light", dark: "github-dark" },
  keepBackground: false,
};

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // 计算上一篇 / 下一篇（列表按日期倒序）
  const all = getAllPosts();
  const index = all.findIndex((p) => p.slug === slug);
  const newer = index > 0 ? all[index - 1] : null; // 上一篇（更新的）
  const older = index < all.length - 1 ? all[index + 1] : null; // 下一篇（更早的）

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          <time dateTime={post.date}>{post.date}</time>
          {post.tags.length > 0 && (
            <>
              <span className="mx-2">·</span>
              <span>{post.tags.join(" / ")}</span>
            </>
          )}
        </div>
      </header>

      {/* prose 排版：16px 正文、1.8 行高、深色模式自动反色 */}
      <div className="prose prose-neutral max-w-none text-[16px] leading-[1.8] dark:prose-invert prose-pre:bg-transparent prose-p:text-[16px] prose-p:leading-[1.8]">
        <MDXRemote
          source={post.content}
          components={mdxComponents()}
          options={{
            mdxOptions: {
              remarkPlugins: [],
              rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
            },
          }}
        />
      </div>

      {/* 上一篇 / 下一篇 导航 */}
      <nav className="mt-12 flex items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-800">
        <div className="min-w-0 text-left">
          {newer && (
            <Link
              href={`/posts/${newer.slug}`}
              className="text-sm text-gray-600 hover:underline dark:text-gray-300"
            >
              <span className="text-gray-400">{site.postNav.newer}</span>
              <br />
              {newer.title}
            </Link>
          )}
        </div>
        <div className="min-w-0 text-right">
          {older && (
            <Link
              href={`/posts/${older.slug}`}
              className="text-sm text-gray-600 hover:underline dark:text-gray-300"
            >
              <span className="text-gray-400">{site.postNav.older}</span>
              <br />
              {older.title}
            </Link>
          )}
        </div>
      </nav>
    </article>
  );
}
