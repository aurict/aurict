import { TightPeriods } from "@/components/ui/TightPeriods";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { DOC_PAGES, findDoc } from "../docs-content";

export function generateStaticParams() {
  return DOC_PAGES.map((page) => ({ slug: page.slug.split("/") }));
}

export default async function VersionedDocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = findDoc(slug.join("/"));
  if (!page) notFound();
  return (
    <>
      <main className="inner-main" style={{ maxWidth: 900 }}>
        <div className="page-intro">
          <div className="page-intro-eyebrow">docs · v1 · {page.group}</div>
          <h1 className="page-h1"><TightPeriods text={page.title} /></h1>
          <p className="page-lead">{page.summary}</p>
        </div>
        <article style={{ display: "grid", gap: 32, marginBottom: 72 }}>
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 style={{ fontSize: 25, marginBottom: 10 }}>{section.heading}</h2>
              <p style={{ color: "var(--text-dim)", lineHeight: 1.75 }}>{section.body}</p>
              {section.code && <pre style={{ background: "var(--bg-deep)", border: "1px solid var(--border)", borderRadius: 7, padding: 18, marginTop: 16, overflowX: "auto", whiteSpace: "pre-wrap" }}><code>{section.code}</code></pre>}
            </section>
          ))}
        </article>
      </main>
      <Footer />
    </>
  );
}
