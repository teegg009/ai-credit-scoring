"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { featureLabel } from "@/lib/features";
import { saveResult } from "@/lib/storage";
import { getRiskTier, RISK_TIER_LABELS, RISK_TIER_BADGE_CLASS, RISK_TIER_BAR_CLASS } from "@/lib/risk";
import type { PredictionResponse } from "@/lib/types";

const TOP_N_COLLAPSED = 5;

export default function RiskResult({ data }: { data: PredictionResponse }) {
  const [showAll, setShowAll] = useState(false);
  const tier = getRiskTier(data.risk_score);
  const percent = data.risk_score * 100;
  const maxAbsImpact = Math.max(...data.top_factors.map((f) => Math.abs(f.impact)), 1e-6);
  const visibleFactors = showAll ? data.top_factors : data.top_factors.slice(0, TOP_N_COLLAPSED);

  function handleSave() {
    saveResult(data);
    toast.success("บันทึกผลการประเมินแล้ว ดูได้ที่หน้าประวัติ");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-4xl font-bold tabular-nums">{percent.toFixed(1)}%</span>
          <Badge className={RISK_TIER_BADGE_CLASS[tier]}>{RISK_TIER_LABELS[tier]}</Badge>
        </div>
        <CardDescription>Probability of Default</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Progress value={percent} indicatorClassName={RISK_TIER_BAR_CLASS[tier]} />

        <Separator />

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">ทำไมถึงได้ผลลัพธ์นี้? (Why this prediction?)</h3>
          <div className="flex flex-col gap-3">
            {visibleFactors.map((factor) => {
              const isRisk = factor.direction === "เพิ่มความเสี่ยง";
              const barWidth = (Math.abs(factor.impact) / maxAbsImpact) * 100;
              return (
                <div key={factor.feature} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{featureLabel(factor.feature)}</span>
                    <span className={isRisk ? "text-red-600" : "text-emerald-600"}>
                      {factor.direction} ({factor.impact.toFixed(4)})
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={isRisk ? "h-full bg-red-500" : "h-full bg-emerald-500"}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {data.top_factors.length > TOP_N_COLLAPSED && (
            <Button variant="outline" size="sm" className="self-start" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "แสดงน้อยลง" : "ดูปัจจัยทั้งหมด"}
            </Button>
          )}
        </div>

        <Button onClick={handleSave} className="w-full">
          บันทึกผลการประเมิน
        </Button>
      </CardContent>
    </Card>
  );
}
