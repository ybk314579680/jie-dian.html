import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PostCard from "@/components/PostCard";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { getSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tagName: tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tagName: string }>;
}): Promise<Metadata> {
  const { tagName } = await params;
  return {
    title: `标签：${tagName}`,
    description: `标签「${tagName}」下的所有文章。`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tagName: string }>;
}) {
  const { tagName } = await params;
  const site = getSite();
  const posts = getPostsByTag(tagName);

  if (posts.length === 0) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/tags"
        className="text-sm text-gray-500 hover:underline dark:text-gray-400"
      >
        ← {site.tags.backHint}
      </Link>

      <h1 className="mb-8 mt-3 text-2xl font-bold">标签：{tagName} 下的文章</h1>

      <div className="grid gap-6">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </main>
  );
}
