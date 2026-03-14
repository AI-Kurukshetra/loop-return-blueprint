import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { normalizeRole } from "@/lib/roles";
import { analyzeReasonRisk } from "@/lib/reason-risk";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (normalizeRole(session.user.role) !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchantId");
    const status = searchParams.get("status");

    const records = await prisma.return.findMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        merchant: {
          select: { id: true, name: true, email: true },
        },
        customer: true,
        order: true,
        fraudScores: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { requestedAt: "desc" },
      take: 200,
    });

    const result = records.map((row) => {
      const reasonRisk = analyzeReasonRisk(row.returnReason, row.notes);
      const latestScore = row.fraudScores[0];
      const aiTag =
        latestScore?.riskLevel === "high"
          ? "fraud_suspected"
          : latestScore?.riskLevel === "medium"
            ? "review"
            : reasonRisk.tag;

      return {
        ...row,
        aiTag,
        aiScore: latestScore ? Number(latestScore.score) : reasonRisk.score,
      };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
