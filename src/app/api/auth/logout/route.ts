import { NextResponse } from "next/server";

export async function POST() {
  // Session invalidation is handled by NextAuth signOut on the client.
  return NextResponse.json({ ok: true });
}
