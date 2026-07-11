import fs from "node:fs";
import path from "node:path";

/**
 * 站点内容配置（见 data/site.js）的结构。
 * 这里仅做类型约束，真正的内容由 data/site.js 在运行时提供。
 */
export interface SiteConfig {
  name: string;
  nav: { href: string; label: string }[];
  description: string;
  footer: string;
  home: { title: string; emptyHint: string };
  tags: { title: string; emptyHint: string; backHint: string };
  postNav: { newer: string; older: string };
  about: {
    title: string;
    paragraphs: string[];
    contactTitle: string;
    contacts: { label: string; value: string }[];
  };
}

/**
 * 每次调用都从磁盘重新读取 data/site.js，并在独立的 CommonJS 沙箱中求值，
 * 因此既不会被打包器缓存，也不会被模块缓存复用，
 * 确保修改 data/site.js 后无需重启 / 重建服务即可在下次请求生效。
 */
export function getSite(): SiteConfig {
  const filePath = path.join(process.cwd(), "data", "site.js");
  const code = fs.readFileSync(filePath, "utf8");
  const mod: { exports: { site?: SiteConfig } } = { exports: {} };
  // 以 module / exports 作为沙箱参数执行，模拟 CommonJS 求值
  new Function("module", "exports", code)(mod, mod.exports);
  return mod.exports.site as SiteConfig;
}
