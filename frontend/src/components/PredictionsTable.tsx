"use client";

import { Fragment, useState } from "react";
import { Inbox } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { featureLabel } from "@/lib/features";
import { getRiskTier, RISK_TIER_LABELS, RISK_TIER_BADGE_CLASS } from "@/lib/risk";
import type { PredictionLog } from "@/lib/types";

export default function PredictionsTable({ data }: { data: PredictionLog[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
        <Inbox className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">ยังไม่มีประวัติการประเมิน</p>
        <p className="text-xs text-muted-foreground">
          ผลการประเมินที่บันทึกไว้จากหน้า Assess จะแสดงที่นี่
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>วันที่</TableHead>
          <TableHead>ระดับความเสี่ยง</TableHead>
          <TableHead>Probability</TableHead>
          <TableHead className="text-right">&nbsp;</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => {
          const isExpanded = expandedId === row.id;
          const tier = getRiskTier(row.risk_score);
          return (
            <Fragment key={row.id}>
              <TableRow>
                <TableCell>{new Date(row.created_at).toLocaleString("th-TH")}</TableCell>
                <TableCell>
                  <Badge className={RISK_TIER_BADGE_CLASS[tier]}>{RISK_TIER_LABELS[tier]}</Badge>
                </TableCell>
                <TableCell>{(row.risk_score * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setExpandedId(isExpanded ? null : row.id)}>
                    {isExpanded ? "ซ่อน" : "View"}
                  </Button>
                </TableCell>
              </TableRow>
              {isExpanded && (
                <TableRow>
                  <TableCell colSpan={4} className="whitespace-normal bg-muted/30">
                    <ul className="flex flex-col gap-1 py-1">
                      {row.top_factors.map((f) => (
                        <li key={f.feature} className="flex justify-between text-xs">
                          <span>{featureLabel(f.feature)}</span>
                          <span className={f.direction === "เพิ่มความเสี่ยง" ? "text-red-600" : "text-emerald-600"}>
                            {f.direction} ({f.impact})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
