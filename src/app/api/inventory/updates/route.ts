import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  canAccessMerchant,
  getSellerOrAdminContext,
  scopedMerchantId,
} from "@/lib/access-control";

const createSchema = z.object({
  merchantId: z.string(),
  productId: z.string(),
  sku: z.string().optional(),
  quantity: z.number().int().positive("Quantity must be greater than zero"),
  type: z.enum(["restock", "damage", "liquidate"]),
  reason: z.string().trim().max(240).optional(),
  returnId: z.string().optional(),
  location: z.string().optional(),
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

    const signedQty =
      data.type === "restock" ? Math.abs(data.quantity) : -Math.abs(data.quantity);

    const stock = await prisma.warehouseStock.upsert({
      where: {
        merchantId_productId_sku_location: {
          merchantId: data.merchantId,
          productId: data.productId,
          sku: data.sku ?? "UNKNOWN-SKU",
          location: data.location ?? "main",
        },
      },
      create: {
        merchantId: data.merchantId,
        productId: data.productId,
        sku: data.sku ?? "UNKNOWN-SKU",
        location: data.location ?? "main",
        quantity: Math.max(0, signedQty),
      },
      update: {
        quantity: { increment: signedQty },
      },
    });

    const update = await prisma.inventoryUpdate.create({
      data: {
        merchantId: data.merchantId,
        productId: data.productId,
        sku: data.sku,
        quantity: signedQty,
        type: data.type,
        reason: data.reason,
        returnId: data.returnId,
      },
    });

    return NextResponse.json({ update, stock });
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

    const merchantId = scopedMerchantId(request, context);

    const [updates, stock] = await Promise.all([
      prisma.inventoryUpdate.findMany({
        where: { ...(merchantId ? { merchantId } : {}) },
        include: {
          product: { select: { name: true, sku: true } },
          return: { select: { rmaNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.warehouseStock.findMany({
        where: { ...(merchantId ? { merchantId } : {}) },
        include: { product: { select: { name: true, sku: true } } },
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
    ]);

    return NextResponse.json({ updates, stock });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
