import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
});

const SYSTEM = `You are FreshBot, a friendly AI Food Assistant for the FreshSense app. Answer questions about:
- How to store fruits, vegetables, dairy, meat, and pantry items
- Typical shelf life of common foods (fridge / freezer / pantry)
- Signs of spoilage and food safety
- Food preservation methods (freezing, canning, drying, fermenting)
- General food safety guidelines (temperatures, cross-contamination, leftovers)

Keep answers concise (under 180 words), practical, and formatted with short bullet points where helpful.
If a question is not about food safety, storage, or nutrition, briefly decline and steer back.`;

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => InputSchema.parse(raw))
  .handler(async ({ data }): Promise<{ content: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached — please slow down and try again.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits to keep chatting.");
      throw new Error(`AI error (${res.status}): ${txt.slice(0, 200)}`);
    }

    const body = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return { content: body.choices?.[0]?.message?.content ?? "I couldn't produce a reply — please try again." };
  });
