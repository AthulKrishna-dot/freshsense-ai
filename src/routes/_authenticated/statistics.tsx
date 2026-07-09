import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { StatCards } from "@/components/dashboard/StatCards";

export const Route = createFileRoute("/_authenticated/statistics")({
  component: StatisticsPage,
});

const COLORS = { Fresh: "oklch(0.78 0.19 145)", "Near Expiry": "oklch(0.82 0.17 80)", Spoiled: "oklch(0.62 0.22 27)" };

function StatisticsPage() {
  const { data = [] } = useQuery({
    queryKey: ["predictions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("predictions").select("status, created_at");
      if (error) throw error;
      return data;
    },
  });

  const counts = { Fresh: 0, "Near Expiry": 0, Spoiled: 0 } as Record<string, number>;
  data.forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
  const pieData = Object.entries(counts).map(([name, value]) => ({ name, value }));

  // last 7 days bar
  const byDay: Record<string, { day: string; Fresh: number; "Near Expiry": number; Spoiled: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    byDay[k] = { day: d.toLocaleDateString(undefined, { weekday: "short" }), Fresh: 0, "Near Expiry": 0, Spoiled: 0 };
  }
  data.forEach((r) => {
    const k = new Date(r.created_at).toISOString().slice(0, 10);
    if (byDay[k]) byDay[k][r.status as "Fresh"] += 1;
  });
  const barData = Object.values(byDay);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Statistics Dashboard</h2>
        <p className="text-sm text-muted-foreground">Overview of your food analyses.</p>
      </div>
      <StatCards />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold mb-4">Status Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.23 0.035 155)", border: "1px solid oklch(0.32 0.03 155)", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold mb-4">Last 7 Days</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.03 155)" />
                <XAxis dataKey="day" stroke="oklch(0.72 0.03 145)" />
                <YAxis stroke="oklch(0.72 0.03 145)" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "oklch(0.23 0.035 155)", border: "1px solid oklch(0.32 0.03 155)", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="Fresh" stackId="a" fill={COLORS.Fresh} />
                <Bar dataKey="Near Expiry" stackId="a" fill={COLORS["Near Expiry"]} />
                <Bar dataKey="Spoiled" stackId="a" fill={COLORS.Spoiled} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

