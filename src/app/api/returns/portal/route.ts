import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateRMA } from "@/lib/utils";
import { applyReasonFraudTagging } from "@/lib/fraud-tagging";

const schema = z.object({
  email: z.string().email(),
  reason: z.string().min(2),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(1)
          .refine((value) => !value.includes("-"), {
            message: "Product name must not contain '-'",
          }),
        sku: z.string().min(1),
        quantity: z.number().int().positive(),
        condition: z.enum(["unopened", "opened", "damaged", "defective"]),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    const created = await prisma.$transaction(async (tx) => {
      const merchantEmail = "demo-merchant@loopreturn.app";
      let merchant = await tx.merchant.findUnique({ where: { email: merchantEmail } });
      if (!merchant) {
        merchant = await tx.merchant.create({
          data: {
            name: "Demo Merchant",
            email: merchantEmail,
          },
        });
      }

      let customer = await tx.customer.findFirst({
        where: {
          merchantId: merchant.id,
          email: data.email,
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            merchantId: merchant.id,
            email: data.email,
            name: data.email.split("@")[0],
          },
        });
      }

      const productIdsBySku = new Map<string, string>();
      for (const item of data.items) {
        let product = await tx.product.findFirst({
          where: {
            merchantId: merchant.id,
            sku: item.sku,
          },
        });

        if (!product) {
          product = await tx.product.create({
            data: {
              merchantId: merchant.id,
              name: item.name,
              sku: item.sku,
              price: 50,
            },
          });
        }
        productIdsBySku.set(item.sku, product.id);
      }

      const order = await tx.order.create({
        data: {
          merchantId: merchant.id,
          customerId: customer.id,
          orderNumber: `DEMO-${Date.now()}`,
          totalPrice: data.items.reduce((sum, item) => sum + item.quantity * 50, 0),
          currency: "USD",
          status: "fulfilled",
        },
      });

      const orderItems = await Promise.all(
        data.items.map((item) =>
          tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: productIdsBySku.get(item.sku)!,
              quantity: item.quantity,
              price: 50,
              sku: item.sku,
            },
          })
        )
      );

      const createdReturn = await tx.return.create({
        data: {
          orderId: order.id,
          customerId: customer.id,
          merchantId: merchant.id,
          rmaNumber: generateRMA(),
          status: "pending",
          returnReason: data.reason,
          notes: data.notes,
          returnItems: {
            create: data.items.map((item, index) => ({
              orderItemId: orderItems[index].id,
              productId: productIdsBySku.get(item.sku)!,
              quantity: item.quantity,
              condition: item.condition,
            })),
          },
        },
        include: {
          customer: { select: { email: true } },
          order: { select: { orderNumber: true } },
        },
      });

      return createdReturn;
    });

    await applyReasonFraudTagging({
      merchantId: created.merchantId,
      customerId: created.customerId,
      returnId: created.id,
      returnReason: created.returnReason,
      notes: created.notes,
    });

    return NextResponse.json({
      id: created.id,
      rmaNumber: created.rmaNumber,
      status: created.status,
      customerEmail: created.customer.email,
      orderNumber: created.order.orderNumber,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
