import { createFileRoute } from "@tanstack/react-router";
import { Snowflake, Thermometer, Apple, Beef, Milk, Wheat } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tips")({
  component: TipsPage,
});

const TIPS = [
  { icon: Apple, title: "Fruits", tips: [
    "Store apples in the fridge crisper for up to 6 weeks.",
    "Keep bananas at room temperature, separate from other fruit.",
    "Refrigerate berries unwashed in a paper-towel-lined container.",
  ]},
  { icon: Milk, title: "Dairy", tips: [
    "Keep milk at 4°C (40°F) or below.",
    "Store cheese wrapped in wax paper, not plastic.",
    "Yogurt lasts 1-2 weeks past the sell-by date if unopened.",
  ]},
  { icon: Beef, title: "Meat & Poultry", tips: [
    "Refrigerate raw poultry at 4°C and use within 1-2 days.",
    "Freeze meat at -18°C for long-term storage (up to 6 months).",
    "Thaw meat in the fridge, never on the counter.",
  ]},
  { icon: Wheat, title: "Grains & Pantry", tips: [
    "Store flour in airtight containers to prevent bugs.",
    "Rice keeps 4-5 years sealed; brown rice only 6 months.",
    "Bread stays freshest at room temperature in a bread box.",
  ]},
  { icon: Snowflake, title: "Freezer Guide", tips: [
    "Blanch vegetables before freezing to preserve color & texture.",
    "Label everything with the freeze date.",
    "Don't refreeze thawed food — cook it first.",
  ]},
  { icon: Thermometer, title: "Food Safety", tips: [
    "Danger zone: 4-60°C — don't leave perishables here over 2 hours.",
    "Cook poultry to 74°C internal, ground meat to 71°C.",
    "Refrigerate leftovers within 2 hours of cooking.",
  ]},
];

function TipsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Food Tips & Preservation</h2>
        <p className="text-sm text-muted-foreground">Practical guidance to keep food fresher for longer.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TIPS.map((cat) => (
          <div key={cat.title} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-lg bg-primary/15 grid place-items-center text-primary">
                <cat.icon className="size-5" />
              </div>
              <h3 className="font-semibold">{cat.title}</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {cat.tips.map((t) => (
                <li key={t} className="flex gap-2"><span className="text-primary mt-1">•</span><span>{t}</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

