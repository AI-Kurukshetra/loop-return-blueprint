import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnId = searchParams.get("returnId");

    const events = await prisma.returnTracking.findMany({
      where: {
        ...(returnId ? { returnId } : {}),
      },
      orderBy: { eventAt: "desc" },
      take: 200,
    });

    return NextResponse.json(events);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
