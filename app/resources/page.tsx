export const dynamic = "force-dynamic";

import { db } from "@/lib/db";

export default async function ResourcesPage() {
  const items = await db.resource.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="grid" style={{gap:"1.25rem"}}>
      <section className="card">
        <h1 style={{marginTop:0}}>Masters' Resources</h1>
        <p className="muted" style={{marginTop:".25rem"}}>Helpful references and links.</p>
      </section>

      <section className="grid cols-2">
        {items.map(r => (
          <article key={r.id} className="card">
            <h3 style={{marginTop:0}}>{r.title}</h3>
            {r.summary && <p className="muted">{r.summary}</p>}
            {r.url && <a className="btn" href={r.url} target="_blank" rel="noreferrer">Open</a>}
          </article>
        ))}
        {items.length === 0 && <div className="card muted">No resources yet.</div>}
      </section>
    </div>
  );
}
