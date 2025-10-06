import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NZ", { dateStyle: "medium" }).format(date);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [
    user,
    visitCount,
    workingCount,
    recentVisits,
    recentWorkings,
    leaderboard,
    upcomingMilestone,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: { include: { lodge: true } },
        offices: { include: { lodge: true } },
        milestones: true,
      },
    }),
    prisma.visit.count({ where: { userId } }),
    prisma.lodgeWorking.count({ where: { userId } }),
    prisma.visit.findMany({
      where: { userId },
      include: { lodge: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.lodgeWorking.findMany({
      where: { userId },
      include: { lodge: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { visits: true } },
      },
      orderBy: { visits: { _count: "desc" } },
      take: 5,
    }),
    prisma.milestone.findFirst({
      where: { userId, date: { gte: new Date() } },
      orderBy: { date: "asc" },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  const membershipCount = user.memberships.length;
  const milestoneCount = user.milestones.length;
  const sortedMilestones = [...user.milestones].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
  const grandOffices = user.offices.filter((office) => office.isGrand);

  return (
    <div className="grid" style={{ gap: "2rem" }}>
      <section className="grid stats">
        <article className="stat-tile">
          <span>Total visits</span>
          <strong>{visitCount}</strong>
        </article>
        <article className="stat-tile">
          <span>Lodge workings</span>
          <strong>{workingCount}</strong>
        </article>
        <article className="stat-tile">
          <span>Active lodges</span>
          <strong>{membershipCount}</strong>
        </article>
        <article className="stat-tile">
          <span>Milestones logged</span>
          <strong>{milestoneCount}</strong>
        </article>
      </section>

      <section className="card">
        <h2>Recent visits</h2>
        {recentVisits.length === 0 ? (
          <div className="empty-state">No visits logged yet. Record your first visit today.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Lodge</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentVisits.map((visit) => (
                <tr key={visit.id}>
                  <td>{formatDate(visit.date)}</td>
                  <td>
                    {visit.lodge
                      ? `${visit.lodge.name} No. ${visit.lodge.lodgeNumber}`
                      : "—"}
                  </td>
                  <td>{visit.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Recent lodge workings</h2>
        {recentWorkings.length === 0 ? (
          <div className="empty-state">No lodge workings recorded yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Working</th>
                <th scope="col">Lodge</th>
              </tr>
            </thead>
            <tbody>
              {recentWorkings.map((working) => (
                <tr key={working.id}>
                  <td>{formatDate(working.date)}</td>
                  <td>{working.working}</td>
                  <td>
                    {working.lodge
                      ? `${working.lodge.name} No. ${working.lodge.lodgeNumber}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2>Your lodges &amp; offices</h2>
        {user.memberships.length === 0 ? (
          <div className="empty-state">No lodge memberships yet.</div>
        ) : (
          <ul className="list">
            {user.memberships.map((membership) => (
              <li key={membership.id} className="list-item">
                <div>
                  <strong>{membership.lodge?.name ?? "Unknown lodge"}</strong>
                  <div>
                    <small>
                      Joined {formatDate(membership.startDate)}
                      {membership.endDate
                        ? ` – Departed ${formatDate(membership.endDate)}`
                        : ""}
                    </small>
                  </div>
                </div>
                <div>
                  {user.offices
                    .filter((office) => office.lodgeId === membership.lodgeId)
                    .map((office) => (
                      <span key={office.id} className="badge" style={{ marginLeft: "0.5rem" }}>
                        {office.title}
                      </span>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
        {grandOffices.length > 0 ? (
          <div style={{ marginTop: "1.25rem" }}>
            <h3 style={{ marginTop: 0 }}>Grand offices</h3>
            <ul className="list">
              {grandOffices.map((office) => (
                <li key={office.id} className="list-item">
                  <div>
                    <strong>{office.title}</strong>
                    <div>
                      <small>
                        {formatDate(office.startDate)}
                        {office.endDate ? ` – ${formatDate(office.endDate)}` : ""}
                      </small>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>Milestones</h2>
        {upcomingMilestone ? (
          <p>
            <strong>Next milestone:</strong> {upcomingMilestone.title} on {formatDate(upcomingMilestone.date)}
          </p>
        ) : null}
        {sortedMilestones.length === 0 ? (
          <div className="empty-state">No milestones captured yet.</div>
        ) : (
          <ul className="list">
            {sortedMilestones.slice(0, 4).map((milestone) => (
              <li key={milestone.id} className="list-item">
                <div>
                  <strong>{milestone.title}</strong>
                  <div>
                    <small>{formatDate(milestone.date)}</small>
                  </div>
                </div>
                {milestone.notes ? <small>{milestone.notes}</small> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Leader board</h2>
        {leaderboard.length === 0 ? (
          <div className="empty-state">No visits recorded across the organisation yet.</div>
        ) : (
          <ol className="list">
            {leaderboard.map((member, index) => (
              <li key={member.id} className="list-item">
                <div>
                  <strong>
                    #{index + 1} {member.name ?? member.email}
                  </strong>
                  <div>
                    <small>{member.email}</small>
                  </div>
                </div>
                <span className="badge">{member._count.visits} visits</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
