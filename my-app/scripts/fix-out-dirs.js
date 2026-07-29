/**
 * 静态导出后处理：out/ 中每个与 .html 同名的目录（如 out/about/ + out/about.html），
 * 为其生成 index.html，确保 serve 等静态服务器在解析 /about 时先从
 * about/ 目录找到 index.html 而返回 200，避免因目录优先命中导致 403。
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "out");

if (!fs.existsSync(OUT)) {
  console.error("out/ does not exist — run `next build` first.");
  process.exit(1);
}

/**
 * 递归列出 out/ 下所有文件实体
 */
function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push({ type: "dir", path: full });
      results.push(...walk(full));
    } else {
      results.push({ type: "file", path: full });
    }
  }
  return results;
}

const entries = walk(OUT);

for (const e of entries) {
  if (e.type !== "file" || !e.path.endsWith(".html")) continue;

  // 同名目录路径（去掉 .html 后缀）
  const dirPath = e.path.replace(/\.html$/, "");

  if (!fs.existsSync(dirPath)) continue;
  try {
    if (!fs.statSync(dirPath).isDirectory()) continue;
  } catch {
    continue;
  }

  const indexHtml = path.join(dirPath, "index.html");
  if (fs.existsSync(indexHtml)) continue; // 已有 index.html，跳过

  fs.copyFileSync(e.path, indexHtml);
  console.log(`  ✓ ${path.relative(OUT, indexHtml)}`);
}

console.log("fix-out-dirs done.");
