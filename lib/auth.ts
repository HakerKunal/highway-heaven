import crypto from "crypto";

const PASSWORD = process.env.ADMIN_PASSWORD || "highway@123";

export function adminToken(): string {
  return crypto.createHmac("sha256", PASSWORD).update("highway-heaven-admin").digest("hex");
}

export function checkPassword(pw: string): boolean {
  const a = Buffer.from(pw);
  const b = Buffer.from(PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isAuthed(req: Request): boolean {
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const expected = adminToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
