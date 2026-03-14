import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  status: z.string().trim().min(1),
  location: z.string().trim().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ returnId: string }> }
) {
  const { returnId } = await params;
  try {
    const events = await prisma.returnTracking.findMany({
      where: { returnId },
      orderBy: { eventAt: "desc" },
    });

    return NextResponse.json(events);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ returnId: string }> }
) {
  const { returnId } = await params;
  try {
    const body = await request.json();
    const data = createSchema.parse(body);

    const event = await prisma.returnTracking.create({
      data: {
        returnId,
        status: data.status,
        location: data.location,
        details: data.details as Prisma.InputJsonValue | undefined,
      },
    });

    return NextResponse.json(event);
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
