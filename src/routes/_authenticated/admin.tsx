import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, Users, Database, Search, Loader2, AlertCircle } from "lucide-react";
import { listAllUsers, listAllPredictions } from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const usersFn = useServerFn(listAllUsers);
  const predsFn = useServerFn(listAllPredictions);
  const [q, setQ] = useState("");

  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => usersFn() });
  const preds = useQuery({ queryKey: ["admin-preds"], queryFn: () => predsFn() });

  if (users.isError || preds.isError) {
    const msg = (users.error as Error)?.message ?? (preds.error as Error)?.message ?? "Access denied";
    return (
      <div className="glass-card rounded-xl p-10 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 font-display text-xl font-bold">Admin Access Required</h2>
        <p className="text-sm text-muted-foreground mt-2">{msg}</p>
      </div>
    );
  }

  const filteredUsers = (users.data ?? []).filter((u) =>
    !q || u.email?.toLowerCase().includes(q.toLowerCase()) || u.id.includes(q),
  );
  const filteredPreds = (preds.data ?? []).filter((p) =>
    !q ||
    p.user_email?.toLowerCase().includes(q.toLowerCase()) ||
    p.food_name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl gradient-primary grid place-items-center shadow-glow">
            <Shield className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Full visibility into users and their prediction data.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <Users className="size-3.5" /> Total Users
            </div>
            <div className="text-3xl font-bold font-display mt-1">{users.data?.length ?? "—"}</div>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <Database className="size-3.5" /> Total Predictions
            </div>
            <div className="text-3xl font-bold font-display mt-1">{preds.data?.length ?? "—"}</div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <div className="relative mb-4">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by email, food name, or user id…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users ({filteredUsers.length})</TabsTrigger>
            <TabsTrigger value="predictions">Predictions ({filteredPreds.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            {users.isLoading ? (
              <div className="py-12 text-center text-muted-foreground"><Loader2 className="size-6 animate-spin mx-auto" /></div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2.5">Email</th>
                      <th className="text-left px-4 py-2.5">Provider</th>
                      <th className="text-left px-4 py-2.5">Verified</th>
                      <th className="text-right px-4 py-2.5">Predictions</th>
                      <th className="text-left px-4 py-2.5">Joined</th>
                      <th className="text-left px-4 py-2.5">Last sign-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-t border-border/50 hover:bg-secondary/20">
                        <td className="px-4 py-2.5 font-medium">{u.email ?? "—"}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{u.provider ?? "email"}</td>
                        <td className="px-4 py-2.5">
                          <span className={u.email_confirmed_at ? "text-primary" : "text-muted-foreground"}>
                            {u.email_confirmed_at ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{u.prediction_count}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="predictions" className="mt-4">
            {preds.isLoading ? (
              <div className="py-12 text-center text-muted-foreground"><Loader2 className="size-6 animate-spin mx-auto" /></div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2.5">User</th>
                      <th className="text-left px-4 py-2.5">Food</th>
                      <th className="text-left px-4 py-2.5">Status</th>
                      <th className="text-right px-4 py-2.5">Freshness</th>
                      <th className="text-right px-4 py-2.5">Confidence</th>
                      <th className="text-left px-4 py-2.5">Shelf life</th>
                      <th className="text-left px-4 py-2.5">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPreds.map((p) => (
                      <tr key={p.id} className="border-t border-border/50 hover:bg-secondary/20">
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{p.user_email ?? p.user_id.slice(0, 8)}</td>
                        <td className="px-4 py-2.5 font-medium">{p.food_name}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={p.status as never} /></td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{p.freshness_score}%</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{p.confidence}%</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{p.shelf_life}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{new Date(p.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {filteredPreds.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No predictions found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
