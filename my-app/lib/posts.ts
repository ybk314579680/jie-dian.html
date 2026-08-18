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

/** 取正文第一段纯文本作为摘要（去掉行内 markdown 符号） */
function firstParagraph(text: string): string {
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith("#") || t.startsWith(">") || t.startsWith("!") || t.startsWith("```"))
      continue;
    return t.replace(/[*_`>#]/g, "").slice(0, 80);
  }
  return "";
}

/** 把各种格式的日期统一规范为 YYYY-MM-DD（月、日补零），保证字符串排序即时间排序 */
function normalizeDate(rawDate: unknown): string {
  // YAML 会把未加引号且补零的日期（如 2026-08-17）解析成 JS Date
  if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
    return rawDate.toISOString().slice(0, 10);
  }
  // 字符串（含未补零的 2026-8-1、加引号的 "2026-07-12" 等）：提取年月日并补零
  const s = String(rawDate ?? "").trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }
  return s;
}

/** 读取单个 MDX 文件，解析 frontmatter 与正文 */
function readPostFile(fileName: string): Post {
  const slug = fileName.replace(/\.mdx?$/, "");
  const fullPath = path.join(POSTS_DIR, fileName);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const date = normalizeDate(data.date);

  // 没有 frontmatter.title 时，取正文第一个 # 标题，再退化为文件名
  const h1Match = content.match(/^\s*#\s+(.+)$/m);
  const h1 = h1Match ? h1Match[1].trim() : "";

  return {
    slug,
    title: data.title ?? h1 ?? slug,
    date,
    tags: Array.isArray(data.tags) ? data.tags : [],
    excerpt: data.excerpt ?? firstParagraph(content),
    cover: data.cover ?? "",
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

/** 把任意标签转为稳定、URL 安全的 ASCII slug（支持中文，且静态导出文件名安全） */
export function tagToSlug(tag: string): string {
  return Buffer.from(tag, "utf8").toString("base64url");
}

/** 从 slug 还原标签（与 tagToSlug 互逆） */
export function slugToTag(slug: string): string {
  try {
    return Buffer.from(slug, "base64url").toString("utf8");
  } catch {
    return slug;
  }
}

/** 指定标签下的所有文章 */
export function getPostsByTag(tag: string): Post[] {
  // tag 已通过 slugToTag 还原为真实标签；这里再 trim 避免首尾空格不匹配
  const target = tag.trim();
  return getAllPosts().filter((p) => p.tags.map((t) => t.trim()).includes(target));
}

/** 首页每页文章数（如需调整直接改这里；文章数 ≤ 此值时不分页） */
export const POSTS_PER_PAGE = 3;

/** 按页码（从 1 开始）分页获取文章，并返回总页数 / 当前页 */
export function getPaginatedPosts(page: number): {
  posts: Post[];
  totalPages: number;
  currentPage: number;
} {
  const all = getAllPosts();
  const totalPages = Math.max(1, Math.ceil(all.length / POSTS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  return {
    posts: all.slice(start, start + POSTS_PER_PAGE),
    totalPages,
    currentPage,
  };
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
