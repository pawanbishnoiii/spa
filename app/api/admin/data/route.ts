import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";

const settingKeys = [
  "price_calm_30","price_calm_60","price_calm_90","price_deep_60","price_deep_90","price_aroma_60","price_aroma_90",
  "registration_fee","business_phone","telegram_username","opening_hours","address","meta_pixel_id","adsense_client_id",
] as const;
const updateSchema = z.object({
  settings: z.record(z.enum(settingKeys), z.string().trim().max(500)).optional(),
  therapists: z.array(z.object({id:z.enum(["t1","t2"]),nameEn:z.string().max(80),nameHi:z.string().max(80),specialityEn:z.string().max(200),specialityHi:z.string().max(200),active:z.boolean()})).max(2).optional(),
});

export async function GET() {
  const user = await requireAdminApi(); if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!env.DB) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const since = Math.floor(Date.now()/1000) - 30*86400;
  const [settings, therapists, totals, sources, days, events] = await Promise.all([
    env.DB.prepare("SELECT key, value FROM site_settings ORDER BY key").all<{key:string;value:string}>(),
    env.DB.prepare("SELECT id, name_en, name_hi, speciality_en, speciality_hi, image_key, active FROM therapist_profiles ORDER BY id").all<Record<string,string|number|null>>(),
    env.DB.prepare("SELECT COUNT(*) sessions, COUNT(DISTINCT visitor_hash) visitors, COALESCE(AVG(duration_seconds),0) avg_duration, COALESCE(SUM(page_count),0) page_views FROM analytics_sessions WHERE last_seen >= ?").bind(since).first(),
    env.DB.prepare("SELECT source, COUNT(*) sessions FROM analytics_sessions WHERE last_seen >= ? GROUP BY source ORDER BY sessions DESC LIMIT 8").bind(since).all(),
    env.DB.prepare("SELECT date(first_seen, 'unixepoch') day, COUNT(*) sessions, COUNT(DISTINCT visitor_hash) visitors FROM analytics_sessions WHERE first_seen >= ? GROUP BY day ORDER BY day").bind(since).all(),
    env.DB.prepare("SELECT event_name, COUNT(*) count FROM analytics_events WHERE occurred_at >= ? GROUP BY event_name ORDER BY count DESC").bind(since).all(),
  ]);
  return NextResponse.json({
    user:{email:user.email,displayName:user.displayName},
    settings:Object.fromEntries((settings.results??[]).map((row)=>[row.key,row.value])),
    therapists:(therapists.results??[]).map((row)=>({...row,imageUrl:row.image_key?`/api/media/${row.image_key}`:null,image_key:undefined})),
    analytics:{totals:totals??{},sources:sources.results??[],days:days.results??[],events:events.results??[]},
  });
}

export async function POST(request: Request) {
  const user = await requireAdminApi(); if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!env.DB) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const parsed = updateSchema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const now = Math.floor(Date.now()/1000); const statements: D1PreparedStatement[] = [];
  for (const [key,value] of Object.entries(parsed.data.settings??{})) statements.push(env.DB.prepare("INSERT INTO site_settings (key,value,updated_at,updated_by) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at, updated_by=excluded.updated_by").bind(key,value,now,user.email));
  for (const therapist of parsed.data.therapists??[]) statements.push(env.DB.prepare("INSERT INTO therapist_profiles (id,name_en,name_hi,speciality_en,speciality_hi,image_key,active,updated_at) VALUES (?,?,?,?,?,NULL,?,?) ON CONFLICT(id) DO UPDATE SET name_en=excluded.name_en,name_hi=excluded.name_hi,speciality_en=excluded.speciality_en,speciality_hi=excluded.speciality_hi,active=excluded.active,updated_at=excluded.updated_at").bind(therapist.id,therapist.nameEn,therapist.nameHi,therapist.specialityEn,therapist.specialityHi,therapist.active?1:0,now));
  if (statements.length) await env.DB.batch(statements);
  return NextResponse.json({ ok:true });
}
