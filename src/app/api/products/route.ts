import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  canAccessMerchant,
  getSellerOrAdminContext,
  scopedMerchantId,
} from "@/lib/access-control";

const productSchema = z.object({
  merchantId: z.string(),
  name: z
    .string()
    .trim()
    .min(2, "Product name is required")
    .max(120, "Product name is too long")
    .refine((value) => !value.includes("-"), {
      message: "Product name must not contain '-'",
    }),
  sku: z.string().trim().min(1, "SKU is required").max(64),
  price: z.number().nonnegative("Price cannot be negative"),
});

export async function GET(request: NextRequest) {
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const merchantId = scopedMerchantId(request, context);

    const products = await prisma.product.findMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
      },
      include: {
        warehouseStock: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = productSchema.parse(body);

    if (!canAccessMerchant(data.merchantId, context)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const product = await prisma.product.create({
      data: {
        merchantId: data.merchantId,
        name: data.name,
        sku: data.sku,
        price: data.price,
      },
    });

    return NextResponse.json(product);
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
