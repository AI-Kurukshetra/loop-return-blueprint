import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { notifyReturnEvent } from "@/lib/communications";

const schema = z.object({
  returnId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["original", "store_credit", "other"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { returnId, amount, paymentMethod } = schema.parse(body);

    const returnRecord = await prisma.return.findUnique({
      where: { id: returnId },
      include: { refund: true, customer: true },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    if (returnRecord.refund) {
      return NextResponse.json(
        { error: "Refund already exists for this return" },
        { status: 400 }
      );
    }

    const refund = await prisma.refund.create({
      data: {
        returnId,
        amount,
        paymentMethod,
        status: "pending",
      },
    });

    // Update return status
    await prisma.return.update({
      where: { id: returnId },
      data: { status: "refunded", refundedAt: new Date() },
    });

    await notifyReturnEvent({
      merchantId: returnRecord.merchantId,
      returnId: returnRecord.id,
      customerId: returnRecord.customerId,
      customerEmail: returnRecord.customer.email,
      customerPhone: returnRecord.customer.phone,
      rmaNumber: returnRecord.rmaNumber,
      eventType: "refund_processed",
    });

    return NextResponse.json(refund);
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
