import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  try {
    return format(date, "d MMM yyyy");
  } catch {
    return new Date(date).toLocaleDateString();
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      visits: { orderBy: { date: "desc" }, take: 5 },
      workings: { orderBy: { date: "desc" }, take: 5 },
      milestones: { orderBy: { date: "asc" }, take: 5 },
      offices: true,
    },
  });

  if (!user) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Almost there…</h2>
        <p>
          You are authenticated but we couldn&apos;t find a user record for <strong>{session.user.email}</strong> in the
          database. Ask an administrator to run the seeding script or add your account in the Prisma dashboard.
        </p>
      </div>
    );
  }

  const [visitCount, workingCount] = await Promise.all([
    prisma.visit.count({ where: { userId: user.id } }),
    prisma.lodgeWorking.count({ where: { userId: user.id } }),
  ]);

  const leaderboardRaw = await prisma.visit.groupBy({
    by: ["userId"],
    _count: { userId: true },
    orderBy: { _count: { userId: "desc" } },
    take: 5,
  });

  const leaderboardUsers = await prisma.user.findMany({
    where: { id: { in: leaderboardRaw.map((entry) => entry.userId) } },
    select: { id: true, name: true, email: true },
  });

  const leaderboard = leaderboardRaw.map((entry) => {
    const person = leaderboardUsers.find((u) => u.id === entry.userId);
    return {
      id: entry.userId,
      name: person?.name || person?.email || "Unknown",
      visits: entry._count.userId,
    };
  });

  const upcomingMilestones = user.milestones.filter((milestone) => milestone.date >= new Date());

  return (
    <div className="grid two">
      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2 style={{ marginTop: 0 }}>Good evening, {user.name || session.user?.name || user.email}</h2>
        <p style={{ color: "rgba(148, 163, 184, 0.8)", marginBottom: "1.5rem" }}>
          Here&apos;s where your Masonic year stands today.
        </p>
        <div className="grid three">
          <div>
            <p style={{ color: "rgba(148, 163, 184, 0.7)", margin: 0 }}>Visits logged</p>
            <p style={{ fontSize: "2rem", margin: 0, fontWeight: 700 }}>{visitCount}</p>
          </div>
          <div>
            <p style={{ color: "rgba(148, 163, 184, 0.7)", margin: 0 }}>Lodge workings</p>
            <p style={{ fontSize: "2rem", margin: 0, fontWeight: 700 }}>{workingCount}</p>
          </div>
          <div>
            <p style={{ color: "rgba(148, 163, 184, 0.7)", margin: 0 }}>Active offices</p>
            <p style={{ fontSize: "2rem", margin: 0, fontWeight: 700 }}>
              {user.offices.filter((office) => !office.endDate || office.endDate > new Date()).length}
            </p>
          </div>
        </div>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Recent visits</h3>
        {user.visits.length === 0 ? (
          <p style={{ color: "rgba(148, 163, 184, 0.8)" }}>No visits logged yet. Start with your next trip!</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {user.visits.map((visit) => (
                <tr key={visit.id}>
                  <td>{formatDate(visit.date)}</td>
                  <td>{visit.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Latest lodge workings</h3>
        {user.workings.length === 0 ? (
          <p style={{ color: "rgba(148, 163, 184, 0.8)" }}>No workings recorded yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Working</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {user.workings.map((working) => (
                <tr key={working.id}>
                  <td>{formatDate(working.date)}</td>
                  <td>{working.working}</td>
                  <td>{working.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Visit leader board</h3>
        {leaderboard.length === 0 ? (
          <p style={{ color: "rgba(148, 163, 184, 0.8)" }}>No visits recorded across the membership yet.</p>
        ) : (
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {leaderboard.map((entry, index) => (
              <li key={entry.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className="badge" style={{ minWidth: "2rem", justifyContent: "center" }}>{index + 1}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{entry.name}</p>
                  <p style={{ margin: 0, color: "rgba(148, 163, 184, 0.7)", fontSize: "0.85rem" }}>{entry.visits} visits</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Upcoming milestones</h3>
        {upcomingMilestones.length === 0 ? (
          <p style={{ color: "rgba(148, 163, 184, 0.8)" }}>No future milestones logged. Add them in Prisma or via an admin UI.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {upcomingMilestones.map((milestone) => (
              <li key={milestone.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                <span style={{ fontWeight: 600 }}>{milestone.title}</span>
                <span style={{ color: "rgba(148, 163, 184, 0.7)" }}>{formatDate(milestone.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
