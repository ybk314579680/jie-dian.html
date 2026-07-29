import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { getAllPosts, getPaginatedPosts, POSTS_PER_PAGE } from "@/lib/posts";
import { getSite } from "@/lib/site";

// 预渲染第 2 页及之后（第 1 页即首页 /），确保静态导出时每个分页都是真实存在的静态文件，
// 这样直接访问 /page/2 刷新不会因“无对应路径”而 404
export function generateStaticParams() {
  const total = Math.max(1, Math.ceil(getAllPosts().length / POSTS_PER_PAGE));
  return Array.from({ length: Math.max(0, total - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `文章列表（第 ${page} 页）`,
  };
}

export default async function PaginatedHomePage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const pageNum = Number(page);

  // 第 1 页属于首页 /，分页路由只接收 ≥2 的合法页码
  if (!Number.isInteger(pageNum) || pageNum < 2) notFound();

  const site = getSite();
  const { posts, totalPages, currentPage } = getPaginatedPosts(pageNum);

  // 页码超出范围（如 /page/999）也 404，避免空列表
  if (currentPage !== pageNum) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">{site.home.title}</h1>

      {posts.length === 0 ? (
        <p className="text-gray-500">{site.home.emptyHint}</p>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}
    </main>
  );
}
