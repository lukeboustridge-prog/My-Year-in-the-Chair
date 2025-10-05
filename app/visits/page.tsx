export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { WORK_TYPE_OPTIONS } from "@/lib/constants";

export default async function VisitsPage() {
  const uid = getUserId();
  const [visits] = uid
    ? await Promise.all([
        db.visit.findMany({ where: { userId: uid }, orderBy: { date: "desc" } }),
      ])
    : [[]];

  return (
    <div className="grid" style={{gap:"1.25rem"}}>
      <section className="card">
        <h1 style={{marginTop:0}}>Visits</h1>
        <p className="muted" style={{marginTop:".25rem"}}>Record your visits and see them below. (Form actions remain as in your current build.)</p>
      </section>

      <section className="card">
        <h2 style={{marginTop:0}}>Your Visits</h2>
        <div style={{overflowX:"auto"}}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Lodge</th>
                <th>Region</th>
                <th>Work of evening</th>
                <th>Candidate</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {visits.map(v => (
                <tr key={v.id}>
                  <td>{new Date(v.date).toDateString()}</td>
                  <td>{v.lodgeName ?? "—"}{v.lodgeNumber ? ` (${v.lodgeNumber})` : ""}</td>
                  <td>{v.region ?? "—"}</td>
                  <td>{v.workOfEvening ?? "—"}</td>
                  <td>{v.candidateName ?? "—"}</td>
                  <td>{v.comments ?? "—"}</td>
                </tr>
              ))}
              {visits.length === 0 && (
                <tr><td colSpan={6} className="muted">No visits yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
