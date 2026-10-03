import {NextResponse} from "next/server";
import {requireAdminApi} from "@/lib/admin-auth";
import {protectLegacyEnquiries} from "@/lib/enquiry-privacy";
export async function POST(request:Request){if(!await requireAdminApi()||request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Forbidden"},{status:403});try{return NextResponse.json({protected:await protectLegacyEnquiries()},{headers:{"Cache-Control":"no-store"}})}catch{return NextResponse.json({error:"Could not protect legacy records"},{status:503})}}
