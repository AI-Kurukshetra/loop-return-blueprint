import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const webhookSchema = z.object({
  source: z.string().trim().min(1),
  eventType: z.string().trim().min(1),
  payload: z.record(z.string(), z.unknown()),
  merchantId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = webhookSchema.parse(body);

    const event = await prisma.webhookEvent.create({
      data: {
        source: data.source,
        eventType: data.eventType,
        payload: data.payload as Prisma.InputJsonValue,
        merchantId: data.merchantId,
      },
    });

    return NextResponse.json({ ok: true, id: event.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid webhook payload", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
