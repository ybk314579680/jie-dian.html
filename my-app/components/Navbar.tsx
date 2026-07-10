import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { site } from "@/data/site";

export default function Navbar() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {site.name}
        </Link>
        <div className="flex items-center gap-1">
          <ul className="flex gap-5 text-sm sm:gap-6">
            {site.nav.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-foreground/70 transition hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* 日间 / 夜间切换按钮（客户端组件） */}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
