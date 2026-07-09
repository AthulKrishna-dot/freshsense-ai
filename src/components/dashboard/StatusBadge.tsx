import { cn } from "@/lib/utils";
import { Leaf, Clock, AlertTriangle } from "lucide-react";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cfg = {
    Fresh: { icon: Leaf, cls: "bg-primary/15 text-primary border-primary/30" },
    "Near Expiry": { icon: Clock, cls: "bg-warning/15 text-warning border-warning/30" },
    Spoiled: { icon: AlertTriangle, cls: "bg-destructive/15 text-destructive border-destructive/30" },
  }[status] ?? { icon: Clock, cls: "bg-muted text-muted-foreground border-border" };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", cfg.cls, className)}>
      <cfg.icon className="size-3.5" />
      {status}
    </span>
  );
}
