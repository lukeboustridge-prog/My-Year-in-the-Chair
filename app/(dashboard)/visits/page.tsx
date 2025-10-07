import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createVisit, deleteVisit } from "@/lib/actions";
import { format } from "date-fns";

function formatDate(date: Date) {
  try {
    return format(date, "d MMM yyyy");
  } catch {
    return new Date(date).toLocaleDateString();
  }
}

export default async function VisitsPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      visits: { orderBy: { date: "desc" } },
    },
  });

  if (!user) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>No user record found</h2>
        <p>Please ensure your account has been added to the database before logging visits.</p>
      </div>
    );
  }

  return (
    <div className="grid two">
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Log a visit</h2>
        <p style={{ color: "rgba(148, 163, 184, 0.8)" }}>
          Capture each time you attend another lodge during your year.
        </p>
        <form action={createVisit} className="grid" style={{ gap: "1rem" }}>
          <input type="hidden" name="userId" value={user.id} />
          <label>
            Date
            <input type="date" name="date" required max={new Date().toISOString().split("T")[0]} />
          </label>
          <label>
            Notes
            <textarea name="notes" rows={3} placeholder="Installation, raising, special guests…" />
          </label>
          <button className="primary" type="submit">
            Save visit
          </button>
        </form>
      </section>

      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2 style={{ marginTop: 0 }}>Visit history</h2>
        {user.visits.length === 0 ? (
          <p style={{ color: "rgba(148, 163, 184, 0.8)" }}>No visits logged yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "160px" }}>Date</th>
                <th>Notes</th>
                <th style={{ width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {user.visits.map((visit) => (
                <tr key={visit.id}>
                  <td>{formatDate(visit.date)}</td>
                  <td>{visit.notes || "—"}</td>
                  <td>
                    <form
                      action={async () => {
                        "use server";
                        await deleteVisit(visit.id);
                      }}
                    >
                      <button className="danger" type="submit">
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
