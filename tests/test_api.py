from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

VALID = {
    "RevolvingUtilizationOfUnsecuredLines": 0.3,
    "age": 35,
    "NumberOfTime30-59DaysPastDueNotWorse": 0,
    "DebtRatio": 0.35,
    "MonthlyIncome": 5400,
    "NumberOfOpenCreditLinesAndLoans": 6,
    "NumberOfTimes90DaysLate": 0,
    "NumberRealEstateLoansOrLines": 1,
    "NumberOfTime60-89DaysPastDueNotWorse": 0,
    "NumberOfDependents": 1,
}

def test_health():
    assert client.get("/health").json() == {"status": "ok"}

def test_predict_valid():
    r = client.post("/predict", json=VALID)
    assert r.status_code == 200
    body = r.json()
    assert 0.0 <= body["risk_score"] <= 1.0
    assert body["risk_tier"] in {"low", "medium", "high"}
    assert 1 <= len(body["top_factors"]) <= 10

def test_predict_missing_income_is_accepted():
    payload = {**VALID, "MonthlyIncome": None}
    assert client.post("/predict", json=payload).status_code == 200

def test_predict_rejects_underage():
    assert client.post("/predict", json={**VALID, "age": 17}).status_code == 422

def test_predict_rejects_missing_field():
    payload = {k: v for k, v in VALID.items() if k != "DebtRatio"}
    assert client.post("/predict", json=payload).status_code == 422

def test_predictions_without_db_returns_503():
    assert client.get("/predictions").status_code == 503
