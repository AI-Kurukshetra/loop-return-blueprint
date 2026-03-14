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
    const days = parseInt(searchParams.get("days") ?? "30", 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const refunds = await prisma.refund.findMany({
      where: {
        return: {
          ...(merchantId ? { merchantId } : {}),
          refundedAt: { gte: startDate },
        },
      },
    });

    const totalRefunded = refunds.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );

    return NextResponse.json({
      totalRefunded,
      refundCount: refunds.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
