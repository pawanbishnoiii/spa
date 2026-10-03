import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  firstName: z.string().trim().min(2).max(40),
  lastName: z.string().trim().min(1).max(40),
  buttonId: z.string().max(80),
  gender: z.enum(["female", "male", "nonbinary", "prefer-not"]),
  age: z.coerce.number().int().min(18).max(100),
  service: z.enum(["calm", "deep", "aroma"]),
  therapist: z.string().trim().max(80).optional(),
  marketing: z.boolean().default(false),
  website: z.string().max(0), idempotencyKey: z.string().uuid(),
});

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Please review the highlighted details." }, { status: 400 });
    const db = env.DB;
    if (!db) return NextResponse.json({ error: "Enquiries are temporarily unavailable. Please call or use Telegram." }, { status: 503 });
    const now = new Date(); const day = now.toISOString().slice(0, 10);
    const fingerprint = await digest(`${day}:${request.headers.get("cf-connecting-ip") ?? "local"}`);
    const current = await db.prepare("SELECT count FROM enquiry_rate_limits WHERE fingerprint = ?").bind(fingerprint).first<{count:number}>();
    if ((current?.count ?? 0) >= 5) return NextResponse.json({ error: "Too many enquiries today. Please call us instead." }, { status: 429 });
    const existing = await db.prepare("SELECT reference FROM enquiries WHERE idempotency_key = ?").bind(parsed.data.idempotencyKey).first<{reference:string}>();
    if (existing) return NextResponse.json({ reference: existing.reference });
    const reference = `ENQ-${day.replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const deletion = new Date(now.getTime() + 90 * 86400000);
    await db.batch([
      db.prepare("INSERT INTO enquiries (id, reference, idempotency_key, name, first_name, last_name, button_id, gender, age, service, therapist_preference, marketing_consent, created_at, delete_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), reference, parsed.data.idempotencyKey, `${parsed.data.firstName} ${parsed.data.lastName}`, parsed.data.firstName, parsed.data.lastName, parsed.data.buttonId, parsed.data.gender, parsed.data.age, parsed.data.service, parsed.data.therapist || null, parsed.data.marketing ? 1 : 0, Math.floor(now.getTime()/1000), Math.floor(deletion.getTime()/1000)),
      current ? db.prepare("UPDATE enquiry_rate_limits SET count = count + 1 WHERE fingerprint = ?").bind(fingerprint) : db.prepare("INSERT INTO enquiry_rate_limits (fingerprint, count, window_start) VALUES (?, 1, ?)").bind(fingerprint, Math.floor(now.getTime()/1000)),
    ]);
    return NextResponse.json({ reference });
  } catch {
    return NextResponse.json({ error: "We could not save your enquiry. Please try again." }, { status: 500 });
  }
}
