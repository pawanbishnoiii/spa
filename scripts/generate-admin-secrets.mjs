import { pbkdf2Sync, randomBytes } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error("Usage: npm run admin:secrets -- 'your-strong-password'");
  process.exit(1);
}
const salt = randomBytes(18).toString("base64url");
const hash = pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
console.log(`ADMIN_PASSWORD_HASH=${JSON.stringify({ salt, hash })}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(48).toString("base64url")}`);
console.log(`ENQUIRY_ENCRYPTION_KEY=${randomBytes(32).toString("base64")}`);
