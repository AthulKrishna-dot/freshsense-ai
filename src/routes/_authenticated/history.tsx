import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { Search, Trash2, FileDown, Apple } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { toast } from "sonner";
import { downloadPredictionPdf, type PredictionRow } from "@/lib/pdf-report";

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["predictions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("predictions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as PredictionRow[];
    },
  });

  const filtered = useMemo(() => data.filter((r) => {
    const matchesQ = q ? r.food_name.toLowerCase().includes(q.toLowerCase()) : true;
    const matchesS = status === "all" ? true : r.status === status;
    return matchesQ && matchesS;
  }), [data, q, status]);

  async function del(id: string) {
    const { error } = await supabase.from("predictions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refetch();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Prediction History</h2>
        <p className="text-sm text-muted-foreground">All the food items you've analyzed.</p>
      </div>

      <div className="glass-card rounded-xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search by food name…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Fresh">Fresh</SelectItem>
            <SelectItem value="Near Expiry">Near Expiry</SelectItem>
            <SelectItem value="Spoiled">Spoiled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left p-3">Item</th>
                <th className="text-left p-3">Food</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Score</th>
                <th className="text-left p-3">Confidence</th>
                <th className="text-left p-3">Date</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No predictions yet.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border/50 hover:bg-secondary/20">
                  <td className="p-3">
                    <div className="size-10 rounded-lg bg-primary/15 grid place-items-center text-primary">
                      <Apple className="size-5" />
                    </div>
                  </td>
                  <td className="p-3 font-medium">{r.food_name}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3">{r.freshness_score}%</td>
                  <td className="p-3">{r.confidence}%</td>
                  <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => downloadPredictionPdf(r)}>
                      <FileDown className="size-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del(r.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

