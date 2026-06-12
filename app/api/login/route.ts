import { NextResponse } from "next/server";
import { adminToken, checkPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pw = typeof body.password === "string" ? body.password : "";
  if (!checkPassword(pw)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  return NextResponse.json({ token: adminToken() });
}
