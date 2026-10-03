import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {hasSupabase} from "@/lib/supabase/config";
import {upsertSupabaseAnalytics} from "@/lib/supabase/store";

const allowedEvents = [
  "page_view",
  "heartbeat",
  "engaged_session",
  "scroll_depth",
  "call_click",
  "telegram_click",
  "enquiry_start",
  "enquiry_success",
  "service_view",
  "language_switch",
] as const;
const schema = z.object({
  consent: z.literal(true),
  sessionId: z.string().uuid(),
  eventName: z.enum(allowedEvents),
  path: z.string().max(240),
  durationSeconds: z.number().int().min(0).max(21600).optional(),
  utmSource: z.string().max(80).optional(),
  utmMedium: z.string().max(80).optional(),
  utmCampaign: z.string().max(120).optional(),
  referrer: z.string().max(500).optional(),
  serviceId: z.enum(["calm", "deep", "aroma"]).optional(),
  consentVersion: z.literal("2026-10"),
  buttonId: z.string().max(80).optional(),
});

async function hash(value: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!env.DB && !hasSupabase()))
    return NextResponse.json({ ok: false }, { status: 400 });
  const data = parsed.data;
  const now = Math.floor(Date.now() / 1000);
  const day = new Date().toISOString().slice(0, 10);
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const visitorHash = await hash(
    `${env.ANALYTICS_SALT ?? "rotate-me"}:${day}:${ip}`,
  );
  const ua = request.headers.get("user-agent") ?? "";
  const device = /mobile|android|iphone/i.test(ua)
    ? "mobile"
    : /tablet|ipad/i.test(ua)
      ? "tablet"
      : "desktop";
  let referrerHost: string | null = null;
  try {
    referrerHost = data.referrer
      ? new URL(data.referrer).hostname.slice(0, 120)
      : null;
  } catch {}
  const source = data.utmSource || (referrerHost ? referrerHost : "direct");
  const medium = data.utmMedium || (referrerHost ? "referral" : "none");
  const duration = data.durationSeconds ?? 0;
  const pageIncrement = data.eventName === "page_view" ? 1 : 0;
  if (hasSupabase()) {
    const session = {
      id: data.sessionId, visitor_hash: visitorHash, first_seen: now, last_seen: now,
      duration_seconds: duration, page_increment: pageIncrement, source, medium,
      campaign: data.utmCampaign ?? null, landing_path: data.path, referrer_host: referrerHost,
      device, country: null, region: null, consent_version: data.consentVersion,
    };
    const event = data.eventName === "heartbeat" ? undefined : {
      id: crypto.randomUUID(), session_id: data.sessionId, event_name: data.eventName,
      path: data.path, occurred_at: now,
      metadata: { serviceId: data.serviceId, buttonId: data.buttonId },
    };
    await upsertSupabaseAnalytics(session, event);
    return NextResponse.json({ ok: true });
  }
  const update = env.DB!.prepare(
    `INSERT INTO analytics_sessions (id, visitor_hash, first_seen, last_seen, duration_seconds, page_count, source, medium, campaign, landing_path, referrer_host, device, country, region, consent_version)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
      ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen, duration_seconds=MAX(duration_seconds, excluded.duration_seconds), page_count=page_count+?`,
  ).bind(
    data.sessionId,
    visitorHash,
    now,
    now,
    duration,
    source,
    medium,
    data.utmCampaign ?? null,
    data.path,
    referrerHost,
    device,
    null,
    data.consentVersion,
    pageIncrement,
  );
  if (data.eventName === "heartbeat") await update.run();
  else
    await env.DB!.batch([
      update,
      env.DB!.prepare(
        "INSERT INTO analytics_events (id, session_id, event_name, path, occurred_at, metadata) VALUES (?, ?, ?, ?, ?, ?)",
      ).bind(
        crypto.randomUUID(),
        data.sessionId,
        data.eventName,
        data.path,
        now,
        JSON.stringify({ serviceId: data.serviceId, buttonId: data.buttonId }),
      ),
    ]);
  return NextResponse.json({ ok: true });
}
