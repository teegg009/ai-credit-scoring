
import shap
import pandas as pd
import matplotlib.pyplot as plt
import xgboost as xgb

# --- ถ้ารันแยกไฟล์จาก train.py ให้ uncomment 3 บรรทัดนี้ ---
model = xgb.XGBClassifier()
model.load_model('credit_model.json')
X_val = pd.read_csv('X_val_sample.csv')  # ต้องเซฟ X_val ไว้ตอน train ด้วยถ้าจะใช้ทางนี้

# ใช้ sample แทนทั้ง X_val เพื่อความเร็ว (SHAP คำนวณช้าถ้า dataset ใหญ่)
X_sample = X_val.sample(n=min(2000, len(X_val)), random_state=42)

explainer = shap.TreeExplainer(model)
shap_values = explainer(X_sample)

# 1. Summary plot — ดูภาพรวมว่า feature ไหนมีผลต่อการทำนายมากสุด และมีทิศทางยังไง
plt.figure()
shap.summary_plot(shap_values, X_sample, show=False)
plt.tight_layout()
plt.savefig('shap_summary.png', dpi=150, bbox_inches='tight')
plt.close()
print("เซฟกราฟ SHAP summary เรียบร้อย: shap_summary.png")

# 2. Bar plot — importance เฉลี่ยแบบเรียงลำดับ อ่านง่ายกว่าสำหรับ non-technical stakeholder
plt.figure()
shap.plots.bar(shap_values, show=False)
plt.tight_layout()
plt.savefig('shap_bar.png', dpi=150, bbox_inches='tight')
plt.close()
print("เซฟกราฟ SHAP bar เรียบร้อย: shap_bar.png")

# 3. ฟังก์ชันอธิบายการทำนายรายคน — ใช้ตอนต่อกับ FastAPI endpoint
def explain_single_prediction(model, explainer, row: pd.DataFrame, top_n: int = 5):
    """
    รับ 1 แถวข้อมูล คืนค่า top_n feature ที่มีผลต่อคะแนนเครดิตมากที่สุด
    พร้อมทิศทาง (เพิ่ม/ลดความเสี่ยง) — ใช้แสดงเหตุผลให้ผู้ใช้เข้าใจได้ (สอดคล้อง PDPA
    เรื่องสิทธิ์ในการขอคำอธิบายการตัดสินใจอัตโนมัติ)
    """
    sv = explainer(row)
    contributions = pd.DataFrame({
        'feature': row.columns,
        'value': row.iloc[0].values,
        'shap_value': sv.values[0],
    })
    contributions['abs_impact'] = contributions['shap_value'].abs()
    contributions = contributions.sort_values('abs_impact', ascending=False).head(top_n)
    contributions['direction'] = contributions['shap_value'].apply(
        lambda x: 'เพิ่มความเสี่ยง' if x > 0 else 'ลดความเสี่ยง'
    )
    return contributions[['feature', 'value', 'direction', 'shap_value']]

if __name__ == '__main__':
    import sys
    # รับ index จาก command line เช่น: python Shapexplain.py 5
    # ถ้าไม่ใส่อะไร จะใช้แถวแรก (index 0) เป็นค่า default
    row_index = int(sys.argv[1]) if len(sys.argv) > 1 else 0

    if row_index >= len(X_val):
        print(f"index {row_index} เกินขอบเขต! X_val มีทั้งหมด {len(X_val)} แถว (0 ถึง {len(X_val)-1})")
    else:
        example = explain_single_prediction(model, explainer, X_val.iloc[[row_index]])
        print(f"\nตัวอย่างคำอธิบายรายบุคคล (แถวที่ {row_index}):\n", example)