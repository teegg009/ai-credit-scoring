"use client";

import { useState } from "react";
import PredictionForm from "@/components/PredictionForm";
import RiskResult from "@/components/RiskResult";
import type { PredictionResponse } from "@/lib/types";

export default function HomePage() {
  const [result, setResult] = useState<PredictionResponse | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ประเมินความเสี่ยงสินเชื่อ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          กรอกข้อมูลผู้ขอสินเชื่อเพื่อประเมินความเสี่ยงด้วย AI (XGBoost) พร้อมคำอธิบายผลลัพธ์แบบ SHAP
        </p>
      </div>
      <PredictionForm onResult={setResult} />
      {result && <RiskResult data={result} />}
    </div>
  );
}
