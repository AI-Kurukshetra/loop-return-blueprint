import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSellerOrAdminContext, scopedMerchantId } from "@/lib/access-control";

export async function GET(request: NextRequest) {
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = scopedMerchantId(request, context);
    const customerId = searchParams.get("customerId");

    const orders = await prisma.order.findMany({
      where: {
        ...(merchantId && { merchantId }),
        ...(customerId && { customerId }),
      },
      include: {
        customer: true,
        orderItems: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
