import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("ekrishi_session")?.value;
  if (!raw) return NextResponse.json({ ok: false, error: "UNAUTHORIZED", status: 401 }, { status: 401 });

  try {
    const session = JSON.parse(Buffer.from(raw, "base64").toString());
    return NextResponse.json({ ok: true, ...session });
  } catch {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED", status: 401 }, { status: 401 });
  }
}
