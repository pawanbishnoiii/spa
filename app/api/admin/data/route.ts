import { env } from "cloudflare:workers";
import { profilePhotos } from "@/lib/profile-media";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { decryptDetails } from "@/lib/enquiry-privacy";

const settingKeys = [
  "price_calm_30",
  "price_calm_60",
  "price_calm_90",
  "price_deep_60",
  "price_deep_90",
  "price_aroma_60",
  "price_aroma_90",
  "package_hour_1",
  "package_hour_2",
  "package_hour_3",
  "package_hour_4",
  "package_full_day",
  "package_full_night",
  "image_calm",
  "image_deep",
  "image_aroma",
  "hero_image",
  "city",
  "hero_title",
  "hero_intro",
  "collect_user_details",
  "site_name",
  "registration_fee",
  "business_phone",
  "telegram_username",
  "telegram_cta_en",
  "opening_hours",
  "address",
  "meta_pixel_id",
  "adsense_client_id",
] as const;
const updateSchema = z.object({
  settings: z
    .record(z.enum(settingKeys), z.string().trim().max(500))
    .optional(),
  therapists: z
    .array(
      z.object({
        id: z.enum(["t1", "t2", "t3", "t4", "t5", "t6"]),
        nameEn: z.string().max(80),
        nameHi: z.string().max(80),
        specialityEn: z.string().max(200),
        specialityHi: z.string().max(200),
        active: z.boolean(),
      }),
    )
    .max(6)
    .optional(),
});

