"""Preprocessing helpers for triage model inference."""

import re
import pandas as pd


TRIAGE_FEATURE_COLUMNS = [
    'age',
    'gender_male',
    'gender_female',
    'systolic_bp',
    'heart_rate',
    'temperature',
    'oxygen_saturation',
    'respiratory_rate',
    'chest_pain',
    'difficulty_breathing',
    'severe_headache',
    'abdominal_pain',
    'fever',
    'nausea',
    'dizziness',
    'confusion',
    'loss_of_consciousness',
    'diabetes',
    'hypertension',
    'heart_disease',
    'asthma',
    'cancer',
    'kidney_disease',
    'other_symptom',
    'other_condition',
]

DEPARTMENT_LABELS = [
    'Cardiology',
    'Neurology',
    'Pulmonology',
    'General Medicine',
    'Gastroenterology',
    'Emergency',
]

SYMPTOM_KEYWORDS = {
    'chest_pain': ['chest pain', 'angina', 'chest tightness', 'chest discomfort'],
    'difficulty_breathing': ['difficulty breathing', 'shortness of breath', 'dyspnea', 'breathless', 'wheezing'],
    'severe_headache': ['severe headache', 'migraine', 'head pain', 'thunderclap headache'],
    'abdominal_pain': ['abdominal pain', 'stomach pain', 'belly pain', 'epigastric pain'],
    'fever': ['fever', 'febrile', 'high temperature', 'chills'],
    'nausea': ['nausea', 'vomiting', 'queasy', 'emesis'],
    'dizziness': ['dizziness', 'vertigo', 'lightheaded'],
    'confusion': ['confusion', 'disorientation', 'altered mental status'],
    'loss_of_consciousness': ['loss of consciousness', 'unconscious', 'syncope', 'passed out', 'blackout'],
    'cardiac_symptom': ['palpitations', 'rapid heartbeat', 'irregular heartbeat', 'tachycardia'],
    'neuro_symptom': ['blurred vision', 'slurred speech', 'weakness', 'numbness', 'stroke signs', 'seizure'],
    'general_symptom': ['fatigue', 'tiredness', 'malaise'],
}

CONDITION_KEYWORDS = {
    'diabetes': ['diabetes', 'dm', 'type 1 diabetes', 'type 2 diabetes'],
    'hypertension': ['hypertension', 'high blood pressure', 'htn'],
    'heart_disease': ['heart disease', 'cad', 'coronary artery disease', 'mi', 'heart failure'],
    'asthma': ['asthma', 'copd', 'chronic bronchitis'],
    'cancer': ['cancer', 'malignancy', 'tumor', 'oncology'],
    'kidney_disease': ['kidney disease', 'ckd', 'renal disease', 'renal failure'],
    'stroke_history': ['stroke', 'cva', 'tia'],
}


def _normalize_token(text):
    return re.sub(r'\s+', ' ', str(text or '').strip().lower())


def _tokenize(values):
    if not values:
        return []
    tokens = []
    for item in values:
        for piece in re.split(r'[,;/\n]+', str(item or '')):
            clean = _normalize_token(piece)
            if clean:
                tokens.append(clean)
    return tokens


def _parse_systolic_bp(value):
    if isinstance(value, (int, float)):
        return int(value)
    match = re.match(r'^\s*(\d{2,3})', str(value or ''))
    return int(match.group(1)) if match else 120


def _map_tokens_to_flags(tokens, keyword_map):
    flags = {key: 0 for key in keyword_map}
    unknown = 0
    for token in tokens:
        if token in {'none', 'nil', 'na', 'n/a', 'no conditions', 'no known conditions'}:
            continue
        matched = False
        for target, keywords in keyword_map.items():
            if token == target.replace('_', ' ') or any(k in token for k in keywords):
                flags[target] = 1
                matched = True
        if not matched:
            unknown = 1
    return flags, unknown


def build_triage_feature_payload(triage_data):
    gender = _normalize_token(triage_data.get('gender'))
    symptom_tokens = _tokenize(triage_data.get('symptoms', []))
    condition_tokens = _tokenize(triage_data.get('previous_conditions', []))

    symptom_flags, other_symptom = _map_tokens_to_flags(symptom_tokens, SYMPTOM_KEYWORDS)
    condition_flags, other_condition = _map_tokens_to_flags(condition_tokens, CONDITION_KEYWORDS)

    feature_row = {
        'age': int(triage_data.get('age') or 0),
        'gender_male': 1 if gender == 'male' else 0,
        'gender_female': 1 if gender == 'female' else 0,
        'systolic_bp': _parse_systolic_bp(triage_data.get('blood_pressure') or triage_data.get('systolic_bp')),
        'heart_rate': int(triage_data.get('heart_rate') or 0),
        'temperature': float(triage_data.get('temperature') or 0),
        'oxygen_saturation': int(triage_data.get('oxygen_saturation') or 0),
        'respiratory_rate': int(triage_data.get('respiratory_rate') or 0),
        'chest_pain': symptom_flags.get('chest_pain', 0),
        'difficulty_breathing': symptom_flags.get('difficulty_breathing', 0),
        'severe_headache': symptom_flags.get('severe_headache', 0),
        'abdominal_pain': symptom_flags.get('abdominal_pain', 0),
        'fever': symptom_flags.get('fever', 0),
        'nausea': symptom_flags.get('nausea', 0),
        'dizziness': symptom_flags.get('dizziness', 0),
        'confusion': symptom_flags.get('confusion', 0),
        'loss_of_consciousness': symptom_flags.get('loss_of_consciousness', 0),
        'diabetes': condition_flags.get('diabetes', 0),
        'hypertension': condition_flags.get('hypertension', 0),
        'heart_disease': condition_flags.get('heart_disease', 0),
        'asthma': condition_flags.get('asthma', 0),
        'cancer': condition_flags.get('cancer', 0),
        'kidney_disease': condition_flags.get('kidney_disease', 0),
        'other_symptom': other_symptom,
        'other_condition': other_condition,
    }

    context = {
        'symptom_tokens': symptom_tokens,
        'condition_tokens': condition_tokens,
        'symptom_flags': symptom_flags,
        'condition_flags': condition_flags,
    }

    return feature_row, context


def preprocess_triage_data(triage_data):
    feature_row, context = build_triage_feature_payload(triage_data)
    df = pd.DataFrame([[feature_row[col] for col in TRIAGE_FEATURE_COLUMNS]], columns=TRIAGE_FEATURE_COLUMNS)
    return df.astype(float), context


def preprocess_patient_data(data):
    """
    Backward-compatible alias for existing risk routes.
    Uses triage feature preprocessing.
    """
    df, _ = preprocess_triage_data(data)
    return df
