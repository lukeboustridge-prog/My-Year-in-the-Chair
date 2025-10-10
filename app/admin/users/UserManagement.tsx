'use client';

import { useState } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isApproved: boolean;
  createdAt: string;
  region: string | null;
};

type Props = {
  initialUsers: UserRow[];
  viewerRole: string;
  viewerRegion: string | null;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const ROLE_LABELS: Record<string, string> = {
  USER: "Member",
  ADMIN: "Administrator",
  GRAND_SUPERINTENDENT: "Grand Superintendent",
};

const ROLE_OPTIONS = [
  { value: "USER", label: ROLE_LABELS.USER },
  { value: "GRAND_SUPERINTENDENT", label: ROLE_LABELS.GRAND_SUPERINTENDENT },
  { value: "ADMIN", label: ROLE_LABELS.ADMIN },
];

export default function UserManagement({ initialUsers, viewerRole, viewerRegion }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = viewerRole === "ADMIN";
  const approvalsDisabled = viewerRole === "GRAND_SUPERINTENDENT" && !viewerRegion;

  const mutateUser = async (userId: string, payload: Partial<Pick<UserRow, "isApproved" | "role">>) => {
    setBusyId(userId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }
      const result = (await response.json()) as UserRow;
      setUsers((previous) =>
        previous.map((user) => (user.id === userId ? { ...user, ...result } : user)),
      );
    } catch (err) {
      console.error("USER_UPDATE", err);
      setError("Unable to update user. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const updateApproval = async (userId: string, approved: boolean) => {
    await mutateUser(userId, { isApproved: approved });
  };

  const updateRole = async (userId: string, role: string) => {
    const current = users.find((user) => user.id === userId);
    if (current?.role === role) return;
    await mutateUser(userId, { role: role as UserRow["role"] });
  };

  return (
    <div className="card">
      <div className="card-body space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Registered users</h2>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        {viewerRole === "GRAND_SUPERINTENDENT" && !viewerRegion ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Your account does not have a district assigned yet. Please contact an administrator to set your
            region before approving members.
          </div>
        ) : null}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Region</th>
                <th className="py-2 pr-3">Joined</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const awaiting = !user.isApproved;
                const label = awaiting ? "Pending" : "Approved";
                const actionLabel = awaiting ? "Approve" : "Revoke";
                const disabled = busyId === user.id || approvalsDisabled;
                const roleLabel = ROLE_LABELS[user.role] ?? user.role;
                return (
                  <tr key={user.id} className="border-t">
                    <td className="py-2 pr-3 font-medium text-slate-900">{user.name ?? "—"}</td>
                    <td className="py-2 pr-3">{user.email}</td>
                    <td className="py-2 pr-3 uppercase text-slate-500">
                      {isAdmin ? (
                        <select
                          className="input h-8 px-2 py-1 text-xs uppercase"
                          value={user.role}
                          onChange={(event) => updateRole(user.id, event.target.value)}
                          disabled={disabled}
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        roleLabel
                      )}
                    </td>
                    <td className="py-2 pr-3">{user.region ?? "—"}</td>
                    <td className="py-2 pr-3">{formatDate(user.createdAt)}</td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${awaiting ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {label}
                      </span>
                    </td>
                    <td className="py-2 pr-0 text-right">
                      <button
                        type="button"
                        className="navlink"
                        disabled={disabled}
                        onClick={() => updateApproval(user.id, awaiting)}
                      >
                        {disabled ? "Saving…" : actionLabel}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 md:hidden">
          {users.map((user) => {
            const awaiting = !user.isApproved;
            const label = awaiting ? "Pending approval" : "Approved";
            const actionLabel = awaiting ? "Approve" : "Revoke";
            const disabled = busyId === user.id || approvalsDisabled;
            const roleLabel = ROLE_LABELS[user.role] ?? user.role;
            return (
              <div key={user.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{user.name ?? "—"}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {isAdmin ? (
                        <select
                          className="input mt-1 h-8 w-full px-2 py-1 text-xs uppercase"
                          value={user.role}
                          onChange={(event) => updateRole(user.id, event.target.value)}
                          disabled={disabled}
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        roleLabel
                      )}
                    </p>
                    <p className="text-xs text-slate-500">Region: {user.region ?? "—"}</p>
                    <p className="mt-1 text-xs text-slate-500">Joined {formatDate(user.createdAt)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${awaiting ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {label}
                  </span>
                </div>
                <button
                  type="button"
                  className="navlink mt-3 w-full justify-center"
                  disabled={disabled}
                  onClick={() => updateApproval(user.id, awaiting)}
                >
                  {disabled ? "Saving…" : actionLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
