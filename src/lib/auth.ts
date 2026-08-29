import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Creates the signed-in user's profile row once. Safe to call on every sign-in. */
export async function ensureProfile(
  user: User,
  extra?: { fullName?: string; careerLevel?: string; targetRole?: string },
) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return;
  await supabase.from("profiles").insert({
    user_id: user.id,
    full_name: extra?.fullName ?? (user.user_metadata?.["full_name"] as string | undefined) ?? "",
    experience_level:
      extra?.careerLevel ??
      (user.user_metadata?.["career_level"] as string | undefined) ??
      (user.user_metadata?.["experience_level"] as string | undefined) ??
      null,
    target_role:
      extra?.targetRole ?? (user.user_metadata?.["target_role"] as string | undefined) ?? null,
  });
}

/** Current auth session/user for UI purposes (header, profile page, sign-out). */
export function useAuthUser() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    loading,
  };
}
