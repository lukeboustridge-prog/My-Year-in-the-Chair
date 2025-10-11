"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, type ChangeEvent } from "react";

type Option = {
  value: string;
  label: string;
};

type EventRegionSelectProps = {
  options: Option[];
  value: string;
};

export function EventRegionSelect({ options, value }: EventRegionSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString());
      if (next) {
        params.set("region", next);
      } else {
        params.delete("region");
      }
      const query = params.toString();
      router.replace(query ? `?${query}` : "", { scroll: false });
    });
  };

  return (
    <label className="label max-w-xs">
      <span className="text-sm font-medium text-slate-700">Region filter</span>
      <select
        className="input mt-1"
        value={value}
        onChange={handleChange}
        disabled={isPending}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
