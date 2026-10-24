"use client";

import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHistory } from "@/lib/storage";
import { getRiskTier, RISK_TIER_HEX, RISK_TIER_LABELS, type RiskTier } from "@/lib/risk";
import type { PredictionLog } from "@/lib/types";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-bold tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<PredictionLog[]>([]);

  useEffect(() => {
    setData(getHistory());
  }, []);

  const total = data.length;

  if (total === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">ยังไม่มีข้อมูลสำหรับสรุปผล</p>
          <p className="text-xs text-muted-foreground">ประเมินความเสี่ยงและบันทึกผลจากหน้า Assess ก่อน</p>
        </div>
      </div>
    );
  }

  const highRiskCount = data.filter((d) => getRiskTier(d.risk_score) === "high").length;
  const highRiskPct = (highRiskCount / total) * 100;
  const avgProbability = (data.reduce((sum, d) => sum + d.risk_score, 0) / total) * 100;

  const tiers: RiskTier[] = ["low", "medium", "high"];
  const distribution = tiers.map((tier) => ({
    tier,
    label: RISK_TIER_LABELS[tier],
    count: data.filter((d) => getRiskTier(d.risk_score) === tier).length,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="จำนวนการประเมินทั้งหมด" value={String(total)} />
        <StatCard label="% High Risk" value={`${highRiskPct.toFixed(1)}%`} />
        <StatCard label="ค่าเฉลี่ย Probability" value={`${avgProbability.toFixed(1)}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>จำนวนการประเมินแบ่งตามระดับความเสี่ยง</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.map((entry) => (
                    <Cell key={entry.tier} fill={RISK_TIER_HEX[entry.tier]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
