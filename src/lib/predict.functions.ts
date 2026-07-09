import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageBase64: z.string().min(50),
  mimeType: z.string().default("image/jpeg"),
});

const StatusSchema = z.enum(["Fresh", "Near Expiry", "Spoiled"]);

export type PredictionResult = {
  foodName: string;
  status: z.infer<typeof StatusSchema>;
  freshnessScore: number;
  shelfLife: string;
  storageRecommendation: string;
  confidence: number;
  notes: string;
};

const SYSTEM = `You are a food-safety vision expert. Analyze the uploaded image of a food item and return ONLY a strict JSON object with these exact fields:
{
  "foodName": string (specific name, e.g. "Banana", "Chicken breast", "Whole milk"),
  "status": "Fresh" | "Near Expiry" | "Spoiled",
  "freshnessScore": integer 0-100 (100 = perfectly fresh, 0 = fully spoiled),
  "shelfLife": string (human-readable estimate like "3-5 days if refrigerated"),
  "storageRecommendation": string (concrete storage advice, 1-2 sentences),
  "confidence": integer 0-100 (your certainty),
  "notes": string (visible signs — bruising, mold, discoloration, texture. 1-2 sentences)
}
If the image is not a food item, set foodName to "Not food" and status to "Spoiled" with freshnessScore 0. Return JSON only, no markdown.`;

export const predictFreshness = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => InputSchema.parse(raw))
  .handler(async ({ data }): Promise<PredictionResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const dataUrl = data.imageBase64.startsWith("data:")
      ? data.imageBase64
      : `data:${data.mimeType};base64,${data.imageBase64}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this food image and return the JSON." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
      throw new Error(`AI error (${res.status}): ${txt.slice(0, 200)}`);
    }

    const body = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = body.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    const clamp = (n: unknown, lo: number, hi: number, def: number) => {
      const v = Number(n);
      if (!Number.isFinite(v)) return def;
      return Math.min(hi, Math.max(lo, Math.round(v)));
    };

    const status = StatusSchema.safeParse(parsed.status).success
      ? (parsed.status as PredictionResult["status"])
      : "Near Expiry";

    return {
      foodName: String(parsed.foodName ?? "Unknown food").slice(0, 80),
      status,
      freshnessScore: clamp(parsed.freshnessScore, 0, 100, 50),
      shelfLife: String(parsed.shelfLife ?? "Unknown").slice(0, 200),
      storageRecommendation: String(parsed.storageRecommendation ?? "Store in a cool, dry place.").slice(0, 400),
      confidence: clamp(parsed.confidence, 0, 100, 70),
      notes: String(parsed.notes ?? "").slice(0, 400),
    };
  });
