import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, Camera, Sparkles, ShieldCheck, ArrowRight, MessageSquare, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 backdrop-blur-md sticky top-0 z-40 bg-background/70">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl gradient-primary grid place-items-center shadow-glow">
              <Leaf className="size-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold">FreshSense AI</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Food Safety Intelligence</div>
            </div>
          </div>
          <Link to="/auth">
            <Button className="gradient-primary text-primary-foreground shadow-glow">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        <section className="pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/50 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Powered by multimodal AI vision
            </div>
            <h1 className="mt-6 text-5xl md:text-6xl font-bold font-display leading-[1.05]">
              AI-Powered Food Expiry &
              <span className="block bg-clip-text text-transparent gradient-primary">Freshness Prediction</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Snap a photo of any food item. FreshSense scores freshness, estimates shelf life, and tells you exactly how to store it — in seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary text-primary-foreground shadow-glow">
                  Analyze food now <ArrowRight className="ml-1 size-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg">
              {[
                { label: "Detection accuracy", value: "94%" },
                { label: "Food categories", value: "150+" },
                { label: "Avg response", value: "1.8s" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-primary font-display">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 shadow-glow">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-transparent grid place-items-center border border-primary/20">
              <div className="text-center px-8">
                <div className="mx-auto size-20 rounded-2xl gradient-primary grid place-items-center shadow-glow">
                  <Camera className="size-10 text-primary-foreground" />
                </div>
                <p className="mt-6 font-display text-2xl font-semibold">Upload · Analyze · Save</p>
                <p className="mt-2 text-sm text-muted-foreground">Vision AI classifies Fresh, Near Expiry or Spoiled with a confidence score.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 grid md:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, title: "Smart safety scoring", desc: "Freshness % plus a clear Fresh / Near Expiry / Spoiled verdict." },
            { icon: LineChart, title: "History & analytics", desc: "Prediction history table, charts, and PDF reports." },
            { icon: MessageSquare, title: "AI Food Assistant", desc: "Ask about storage, shelf life, and spoilage signs anytime." },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6">
              <div className="size-10 rounded-lg bg-primary/15 grid place-items-center text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/50 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-muted-foreground flex flex-wrap justify-between gap-4">
          <div>© 2026 FreshSense AI — Food Expiry & Freshness Prediction</div>
          <div>Built with React, TanStack Start, Gemini Vision & Lovable Cloud</div>
        </div>
      </footer>
    </div>
  );
}
