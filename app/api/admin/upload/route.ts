import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const user = await requireAdminApi(); if (!user) return NextResponse.json({ error:"Forbidden" }, { status:403 });
  if (!env.DB || !env.BUCKET) return NextResponse.json({ error:"Media storage unavailable" }, { status:503 });
  const form = await request.formData(); const therapistId = form.get("therapistId"); const file = form.get("file");
  if ((therapistId!=="t1"&&therapistId!=="t2") || !(file instanceof File)) return NextResponse.json({ error:"Invalid upload" }, { status:400 });
  if (!new Set(["image/jpeg","image/png","image/webp"]).has(file.type) || file.size>5_000_000) return NextResponse.json({ error:"Use JPG, PNG or WebP up to 5 MB" }, { status:400 });
  const extension = file.type.split("/")[1].replace("jpeg","jpg"); const key=`therapists/${therapistId}/${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key,file.stream(),{httpMetadata:{contentType:file.type,cacheControl:"public, max-age=31536000, immutable"}});
  const now=Math.floor(Date.now()/1000);
  const defaults = therapistId === "t1"
    ? ["Aanya", "आन्या", "Deep-tissue & recovery", "डीप-टिशू और रिकवरी"]
    : ["Meher", "मेहर", "Aroma & relaxation", "अरोमा और रिलैक्सेशन"];
  await env.DB.prepare(`INSERT INTO therapist_profiles
    (id,name_en,name_hi,speciality_en,speciality_hi,image_key,active,updated_at)
    VALUES (?,?,?,?,?,?,1,?)
    ON CONFLICT(id) DO UPDATE SET image_key=excluded.image_key, updated_at=excluded.updated_at`)
    .bind(therapistId,...defaults,key,now).run();
  return NextResponse.json({ ok:true,imageUrl:`/api/media/${key}` });
}
