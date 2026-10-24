
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
import pandas as pd
import xgboost as xgb
import shap

from database import init_db, get_session, is_db_enabled
from models import PredictionLog

logger = logging.getLogger("credit_api")

BASE_DIR = Path(__file__).resolve().parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="AI Credit Scoring API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# --- โหลดโมเดลตอน startup ครั้งเดียว (ไม่โหลดซ้ำทุก request) ---
model = xgb.XGBClassifier()
model.load_model(BASE_DIR / "credit_model.json")
explainer = shap.TreeExplainer(model)

# median ของ MonthlyIncome ที่ train.py ใช้เติมค่าที่หายไป — ต้องตรงกับตอน train
TRAIN_INCOME_MEDIAN = 5400.0

# เกณฑ์แบ่งระดับความเสี่ยง — ต้องตรงกับ frontend/src/lib/risk.ts
HIGH_RISK_THRESHOLD = 0.6
MEDIUM_RISK_THRESHOLD = 0.3
 
# ลำดับ column ต้องตรงกับตอน train เป๊ะๆ —
FEATURE_ORDER = [
    "RevolvingUtilizationOfUnsecuredLines",
    "age",
    "NumberOfTime30-59DaysPastDueNotWorse",
    "DebtRatio",
    "MonthlyIncome",
    "NumberOfOpenCreditLinesAndLoans",
    "NumberOfTimes90DaysLate",
    "NumberRealEstateLoansOrLines",
    "NumberOfTime60-89DaysPastDueNotWorse",
    "NumberOfDependents",
    "MonthlyIncome_missing",
]
 
 
class CreditApplication(BaseModel):
    model_config = ConfigDict(populate_by_name=True, allow_inf_nan=False)

    RevolvingUtilizationOfUnsecuredLines: float = Field(..., ge=0)
    age: int = Field(..., ge=18, le=100)
    NumberOfTime30_59DaysPastDueNotWorse: int = Field(..., ge=0, alias="NumberOfTime30-59DaysPastDueNotWorse")
    DebtRatio: float = Field(..., ge=0)
    MonthlyIncome: float | None = Field(None, ge=0)
    NumberOfOpenCreditLinesAndLoans: int = Field(..., ge=0)
    NumberOfTimes90DaysLate: int = Field(..., ge=0)
    NumberRealEstateLoansOrLines: int = Field(..., ge=0)
    NumberOfTime60_89DaysPastDueNotWorse: int = Field(..., ge=0, alias="NumberOfTime60-89DaysPastDueNotWorse")
    NumberOfDependents: float | None = Field(0, ge=0)


class PredictionResponse(BaseModel):
    risk_score: float
    risk_label: str
    risk_tier: str
    top_factors: list[dict]


def risk_tier(score: float) -> str:
    if score >= HIGH_RISK_THRESHOLD:
        return "high"
    if score >= MEDIUM_RISK_THRESHOLD:
        return "medium"
    return "low"


def to_feature_row(payload: CreditApplication) -> pd.DataFrame:
    data = payload.model_dump(by_alias=True)
    income_missing = int(data["MonthlyIncome"] is None)
    data["MonthlyIncome"] = data["MonthlyIncome"] if data["MonthlyIncome"] is not None else TRAIN_INCOME_MEDIAN
    data["MonthlyIncome_missing"] = income_missing
    data["NumberOfDependents"] = data["NumberOfDependents"] or 0
    row = pd.DataFrame([data])[FEATURE_ORDER]
    return row
 
 
@app.get("/health")
def health():
    return {"status": "ok"}
 
 
@app.post("/predict", response_model=PredictionResponse)
def predict(payload: CreditApplication, request: Request):
    try:
        row = to_feature_row(payload)
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"ข้อมูลไม่ครบ: {e}")

    proba = float(model.predict_proba(row)[0, 1])
    tier = risk_tier(proba)
    label = "high_risk" if tier == "high" else "low_risk"

    sv = explainer(row)
    contrib = pd.DataFrame({
        "feature": row.columns,
        "shap_value": sv.values[0],
    })
    contrib["abs_impact"] = contrib["shap_value"].abs()
    top = contrib.sort_values("abs_impact", ascending=False).head(10)
    factors = [
        {
            "feature": r.feature,
            "direction": "เพิ่มความเสี่ยง" if r.shap_value > 0 else "ลดความเสี่ยง",
            "impact": round(float(r.shap_value), 4),
        }
        for r in top.itertuples()
    ]

    response = PredictionResponse(risk_score=round(proba, 4), risk_label=label, risk_tier=tier, top_factors=factors)

    # --- Audit log (best-effort, ไม่บล็อก response ถ้า DB มีปัญหา) ---
    if is_db_enabled():
        try:
            with get_session() as session:
                log = PredictionLog(
                    request_id=request.headers.get("x-request-id"),
                    input_payload=payload.model_dump(by_alias=True),
                    risk_score=response.risk_score,
                    risk_label=response.risk_label,
                    top_factors=response.top_factors,
                )
                session.add(log)
                session.commit()
        except Exception:
            logger.exception("audit log insert failed; continuing without blocking response")

    return response


@app.get("/predictions")
def list_predictions(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    if not is_db_enabled():
        raise HTTPException(status_code=503, detail="audit log DB not configured")
    with get_session() as session:
        rows = (
            session.query(PredictionLog)
            .order_by(PredictionLog.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return [
            {
                "id": str(r.id),
                "created_at": r.created_at.isoformat(),
                "risk_score": r.risk_score,
                "risk_label": r.risk_label,
                "top_factors": r.top_factors,
            }
            for r in rows
        ]