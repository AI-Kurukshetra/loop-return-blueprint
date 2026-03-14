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
    const days = Number(searchParams.get("days") ?? "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalReturns, scores, events] = await Promise.all([
      prisma.return.count({
        where: {
          ...(merchantId ? { merchantId } : {}),
          requestedAt: { gte: startDate },
        },
      }),
      prisma.fraudScore.findMany({
        where: {
          ...(merchantId ? { merchantId } : {}),
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.fraudEvent.findMany({
        where: {
          ...(merchantId ? { merchantId } : {}),
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const highRiskCount = scores.filter((s) => Number(s.score) >= 0.8).length;
    const mediumRiskCount = scores.filter(
      (s) => Number(s.score) >= 0.5 && Number(s.score) < 0.8
    ).length;
    const fraudRate = totalReturns > 0 ? (highRiskCount / totalReturns) * 100 : 0;
    const avgRiskScore =
      scores.length > 0
        ? scores.reduce((sum, s) => sum + Number(s.score), 0) / scores.length
        : 0;

    const scoreTimeline = scores.map((s) => ({
      date: s.createdAt.toISOString().slice(0, 10),
      score: Number(s.score),
      riskLevel: s.riskLevel,
    }));

    return NextResponse.json({
      fraudRate,
      highRiskCount,
      mediumRiskCount,
      avgRiskScore,
      eventsCount: events.length,
      scoreTimeline,
      events: events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        createdAt: event.createdAt,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
