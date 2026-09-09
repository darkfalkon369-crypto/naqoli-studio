import type { ReactNode } from "react";
import { categoryOf } from "@/lib/catalog";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-paper shadow-soft",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHead({
  icon,
  title,
  sub,
  extra,
}: {
  icon?: ReactNode;
  title: string;
  sub?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
      {icon && (
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-coral-50 text-coral-600">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-lg leading-6 text-ink-900">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-ink-500">{sub}</p>}
      </div>
      {extra}
    </div>
  );
}

const tones: Record<string, string> = {
  coral: "bg-coral-100 text-coral-700",
  teal: "bg-teal-100 text-teal-700",
  sun: "bg-sun-100 text-sun-600",
  leaf: "bg-leaf-100 text-leaf-600",
  ink: "bg-ink-900/8 text-ink-700",
  ruby: "bg-[#fde3e1] text-ruby-500",
  berry: "bg-[#ece4f9] text-berry-500",
  aqua: "bg-[#dcecf8] text-aqua-500",
};

export function Badge({
  tone = "ink",
  children,
  className,
}: {
  tone?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
        tones[tone] ?? tones.ink,
        className
      )}
    >
      {children}
    </span>
  );
}

export const STATUS_META: Record<
  string,
  { label: string; tone: string; dot: string }
> = {
  generating: { label: "در حال تولید", tone: "sun", dot: "bg-sun-400" },
  queued: { label: "در صف انتشار", tone: "coral", dot: "bg-coral-500" },
  scheduled: { label: "زمان‌بندی‌شده", tone: "aqua", dot: "bg-aqua-500" },
  published: { label: "منتشرشده", tone: "leaf", dot: "bg-leaf-600" },
  failed: { label: "خطا", tone: "ruby", dot: "bg-ruby-500" },
};

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.failed;
  return (
    <Badge tone={m.tone}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot, status === "generating" && "animate-pulse-dot")} />
      {m.label}
    </Badge>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-teal-500" : "bg-ink-300/70",
        disabled && "opacity-50"
      )}
    >
      <span
        className={cn(
          "absolute top-1 right-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
          checked && "-translate-x-5"
        )}
      />
    </button>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  className,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "soft" | "ghost" | "danger" | "teal" | "dark";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const styles: Record<string, string> = {
    primary:
      "bg-coral-500 text-white hover:bg-coral-600 shadow-[0_5px_0_0_var(--color-coral-700)] active:translate-y-0.5 active:shadow-none",
    teal: "bg-teal-500 text-white hover:bg-teal-600 shadow-[0_5px_0_0_var(--color-teal-700)] active:translate-y-0.5 active:shadow-none",
    dark: "bg-ink-900 text-cream hover:bg-ink-700 shadow-[0_5px_0_0_#00000055] active:translate-y-0.5 active:shadow-none",
    soft: "bg-coral-50 text-coral-700 border border-coral-100 hover:bg-coral-100",
    ghost: "text-ink-700 hover:bg-ink-900/5 border border-transparent",
    danger: "bg-[#fde3e1] text-ruby-500 hover:bg-[#fbd0cc]",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50",
        styles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  accent = "coral",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: ReactNode;
  accent?: "coral" | "teal" | "sun" | "berry";
}) {
  const accents = {
    coral: "bg-coral-100 text-coral-600",
    teal: "bg-teal-100 text-teal-600",
    sun: "bg-sun-100 text-sun-600",
    berry: "bg-[#ece4f9] text-berry-500",
  };
  return (
    <Card className="animate-pop p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-ink-500">{label}</p>
          <p className="mt-1.5 font-display text-3xl leading-none text-ink-900">
            {value}
          </p>
          {sub && <div className="mt-2 text-xs text-ink-500">{sub}</div>}
        </div>
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
            accents[accent]
          )}
        >
          {icon}
        </span>
      </div>
    </Card>
  );
}

export function Progress({
  value,
  tone = "bg-coral-500",
  striped,
  className,
}: {
  value: number;
  tone?: string;
  striped?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-ink-900/8", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-700", tone, striped && "progress-stripes")}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/**
 * Deterministic, code-drawn cover for a category (no photo assets).
 * Always kid-friendly and on-brand.
 */
export function Cover({
  catKey,
  className,
  emojiClass = "text-2xl",
}: {
  catKey: string;
  className?: string;
  emojiClass?: string;
}) {
  const cat = categoryOf(catKey);
  return (
    <div
      className={cn("relative grid place-items-center overflow-hidden", className)}
      style={{
        background: `linear-gradient(165deg, ${cat.scene.from}, ${cat.scene.to})`,
      }}
    >
      <span
        className="absolute -top-2 -start-2 h-6 w-6 rounded-full"
        style={{ background: "rgba(255,255,255,.8)" }}
      />
      <span
        className="absolute bottom-1 end-1 h-3 w-3 rounded-full"
        style={{ background: `${cat.bar}66` }}
      />
      <span className={emojiClass} style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,.2))" }}>
        {cat.emoji}
      </span>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <span className="animate-floaty text-3xl">🧸</span>
      <p className="text-sm text-ink-500">{text}</p>
    </div>
  );
}
