import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  variant?: "default" | "warning" | "success" | "muted";
}

const VARIANT_STYLES = {
  default: "border-border bg-card",
  warning: "border-amber-400/50 bg-amber-500/5",
  success: "border-emerald-400/50 bg-emerald-500/5",
  muted: "border-border bg-muted/40",
};

const VALUE_STYLES = {
  default: "text-foreground",
  warning: "text-amber-700 dark:text-amber-400",
  success: "text-emerald-700 dark:text-emerald-400",
  muted: "text-muted-foreground",
};

export default function RestoDashboardKpi({
  label,
  value,
  variant = "default",
}: Props) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 flex flex-col gap-1",
        VARIANT_STYLES[variant]
      )}
    >
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className={cn("text-3xl font-bold tabular-nums", VALUE_STYLES[variant])}>
        {value}
      </span>
    </div>
  );
}
