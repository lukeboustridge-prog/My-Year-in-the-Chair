export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { WORK_TYPE_OPTIONS } from "@/lib/constants";

export default async function MyWorkPage() {
  const uid = getUserId();
  const works = uid
    ? await db.myWork.findMany({ where: { userId: uid }, orderBy: { date: "desc" } })
    : [];

  return (
    <div className="grid" style={{gap:"1.25rem"}}>
      <section className="card">
        <h1 style={{marginTop:0}}>My Lodge Workings</h1>
        <p className="muted" style={{marginTop:".25rem"}}>Record your lodge’s own work. (Form actions remain as in your current build.)</p>
      </section>

      <section className="card">
        <h2 style={{marginTop:0}}>Recorded Work</h2>
        <div style={{overflowX:"auto"}}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Work type</th>
                <th>Candidate</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {works.map(w => (
                <tr key={w.id}>
                  <td>{new Date(w.date).toDateString()}</td>
                  <td>{w.work ?? "—"}</td>
                  <td>{w.candidateName ?? "—"}</td>
                  <td>{w.comments ?? "—"}</td>
                </tr>
              ))}
              {works.length === 0 && (
                <tr><td colSpan={4} className="muted">No lodge work recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
