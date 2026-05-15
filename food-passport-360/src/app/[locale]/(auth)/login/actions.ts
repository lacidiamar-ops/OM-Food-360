"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function sendMagicLink(
  email: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}
