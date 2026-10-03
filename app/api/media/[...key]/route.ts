import { env } from "cloudflare:workers";
import {hasSupabase} from "@/lib/supabase/config";
import {downloadSupabaseMedia} from "@/lib/supabase/store";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  if(hasSupabase()){
    try{
      const blob=await downloadSupabaseMedia(key.join("/"));
      if(!blob)return new Response("Not found",{status:404});
      return new Response(blob,{headers:{"content-type":blob.type||"application/octet-stream","x-content-type-options":"nosniff","cache-control":"public, max-age=31536000, immutable"}});
    }catch{return new Response("Not found",{status:404})}
  }
  if (!env.BUCKET) return new Response("Media unavailable", { status: 503 });
  const object = await env.BUCKET.get(key.join("/"));
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("x-content-type-options","nosniff");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
