import jsPDF from "jspdf";

export type PredictionRow = {
  id: string;
  user_id: string;
  food_name: string;
  status: string;
  freshness_score: number;
  shelf_life: string;
  storage_recommendation: string;
  confidence: number;
  notes: string | null;
  image_url: string | null;
  created_at: string;
};

export function downloadPredictionPdf(r: PredictionRow) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  // Header
  doc.setFillColor(24, 68, 44);
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(220, 245, 225);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("FreshSense AI", margin, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Food Expiry & Freshness Prediction Report", margin, 62);

  y = 130;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(r.food_name, margin, y);
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const rows: [string, string][] = [
    ["Status", r.status],
    ["Freshness Score", `${r.freshness_score}%`],
    ["Confidence", `${r.confidence}%`],
    ["Estimated Shelf Life", r.shelf_life],
    ["Analyzed On", new Date(r.created_at).toLocaleString()],
  ];
  rows.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold"); doc.text(`${k}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(v), margin + 160, y);
    y += 20;
  });

  y += 12;
  doc.setFont("helvetica", "bold"); doc.text("Storage Recommendation", margin, y); y += 18;
  doc.setFont("helvetica", "normal");
  const rec = doc.splitTextToSize(r.storage_recommendation || "-", W - margin * 2);
  doc.text(rec, margin, y); y += rec.length * 14 + 12;

  if (r.notes) {
    doc.setFont("helvetica", "bold"); doc.text("AI Notes", margin, y); y += 18;
    doc.setFont("helvetica", "normal");
    const notes = doc.splitTextToSize(r.notes, W - margin * 2);
    doc.text(notes, margin, y); y += notes.length * 14;
  }

  // Footer
  const H = doc.internal.pageSize.getHeight();
  doc.setFontSize(9); doc.setTextColor(120, 120, 120);
  doc.text("© 2026 FreshSense AI — Generated report. Not a substitute for professional food-safety guidance.", margin, H - 30);

  doc.save(`freshsense-${r.food_name.toLowerCase().replace(/\s+/g, "-")}-${r.id.slice(0, 6)}.pdf`);
}
