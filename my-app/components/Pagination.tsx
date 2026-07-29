import Link from "next/link";

/** 页码对应的 URL：第 1 页即首页 /，其余为 /page/N（静态导出可预渲染） */
function pageHref(p: number): string {
  return p <= 1 ? "/" : `/page/${p}`;
}

export default function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const prevHref = currentPage > 1 ? pageHref(currentPage - 1) : null;
  const nextHref = currentPage < totalPages ? pageHref(currentPage + 1) : null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const base =
    "rounded px-3 py-1 transition hover:bg-black/5 dark:hover:bg-white/10";
  const disabled = "rounded px-3 py-1 text-gray-300 dark:text-gray-600";
  const active =
    "rounded bg-black/10 px-3 py-1 font-semibold dark:bg-white/15";

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm">
      {prevHref ? (
        <Link href={prevHref} className={base}>
          ← 上一页
        </Link>
      ) : (
        <span className={disabled}>← 上一页</span>
      )}

      {pages.map((p) => (
        <Link key={p} href={pageHref(p)} className={p === currentPage ? active : base}>
          {p}
        </Link>
      ))}

      {nextHref ? (
        <Link href={nextHref} className={base}>
          下一页 →
        </Link>
      ) : (
        <span className={disabled}>下一页 →</span>
      )}
    </nav>
  );
}
