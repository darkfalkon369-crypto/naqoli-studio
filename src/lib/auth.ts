import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const AUTH_COOKIE = "naqoli_auth";
const TOKEN_MSG = "naqoli-admin:v1";

/** Expected cookie value for a fully authenticated admin. */
export function authToken(secret: string): string {
  return createHmac("sha256", secret).update(TOKEN_MSG).digest("hex");
}

export function getAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET || undefined;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password.normalize("NFKC"), salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password.normalize("NFKC"), salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export function isStrongEnough(password: string): boolean {
  return password.length >= 8;
}
