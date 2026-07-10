"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // 挂载后读取当前主题（SSR 默认渲染太阳图标，避免空白不可见）
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const root = document.documentElement;
    const isDark = root.classList.toggle("dark");
    setDark(isDark);
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      /* localStorage 不可用时忽略 */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="切换日间 / 夜间模式"
      title="切换日间 / 夜间模式"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
    >
      {/* 默认（含 SSR）显示太阳图标，挂载后按当前主题切换为月亮 */}
      {dark ? (
        // 月亮（夜间）
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // 太阳（日间）
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
