import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
export async function POST(request: Request) {
  const user = await requireAdminApi();
  if (!user || request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!env.DB || !env.BUCKET)
    return NextResponse.json(
      { error: "Media storage unavailable" },
      { status: 503 },
    );
  const form = await request.formData(),
    id = form.get("therapistId"),
    kind = form.get("kind") || "portrait",
    file = form.get("file");
  if (
    !(file instanceof File) ||
    !["hero", "portrait", "gallery"].includes(String(kind)) ||
    (kind !== "hero" && (typeof id !== "string" || !/^t[1-6]$/.test(id)))
  )
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 5_000_000 ||
    file.size < 12
  )
    return NextResponse.json(
      { error: "Use JPG, PNG or WebP up to 5 MB" },
      { status: 400 },
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  const valid =
    file.type === "image/jpeg"
      ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : file.type === "image/png"
        ? [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)
        : new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
          new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (!valid)
    return NextResponse.json(
      { error: "File contents do not match its image type" },
      { status: 400 },
    );
  if (kind === "gallery") {
    const count = await env.DB.prepare(
      "SELECT COUNT(*) count FROM therapist_photos WHERE therapist_id=?",
    )
      .bind(id)
      .first<{ count: number }>();
    if ((count?.count || 0) >= 8)
      return NextResponse.json(
        { error: "Maximum 8 gallery photos per profile" },
        { status: 400 },
      );
  }
  const mediaId = crypto.randomUUID(),
    key = `spa/${kind}/${mediaId}.${file.type.split("/")[1].replace("jpeg", "jpg")}`,
    now = Math.floor(Date.now() / 1000);
  await env.BUCKET.put(key, bytes, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
  if (kind === "hero")
    await env.DB.prepare(
      "INSERT INTO site_settings (key,value,updated_at,updated_by) VALUES ('hero_image',?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at,updated_by=excluded.updated_by",
    )
      .bind("/api/media/" + key, now, user.email)
      .run();
  else if (kind === "gallery")
    await env.DB.prepare(
      "INSERT INTO therapist_photos (id,therapist_id,image_key,created_at) VALUES (?,?,?,?)",
    )
      .bind(mediaId, id, key, now)
      .run();
  else
    await env.DB.prepare(
      "INSERT INTO therapist_profiles (id,name_en,name_hi,speciality_en,speciality_hi,image_key,active,updated_at) VALUES (?,?,?,?,?,?,0,?) ON CONFLICT(id) DO UPDATE SET image_key=excluded.image_key,updated_at=excluded.updated_at",
    )
      .bind(
        id,
        "New therapist",
        "New therapist",
        "Massage care",
        "Massage care",
        key,
        now,
      )
      .run();
  return NextResponse.json({
    ok: true,
    id: mediaId,
    imageUrl: "/api/media/" + key,
  });
}
export async function DELETE(request: Request) {
  const user = await requireAdminApi();
  if (!user || request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!env.DB || !env.BUCKET)
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  const body = (await request.json().catch(() => null)) as {
    photoId?: string;
    therapistId?: string;
  } | null;
  if (
    typeof body?.photoId !== "string" ||
    typeof body?.therapistId !== "string"
  )
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const photo = await env.DB.prepare(
    "SELECT image_key FROM therapist_photos WHERE id=? AND therapist_id=?",
  )
    .bind(body.photoId, body.therapistId)
    .first<{ image_key: string }>();
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await env.DB.prepare(
    "DELETE FROM therapist_photos WHERE id=? AND therapist_id=?",
  )
    .bind(body.photoId, body.therapistId)
    .run();
  await env.BUCKET.delete(photo.image_key);
  return NextResponse.json({ ok: true });
}
