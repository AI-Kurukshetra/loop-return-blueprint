export type ReasonRisk = {
  tag: "safe" | "review" | "fraud_suspected";
  score: number;
  signals: string[];
};

const suspiciousPhrases = [
  "didn't receive",
  "did not receive",
  "empty box",
  "fake",
  "counterfeit",
  "refund only",
  "no return",
  "chargeback",
  "scam",
  "worn once",
  "used and return",
  "not mine",
];

export function analyzeReasonRisk(reason?: string | null, notes?: string | null): ReasonRisk {
  const text = `${reason ?? ""} ${notes ?? ""}`.toLowerCase();
  const hits = suspiciousPhrases.filter((phrase) => text.includes(phrase));

  if (hits.length >= 2) {
    return {
      tag: "fraud_suspected",
      score: 0.86,
      signals: hits,
    };
  }

  if (hits.length === 1) {
    return {
      tag: "review",
      score: 0.58,
      signals: hits,
    };
  }

  return {
    tag: "safe",
    score: 0.21,
    signals: [],
  };
}
