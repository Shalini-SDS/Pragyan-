import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from risk_engine.preprocess import TRIAGE_FEATURE_COLUMNS, DEPARTMENT_LABELS


def _rule_department(row):
    if (
        row['loss_of_consciousness'] == 1
        or (row['difficulty_breathing'] == 1 and row['oxygen_saturation'] < 90)
        or (row['chest_pain'] == 1 and row['systolic_bp'] > 180)
    ):
        return 'Emergency'
    if row['chest_pain'] == 1 or row['hypertension'] == 1 or row['heart_disease'] == 1:
        return 'Cardiology'
    if row['severe_headache'] == 1 or row['dizziness'] == 1 or row['confusion'] == 1:
        return 'Neurology'
    if row['difficulty_breathing'] == 1 or row['oxygen_saturation'] < 92 or row['asthma'] == 1:
        return 'Pulmonology'
    if row['abdominal_pain'] == 1 or row['nausea'] == 1 or row['fever'] == 1:
        return 'Gastroenterology'
    return 'General Medicine'


def _vital_abnormality_score(row):
    score = 0
    if row['systolic_bp'] > 160:
        score += 10
    if row['oxygen_saturation'] < 90:
        score += 15
    if row['heart_rate'] > 120:
        score += 10
    if row['temperature'] > 39:
        score += 8
    return min(score / 43.0, 1.0)


def _critical_symptom_score(row):
    score = 0
    if row['loss_of_consciousness'] == 1:
        score += 15
    if row['chest_pain'] == 1:
        score += 10
    if row['difficulty_breathing'] == 1:
        score += 12
    if row['confusion'] == 1:
        score += 8
    return min(score / 45.0, 1.0)


def _rule_priority_score(row):
    # Proxy model probability term for synthetic labels.
    probability_proxy = (
        0.22 * row['chest_pain'] +
        0.24 * row['difficulty_breathing'] +
        0.25 * row['loss_of_consciousness'] +
        0.15 * row['confusion'] +
        0.12 * row['heart_disease'] +
        0.08 * row['hypertension'] +
        0.28 * max((95 - row['oxygen_saturation']) / 15, 0) +
        0.20 * max((row['systolic_bp'] - 120) / 60, 0) +
        0.18 * max((row['heart_rate'] - 80) / 60, 0) +
        0.16 * max((row['temperature'] - 37.0) / 3.0, 0) +
        0.10 * max((row['respiratory_rate'] - 18) / 18, 0) +
        0.08 * max((row['age'] - 45) / 45, 0)
    )
    probability_proxy = float(np.clip(probability_proxy, 0, 1))
    priority = (probability_proxy * 70) + (_vital_abnormality_score(row) * 20) + (_critical_symptom_score(row) * 10)
    return float(np.clip(priority, 0, 100))


def _risk_level_from_score(score):
    if score >= 70:
        return 'High'
    if score >= 40:
        return 'Medium'
    return 'Low'


def generate_synthetic_dataset(num_rows=7000, random_seed=42):
    rng = np.random.default_rng(random_seed)
    rows = []
    for _ in range(num_rows):
        age = int(rng.integers(1, 95))
        gender = rng.choice(['male', 'female', 'other'], p=[0.48, 0.48, 0.04])
        gender_male = 1 if gender == 'male' else 0
        gender_female = 1 if gender == 'female' else 0

        row = {
            'age': age,
            'gender_male': gender_male,
            'gender_female': gender_female,
            'systolic_bp': int(np.clip(rng.normal(128, 22), 85, 220)),
            'heart_rate': int(np.clip(rng.normal(84, 18), 40, 180)),
            'temperature': round(float(np.clip(rng.normal(37.2, 0.9), 35.0, 41.5)), 1),
            'oxygen_saturation': int(np.clip(rng.normal(96, 4), 70, 100)),
            'respiratory_rate': int(np.clip(rng.normal(18, 5), 8, 40)),
            'chest_pain': int(rng.binomial(1, 0.16)),
            'difficulty_breathing': int(rng.binomial(1, 0.14)),
            'severe_headache': int(rng.binomial(1, 0.14)),
            'abdominal_pain': int(rng.binomial(1, 0.18)),
            'fever': int(rng.binomial(1, 0.2)),
            'nausea': int(rng.binomial(1, 0.2)),
            'dizziness': int(rng.binomial(1, 0.16)),
            'confusion': int(rng.binomial(1, 0.08)),
            'loss_of_consciousness': int(rng.binomial(1, 0.03)),
            'diabetes': int(rng.binomial(1, 0.18)),
            'hypertension': int(rng.binomial(1, 0.24)),
            'heart_disease': int(rng.binomial(1, 0.12)),
            'asthma': int(rng.binomial(1, 0.1)),
            'cancer': int(rng.binomial(1, 0.05)),
            'kidney_disease': int(rng.binomial(1, 0.07)),
            'other_symptom': int(rng.binomial(1, 0.08)),
            'other_condition': int(rng.binomial(1, 0.06)),
        }

        row['department'] = _rule_department(row)
        row['priority_score'] = _rule_priority_score(row)
        row['risk_level'] = _risk_level_from_score(row['priority_score'])
        rows.append(row)

    return pd.DataFrame(rows)


def train_models(output_dir='backend/models', num_rows=7000):
    df = generate_synthetic_dataset(num_rows=num_rows)
    X = df[TRIAGE_FEATURE_COLUMNS]

    # Risk model: binary high-risk probability model (required for score formula).
    # Tuned for better high-risk recall without collapsing precision.
    # Use a stricter threshold so "high-risk probability" reflects clinically meaningful acuity.
    y_risk = (df['priority_score'] >= 45).astype(int)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_risk, test_size=0.2, random_state=42, stratify=y_risk
    )
    risk_model = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight={0: 1, 1: 2},
        n_jobs=-1,
    )
    risk_model.fit(X_train, y_train)
    y_pred = risk_model.predict(X_test)
    print('Risk model accuracy:', round(accuracy_score(y_test, y_pred), 4))
    print(classification_report(y_test, y_pred, zero_division=0))

    # Department model
    y_dept = df['department']
    Xd_train, Xd_test, yd_train, yd_test = train_test_split(
        X, y_dept, test_size=0.2, random_state=42, stratify=y_dept
    )
    dept_model = RandomForestClassifier(n_estimators=250, random_state=42, class_weight='balanced')
    dept_model.fit(Xd_train, yd_train)
    yd_pred = dept_model.predict(Xd_test)
    print('Department model accuracy:', round(accuracy_score(yd_test, yd_pred), 4))
    print(classification_report(yd_test, yd_pred, labels=DEPARTMENT_LABELS, zero_division=0))

    os.makedirs(output_dir, exist_ok=True)
    risk_model_path = os.path.join(output_dir, 'risk_model.joblib')
    dept_model_path = os.path.join(output_dir, 'department_model.joblib')
    pkl_risk_path = os.path.join(output_dir, 'risk_model.pkl')
    pkl_dept_path = os.path.join(output_dir, 'department_model.pkl')

    # Save as .joblib and .pkl (both are joblib format for simple deployment compatibility).
    joblib.dump(risk_model, risk_model_path)
    joblib.dump(dept_model, dept_model_path)
    joblib.dump(risk_model, pkl_risk_path)
    joblib.dump(dept_model, pkl_dept_path)

    print('Saved:', risk_model_path)
    print('Saved:', dept_model_path)
    print('Saved:', pkl_risk_path)
    print('Saved:', pkl_dept_path)


if __name__ == '__main__':
    train_models(output_dir='backend/models', num_rows=7000)
