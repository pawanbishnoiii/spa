import {env} from "cloudflare:workers";
import {getChatGPTUser,chatGPTSignOutPath} from "@/app/chatgpt-auth";
import {isAdminEmail} from "@/lib/admin-auth";
import {getPasswordAdmin} from "@/lib/password-admin";
import AdminDashboard from "@/components/admin-dashboard";
import AdminLogin from "@/components/admin-login";
export const dynamic="force-dynamic";
export default async function AdminPage(){
 const admin=await getPasswordAdmin();
 if(admin)return <AdminDashboard email={admin.email} signOutPath="/api/admin/logout" storageReady={Boolean(env.BUCKET)}/>;
 const user=await getChatGPTUser();
 if(user&&isAdminEmail(user.email))return <AdminDashboard email={user.email} signOutPath={chatGPTSignOutPath("/admin")} storageReady={Boolean(env.BUCKET)}/>;
 return <AdminLogin/>;
}
