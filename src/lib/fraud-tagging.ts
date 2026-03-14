import { prisma } from "@/lib/db";
import { analyzeReasonRisk } from "@/lib/reason-risk";

type Args = {
  merchantId: string;
  customerId: string;
  returnId: string;
  returnReason?: string | null;
  notes?: string | null;
};

export async function applyReasonFraudTagging(args: Args) {
  const result = analyzeReasonRisk(args.returnReason, args.notes);

  if (result.tag === "safe") {
    return result;
  }

  await prisma.fraudScore.create({
    data: {
      merchantId: args.merchantId,
      customerId: args.customerId,
      returnId: args.returnId,
      score: result.score,
      riskLevel: result.tag === "fraud_suspected" ? "high" : "medium",
      factors: {
        source: "reason_nlp_rules",
        signals: result.signals,
      },
    },
  });

  await prisma.fraudEvent.create({
    data: {
      merchantId: args.merchantId,
      customerId: args.customerId,
      returnId: args.returnId,
      eventType:
        result.tag === "fraud_suspected" ? "reason_flagged_high_risk" : "reason_flagged_review",
      details: {
        tag: result.tag,
        score: result.score,
        signals: result.signals,
      },
    },
  });

  return result;
}
