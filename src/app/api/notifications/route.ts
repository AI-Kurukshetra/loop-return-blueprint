import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSellerOrAdminContext, scopedMerchantId } from "@/lib/access-control";

export async function GET(request: NextRequest) {
  try {
    const context = await getSellerOrAdminContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const merchantId = scopedMerchantId(request, context);

    if (!merchantId) {
      return NextResponse.json(
        { error: "merchantId is required" },
        { status: 400 }
      );
    }

    const [pendingReturns, failedComms, recentComms] = await Promise.all([
      prisma.return.count({
        where: {
          merchantId,
          status: "pending",
        },
      }),
      prisma.communicationEvent.count({
        where: {
          merchantId,
          status: "failed",
        },
      }),
      prisma.communicationEvent.findMany({
        where: { merchantId },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          eventType: true,
          channel: true,
          status: true,
          recipient: true,
          createdAt: true,
          return: {
            select: {
              rmaNumber: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      summary: {
        pendingReturns,
        failedComms,
      },
      recent: recentComms,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
