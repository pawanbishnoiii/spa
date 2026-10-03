import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const bucket = "spa-media";

function db() {
  const client = getSupabaseAdmin();
  if (!client) throw new Error("Supabase is not configured");
  return client;
}

function must<T>(result: { data: T; error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function getSupabaseProfilePhotos() {
  const rows = must(await db().from("therapist_photos").select("id,therapist_id,image_key").order("created_at"));
  return (rows ?? []).map((row) => ({
    id: row.id,
    therapistId: row.therapist_id,
    url: `/api/media/${row.image_key}`,
  }));
}

export async function getSupabasePublicConfig() {
  const [settingsResult, profilesResult, photos] = await Promise.all([
    db().from("site_settings").select("key,value"),
    db().from("therapist_profiles").select("id,name_en,name_hi,speciality_en,speciality_hi,image_key,active").eq("active", true).order("id"),
    getSupabaseProfilePhotos(),
  ]);
  const settingsRows = must(settingsResult) ?? [];
  const profiles = must(profilesResult) ?? [];
  return {
    settings: Object.fromEntries(settingsRows.map((row) => [row.key, row.value])),
    therapists: profiles.map((row) => ({
      ...row,
      photos: photos.filter((photo) => photo.therapistId === row.id),
      imageUrl: row.image_key ? `/api/media/${row.image_key}` : null,
      image_key: undefined,
    })),
  };
}

export async function getSupabaseAdminData(decrypt: (row: Record<string, unknown>) => Promise<Record<string, unknown>>) {
  const since = Math.floor(Date.now() / 1000) - 30 * 86400;
  const now = Math.floor(Date.now() / 1000);
  const [settingsResult, profilesResult, photos, sessionsResult, eventsResult, leadsResult] = await Promise.all([
    db().from("site_settings").select("key,value").order("key"),
    db().from("therapist_profiles").select("id,name_en,name_hi,speciality_en,speciality_hi,image_key,active").order("id"),
    getSupabaseProfilePhotos(),
    db().from("analytics_sessions").select("id,visitor_hash,source,medium,campaign,device,landing_path,page_count,duration_seconds,first_seen,last_seen").gte("last_seen", since).order("last_seen", { ascending: false }).limit(200),
    db().from("analytics_events").select("session_id,event_name,occurred_at,metadata").gte("occurred_at", since),
    db().from("enquiries").select("encrypted_details,reference,first_name,last_name,name,phone,therapist_preference,age,gender,service,button_id,created_at").gt("delete_after", now).order("created_at", { ascending: false }).limit(200),
  ]);
  const settings = must(settingsResult) ?? [];
  const profiles = must(profilesResult) ?? [];
  const sessions = must(sessionsResult) ?? [];
  const events = must(eventsResult) ?? [];
  const leads = must(leadsResult) ?? [];
  const sourceCounts = new Map<string, number>();
  const dayCounts = new Map<string, { sessions: number; visitors: Set<string> }>();
  for (const session of sessions) {
    sourceCounts.set(session.source, (sourceCounts.get(session.source) ?? 0) + 1);
    const day = new Date(Number(session.first_seen) * 1000).toISOString().slice(0, 10);
    const entry = dayCounts.get(day) ?? { sessions: 0, visitors: new Set<string>() };
    entry.sessions += 1;
    entry.visitors.add(session.visitor_hash);
    dayCounts.set(day, entry);
  }
  const eventCounts = new Map<string, number>();
  const buttonCounts = new Map<string, { clicks: number; users: Set<string> }>();
  for (const event of events) {
    eventCounts.set(event.event_name, (eventCounts.get(event.event_name) ?? 0) + 1);
    if (event.event_name === "telegram_click") {
      const metadata = (event.metadata && typeof event.metadata === "object") ? event.metadata as Record<string, unknown> : {};
      const buttonId = String(metadata.buttonId || "legacy");
      const value = buttonCounts.get(buttonId) ?? { clicks: 0, users: new Set<string>() };
      value.clicks += 1;
      value.users.add(event.session_id);
      buttonCounts.set(buttonId, value);
    }
  }
  const visitors = new Set(sessions.map((session) => session.visitor_hash)).size;
  const duration = sessions.reduce((sum, session) => sum + Number(session.duration_seconds || 0), 0);
  return {
    settings: Object.fromEntries(settings.map((row) => [row.key, row.value])),
    therapists: profiles.map((row) => ({
      ...row,
      active: row.active ? 1 : 0,
      photos: photos.filter((photo) => photo.therapistId === row.id),
      imageUrl: row.image_key ? `/api/media/${row.image_key}` : null,
      image_key: undefined,
    })),
    leads: await Promise.all(leads.map((row) => decrypt(row))),
    analytics: {
      totals: {
        sessions: sessions.length,
        visitors,
        avg_duration: sessions.length ? duration / sessions.length : 0,
        page_views: sessions.reduce((sum, session) => sum + Number(session.page_count || 0), 0),
      },
      sources: [...sourceCounts].map(([source, count]) => ({ source, sessions: count })).sort((a, b) => b.sessions - a.sessions).slice(0, 8),
      days: [...dayCounts].map(([day, value]) => ({ day, sessions: value.sessions, visitors: value.visitors.size })).sort((a, b) => a.day.localeCompare(b.day)),
      events: [...eventCounts].map(([event_name, count]) => ({ event_name, count })).sort((a, b) => b.count - a.count),
      sessions,
      buttons: [...buttonCounts].map(([button_id, value]) => ({ button_id, clicks: value.clicks, users: value.users.size })).sort((a, b) => b.clicks - a.clicks),
    },
  };
}

export async function saveSupabaseAdminData(
  settings: Record<string, string> | undefined,
  therapists: Array<{ id: string; nameEn: string; nameHi: string; specialityEn: string; specialityHi: string; active: boolean }> | undefined,
  email: string,
) {
  const now = Math.floor(Date.now() / 1000);
  const writes: PromiseLike<unknown>[] = [];
  if (settings && Object.keys(settings).length) {
    writes.push(db().from("site_settings").upsert(Object.entries(settings).map(([key, value]) => ({ key, value, updated_at: now, updated_by: email }))));
  }
  if (therapists?.length) {
    writes.push(db().from("therapist_profiles").upsert(therapists.map((item) => ({
      id: item.id,
      name_en: item.nameEn,
      name_hi: item.nameHi,
      speciality_en: item.specialityEn,
      speciality_hi: item.specialityHi,
      active: item.active,
      updated_at: now,
    }))));
  }
  const results = await Promise.all(writes);
  for (const result of results as Array<{ error?: { message: string } | null }>) if (result.error) throw new Error(result.error.message);
}

export async function deleteSupabaseData(scope: string, id?: string) {
  if (scope === "enquiries") must(await db().from("enquiries").delete().neq("id", ""));
  else if (scope === "sources") must(await db().from("analytics_sessions").update({ source: "cleared", medium: "none", campaign: null, referrer_host: null }).neq("id", ""));
  else if (scope === "analytics") {
    must(await db().from("analytics_events").delete().neq("id", ""));
    must(await db().from("analytics_sessions").delete().neq("id", ""));
  } else if (scope === "profile" && id && /^t[1-6]$/.test(id)) {
    const [profileResult, photosResult] = await Promise.all([
      db().from("therapist_profiles").select("image_key").eq("id", id).maybeSingle(),
      db().from("therapist_photos").select("image_key").eq("therapist_id", id),
    ]);
    if (profileResult.error) throw profileResult.error;
    const photos = must(photosResult) ?? [];
    must(await db().from("therapist_photos").delete().eq("therapist_id", id));
    must(await db().from("therapist_profiles").delete().eq("id", id));
    const keys = [profileResult.data?.image_key, ...photos.map((photo) => photo.image_key)].filter(Boolean) as string[];
    if (keys.length) must(await db().storage.from(bucket).remove(keys));
  } else throw new Error("Invalid history scope");
}

export async function searchSupabaseEnquiries(offset: number, decrypt: (row: Record<string, unknown>) => Promise<Record<string, unknown>>) {
  const now = Math.floor(Date.now() / 1000);
  const result = await db().from("enquiries")
    .select("encrypted_details,reference,first_name,last_name,name,phone,therapist_preference,age,gender,service,button_id,created_at")
    .gt("delete_after", now).order("created_at", { ascending: false }).range(offset, offset + 199);
  const rows = must(result) ?? [];
  return { rows: await Promise.all(rows.map((row) => decrypt(row))), count: rows.length };
}

export async function rateLimitSupabase(fingerprint: string, maximum: number, windowStart: number) {
  const result = await db().rpc("consume_rate_limit", {
    p_fingerprint: fingerprint,
    p_max: maximum,
    p_window_start: windowStart,
  });
  return Boolean(must(result));
}

export async function getSupabaseEnquiryByIdempotency(idempotencyKey: string) {
  return must(await db().from("enquiries").select("reference").eq("idempotency_key", idempotencyKey).maybeSingle());
}

export async function insertSupabaseEnquiry(row: Record<string, unknown>) {
  must(await db().from("enquiries").insert(row));
}

export async function upsertSupabaseAnalytics(session: Record<string, unknown>, event?: Record<string, unknown>) {
  const client = db();
  const current = must(await client.from("analytics_sessions").select("duration_seconds,page_count").eq("id", session.id).maybeSingle());
  const next: Record<string, unknown> = current ? {
    ...session,
    duration_seconds: Math.max(Number(current.duration_seconds || 0), Number(session.duration_seconds || 0)),
    page_count: Number(current.page_count || 0) + Number(session.page_increment || 0),
  } : { ...session, page_count: 1 };
  delete next.page_increment;
  must(await client.from("analytics_sessions").upsert(next));
  if (event) must(await client.from("analytics_events").insert(event));
}

export async function uploadSupabaseMedia(key: string, bytes: Uint8Array, contentType: string) {
  must(await db().storage.from(bucket).upload(key, bytes, { contentType, cacheControl: "31536000", upsert: false }));
}

export async function downloadSupabaseMedia(key: string) {
  return must(await db().storage.from(bucket).download(key));
}

export async function removeSupabaseMedia(keys: string[]) {
  if (keys.length) must(await db().storage.from(bucket).remove(keys));
}

export function supabaseMediaBucket() { return bucket; }

export { db as requireSupabase };
