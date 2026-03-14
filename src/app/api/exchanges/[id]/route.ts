import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const exchange = await prisma.exchange.findUnique({
      where: { id },
      include: {
        return: {
          include: {
            customer: true,
            order: true,
            returnItems: { include: { product: true } },
          },
        },
      },
    });

    if (!exchange) {
      return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
    }

    return NextResponse.json(exchange);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
