import { Link, useRouter, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Upload, History, Sparkles, BarChart3, Info, Settings, MessageSquare, Leaf, LogOut, Shield } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkIsAdmin } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };
const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard", label: "Upload Food Image", icon: Upload },
  { to: "/history", label: "Prediction History", icon: History },
  { to: "/tips", label: "Food Tips", icon: Sparkles },
  { to: "/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/chatbot", label: "AI Assistant", icon: MessageSquare },
  { to: "/about", label: "About Project", icon: Info },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const location = useLocation();
  const [email, setEmail] = useState<string>("");
  const check = useServerFn(checkIsAdmin);
  const { data: adminInfo } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => check(),
    staleTime: 5 * 60 * 1000,
  });
  const isAdmin = adminInfo?.isAdmin ?? false;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="md:w-64 md:sticky md:top-0 md:h-screen border-b md:border-b-0 md:border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md flex md:flex-col">
        <div className="p-5 flex items-center gap-2.5 border-b border-sidebar-border/60">
          <div className="size-9 rounded-xl gradient-primary grid place-items-center shadow-glow">
            <Leaf className="size-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-sm">FreshSense AI</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Food Safety</div>
          </div>
        </div>
        <nav className="p-3 flex-1 space-y-1 overflow-x-auto md:overflow-x-visible flex md:block">
          {NAV.map((item, i) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={i}
                to={item.to as never}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to={"/admin" as never}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors mt-2",
                location.pathname === "/admin"
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-primary/20",
              )}
            >
              <Shield className="size-4" />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>
        <div className="hidden md:block p-3 border-t border-sidebar-border/60">
          <div className="text-xs text-muted-foreground truncate mb-2">{email}</div>
          <Button onClick={signOut} variant="outline" size="sm" className="w-full">
            <LogOut className="size-3.5 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border/60 bg-background/60 backdrop-blur-md sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-lg font-bold">AI-Powered Food Expiry & Freshness Prediction</h1>
              <p className="text-xs text-muted-foreground">Smart Food Safety Monitoring using Artificial Intelligence</p>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              AI online · Gemini Vision
            </div>
          </div>
        </header>
        <main className="p-6 flex-1">{children}</main>
        <footer className="border-t border-border/50 px-6 py-4 text-xs text-muted-foreground flex flex-wrap gap-2 justify-between">
          <div>© 2026 AI-Powered Food Expiry Detection & Freshness Prediction</div>
          <div>Built with React, TanStack Start, TensorFlow-style vision AI & Tailwind CSS.</div>
        </footer>
      </div>
    </div>
  );
}
