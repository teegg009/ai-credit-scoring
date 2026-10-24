export type RiskTier = "low" | "medium" | "high";

// ต้องตรงกับ HIGH_RISK_THRESHOLD / MEDIUM_RISK_THRESHOLD ใน main.py
export function getRiskTier(score: number): RiskTier {
  if (score >= 0.6) return "high";
  if (score >= 0.3) return "medium";
  return "low";
}

export const RISK_TIER_LABELS: Record<RiskTier, string> = {
  low: "ต่ำ (LOW)",
  medium: "ปานกลาง (MEDIUM)",
  high: "สูง (HIGH)",
};

export const RISK_TIER_BADGE_CLASS: Record<RiskTier, string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

export const RISK_TIER_BAR_CLASS: Record<RiskTier, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

export const RISK_TIER_HEX: Record<RiskTier, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
};
