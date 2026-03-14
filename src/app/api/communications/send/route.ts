import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { notifyReturnEvent } from "@/lib/communications";
import { canAccessMerchant, getSellerOrAdminContext } from "@/lib/access-control";

const schema = z.object({
  returnId: z.string(),
  eventType: z.enum(["return_approved", "label_created", "refund_processed"]),
});

export async function POST(request: NextRequest) {
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { returnId, eventType } = schema.parse(body);

    const returnRecord = await prisma.return.findUnique({
      where: { id: returnId },
      include: { customer: true },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }
    if (!canAccessMerchant(returnRecord.merchantId, context)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await notifyReturnEvent({
      merchantId: returnRecord.merchantId,
      returnId: returnRecord.id,
      customerId: returnRecord.customerId,
      customerEmail: returnRecord.customer.email,
      customerPhone: returnRecord.customer.phone,
      rmaNumber: returnRecord.rmaNumber,
      eventType,
    });

    return NextResponse.json({ ok: true });
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
