/**
 * 静态导出后处理：将 out/ 中与 .html 同名的 RSC 数据目录替换为包含 index.html 的真实目录。
 *
 * Next.js 静态导出对 /about 会同时产出 out/about.html（正文）和 out/about/（RSC 数据目录）。
 * 静态服务器（serve / nginx）的路径解析是"目录优先"——收到 /about 先看 out/about/ 目录，
 * 目录里没有 index.html 就直接 403，不会回退尝试 about.html。
 *
 * 本脚本的处理逻辑：
 *   1. 删除纯 RSC 数据目录（内部只有 .txt/.js 等文件，没有 index.html）
 *   2. 创建同名目录，把 .html 文件移进去并重命名为 index.html
 *
 * 最终 out/ 结构：
 *   out/about/index.html   （而不是 out/about.html + out/about/数据目录）
 *   out/posts/SX/index.html
 *   out/tags/5LiJ6KeC/index.html
 *   out/page/2/index.html
 *
 * 这样 serve/nginx 对 /about 命中 out/about/index.html，永远 200。
 */

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "out");

if (!fs.existsSync(OUT)) {
  console.error("out/ does not exist — run `next build` first.");
  process.exit(1);
}

/**
 * 判断一个目录是否是纯 RSC 数据目录（没有 index.html 的目录就是数据目录）
 */
function isDataDir(dirPath) {
  try {
    if (!fs.statSync(dirPath).isDirectory()) return false;
    const entries = fs.readdirSync(dirPath);
    return !entries.includes("index.html");
  } catch {
    return false;
  }
}

// 1. 扫描所有 .html 文件，收集需要处理的映射
const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith(".html")) {
      htmlFiles.push(full);
    }
  }
}
walk(OUT);

const processed = new Set();

for (const htmlPath of htmlFiles) {
  const dir = path.dirname(htmlPath);
  const basename = path.basename(htmlPath, ".html"); // "about" / "SX" / "index"
  const targetDir = path.join(dir, basename);

  // 根目录的 index.html 不动（它是站点首页 /）
  if (dir === OUT && basename === "index") continue;

  // 已在目录内的 index.html 不动（如 out/page/2/index.html）
  if (basename === "index") continue;

  // 防止重复处理
  if (processed.has(targetDir)) continue;
  processed.add(targetDir);

  // 如果存在同名数据目录，先删掉
  if (fs.existsSync(targetDir) && isDataDir(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // 创建目标目录（如果还不存在）
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 把 .html 文件移入目录并重命名为 index.html
  const targetFile = path.join(targetDir, "index.html");
  fs.renameSync(htmlPath, targetFile);
  console.log(`  ✓ ${path.relative(OUT, targetFile)}`);
}

// 2. 删除所有残留的纯数据目录（它们没有对应的 .html 了）
function cleanupDataDirs(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanupDataDirs(full);
      // 处理完后如果目录空了（或只剩 .txt），删掉
      try {
        const remaining = fs.readdirSync(full);
        if (remaining.length === 0) {
          fs.rmdirSync(full);
        }
      } catch {
        // 目录可能已被移走
      }
    }
  }
}
cleanupDataDirs(OUT);

console.log("fix-out-dirs done.");
