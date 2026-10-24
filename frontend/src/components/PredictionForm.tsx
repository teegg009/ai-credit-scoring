"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { predict } from "@/lib/api";
import type { CreditApplication, PredictionResponse } from "@/lib/types";

const initialForm: CreditApplication = {
  RevolvingUtilizationOfUnsecuredLines: null,
  age: null,
  "NumberOfTime30-59DaysPastDueNotWorse": 0,
  DebtRatio: null,
  MonthlyIncome: null,
  NumberOfOpenCreditLinesAndLoans: 0,
  NumberOfTimes90DaysLate: 0,
  NumberRealEstateLoansOrLines: 0,
  "NumberOfTime60-89DaysPastDueNotWorse": 0,
  NumberOfDependents: 0,
};

type FieldConfig = {
  key: keyof CreditApplication;
  label: string;
  description: string;
  step?: string;
  min?: number;
  max?: number;
};

const personalFields: FieldConfig[] = [
  { key: "age", label: "อายุ", description: "อายุของผู้ขอสินเชื่อ (ปี)", min: 18, max: 100 },
  {
    key: "NumberOfDependents",
    label: "จำนวนผู้ที่อยู่ในความดูแล",
    description: "บุตรหรือผู้ที่อยู่ในความอุปการะ — เว้นว่างได้",
    min: 0,
  },
];

const financialFields: FieldConfig[] = [
  {
    key: "MonthlyIncome",
    label: "รายได้ต่อเดือน (USD)",
    description: "รายได้รวมต่อเดือนก่อนหักค่าใช้จ่าย หน่วยดอลลาร์สหรัฐ (โมเดลเทรนจากข้อมูล US) — เว้นว่างได้ถ้าไม่ทราบ",
    min: 0,
  },
  {
    key: "DebtRatio",
    label: "อัตราส่วนหนี้สินต่อรายได้ (ปกติ 0–1, เกินได้)",
    description: "ภาระหนี้สินรายเดือนหารด้วยรายได้รายเดือน",
    step: "0.01",
    min: 0,
  },
  {
    key: "RevolvingUtilizationOfUnsecuredLines",
    label: "อัตราการใช้วงเงินหมุนเวียน (0–1+)",
    description: "ยอดคงค้างหารด้วยวงเงินสินเชื่อ/บัตรเครดิตทั้งหมด",
    step: "0.01",
    min: 0,
  },
  {
    key: "NumberOfOpenCreditLinesAndLoans",
    label: "จำนวนวงเงิน/สินเชื่อที่เปิดอยู่",
    description: "รวมบัตรเครดิตและสินเชื่อทุกประเภทที่ยังใช้งานอยู่",
    min: 0,
  },
  {
    key: "NumberRealEstateLoansOrLines",
    label: "จำนวนสินเชื่ออสังหาริมทรัพย์",
    description: "สินเชื่อบ้านหรือวงเงินที่ค้ำประกันด้วยอสังหาริมทรัพย์",
    min: 0,
  },
  {
    key: "NumberOfTime30-59DaysPastDueNotWorse",
    label: "ค้างชำระ 30–59 วัน (ครั้ง)",
    description: "จำนวนครั้งที่ค้างชำระ 30–59 วันในช่วง 2 ปีที่ผ่านมา",
    min: 0,
  },
  {
    key: "NumberOfTime60-89DaysPastDueNotWorse",
    label: "ค้างชำระ 60–89 วัน (ครั้ง)",
    description: "จำนวนครั้งที่ค้างชำระ 60–89 วันในช่วง 2 ปีที่ผ่านมา",
    min: 0,
  },
  {
    key: "NumberOfTimes90DaysLate",
    label: "ค้างชำระ 90 วันขึ้นไป (ครั้ง)",
    description: "จำนวนครั้งที่ค้างชำระตั้งแต่ 90 วันขึ้นไป",
    min: 0,
  },
];

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: number | null;
  onChange: (value: string) => void;
}) {
  const nullable = field.key === "MonthlyIncome" || field.key === "NumberOfDependents";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <Label htmlFor={field.key}>{field.label}</Label>
        <Tooltip>
          <TooltipTrigger className="text-muted-foreground hover:text-foreground">
            <Info className="h-3.5 w-3.5" />
          </TooltipTrigger>
          <TooltipContent>{field.description}</TooltipContent>
        </Tooltip>
      </div>
      <Input
        id={field.key}
        type="number"
        step={field.step ?? "1"}
        min={field.min}
        max={field.max}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={!nullable}
      />
    </div>
  );
}

export default function PredictionForm({
  onResult,
}: {
  onResult: (result: PredictionResponse) => void;
}) {
  const [form, setForm] = useState<CreditApplication>(initialForm);
  const [loading, setLoading] = useState(false);

  function handleChange(key: keyof CreditApplication, value: string) {
    const nullable = key === "MonthlyIncome" || key === "NumberOfDependents";
    setForm((prev) => ({
      ...prev,
      [key]: value === "" ? (nullable ? null : prev[key]) : Number(value),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await predict(form);
      onResult(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลส่วนบุคคล</CardTitle>
            <CardDescription>Personal Info</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {personalFields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={form[field.key]}
                onChange={(value) => handleChange(field.key, value)}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลทางการเงิน</CardTitle>
            <CardDescription>Financial Info</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {financialFields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={form[field.key]}
                onChange={(value) => handleChange(field.key, value)}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "กำลังประเมิน..." : "ประเมินความเสี่ยง"}
      </Button>
    </form>
  );
}
