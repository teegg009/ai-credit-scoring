export const FEATURE_LABELS: Record<string, string> = {
  RevolvingUtilizationOfUnsecuredLines: "อัตราการใช้วงเงินหมุนเวียน",
  age: "อายุ",
  "NumberOfTime30-59DaysPastDueNotWorse": "ค้างชำระ 30–59 วัน",
  DebtRatio: "อัตราส่วนหนี้สินต่อรายได้",
  MonthlyIncome: "รายได้ต่อเดือน",
  MonthlyIncome_missing: "ไม่ได้ระบุรายได้ต่อเดือน",
  NumberOfOpenCreditLinesAndLoans: "จำนวนวงเงิน/สินเชื่อที่เปิดอยู่",
  NumberOfTimes90DaysLate: "ค้างชำระ 90 วันขึ้นไป",
  NumberRealEstateLoansOrLines: "จำนวนสินเชื่ออสังหาริมทรัพย์",
  "NumberOfTime60-89DaysPastDueNotWorse": "ค้างชำระ 60–89 วัน",
  NumberOfDependents: "จำนวนผู้ที่อยู่ในความดูแล",
};

export function featureLabel(key: string): string {
  return FEATURE_LABELS[key] ?? key;
}
