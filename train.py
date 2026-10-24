import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report
import matplotlib.pyplot as plt
from sklearn.metrics import roc_curve


# โหลดข้อมูล
df = pd.read_csv('GiveMeSomeCredit/cs-training.csv')
df = df.drop(columns=['Unnamed: 0'])




# เช็คข้อมูลก่อนเติม (ให้เห็นภาพ)
print("จำนวนช่องว่าง MonthlyIncome:", df['MonthlyIncome'].isna().sum())
print("จำนวนช่องว่าง NumberOfDependents:", df['NumberOfDependents'].isna().sum())

# เติมช่องว่าง + เก็บ signal ว่าเคย missing
df['MonthlyIncome_missing'] = df['MonthlyIncome'].isna().astype(int)
df['MonthlyIncome'] = df['MonthlyIncome'].fillna(df['MonthlyIncome'].median())
df['NumberOfDependents'] = df['NumberOfDependents'].fillna(0)

# แยก feature (X) กับ label (y)
X = df.drop(columns=['SeriousDlqin2yrs'])
y = df['SeriousDlqin2yrs']

# แบ่ง train/validation
X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# คำนวณ scale_pos_weight (เพราะข้อมูล imbalance)
neg, pos = (y_train == 0).sum(), (y_train == 1).sum()
scale_pos_weight = neg / pos
print("scale_pos_weight:", scale_pos_weight)

# สร้างโมเดล
model = xgb.XGBClassifier(
    n_estimators=500,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=scale_pos_weight,
    eval_metric='auc',
    early_stopping_rounds=30,
    random_state=42
)

# Train
model.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    verbose=50
)

X_val.to_csv('X_val_sample.csv', index=False)
print("เซฟ X_val สำหรับ SHAP เรียบร้อย: X_val_sample.csv")
# ประเมินผล
y_pred_proba = model.predict_proba(X_val)[:, 1]
print("\nAUC Score:", roc_auc_score(y_val, y_pred_proba))
print("\n", classification_report(y_val, model.predict(X_val)))

importance = pd.DataFrame({
    'feature': X_train.columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print(importance)
importance = pd.DataFrame({
    'feature': X_train.columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=True)  # ascending=True เพราะกราฟแท่งนอนจะได้เรียงจากมากไปน้อยจากบนลงล่าง
fpr, tpr, thresholds = roc_curve(y_val, y_pred_proba)
plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, color='#4C72B0', linewidth=2, label=f'AUC = {roc_auc_score(y_val, y_pred_proba):.3f}')
plt.plot([0, 1], [0, 1], color='gray', linestyle='--', label=' random (AUC = 0.5)')
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve - Credit Scoring Model')
plt.legend()
plt.tight_layout()
plt.savefig('roc_curve.png', dpi=150)
plt.show()

print("เซฟกราฟ ROC เรียบร้อย: roc_curve.png")




model.save_model('credit_model.json')
print("\nเซฟโมเดลเรียบร้อย: credit_model.json")