import {env} from "cloudflare:workers";
import {NextResponse} from "next/server";
import {requireAdminApi} from "@/lib/admin-auth";
import {decryptDetails} from "@/lib/enquiry-privacy";
export async function POST(request:Request){
 if(!await requireAdminApi()||request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Forbidden"},{status:403});
 if(!env.DB)return NextResponse.json({error:"Database unavailable"},{status:503});
 const body=await request.json().catch(()=>null);if(typeof body?.query!=="string"||body.query.length>80||!Number.isSafeInteger(body.offset||0)||(body.offset||0)<0)return NextResponse.json({error:"Invalid search"},{status:400});
 const query=body.query.toLowerCase().trim(),digits=query.replace(/\D/g,"");let offset=body.offset||0,hasMore=true;const matches:Record<string,any>[]=[];
 try{for(let batch=0;batch<10&&matches.length<200;batch++){const result=await env.DB.prepare("SELECT encrypted_details,reference,first_name,last_name,name,phone,therapist_preference,age,gender,service,button_id,created_at FROM enquiries WHERE delete_after>? ORDER BY created_at DESC,reference DESC LIMIT 200 OFFSET ?").bind(Math.floor(Date.now()/1000),offset).all<Record<string,any>>();const rows=result.results||[];offset+=rows.length;for(const record of rows){const row=await decryptDetails(record);if(!query||[row.name,row.first_name,row.last_name,row.phone,row.reference].some(v=>String(v||"").toLowerCase().includes(query))||(digits.length>=3&&String(row.phone||"").replace(/\D/g,"").includes(digits)))matches.push(row)}if(rows.length<200){hasMore=false;break}if(!query)break}return NextResponse.json({rows:matches,nextOffset:hasMore?offset:null},{headers:{"Cache-Control":"private, no-store"}})}catch{return NextResponse.json({error:"Unable to load enquiries"},{status:503})}
}
