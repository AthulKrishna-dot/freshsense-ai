import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Database, Camera, ShieldCheck, Github, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold">About the Project</h2>
        <p className="text-sm text-muted-foreground">AI-Powered Food Expiry Detection & Freshness Prediction</p>
      </div>

      <div className="glass-card rounded-2xl p-8">
        <p className="text-lg leading-relaxed">
          FreshSense AI is a smart food-safety monitoring system that uses multimodal vision AI to analyze
          uploaded food images. It classifies items as <span className="text-primary font-semibold">Fresh</span>,{" "}
          <span className="text-warning font-semibold">Near Expiry</span> or{" "}
          <span className="text-destructive font-semibold">Spoiled</span>, estimates shelf life,
          and generates concrete storage recommendations.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          { icon: Camera, title: "Image Analysis", desc: "Upload or capture a photo. Preprocessing pipeline normalizes and feeds it to the vision model." },
          { icon: Cpu, title: "Vision AI", desc: "Multimodal AI (Gemini Vision) predicts freshness class + score with confidence." },
          { icon: Database, title: "Prediction History", desc: "Every analysis is saved to your account with RLS-scoped storage." },
          { icon: ShieldCheck, title: "Safety Guidance", desc: "Storage tips, shelf-life estimates, and an AI food assistant chatbot." },
        ].map((f) => (
          <div key={f.title} className="glass-card rounded-xl p-5">
            <div className="size-10 rounded-lg bg-primary/15 grid place-items-center text-primary mb-3">
              <f.icon className="size-5" />
            </div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Technology Stack</h3>
        <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {["React 19 + TanStack Start", "TypeScript", "Tailwind CSS v4", "Lovable Cloud (Postgres)", "Google Gemini Vision", "Recharts", "jsPDF Reports", "Supabase Auth (Email + Google)", "Cloudflare Workers Runtime"].map((t) => (
            <div key={t} className="rounded-lg border border-border/60 px-3 py-2 bg-secondary/30">{t}</div>
          ))}
        </div>
      </div>

      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Github className="size-4" /> Built with love using the FreshSense architecture.
      </div>
    </div>
  );
}
