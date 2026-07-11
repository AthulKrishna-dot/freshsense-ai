import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  provider: string | null;
  prediction_count: number;
};

export type AdminPrediction = {
  id: string;
  user_id: string;
  user_email: string | null;
  food_name: string;
  status: string;
  freshness_score: number;
  confidence: number;
  shelf_life: string;
  storage_recommendation: string;
  notes: string | null;
  created_at: string;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: usersData, error: uErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (uErr) throw new Error(uErr.message);

    const { data: preds, error: pErr } = await supabaseAdmin
      .from("predictions")
      .select("user_id");
    if (pErr) throw new Error(pErr.message);

    const counts = new Map<string, number>();
    for (const p of preds ?? []) counts.set(p.user_id, (counts.get(p.user_id) ?? 0) + 1);

    return usersData.users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      email_confirmed_at: u.email_confirmed_at ?? null,
      provider: (u.app_metadata?.provider as string) ?? null,
      prediction_count: counts.get(u.id) ?? 0,
    }));
  });

export const listAllPredictions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminPrediction[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: preds, error } = await supabaseAdmin
      .from("predictions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((preds ?? []).map((p) => p.user_id)));
    const emails = new Map<string, string | null>();
    if (ids.length) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      for (const u of usersData?.users ?? []) emails.set(u.id, u.email ?? null);
    }

    return (preds ?? []).map((p) => ({
      id: p.id,
      user_id: p.user_id,
      user_email: emails.get(p.user_id) ?? null,
      food_name: p.food_name,
      status: p.status,
      freshness_score: p.freshness_score,
      confidence: p.confidence,
      shelf_life: p.shelf_life,
      storage_recommendation: p.storage_recommendation,
      notes: p.notes,
      created_at: p.created_at,
    }));
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean }> => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });
