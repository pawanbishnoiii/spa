import {env} from "cloudflare:workers";
import {hasSupabase} from "@/lib/supabase/config";
import {getSupabaseProfilePhotos} from "@/lib/supabase/store";
export async function profilePhotos(){if(hasSupabase())return getSupabaseProfilePhotos();if(!env.DB)return [];const result=await env.DB.prepare("SELECT id,therapist_id,image_key FROM therapist_photos ORDER BY created_at").all<{id:string;therapist_id:string;image_key:string}>();return (result.results||[]).map(row=>({id:row.id,therapistId:row.therapist_id,url:"/api/media/"+row.image_key}))}
