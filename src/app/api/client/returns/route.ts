import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateRMA } from "@/lib/utils";
import { normalizeRole } from "@/lib/roles";
import { applyReasonFraudTagging } from "@/lib/fraud-tagging";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (normalizeRole(session.user.role) !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        merchantId: session.user.merchantId,
        email: session.user.email ?? undefined,
      },
    });

    if (!customer) {
      return NextResponse.json({ returns: [] });
    }

    const returns = await prisma.return.findMany({
      where: {
        merchantId: session.user.merchantId,
        customerId: customer.id,
      },
      include: {
        order: { select: { orderNumber: true } },
        returnItems: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    return NextResponse.json({ returns });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const schema = z.object({
  orderId: z.string(),
  returnReason: z.string().min(2),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        orderItemId: z.string(),
        quantity: z.number().int().positive(),
        condition: z.enum(["unopened", "opened", "damaged", "defective"]),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (normalizeRole(session.user.role) !== "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = schema.parse(body);

    const customer = await prisma.customer.findFirst({
      where: {
        merchantId: session.user.merchantId,
        email: session.user.email ?? undefined,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: data.orderId,
        merchantId: session.user.merchantId,
        customerId: customer.id,
      },
      include: { orderItems: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderItemsById = new Map(order.orderItems.map((item) => [item.id, item]));

    for (const item of data.items) {
      const matched = orderItemsById.get(item.orderItemId);
      if (!matched) {
        return NextResponse.json(
          { error: `Invalid order item ${item.orderItemId}` },
          { status: 400 }
        );
      }
      if (item.quantity > matched.quantity) {
        return NextResponse.json(
          { error: `Quantity exceeds ordered quantity for ${item.orderItemId}` },
          { status: 400 }
        );
      }
    }

    const created = await prisma.return.create({
      data: {
        merchantId: order.merchantId,
        customerId: customer.id,
        orderId: order.id,
        rmaNumber: generateRMA(),
        returnReason: data.returnReason,
        notes: data.notes,
        status: "pending",
        returnItems: {
          create: data.items.map((item) => {
            const orderItem = orderItemsById.get(item.orderItemId)!;
            return {
              orderItemId: orderItem.id,
              productId: orderItem.productId,
              quantity: item.quantity,
              condition: item.condition,
            };
          }),
        },
      },
    });

    await applyReasonFraudTagging({
      merchantId: created.merchantId,
      customerId: created.customerId,
      returnId: created.id,
      returnReason: created.returnReason,
      notes: created.notes,
    });

    return NextResponse.json(created);
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
