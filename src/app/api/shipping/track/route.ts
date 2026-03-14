import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackingNumber = searchParams.get("tracking");
  const returnId = searchParams.get("returnId");

  if (!trackingNumber && !returnId) {
    return NextResponse.json(
      { error: "Provide tracking or returnId" },
      { status: 400 }
    );
  }

  try {
    const label = await prisma.shippingLabel.findFirst({
      where: trackingNumber
        ? { trackingNumber }
        : returnId
          ? { returnId }
          : undefined,
      include: { return: { include: { customer: true } } },
    });

    if (!label) {
      return NextResponse.json({ error: "Label not found" }, { status: 404 });
    }

    // Placeholder: In production, call carrier API for real tracking
    return NextResponse.json({
      trackingNumber: label.trackingNumber,
      carrier: label.carrier,
      status: label.status,
      labelUrl: label.labelUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
