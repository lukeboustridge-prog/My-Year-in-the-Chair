"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type EventRSVPButtonProps = {
  lodgeWorkId: string;
  alreadyRsvped: boolean;
  disabled?: boolean;
};

export function EventRSVPButton({ lodgeWorkId, alreadyRsvped, disabled }: EventRSVPButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmed, setConfirmed] = useState(alreadyRsvped);

  const handleClick = async () => {
    if (pending || confirmed || disabled) return;
    setPending(true);
    try {
      const res = await fetch(`/api/workings/${lodgeWorkId}/rsvp`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      setConfirmed(true);
      router.refresh();
    } catch (err: any) {
      console.error("EVENT_RSVP", err);
      alert(err?.message || "Failed to RSVP");
    } finally {
      setPending(false);
    }
  };

  const isDisabled = disabled || confirmed;
  const label = confirmed
    ? "RSVPed"
    : disabled
    ? "Your event"
    : pending
    ? "RSVPing..."
    : "RSVP";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled || pending}
      className={`inline-flex items-center justify-center rounded-lg border px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        confirmed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
