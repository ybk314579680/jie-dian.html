import PostCard from "@/components/PostCard";
import { getAllPosts } from "@/lib/posts";
import { getSite } from "@/lib/site";

export default function HomePage() {
  const site = getSite();
  const posts = getAllPosts();

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
    </main>
  );
}
