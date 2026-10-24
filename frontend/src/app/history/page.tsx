"use client";

import { useEffect, useState } from "react";
import PredictionsTable from "@/components/PredictionsTable";
import { getHistory } from "@/lib/storage";
import type { PredictionLog } from "@/lib/types";

export default function HistoryPage() {
  const [data, setData] = useState<PredictionLog[]>([]);

  useEffect(() => {
    setData(getHistory());
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ประวัติการประเมิน</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ผลการประเมินที่บันทึกไว้บนเครื่องนี้ ({data.length} รายการ)
        </p>
      </div>
      <PredictionsTable data={data} />
    </div>
  );
}
