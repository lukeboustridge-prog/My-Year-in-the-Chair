import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createVisit, deleteVisit } from "@/lib/actions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NZ", { dateStyle: "medium" }).format(date);
}

export default async function VisitsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [visits, lodges] = await Promise.all([
    prisma.visit.findMany({
      where: { userId },
      include: { lodge: true },
      orderBy: { date: "desc" },
    }),
    prisma.lodge.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="grid" style={{ gap: "2rem" }}>
      <section className="card">
        <h1 style={{ marginBottom: "0.5rem" }}>Log a visit</h1>
        <p style={{ marginTop: 0, color: "#475569" }}>
          Capture every visit to keep your records complete and power the leaderboard.
        </p>
        <form action={createVisit} className="form">
          <input type="hidden" name="userId" value={userId} />
          <div className="field">
            <label htmlFor="visit-date">Date</label>
            <input id="visit-date" name="date" type="date" required />
          </div>
          <div className="field">
            <label htmlFor="visit-lodge">Lodge (optional)</label>
            <select id="visit-lodge" name="lodgeId" defaultValue="">
              <option value="">Select a lodge</option>
              {lodges.map((lodge) => (
                <option key={lodge.id} value={lodge.id}>
                  {lodge.name} No. {lodge.lodgeNumber}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="visit-notes">Notes</label>
            <textarea
              id="visit-notes"
              name="notes"
              placeholder="Highlights, visiting brethren, or key learnings."
            />
          </div>
          <div className="form-actions">
            <button className="button" type="submit">
              Log visit
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>All visits</h2>
        {visits.length === 0 ? (
          <div className="empty-state">No visits logged yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Lodge</th>
                <th scope="col">Notes</th>
                <th scope="col" style={{ width: "120px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr key={visit.id}>
                  <td>{formatDate(visit.date)}</td>
                  <td>
                    {visit.lodge
                      ? `${visit.lodge.name} No. ${visit.lodge.lodgeNumber}`
                      : "—"}
                  </td>
                  <td>{visit.notes || "—"}</td>
                  <td>
                    <form action={deleteVisit.bind(null, visit.id)}>
                      <button className="button danger" type="submit">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
