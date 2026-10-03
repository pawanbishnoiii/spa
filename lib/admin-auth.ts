import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export function isAdminEmail(email: string) {
  const allowed = (env.ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

export async function requireAdminApi() {
  const user = await getChatGPTUser();
  return user && isAdminEmail(user.email) ? user : null;
}
