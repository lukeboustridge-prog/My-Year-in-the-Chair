import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createWorking, deleteWorking } from "@/lib/actions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NZ", { dateStyle: "medium" }).format(date);
}

export default async function WorkingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [workings, lodges] = await Promise.all([
    prisma.lodgeWorking.findMany({
      where: { userId },
      include: { lodge: true },
      orderBy: { date: "desc" },
    }),
    prisma.lodge.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="grid" style={{ gap: "2rem" }}>
      <section className="card">
        <h1 style={{ marginBottom: "0.5rem" }}>Record a lodge working</h1>
        <p style={{ marginTop: 0, color: "#475569" }}>
          Log every working you deliver to build a full picture of your year in the chair.
        </p>
        <form action={createWorking} className="form">
          <input type="hidden" name="userId" value={userId} />
          <div className="field">
            <label htmlFor="working-date">Date</label>
            <input id="working-date" name="date" type="date" required />
          </div>
          <div className="field">
            <label htmlFor="working-type">Working</label>
            <input
              id="working-type"
              name="working"
              type="text"
              placeholder="e.g. First Degree, Installation"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="working-lodge">Lodge (optional)</label>
            <select id="working-lodge" name="lodgeId" defaultValue="">
              <option value="">Select a lodge</option>
              {lodges.map((lodge) => (
                <option key={lodge.id} value={lodge.id}>
                  {lodge.name} No. {lodge.number}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="working-notes">Notes</label>
            <textarea
              id="working-notes"
              name="notes"
              placeholder="Optional highlights, brethren involved, or lessons learned."
            />
          </div>
          <div className="form-actions">
            <button className="button" type="submit">
              Save working
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>All lodge workings</h2>
        {workings.length === 0 ? (
          <div className="empty-state">No lodge workings recorded yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Working</th>
                <th scope="col">Lodge</th>
                <th scope="col">Notes</th>
                <th scope="col" style={{ width: "120px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {workings.map((working) => (
                <tr key={working.id}>
                  <td>{formatDate(working.date)}</td>
                  <td>{working.working}</td>
                  <td>
                    {working.lodge
                      ? `${working.lodge.name} No. ${working.lodge.number}`
                      : "—"}
                  </td>
                  <td>{working.notes || "—"}</td>
                  <td>
                    <form action={deleteWorking.bind(null, working.id)}>
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
