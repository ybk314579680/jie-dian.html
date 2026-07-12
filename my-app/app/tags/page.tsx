import Link from "next/link";
import type { Metadata } from "next";
import { getAllTags } from "@/lib/posts";
import { getSite } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const site = getSite();
  return {
    title: site.tags.title,
    description: site.description,
  };
}

export default function TagsPage() {
  const site = getSite();
  const tags = getAllTags();
  const maxCount = tags.length > 0 ? tags[0].count : 1;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold">{site.tags.title}</h1>

      {tags.length === 0 ? (
        <p className="text-gray-500">{site.tags.emptyHint}</p>
      ) : (
        // 文章越多的标签字号越大（0.9rem ~ 1.8rem）
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {tags.map(({ tag, count }) => {
            const fontSize = 0.9 + (count / maxCount) * 0.9;
            return (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="font-medium text-gray-700 transition hover:text-black dark:text-gray-300 dark:hover:text-white"
                style={{ fontSize: `${fontSize}rem` }}
              >
                {tag}
                <sup className="ml-0.5 text-sm text-gray-400">{count}</sup>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
