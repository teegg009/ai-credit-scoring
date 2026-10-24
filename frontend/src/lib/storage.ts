import type { PredictionLog, PredictionResponse } from "@/lib/types";

const STORAGE_KEY = "creditrisk_history";

function readAll(): PredictionLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PredictionLog[]) : [];
  } catch {
    return [];
  }
}

function writeAll(logs: PredictionLog[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function getHistory(): PredictionLog[] {
  return readAll().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function saveResult(result: PredictionResponse): PredictionLog {
  const log: PredictionLog = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    risk_score: result.risk_score,
    risk_label: result.risk_label,
    top_factors: result.top_factors,
  };
  const logs = readAll();
  logs.push(log);
  writeAll(logs);
  return log;
}
