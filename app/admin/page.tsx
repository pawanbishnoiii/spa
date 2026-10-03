import {env} from "cloudflare:workers";
import {getChatGPTUser,chatGPTSignOutPath} from "@/app/chatgpt-auth";
import {isAdminEmail} from "@/lib/admin-auth";
import {getPasswordAdmin} from "@/lib/password-admin";
import AdminDashboard from "@/components/admin-dashboard";
import AdminLogin from "@/components/admin-login";
import {hasSupabase} from "@/lib/supabase/config";
export const dynamic="force-dynamic";
export default async function AdminPage(){
 const admin=await getPasswordAdmin();
 const storageReady=hasSupabase()||Boolean(env.BUCKET);
 if(admin)return <AdminDashboard email={admin.email} signOutPath="/api/admin/logout" storageReady={storageReady}/>;
 const user=await getChatGPTUser();
 if(user&&isAdminEmail(user.email))return <AdminDashboard email={user.email} signOutPath={chatGPTSignOutPath("/admin")} storageReady={storageReady}/>;
 return <AdminLogin/>;
}
