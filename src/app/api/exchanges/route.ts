import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  returnId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { returnId } = schema.parse(body);

    const returnRecord = await prisma.return.findUnique({
      where: { id: returnId },
      include: { exchange: true },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    if (returnRecord.exchange) {
      return NextResponse.json(
        { error: "Exchange already exists for this return" },
        { status: 400 }
      );
    }

    const exchange = await prisma.exchange.create({
      data: { returnId, status: "pending" },
      include: { return: true },
    });

    return NextResponse.json(exchange);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchantId");

    const exchanges = await prisma.exchange.findMany({
      where: {
        ...(merchantId
          ? {
              return: {
                merchantId,
              },
            }
          : {}),
      },
      include: {
        return: {
          include: {
            customer: true,
            order: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(exchanges);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
