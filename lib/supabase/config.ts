import { env } from "cloudflare:workers";

type RuntimeEnv = Record<string, string | undefined>;

function runtimeEnv(): RuntimeEnv {
  return env as unknown as RuntimeEnv;
}

export function supabaseConfig() {
  const runtime = runtimeEnv();
  const url = runtime.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = runtime.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serverKey = runtime.SUPABASE_SECRET_KEY || runtime.SUPABASE_SERVICE_ROLE_KEY;
  return { url, publishableKey, serverKey };
}

export function hasSupabase() {
  const { url, serverKey } = supabaseConfig();
  return Boolean(url && serverKey);
}
