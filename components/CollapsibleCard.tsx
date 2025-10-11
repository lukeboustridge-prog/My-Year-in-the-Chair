"use client";

import { useState, type ReactNode } from "react";

type CollapsibleCardProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function CollapsibleCard({
  title,
  description,
  defaultOpen = false,
  children,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
      >
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>
        <span className="text-2xl font-semibold leading-none text-slate-500" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      <div className={`card-body space-y-4${open ? "" : " hidden"}`}>{children}</div>
    </section>
  );
}
