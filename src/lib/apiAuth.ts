import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export function getSession(req: NextRequest) {
  const phone = req.headers.get("X-EKrishi-Phone");
  if (phone) return { phone, fromHeader: true };

  const raw = req.cookies.get("ekrishi_session")?.value;
  if (!raw) return null;
  try {
    return { ...JSON.parse(Buffer.from(raw, "base64").toString()), fromHeader: false };
  } catch {
    return null;
  }
}

export function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, error: code, message, status }, { status });
}
