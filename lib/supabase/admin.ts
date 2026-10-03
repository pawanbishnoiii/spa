import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/supabase/config";

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (cached) return cached;
  const { url, serverKey } = supabaseConfig();
  if (!url || !serverKey) return null;
  cached = createClient(url, serverKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "x-application-name": "quiet-ritual-server" } },
  });
  return cached;
}
