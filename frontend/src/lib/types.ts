export interface CreditApplication {
  RevolvingUtilizationOfUnsecuredLines: number | null;
  age: number | null;
  "NumberOfTime30-59DaysPastDueNotWorse": number | null;
  DebtRatio: number | null;
  MonthlyIncome: number | null;
  NumberOfOpenCreditLinesAndLoans: number | null;
  NumberOfTimes90DaysLate: number | null;
  NumberRealEstateLoansOrLines: number | null;
  "NumberOfTime60-89DaysPastDueNotWorse": number | null;
  NumberOfDependents: number | null;
}

export interface TopFactor {
  feature: string;
  direction: string;
  impact: number;
}

export interface PredictionResponse {
  risk_score: number;
  risk_label: "high_risk" | "low_risk";
  risk_tier: "low" | "medium" | "high";
  top_factors: TopFactor[];
}

export interface PredictionLog {
  id: string;
  created_at: string;
  risk_score: number;
  risk_label: string;
  top_factors: TopFactor[];
}
