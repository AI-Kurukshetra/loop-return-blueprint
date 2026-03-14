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

    const returns = await prisma.return.findMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
        requestedAt: { gte: startDate },
      },
      include: { refund: true, exchange: true },
      orderBy: { requestedAt: "asc" },
    });

    const totalReturns = returns.length;
    const approved = returns.filter((r) =>
      ["approved", "received", "processing", "refunded"].includes(r.status)
    ).length;
    const refunded = returns.filter((r) => r.status === "refunded").length;
    const exchanges = returns.filter((r) => !!r.exchange).length;
    const totalRefundAmount = returns
      .filter((r) => r.refund)
      .reduce((sum, r) => sum + Number(r.refund!.amount), 0);
    const reasonMap = new Map<string, number>();
    const trendMap = new Map<string, number>();

    let totalProcessingHours = 0;
    let processedReturns = 0;

    for (const item of returns) {
      const reason = item.returnReason?.trim() || "Unspecified";
      reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);

      const day = item.requestedAt.toISOString().slice(0, 10);
      trendMap.set(day, (trendMap.get(day) ?? 0) + 1);

      const endDate = item.refundedAt ?? item.approvedAt;
      if (endDate) {
        const diff = endDate.getTime() - item.requestedAt.getTime();
        totalProcessingHours += diff / (1000 * 60 * 60);
        processedReturns += 1;
      }
    }

    const processingTimeHours =
      processedReturns > 0 ? totalProcessingHours / processedReturns : 0;

    return NextResponse.json({
      totalReturns,
      approved,
      refunded,
      exchanges,
      totalRefundAmount,
      returnRate: totalReturns > 0 ? (approved / totalReturns) * 100 : 0,
      refundExchangeRatio: exchanges > 0 ? refunded / exchanges : refunded,
      processingTimeHours,
      returnReasons: [...reasonMap.entries()]
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
      returnTrend: [...trendMap.entries()]
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => (a.date > b.date ? 1 : -1)),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
