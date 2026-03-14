import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateRMA } from "@/lib/utils";
import { applyReasonFraudTagging } from "@/lib/fraud-tagging";
import {
  canAccessMerchant,
  getSellerOrAdminContext,
  scopedMerchantId,
} from "@/lib/access-control";

const createSchema = z.object({
  orderId: z.string(),
  customerId: z.string(),
  merchantId: z.string(),
  returnReason: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      orderItemId: z.string(),
      productId: z.string(),
      variantId: z.string().optional(),
      quantity: z.number().int().positive(),
      condition: z.enum(["unopened", "opened", "damaged", "defective"]),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createSchema.parse(body);

    if (!canAccessMerchant(data.merchantId, context)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const returnRecord = await prisma.return.create({
      data: {
        orderId: data.orderId,
        customerId: data.customerId,
        merchantId: data.merchantId,
        rmaNumber: generateRMA(),
        returnReason: data.returnReason,
        notes: data.notes,
        status: "pending",
        returnItems: {
          create: data.items.map((item) => ({
            orderItemId: item.orderItemId,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            condition: item.condition,
          })),
        },
      },
      include: {
        returnItems: { include: { product: true } },
        order: true,
      },
    });

    await applyReasonFraudTagging({
      merchantId: returnRecord.merchantId,
      customerId: returnRecord.customerId,
      returnId: returnRecord.id,
      returnReason: returnRecord.returnReason,
      notes: returnRecord.notes,
    });

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

export async function GET(request: NextRequest) {
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = scopedMerchantId(request, context);
    const status = searchParams.get("status");

    const returns = await prisma.return.findMany({
      where: {
        ...(merchantId && { merchantId }),
        ...(status && { status }),
      },
      include: {
        order: true,
        customer: true,
        returnItems: { include: { product: true } },
      },
      orderBy: { requestedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(returns);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
