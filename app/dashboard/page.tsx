export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";

function displayName(user: any) {
  const parts: string[] = [];
  if (user?.prefix) parts.push(user.prefix);
  if (user?.name) parts.push(user.name);
  const pn = [...(user?.postNominals ?? []), ...(user?.grandPostNominals ?? [])];
  if (pn.length) parts[parts.length-1] = parts[parts.length-1] + " " + pn.join(", ");
  return parts.join(" ");
}

export default async function DashboardPage() {
  const uid = getUserId();
  const user = uid ? await db.user.findUnique({ where: { id: uid } }) : null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearAgo = new Date(now); yearAgo.setFullYear(now.getFullYear() - 1);
  const termStart = user?.termStart ?? yearAgo;

  const [visits, mywork] = uid
    ? await Promise.all([
        db.visit.findMany({ where: { userId: uid }, orderBy: { date: "desc" } }),
        db.myWork.findMany({ where: { userId: uid }, orderBy: { date: "desc" } }),
      ])
    : [[], []];

  const rolling12 = visits.filter(v => v.date >= yearAgo).length;
  const thisMonth = visits.filter(v => v.date >= startOfMonth).length;

  const visitByWork = new Map<string, number>();
  for (const v of visits) {
    const k = (v.workOfEvening ?? "OTHER") as string;
    visitByWork.set(k, (visitByWork.get(k) || 0) + 1);
  }

  const myWorkByType = new Map<string, number>();
  for (const m of mywork) {
    const k = (m.work ?? "OTHER") as string;
    myWorkByType.set(k, (myWorkByType.get(k) || 0) + 1);
  }

  return (
    <div className="grid" style={{gap: "1.25rem"}}>
      <header className="card">
        <h1 style={{margin:0, fontSize:"1.6rem", fontWeight:700}}>
          Welcome{user ? `, ${displayName(user)}` : ""}
        </h1>
        {user?.grandRank && <div className="stat-label" style={{marginTop:".25rem"}}>Grand Rank: {user.grandRank}</div>}
        {user?.lodgeName && (
          <div className="stat-label">
            {user.lodgeName}{user.lodgeNumber ? ` (${user.lodgeNumber})` : ""}{user.region ? ` • ${user.region}` : ""}
          </div>
        )}
      </header>

      <section className="grid sm-4">
        <div className="card">
          <div className="stat-label">Term start</div>
          <div className="stat-value">{(user?.termStart ?? termStart).toDateString()}</div>
        </div>
        <div className="card">
          <div className="stat-label">Today</div>
          <div className="stat-value">{new Date().toDateString()}</div>
        </div>
        <div className="card">
          <div className="stat-label">Visits (rolling 12 months)</div>
          <div className="stat-value">{rolling12}</div>
        </div>
        <div className="card">
          <div className="stat-label">Visits (this month)</div>
          <div className="stat-value">{thisMonth}</div>
        </div>
      </section>

      <section className="grid sm-2">
        <div className="card">
          <h2 style={{marginTop:0}}>Visits by work of the evening</h2>
          <ul style={{margin:0, paddingLeft:"1.1rem"}}>
            {Array.from(visitByWork.entries()).map(([k,n]) => (
              <li key={k}><strong>{k}</strong>: {n}</li>
            ))}
            {visitByWork.size === 0 && <li className="stat-label">No data yet.</li>}
          </ul>
        </div>

        <div className="card">
          <h2 style={{marginTop:0}}>My Lodge Work by type</h2>
          <ul style={{margin:0, paddingLeft:"1.1rem"}}>
            {Array.from(myWorkByType.entries()).map(([k,n]) => (
              <li key={k}><strong>{k}</strong>: {n}</li>
            ))}
            {myWorkByType.size === 0 && <li className="stat-label">No data yet.</li>}
          </ul>
        </div>
      </section>

      <section className="card" style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <h2 style={{marginTop:0}}>Export</h2>
          <div className="stat-label">Download a CSV of your term summary for the Grand Superintendent / Region.</div>
        </div>
        <a className="btn primary" href="/api/reports/term">Download CSV</a>
      </section>
    </div>
  );
}
