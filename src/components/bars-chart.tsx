"use client";

import { faCompact, faNum } from "@/lib/format";
import { cn } from "./ui";

export function BarsChart({
  data,
  highlightLast = true,
}: {
  data: { label: string; value: number }[];
  highlightLast?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex h-44 items-end gap-1.5 sm:gap-2">
        {data.map((d, i) => {
          const isMax = d.value === max && d.value > 0;
          const isLast = highlightLast && i === data.length - 1;
          return (
            <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[10px] font-bold text-cream opacity-0 shadow transition-opacity group-hover:opacity-100">
                {faNum(d.value)} بازدید
              </div>
              <div
                className={cn(
                  "w-full rounded-t-md transition-all duration-500 group-hover:opacity-80",
                  isLast
                    ? "bg-gradient-to-t from-coral-600 to-sun-300"
                    : isMax
                      ? "bg-gradient-to-t from-coral-600 to-coral-300"
                      : "bg-gradient-to-t from-coral-300 to-coral-100"
                )}
                style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 border-t border-line pt-2 sm:gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-ink-500 sm:text-[10px]">
            {i % 2 === 0 ? d.label : ""}
          </div>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-ink-300">
        بیشترین بازدید روز: {faCompact(max)}
      </p>
    </div>
  );
}
