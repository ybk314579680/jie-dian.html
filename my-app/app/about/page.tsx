import type { Metadata } from "next";
import { getSite } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = getSite();
  return {
    title: site.about.title,
    description: site.description,
  };
}

export default function AboutPage() {
  const site = getSite();
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="prose prose-neutral max-w-none text-[16px] leading-[1.8] dark:prose-invert">
        <h1>{site.about.title}</h1>
        {site.about.paragraphs.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
        {site.about.contacts.length > 0 && (
          <>
            <h2>{site.about.contactTitle}</h2>
            <ul>
              {site.about.contacts.map((c, i) => (
                <li key={i}>
                  {c.label}：{c.value}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
