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

      <section className="card" style={{padding:"1.25rem"}}>
        <h2 style={{marginTop:0}}>Install on your home screen</h2>
        <p className="muted" style={{marginTop:".25rem"}}>
          Save My Year in the Chair as an app icon so it&apos;s quick to open on your
          phone or tablet.
        </p>
        <div className="grid" style={{gap:"1rem", marginTop:"1rem"}}>
          <div>
            <h3 style={{marginTop:0}}>iPhone or iPad (Safari)</h3>
            <ol className="muted" style={{paddingLeft:"1.25rem", marginTop:".5rem", display:"grid", gap:".25rem"}}>
              <li>Open this site in Safari.</li>
              <li>Tap the <strong>Share</strong> button (square with an arrow).</li>
              <li>Choose <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> to confirm.</li>
            </ol>
          </div>
          <div>
            <h3 style={{marginTop:0}}>Android (Chrome)</h3>
            <ol className="muted" style={{paddingLeft:"1.25rem", marginTop:".5rem", display:"grid", gap:".25rem"}}>
              <li>Open this site in Chrome.</li>
              <li>Tap the <strong>⋮</strong> menu in the top-right corner.</li>
              <li>Select <strong>Add to Home screen</strong>.</li>
              <li>Choose <strong>Install</strong> to finish.</li>
            </ol>
          </div>
        </div>
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
