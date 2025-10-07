import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createWorking, deleteWorking } from "@/lib/actions";
import { format } from "date-fns";

function formatDate(date: Date) {
  try {
    return format(date, "d MMM yyyy");
  } catch {
    return new Date(date).toLocaleDateString();
  }
}

export default async function WorkingsPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      workings: { orderBy: { date: "desc" } },
    },
  });

  if (!user) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>No user record found</h2>
        <p>Please ensure your account exists before recording lodge workings.</p>
      </div>
    );
  }

  return (
    <div className="grid two">
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Record a working</h2>
        <p style={{ color: "rgba(148, 163, 184, 0.8)" }}>
          Note every degree, installation, or special ceremony you oversee.
        </p>
        <form action={createWorking} className="grid" style={{ gap: "1rem" }}>
          <input type="hidden" name="userId" value={user.id} />
          <label>
            Date
            <input type="date" name="date" required max={new Date().toISOString().split("T")[0]} />
          </label>
          <label>
            Working
            <input
              type="text"
              name="working"
              placeholder="1st Degree, Installation, Passing, Raising…"
              required
            />
          </label>
          <label>
            Notes
            <textarea name="notes" rows={3} placeholder="Officers involved, candidates, highlights" />
          </label>
          <button className="primary" type="submit">
            Save working
          </button>
        </form>
      </section>

      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2 style={{ marginTop: 0 }}>Working log</h2>
        {user.workings.length === 0 ? (
          <p style={{ color: "rgba(148, 163, 184, 0.8)" }}>No lodge workings recorded yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "160px" }}>Date</th>
                <th style={{ width: "220px" }}>Working</th>
                <th>Notes</th>
                <th style={{ width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {user.workings.map((working) => (
                <tr key={working.id}>
                  <td>{formatDate(working.date)}</td>
                  <td>{working.working}</td>
                  <td>{working.notes || "—"}</td>
                  <td>
                    <form
                      action={async () => {
                        "use server";
                        await deleteWorking(working.id);
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
