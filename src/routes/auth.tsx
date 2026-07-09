import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — you can sign in now");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return toast.error(result.error.message ?? "Google sign-in failed");
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-glow">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="size-9 rounded-xl gradient-primary grid place-items-center">
            <Leaf className="size-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold">FreshSense AI</span>
        </Link>
        <h1 className="text-2xl font-bold font-display">Welcome</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to start analyzing food freshness.</p>

        <Button onClick={google} variant="outline" className="w-full mt-6">
          <svg className="size-4 mr-2" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .55 4.1 1.6l3-3C17.3 1.7 14.9 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.5 2.7C6 7.5 8.8 5 12 5z"/><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.4-.2-2.1H12v4h6.2c-.3 1.4-1.2 2.7-2.5 3.5v2.9h4c2.3-2.2 3.6-5.3 3.6-8.3z"/><path fill="#FBBC05" d="M5.1 14.3c-.3-.8-.4-1.6-.4-2.3s.2-1.6.4-2.3V6.9H1.6C.6 8.4 0 10.1 0 12s.6 3.6 1.6 5.1l3.5-2.8z"/><path fill="#34A853" d="M12 23c3 0 5.6-1 7.5-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.8 1.1-3.2 0-5.9-2.1-6.9-5l-3.5 2.7C3.5 20.3 7.4 23 12 23z"/></svg>
          Continue with Google
        </Button>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px bg-border flex-1" /> OR <span className="h-px bg-border flex-1" />
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={signIn} className="space-y-3 mt-4">
              <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={signUp} className="space-y-3 mt-4">
              <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground">
                {loading ? "Creating…" : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