export async function GET() {
  const user = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!env.DB)
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  const photos = await profilePhotos();
  const since = Math.floor(Date.now() / 1000) - 30 * 86400;
  const [
    settings,
    therapists,
    totals,
    sources,
    days,
    events,
    leads,
    sessions,
    buttons,
  ] = await Promise.all([
    env.DB.prepare("SELECT key, value FROM site_settings ORDER BY key").all<{
      key: string;
      value: string;
    }>(),
    env.DB.prepare(
      "SELECT id, name_en, name_hi, speciality_en, speciality_hi, image_key, active FROM therapist_profiles ORDER BY id",
    ).all<Record<string, string | number | null>>(),
    env.DB.prepare(
      "SELECT COUNT(*) sessions, COUNT(DISTINCT visitor_hash) visitors, COALESCE(AVG(duration_seconds),0) avg_duration, COALESCE(SUM(page_count),0) page_views FROM analytics_sessions WHERE last_seen >= ?",
    )
      .bind(since)
      .first(),
    env.DB.prepare(
      "SELECT source, COUNT(*) sessions FROM analytics_sessions WHERE last_seen >= ? GROUP BY source ORDER BY sessions DESC LIMIT 8",
    )
      .bind(since)
      .all(),
    env.DB.prepare(
      "SELECT date(first_seen, 'unixepoch') day, COUNT(*) sessions, COUNT(DISTINCT visitor_hash) visitors FROM analytics_sessions WHERE first_seen >= ? GROUP BY day ORDER BY day",
    )
      .bind(since)
      .all(),
    env.DB.prepare(
      "SELECT event_name, COUNT(*) count FROM analytics_events WHERE occurred_at >= ? GROUP BY event_name ORDER BY count DESC",
    )
      .bind(since)
      .all(),
    env.DB.prepare(
      "SELECT encrypted_details, reference, first_name, last_name, name, phone, therapist_preference, age, gender, service, button_id, created_at FROM enquiries WHERE delete_after > ? ORDER BY created_at DESC LIMIT 200",
    )
      .bind(Math.floor(Date.now() / 1000))
      .all(),
    env.DB.prepare(
      "SELECT id, visitor_hash, source, medium, campaign, device, country, landing_path, page_count, duration_seconds, first_seen, last_seen FROM analytics_sessions WHERE last_seen >= ? ORDER BY last_seen DESC LIMIT 200",
    )
      .bind(since)
      .all(),
    env.DB.prepare(
      "SELECT COALESCE(json_extract(metadata, '$.buttonId'), 'legacy') button_id, COUNT(*) clicks, COUNT(DISTINCT session_id) users FROM analytics_events WHERE event_name = 'telegram_click' AND occurred_at >= ? GROUP BY button_id ORDER BY clicks DESC",
    )
      .bind(since)
      .all(),
  ]);
  return NextResponse.json(
    {
      user: { email: user.email, displayName: user.displayName },
      settings: Object.fromEntries(
        (settings.results ?? []).map((row) => [row.key, row.value]),
      ),
      therapists: (therapists.results ?? []).map((row) => ({
        ...row,
        photos: photos.filter((p) => p.therapistId === row.id),
        imageUrl: row.image_key ? `/api/media/${row.image_key}` : null,
        image_key: undefined,
      })),
      leads: await Promise.all(
        (leads.results ?? []).map((row) => decryptDetails(row)),
      ),
      analytics: {
        totals: totals ?? {},
        sources: sources.results ?? [],
        days: days.results ?? [],
        events: events.results ?? [],
        sessions: sessions.results ?? [],
        buttons: buttons.results ?? [],
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const user = await requireAdminApi();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!env.DB)
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  if ((parsed.data.settings?.telegram_cta_en?.length ?? 0) > 40)
    return NextResponse.json(
      { error: "Telegram button labels must be 40 characters or fewer" },
      { status: 400 },
    );
  if ((parsed.data.settings?.site_name?.length ?? 0) > 80)
    return NextResponse.json(
      { error: "Website name must be 80 characters or fewer" },
      { status: 400 },
    );
  if (
    parsed.data.settings?.meta_pixel_id &&
    !/^\d{5,24}$/.test(parsed.data.settings.meta_pixel_id)
  )
    return NextResponse.json(
      { error: "Meta Pixel ID must contain digits only" },
      { status: 400 },
    );
  if (
    parsed.data.settings?.adsense_client_id &&
    !/^ca-pub-\d{10,24}$/.test(parsed.data.settings.adsense_client_id)
  )
    return NextResponse.json(
      { error: "Use a valid AdSense publisher ID such as ca-pub-…" },
      { status: 400 },
    );
  const now = Math.floor(Date.now() / 1000);
  const statements: D1PreparedStatement[] = [];
  for (const [key, value] of Object.entries(parsed.data.settings ?? {}))
    statements.push(
      env.DB.prepare(
        "INSERT INTO site_settings (key,value,updated_at,updated_by) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at, updated_by=excluded.updated_by",
      ).bind(key, value, now, user.email),
    );
  for (const therapist of parsed.data.therapists ?? [])
    statements.push(
      env.DB.prepare(
        "INSERT INTO therapist_profiles (id,name_en,name_hi,speciality_en,speciality_hi,image_key,active,updated_at) VALUES (?,?,?,?,?,NULL,?,?) ON CONFLICT(id) DO UPDATE SET name_en=excluded.name_en,name_hi=excluded.name_hi,speciality_en=excluded.speciality_en,speciality_hi=excluded.speciality_hi,active=excluded.active,updated_at=excluded.updated_at",
      ).bind(
        therapist.id,
        therapist.nameEn,
        therapist.nameHi,
        therapist.specialityEn,
        therapist.specialityHi,
        therapist.active ? 1 : 0,
        now,
      ),
    );
  if (statements.length) await env.DB.batch(statements);
  return NextResponse.json({ ok: true });
}
export async function DELETE(request: Request) {
  const user = await requireAdminApi();
  if (!user || request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!env.DB)
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  const body = (await request.json().catch(() => null)) as {
    scope?: string;
    id?: string;
  } | null;
  if (body?.scope === "enquiries")
    await env.DB.prepare("DELETE FROM enquiries").run();
  else if (body?.scope === "sources")
    await env.DB.prepare(
      "UPDATE analytics_sessions SET source='cleared',medium='none',campaign=NULL,referrer_host=NULL",
    ).run();
  else if (body?.scope === "analytics")
    await env.DB.batch([
      env.DB.prepare("DELETE FROM analytics_events"),
      env.DB.prepare("DELETE FROM analytics_sessions"),
    ]);
  else if (
    body?.scope === "profile" &&
    typeof body.id === "string" &&
    /^t[1-6]$/.test(body.id)
  ) {
    const [profile, gallery] = await Promise.all([
      env.DB.prepare("SELECT image_key FROM therapist_profiles WHERE id=?")
        .bind(body.id)
        .first<{ image_key: string | null }>(),
      env.DB.prepare(
        "SELECT image_key FROM therapist_photos WHERE therapist_id=?",
      )
        .bind(body.id)
        .all<{ image_key: string }>(),
    ]);
    await env.DB.batch([
      env.DB.prepare("DELETE FROM therapist_photos WHERE therapist_id=?").bind(
        body.id,
      ),
      env.DB.prepare("DELETE FROM therapist_profiles WHERE id=?").bind(body.id),
    ]);
    const bucket = env.BUCKET;
    if (bucket)
      await Promise.all(
        [
          profile?.image_key,
          ...(gallery.results ?? []).map((item) => item.image_key),
        ]
          .filter((key): key is string => Boolean(key))
          .map((key) => bucket.delete(key)),
      );
  } else
    return NextResponse.json(
      { error: "Invalid history scope" },
      { status: 400 },
    );
  return NextResponse.json({ ok: true });
}
