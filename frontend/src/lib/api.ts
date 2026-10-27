import type { CreditApplication, PredictionResponse, PredictionLog } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const body = JSON.parse(text);
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = body.detail.map((e: { loc?: unknown[]; msg?: string }) => `${e.loc?.at(-1)}: ${e.msg}`).join(", ");
      }
    } catch {
      // response wasn't JSON, fall back to raw text
    }
    throw new Error(message || `API error ${res.status}`);
  }
  return res.json();
}

export const predict = (payload: CreditApplication) =>
  apiFetch<PredictionResponse>("/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getPredictions = (limit = 20, offset = 0) =>
  apiFetch<PredictionLog[]>(`/predictions?limit=${limit}&offset=${offset}`);
