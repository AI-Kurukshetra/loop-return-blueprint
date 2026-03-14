import { prisma } from "@/lib/db";

type FraudScoreInput = {
  returnId: string;
};

export async function scoreReturnFraud({ returnId }: FraudScoreInput) {
  const returnRecord = await prisma.return.findUnique({
    where: { id: returnId },
    include: {
      customer: true,
      returnItems: true,
    },
  });

  if (!returnRecord) {
    throw new Error("Return not found");
  }

  const [customerReturnCount, sameReasonCount, recentHighRiskAccounts] =
    await Promise.all([
      prisma.return.count({
        where: {
          merchantId: returnRecord.merchantId,
          customerId: returnRecord.customerId,
          requestedAt: {
            gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
          },
        },
      }),
      prisma.return.count({
        where: {
          merchantId: returnRecord.merchantId,
          customerId: returnRecord.customerId,
          returnReason: returnRecord.returnReason ?? undefined,
        },
      }),
      prisma.fraudScore.count({
        where: {
          merchantId: returnRecord.merchantId,
          customerId: returnRecord.customerId,
          score: { gte: 0.8 },
          createdAt: {
            gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180),
          },
        },
      }),
    ]);

  let score = 0.08;
  const factors: Record<string, number | string> = {};

  if (customerReturnCount >= 5) {
    score += 0.35;
    factors.highReturnRate = customerReturnCount;
  }
  if (sameReasonCount >= 3) {
    score += 0.2;
    factors.sameReasonRepeated = sameReasonCount;
  }
  if (returnRecord.returnItems.length >= 4) {
    score += 0.15;
    factors.bulkReturnItems = returnRecord.returnItems.length;
  }
  if (recentHighRiskAccounts > 0) {
    score += 0.25;
    factors.recentHighRiskHistory = recentHighRiskAccounts;
  }

  score = Math.min(0.99, Number(score.toFixed(4)));
  const riskLevel = score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low";

  const fraudScore = await prisma.fraudScore.create({
    data: {
      merchantId: returnRecord.merchantId,
      returnId: returnRecord.id,
      customerId: returnRecord.customerId,
      score,
      riskLevel,
      factors,
    },
  });

  if (riskLevel !== "low") {
    await prisma.fraudEvent.create({
      data: {
        merchantId: returnRecord.merchantId,
        returnId: returnRecord.id,
        customerId: returnRecord.customerId,
        eventType: riskLevel === "high" ? "high_risk_return" : "medium_risk_return",
        details: {
          score,
          factors,
          returnId: returnRecord.id,
          customerId: returnRecord.customerId,
        },
      },
    });
  }

  return fraudScore;
}
