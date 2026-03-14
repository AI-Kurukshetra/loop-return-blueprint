import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { notifyReturnEvent } from "@/lib/communications";

const schema = z.object({
  returnId: z.string(),
  carrier: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { returnId, carrier } = schema.parse(body);

    const returnRecord = await prisma.return.findUnique({
      where: { id: returnId },
      include: { shippingLabel: true, customer: true },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    if (returnRecord.shippingLabel) {
      return NextResponse.json(
        { error: "Shipping label already exists" },
        { status: 400 }
      );
    }

    // Placeholder: In production, integrate with EasyPost, Shippo, or carrier API
    const trackingNumber = `1Z${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const labelUrl = `https://labels.example.com/${returnId}`;

    const label = await prisma.shippingLabel.create({
      data: {
        returnId,
        carrier,
        trackingNumber,
        labelUrl,
        status: "created",
      },
    });

    await notifyReturnEvent({
      merchantId: returnRecord.merchantId,
      returnId: returnRecord.id,
      customerId: returnRecord.customerId,
      customerEmail: returnRecord.customer.email,
      customerPhone: returnRecord.customer.phone,
      rmaNumber: returnRecord.rmaNumber,
      eventType: "label_created",
    });

    return NextResponse.json(label);
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
