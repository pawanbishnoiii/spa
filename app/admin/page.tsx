import { env } from "cloudflare:workers";
import Link from "next/link";
import { requireChatGPTUser, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { isAdminEmail } from "@/lib/admin-auth";
import AdminDashboard from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!isAdminEmail(user.email)) return <main className="admin-denied"><span>ACCESS CONTROL</span><h1>This account is not an approved admin.</h1><p>Signed in as {user.email}. Add this exact email to the protected ADMIN_EMAILS setting.</p><Link href={chatGPTSignOutPath("/admin")} target="_top">Use another account</Link></main>;
  return <AdminDashboard email={user.email} signOutPath={chatGPTSignOutPath("/")} storageReady={Boolean(env.BUCKET)} />;
}
