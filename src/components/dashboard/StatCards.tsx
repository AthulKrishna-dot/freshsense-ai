import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Leaf, Clock, AlertTriangle } from "lucide-react";

export function StatCards() {
  const { data = [] } = useQuery({
    queryKey: ["predictions", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("predictions").select("status");
      if (error) throw error;
      return data as { status: string }[];
    },
  });

  const total = data.length;
  const fresh = data.filter((r) => r.status === "Fresh").length;
  const near = data.filter((r) => r.status === "Near Expiry").length;
  const spoiled = data.filter((r) => r.status === "Spoiled").length;

  const cards = [
    { label: "Total Predictions", value: total, icon: Activity, tone: "text-primary bg-primary/15" },
    { label: "Fresh Items", value: fresh, icon: Leaf, tone: "text-primary bg-primary/15" },
    { label: "Near Expiry", value: near, icon: Clock, tone: "text-warning bg-warning/15" },
    { label: "Spoiled Items", value: spoiled, icon: AlertTriangle, tone: "text-destructive bg-destructive/15" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="glass-card rounded-xl p-5">
          <div className={`size-10 rounded-lg grid place-items-center ${c.tone}`}>
            <c.icon className="size-5" />
          </div>
          <div className="mt-4 text-3xl font-bold font-display">{c.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
