import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { notifyReturnEvent } from "@/lib/communications";
import { scoreReturnFraud } from "@/lib/fraud";
import { canAccessMerchant, getSellerOrAdminContext } from "@/lib/access-control";

const updateSchema = z.object({
  status: z
    .enum([
      "pending",
      "approved",
      "received",
      "processing",
      "refunded",
      "rejected",
      "cancelled",
    ])
    .optional(),
  returnReason: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const returnRecord = await prisma.return.findUnique({
      where: { id },
      include: {
        order: { include: { orderItems: { include: { product: true } } } },
        customer: true,
        returnItems: { include: { product: true, orderItem: true } },
        shippingLabel: true,
        refund: true,
      },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }
    if (!canAccessMerchant(returnRecord.merchantId, context)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(returnRecord);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.return.findUnique({
      where: { id },
      select: { merchantId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }
    if (!canAccessMerchant(existing.merchantId, context)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.status === "approved") {
      updateData.approvedAt = new Date();
    }

    const returnRecord = await prisma.return.update({
      where: { id },
      data: updateData,
      include: {
        returnItems: { include: { product: true } },
        order: true,
        customer: true,
      },
    });

    if (data.status === "approved") {
      await notifyReturnEvent({
        merchantId: returnRecord.merchantId,
        returnId: returnRecord.id,
        customerId: returnRecord.customerId,
        customerEmail: returnRecord.customer.email,
        customerPhone: returnRecord.customer.phone,
        rmaNumber: returnRecord.rmaNumber,
        eventType: "return_approved",
      });
    }

    if (data.status === "processing") {
      await scoreReturnFraud({ returnId: returnRecord.id });
    }

    return NextResponse.json(returnRecord);
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.return.findUnique({
      where: { id },
      select: { merchantId: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }
    if (!canAccessMerchant(existing.merchantId, context)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.return.delete({
      where: { id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete return. Please check linked records." },
      { status: 400 }
    );
  }
}
