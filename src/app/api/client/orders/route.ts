import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { normalizeRole } from "@/lib/roles";

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
      return NextResponse.json([]);
    }

    const orders = await prisma.order.findMany({
      where: {
        merchantId: session.user.merchantId,
        customerId: customer.id,
      },
      include: {
        orderItems: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ customer, orders });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
