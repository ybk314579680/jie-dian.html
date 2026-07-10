import Link from "next/link";
import { PostMeta, formatDate } from "@/lib/posts";

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="rounded-lg border border-black/10 p-5 transition hover:shadow-md dark:border-white/10">
      <h2 className="text-xl font-semibold">
        <Link
          href={`/posts/${post.slug}`}
          className="hover:underline"
        >
          {post.title}
        </Link>
      </h2>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-foreground/60">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        {post.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="rounded bg-black/5 px-2 py-0.5 text-xs transition hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {post.excerpt && (
        <p className="mt-3 text-foreground/70">{post.excerpt}</p>
      )}
    </article>
  );
}
