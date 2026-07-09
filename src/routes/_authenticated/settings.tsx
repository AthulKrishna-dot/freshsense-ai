import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Mail, Shield, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setId(data.user?.id ?? "");
    });
  }, []);

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  async function clearHistory() {
    if (!confirm("Delete all your prediction history? This can't be undone.")) return;
    const { error } = await supabase.from("predictions").delete().eq("user_id", id);
    if (error) return toast.error(error.message);
    toast.success("History cleared");
    qc.invalidateQueries();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account and data.</p>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Mail className="size-4 text-primary" /> Account</h3>
        <div className="text-sm">
          <div className="text-muted-foreground">Signed in as</div>
          <div className="font-medium">{email || "…"}</div>
        </div>
        <Button onClick={signOut} variant="outline"><LogOut className="size-4 mr-2" /> Sign out</Button>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Shield className="size-4 text-primary" /> Privacy</h3>
        <p className="text-sm text-muted-foreground">Your prediction history is stored securely and scoped to your account only. You can wipe it anytime.</p>
        <Button onClick={clearHistory} variant="destructive"><Trash2 className="size-4 mr-2" /> Clear all history</Button>
      </div>
    </div>
  );
}
