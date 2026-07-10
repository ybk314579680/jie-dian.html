import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  cover?: string;
}

export interface Post extends PostMeta {
  /** MDX 正文（不含 frontmatter） */
  content: string;
}

/** 读取单个 MDX 文件，解析 frontmatter 与正文 */
function readPostFile(fileName: string): Post {
  const slug = fileName.replace(/\.mdx?$/, "");
  const fullPath = path.join(POSTS_DIR, fileName);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  // YAML 会把未加引号的日期解析成 JS Date，这里统一规整为 YYYY-MM-DD 字符串
  const rawDate = data.date;
  const date =
    rawDate instanceof Date
      ? rawDate.toISOString().slice(0, 10)
      : String(rawDate ?? "");

  return {
    slug,
    title: data.title ?? slug,
    date,
    tags: Array.isArray(data.tags) ? data.tags : [],
    excerpt: data.excerpt ?? "",
    cover: data.cover,
    content,
  };
}

/** 所有文章，按日期倒序 */
export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map(readPostFile)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** 根据 slug 获取单篇文章 */
export function getPostBySlug(slug: string): Post | null {
  for (const ext of ["mdx", "md"]) {
    const full = path.join(POSTS_DIR, `${slug}.${ext}`);
    if (fs.existsSync(full)) return readPostFile(`${slug}.${ext}`);
  }
  return null;
}

/** 所有 slug（用于 generateStaticParams） */
export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

/** 标签总览：标签名 + 文章数量，按数量倒序 */
export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** 指定标签下的所有文章 */
export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

/** 将 ISO 日期格式化为中文可读形式 */
export function formatDate(date: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
