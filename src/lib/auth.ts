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
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return;
  await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? null,
    full_name: extra?.fullName ?? (user.user_metadata?.["full_name"] as string | undefined) ?? "",
    career_level: extra?.careerLevel ?? null,
    target_role: extra?.targetRole ?? null,
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
