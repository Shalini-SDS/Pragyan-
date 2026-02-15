"""Risk prediction and triage scoring module."""

import numpy as np
from risk_engine.model_loader import ModelLoader
from risk_engine.preprocess import preprocess_triage_data, TRIAGE_FEATURE_COLUMNS


class RiskPredictor:
    """Risk prediction class with triage risk and department inference."""

    def __init__(self):
        """Initialize predictor with risk and department models if available."""
        try:
            self.risk_model = ModelLoader.get_model('risk')
        except:
            self.risk_model = None
        try:
            self.department_model = ModelLoader.get_model('department')
        except:
            self.department_model = None

    @staticmethod
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

    @staticmethod
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
        if row['severe_headache'] == 1:
            score += 6
        if row['dizziness'] == 1:
            score += 4
        return min(score / 45.0, 1.0)

    @staticmethod
    def _chronic_condition_score(row):
        score = 0
        if row.get('heart_disease', 0) == 1:
            score += 10
        if row.get('kidney_disease', 0) == 1:
            score += 8
        if row.get('diabetes', 0) == 1:
            score += 6
        if row.get('hypertension', 0) == 1:
            score += 5
        if row.get('cancer', 0) == 1:
            score += 7
        if row.get('asthma', 0) == 1:
            score += 4
        return min(score / 40.0, 1.0)

    @staticmethod
    def _risk_level_from_score(priority_score):
        if priority_score >= 68:
            return 'High'
        if priority_score >= 35:
            return 'Medium'
        return 'Low'

    @staticmethod
    def _fallback_department(row, context):
        if (
            row['loss_of_consciousness'] == 1
            or (row['difficulty_breathing'] == 1 and row['oxygen_saturation'] < 90)
            or (row['chest_pain'] == 1 and row['systolic_bp'] > 180)
        ):
            return 'Emergency'
        if (
            row['chest_pain'] == 1
            or row['heart_disease'] == 1
            or row['hypertension'] == 1
            or context['symptom_flags'].get('cardiac_symptom', 0) == 1
        ):
            return 'Cardiology'
        if (
            row['severe_headache'] == 1
            or row['dizziness'] == 1
            or row['confusion'] == 1
            or context['condition_flags'].get('stroke_history', 0) == 1
            or context['symptom_flags'].get('neuro_symptom', 0) == 1
        ):
            return 'Neurology'
        if row['difficulty_breathing'] == 1 or row['oxygen_saturation'] < 92 or row['asthma'] == 1:
            return 'Pulmonology'
        if row['abdominal_pain'] == 1 or row['nausea'] == 1 or row['fever'] == 1:
            return 'Gastroenterology'
        return 'General Medicine'

    @staticmethod
    def _feature_rankings(risk_model, row):
        importances = getattr(risk_model, 'feature_importances_', None)
        if importances is None:
            return []

        def _numeric_weight(col, value):
            if col == 'systolic_bp':
                return max((value - 120) / 60, 0)
            if col == 'heart_rate':
                return max((value - 80) / 60, 0)
            if col == 'temperature':
                return max((value - 37) / 3, 0)
            if col == 'oxygen_saturation':
                return max((95 - value) / 15, 0)
            if col == 'respiratory_rate':
                return max((value - 18) / 18, 0)
            if col == 'age':
                return max((value - 40) / 50, 0)
            return max(value, 0)

        contributions = []
        for i, col in enumerate(TRIAGE_FEATURE_COLUMNS):
            val = row[col]
            weight = _numeric_weight(col, val)
            score = float(importances[i]) * float(weight)
            if score > 0:
                contributions.append((col, score, val))
        contributions.sort(key=lambda x: x[1], reverse=True)
        return contributions[:4]

    @staticmethod
    def _humanize_feature(col, value):
        labels = {
            'oxygen_saturation': f'Oxygen Saturation ({int(value)}%)',
            'systolic_bp': f'Systolic Blood Pressure ({int(value)} mmHg)',
            'heart_rate': f'Heart Rate ({int(value)} bpm)',
            'temperature': f'Temperature ({value:.1f} C)',
            'difficulty_breathing': 'Difficulty Breathing',
            'chest_pain': 'Chest Pain',
            'confusion': 'Confusion',
            'loss_of_consciousness': 'Loss of Consciousness',
            'heart_disease': 'Heart Disease History',
            'hypertension': 'Hypertension History',
            'asthma': 'Asthma History',
            'severe_headache': 'Severe Headache',
            'abdominal_pain': 'Abdominal Pain',
            'dizziness': 'Dizziness',
            'fever': 'Fever',
            'nausea': 'Nausea',
            'age': f'Age ({int(value)})',
        }
        return labels.get(col, col.replace('_', ' ').title())

    @staticmethod
    def _recommended_tests_for_department(department, row):
        tests = ['CBC', 'Basic Metabolic Panel']
        if department == 'Cardiology':
            tests.extend(['ECG', 'Troponin', 'Echocardiogram'])
        elif department == 'Neurology':
            tests.extend(['Neurological Exam', 'CT Brain', 'MRI Brain'])
        elif department == 'Pulmonology':
            tests.extend(['Chest X-ray', 'ABG', 'Spirometry'])
        elif department == 'Gastroenterology':
            tests.extend(['LFT', 'Abdominal Ultrasound', 'Serum Lipase'])
        elif department == 'Emergency':
            tests.extend(['ECG', 'Chest X-ray', 'Emergency Panel', 'Point-of-care Ultrasound'])

        if row['oxygen_saturation'] < 90:
            tests.append('Supplemental Oxygen Protocol')
        if row['loss_of_consciousness'] == 1:
            tests.append('Emergency Airway and Neuro Monitoring')
        return list(dict.fromkeys(tests))

    def predict_triage(self, triage_data):
        """Predict triage risk and department with explainability."""
        X, context = preprocess_triage_data(triage_data)
        row = X.iloc[0].to_dict()

        # Model probability of high risk.
        if self.risk_model is not None:
            try:
                risk_classes = list(self.risk_model.classes_)
                if 'High' in risk_classes:
                    high_idx = risk_classes.index('High')
                elif 1 in risk_classes:
                    high_idx = risk_classes.index(1)
                elif True in risk_classes:
                    high_idx = risk_classes.index(True)
                else:
                    high_idx = len(risk_classes) - 1
                risk_probs = self.risk_model.predict_proba(X)[0]
                risk_proba = float(risk_probs[high_idx])
                risk_confidence = float(np.max(risk_probs))
            except Exception:
                self.risk_model = None
                risk_proba = 0.5
                risk_confidence = 0.5
        else:
            risk_proba = 0.5
            risk_confidence = 0.5

        vital_score = self._vital_abnormality_score(row)
        critical_score = self._critical_symptom_score(row)
        chronic_score = self._chronic_condition_score(row)
        neuro_modifier = 0.0
        # Neurologic acuity boost: stroke history + active neuro symptoms should not be near-zero.
        if context['condition_flags'].get('stroke_history', 0) == 1 and (
            row['severe_headache'] == 1 or row['dizziness'] == 1 or row['confusion'] == 1
            or context['symptom_flags'].get('neuro_symptom', 0) == 1
        ):
            neuro_modifier = 0.2
        # Rebalanced blend to reduce "always Medium" behavior and improve spread.
        priority_score = (risk_proba * 55.0) + (vital_score * 25.0) + (critical_score * 15.0) + (chronic_score * 5.0)
        if risk_proba < 0.30:
            priority_score -= 8.0
        elif risk_proba > 0.75:
            priority_score += 6.0
        priority_score += neuro_modifier * 100.0 * 0.1
        if neuro_modifier > 0:
            priority_score = max(priority_score, 45.0)
        if row['loss_of_consciousness'] == 1 or (row['difficulty_breathing'] == 1 and row['oxygen_saturation'] < 90):
            priority_score = max(priority_score, 78.0)
        priority_score = round(float(np.clip(priority_score, 0, 100)), 2)
        risk_level = self._risk_level_from_score(priority_score)

        if self.department_model is not None:
            try:
                dep_probs = self.department_model.predict_proba(X)[0]
                dep_idx = int(np.argmax(dep_probs))
                recommended_department = str(self.department_model.classes_[dep_idx])
                dep_confidence = float(np.max(dep_probs))
            except Exception:
                self.department_model = None
                recommended_department = self._fallback_department(row, context)
                dep_confidence = 0.55
        else:
            recommended_department = self._fallback_department(row, context)
            dep_confidence = 0.55

        # Rule-aligned overrides for manual symptom/condition mappings.
        if context['symptom_flags'].get('cardiac_symptom', 0) == 1 and recommended_department == 'General Medicine':
            recommended_department = 'Cardiology'
            dep_confidence = max(dep_confidence, 0.7)
        if context['condition_flags'].get('stroke_history', 0) == 1 and recommended_department in ('General Medicine', 'Gastroenterology'):
            recommended_department = 'Neurology'
            dep_confidence = max(dep_confidence, 0.7)
        if (
            row['loss_of_consciousness'] == 1
            or (row['difficulty_breathing'] == 1 and row['oxygen_saturation'] < 90)
            or (row['chest_pain'] == 1 and row['systolic_bp'] > 180)
            or priority_score >= 85
        ):
            recommended_department = 'Emergency'
            dep_confidence = max(dep_confidence, 0.8)

        confidence = round(float(np.clip((risk_confidence + dep_confidence) / 2.0, 0, 1)), 3)

        ranked = self._feature_rankings(self.risk_model, row) if self.risk_model is not None else []
        top_features = [self._humanize_feature(col, value) for col, _, value in ranked]
        if not top_features:
            top_features = [
                self._humanize_feature('oxygen_saturation', row['oxygen_saturation']),
                self._humanize_feature('systolic_bp', row['systolic_bp']),
                self._humanize_feature('chest_pain', 1),
                self._humanize_feature('difficulty_breathing', 1),
            ]

        reasoning = (
            f"Patient risk is {risk_level} with a priority score of {priority_score}. "
            f"The score combines Random Forest high-risk probability ({risk_proba:.2f}), "
            f"vital abnormality burden, and critical symptom severity."
        )
        if neuro_modifier > 0:
            reasoning += " Neurologic risk modifier was applied due to stroke history with active neuro symptoms."
        recommended_tests = self._recommended_tests_for_department(recommended_department, row)

        return {
            'risk_level': risk_level,
            'priority_score': priority_score,
            'recommended_department': recommended_department,
            'confidence': confidence,
            'model_probability_high_risk': round(risk_proba, 4),
            'vital_abnormality_score': round(vital_score, 4),
            'critical_symptom_score': round(critical_score, 4),
            'chronic_condition_score': round(chronic_score, 4),
            'explainability': {
                'top_contributing_features': top_features,
                'reasoning': reasoning
            },
            # Backward-compatible keys used by existing UI/API consumers.
            'predicted_department': recommended_department,
            'priority_level': risk_level,
            'risk_score': priority_score,
            'reasoning': [reasoning],
            'recommended_tests': recommended_tests
        }

    def predict_risk(self, patient_data):
        """
        Backward-compatible method used by older /risk endpoint.
        Returns normalized score (0-1) with legacy key names.
        """
        try:
            triage = self.predict_triage(patient_data)
            score01 = triage['priority_score'] / 100.0
            return {
                "risk_score": float(score01),
                "risk_level": triage['risk_level'],
                "confidence": triage['confidence']
            }
        except:
            return self._fallback_prediction(patient_data)

    def _fallback_prediction(self, patient_data):
        """Fallback prediction when model is unavailable."""
        return {
            "risk_score": 0.5,
            "risk_level": "Medium",
            "confidence": 0.5
        }


def predict_risk(patient_data):
    """Backward-compatible functional wrapper."""
    predictor = RiskPredictor()
    return predictor.predict_risk(patient_data)
