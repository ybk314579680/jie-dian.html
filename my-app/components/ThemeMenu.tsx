"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Theme = "light" | "green" | "dark";

interface ThemeOption {
  value: Theme;
  label: string;
  hint: string;
  swatch: string;
}

const STORAGE_KEY = "theme";

const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "奶白", hint: "默认浅色", swatch: "#faf7f0" },
  { value: "green", label: "护眼绿", hint: "豆沙绿", swatch: "#c7edcc" },
  { value: "dark", label: "夜间", hint: "深色模式", swatch: "#18181b" },
];

/** 统一应用主题：先清空所有主题类，再按目标添加，避免残留 */
function applyTheme(theme: Theme, root: HTMLElement = document.documentElement) {
  root.classList.remove("dark", "theme-green");
  if (theme === "dark") root.classList.add("dark");
  else if (theme === "green") root.classList.add("theme-green");
}

/** 从 <html> 的 class 反推当前主题（light 无主题类） */
function readTheme(root: HTMLElement = document.documentElement): Theme {
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("theme-green")) return "green";
  return "light";
}

/** 按钮图标随当前主题变化：奶白=太阳、护眼绿=叶片、夜间=月亮 */
function ThemeIcon({ theme }: { theme: Theme }) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
  };

  if (theme === "dark") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }

  if (theme === "green") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

export default function ThemeMenu() {
  const [theme, setTheme] = useState<Theme>("light");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 挂载后从 <html> 同步当前主题（SSR 默认渲染浅色太阳图标，避免水合不一致与空白）
  useEffect(() => {
    setTheme(readTheme());
  }, []);

  // 菜单打开时监听：点击容器外部 / 按 Esc 关闭；关闭或卸载时清理监听，避免泄漏
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selectTheme = useCallback((next: Theme) => {
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage 不可用时忽略（如隐私模式） */
    }
    setOpen(false);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="选择背景配色"
        title="选择背景配色"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 transition hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 dark:hover:bg-white/10"
      >
        <ThemeIcon theme={theme} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="背景配色"
          className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-black/10 bg-background p-1 shadow-lg shadow-black/5 dark:border-white/15 dark:shadow-black/40"
        >
          {THEME_OPTIONS.map((opt) => {
            const active = opt.value === theme;
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => selectTheme(opt.value)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  active
                    ? "bg-black/5 text-foreground dark:bg-white/10"
                    : "text-foreground/75 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 rounded-full border border-black/15 dark:border-white/25"
                  style={{ backgroundColor: opt.swatch }}
                />
                <span className="flex flex-1 flex-col leading-tight">
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs text-foreground/45">{opt.hint}</span>
                </span>
                {active && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 shrink-0 text-foreground/70"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
