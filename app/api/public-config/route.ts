import { env } from "cloudflare:workers";
import {profilePhotos} from "@/lib/profile-media";
import { NextResponse } from "next/server";

export async function GET() {
  if (!env.DB) return NextResponse.json({ settings: {}, therapists: [] });
  const [settingsResult, therapistsResult] = await Promise.all([
    env.DB.prepare("SELECT key, value FROM site_settings").all<{key:string;value:string}>(),
    env.DB.prepare("SELECT id, name_en, name_hi, speciality_en, speciality_hi, image_key FROM therapist_profiles WHERE active = 1 ORDER BY id").all<Record<string,string|null>>(),
  ]);
  const photos=await profilePhotos();
  const settings = Object.fromEntries((settingsResult.results ?? []).map((row) => [row.key, row.value]));
  const therapists = (therapistsResult.results ?? []).map((row) => ({ ...row,photos:photos.filter(p=>p.therapistId===row.id), imageUrl: row.image_key ? `/api/media/${row.image_key}` : null, image_key: undefined }));
  return NextResponse.json({ settings, therapists }, { headers: { "cache-control": "public, max-age=30, stale-while-revalidate=120" } });
}
