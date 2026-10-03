import { env } from "cloudflare:workers";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { getChatGPTUser, chatGPTSignInPath, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { isAdminEmail } from "@/lib/admin-auth";
import AdminDashboard from "@/components/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getChatGPTUser();
  if (!user) return <main className="admin-gate">
    <section className="admin-gate-visual">
      <Link href="/" className="admin-gate-back"><ArrowLeft/> Back to website</Link>
      <div className="admin-gate-brand"><span><Sparkles/></span><div><b>QUIET RITUAL</b><small>Private operations</small></div></div>
      <div className="admin-gate-quote"><span>ADMINISTRATOR ACCESS</span><h1>Everything your spa needs, behind one secure door.</h1><p>Update prices, portraits, campaigns and visitor insights without touching the website code.</p></div>
    </section>
    <section className="admin-gate-panel">
      <div className="admin-gate-card">
        <span className="admin-gate-icon"><LockKeyhole/></span>
        <small>SPA COMMAND CENTRE</small>
        <h2>Welcome back.</h2>
        <p>Continue with an approved administrator account. Access is checked securely on every request.</p>
        <div className="admin-gate-fields" aria-hidden="true">
          <label><span>Admin account</span><div>Approved email address</div></label>
          <label><span>Password</span><div>•••••••••••• <ShieldCheck/></div></label>
        </div>
        <a className="admin-gate-submit" href={chatGPTSignInPath("/admin")} target="_top"><Sparkles/> Sign in securely</a>
        <p className="admin-gate-note"><ShieldCheck/> Passwords are handled by secure ChatGPT sign-in and are never stored by this website.</p>
      </div>
    </section>
  </main>;
  if (!isAdminEmail(user.email)) return <main className="admin-denied"><span>ACCESS CONTROL</span><h1>This account is not an approved admin.</h1><p>Signed in as {user.email}. Add this exact email to the protected ADMIN_EMAILS setting.</p><Link href={chatGPTSignOutPath("/admin")} target="_top">Use another account</Link></main>;
  return <AdminDashboard email={user.email} signOutPath={chatGPTSignOutPath("/admin")} storageReady={Boolean(env.BUCKET)} />;
}
