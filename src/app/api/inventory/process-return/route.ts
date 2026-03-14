import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  returnId: z.string(),
  location: z.string().optional(),
  liquidateDefective: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { returnId, location, liquidateDefective } = schema.parse(body);

    const returnRecord = await prisma.return.findUnique({
      where: { id: returnId },
      include: {
        returnItems: { include: { product: true } },
      },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    }

    const changes = await Promise.all(
      returnRecord.returnItems.map(async (item) => {
        const type =
          item.condition === "damaged"
            ? "damage"
            : item.condition === "defective" && liquidateDefective
              ? "liquidate"
              : "restock";

        const signedQty = type === "restock" ? item.quantity : -item.quantity;
        const sku = item.product.sku ?? "UNKNOWN-SKU";

        const stock = await prisma.warehouseStock.upsert({
          where: {
            merchantId_productId_sku_location: {
              merchantId: returnRecord.merchantId,
              productId: item.productId,
              sku,
              location: location ?? "main",
            },
          },
          create: {
            merchantId: returnRecord.merchantId,
            productId: item.productId,
            sku,
            location: location ?? "main",
            quantity: Math.max(0, signedQty),
          },
          update: {
            quantity: { increment: signedQty },
          },
        });

        const update = await prisma.inventoryUpdate.create({
          data: {
            merchantId: returnRecord.merchantId,
            productId: item.productId,
            sku,
            quantity: signedQty,
            type,
            reason: `Processed from return ${returnRecord.rmaNumber}`,
            returnId: returnRecord.id,
          },
        });

        return { stock, update };
      })
    );

    return NextResponse.json({
      ok: true,
      processedItems: changes.length,
      changes,
    });
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
