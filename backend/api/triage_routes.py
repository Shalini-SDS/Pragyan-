"""
Triage Routes Module

This module defines API endpoints for patient triage assessments.
Includes ML-powered predictions for department assignment and priority levels.

Endpoints:
    - GET /api/triage: List triages
    - POST /api/triage: Create new triage assessment
    - GET /api/triage/<triage_id>: Get triage details
    - PUT /api/triage/<triage_id>: Update triage
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from database.mongo import (
    get_triages_collection,
    get_patients_collection,
    get_users_collection
)
from models.user_model import TriageSchema
from risk_engine.predictor import RiskPredictor
from datetime import datetime
from bson.objectid import ObjectId

triage_bp = Blueprint('triage', __name__)


def get_hospital_from_jwt():
    """Extract hospital_id from JWT claims."""
    claims = get_jwt()
    return claims.get('hospital_id')


def predict_triage_assessment(triage_data):
    """
    Use ML model to predict department and priority.
    
    Args:
        triage_data: Dict with vital signs and symptoms
        
    Returns:
        Dict with predictions
    """
    try:
        predictor = RiskPredictor()
        
        # Extract vital signs
        vitals = {
            'heart_rate': triage_data.get('heart_rate', 0),
            'blood_pressure_systolic': int(triage_data.get('blood_pressure', '120/80').split('/')[0]),
            'blood_pressure_diastolic': int(triage_data.get('blood_pressure', '120/80').split('/')[1]),
            'temperature': triage_data.get('temperature', 37.0),
            'respiratory_rate': triage_data.get('respiratory_rate', 16),
            'oxygen_saturation': triage_data.get('oxygen_saturation', 98)
        }
        
        # Simple rule-based ML fallback
        # In production, you'd use your trained model
        
        # Calculate risk score based on vital signs
        risk_score = 0.0
        severity = triage_data.get('severity', 5)
        reasoning = []
        
        # Heart rate assessment
        hr = vitals['heart_rate']
        if hr < 60 or hr > 100:
            risk_score += 0.1
            reasoning.append("Abnormal heart rate")
        if hr < 40 or hr > 120:
            risk_score += 0.2
            reasoning.append("Severely abnormal heart rate")
            
        # BP assessment
        sys_bp = vitals['blood_pressure_systolic']
        dias_bp = vitals['blood_pressure_diastolic']
        if sys_bp > 140 or dias_bp > 90:
            risk_score += 0.15
            reasoning.append("Elevated blood pressure")
        if sys_bp > 180 or dias_bp > 120:
            risk_score += 0.2
            reasoning.append("Critical blood pressure")
            
        # Temperature assessment
        temp = vitals['temperature']
        if temp > 38.5 or temp < 36:
            risk_score += 0.15
            reasoning.append("Temperature out of normal range")
            
        # Respiratory rate assessment
        rr = vitals['respiratory_rate']
        if rr > 24 or rr < 12:
            risk_score += 0.1
            reasoning.append("Abnormal respiratory rate")
            
        # Oxygen saturation assessment
        o2 = vitals['oxygen_saturation']
        if o2 < 95:
            risk_score += 0.2
            reasoning.append("Low oxygen saturation")
        if o2 < 90:
            risk_score += 0.2
            reasoning.append("Critical oxygen saturation")
            
        # Severity factor
        risk_score += (severity - 5) * 0.03
        
        # Normalize risk score
        risk_score = min(max(risk_score, 0.0), 1.0)
        
        # Determine priority level
        if risk_score >= 0.8:
            priority_level = "Critical"
        elif risk_score >= 0.6:
            priority_level = "High"
        elif risk_score >= 0.4:
            priority_level = "Medium"
        else:
            priority_level = "Low"
        
        # Predict department based on symptoms + profile context
        symptoms = [s.lower() for s in triage_data.get('symptoms', [])]
        previous_conditions = [c.lower() for c in triage_data.get('previous_conditions', [])]
        gender = str(triage_data.get('gender', 'Other')).lower()
        predicted_department = "General Medicine"  # default
        recommended_tests = ["CBC", "Blood Tests"]
        
        # Chest-related symptoms
        if any(s in symptoms for s in ['chest pain', 'breathing difficulty', 'shortness of breath', 'dyspnea']):
            predicted_department = "Cardiology/Pulmonology"
            recommended_tests.extend(["ECG", "Chest X-ray", "Troponin"])
            reasoning.append("Respiratory/cardiac symptoms detected")
            
        # Head/neuro symptoms
        elif any(s in symptoms for s in ['headache', 'dizziness', 'confusion', 'seizure', 'unconscious']):
            predicted_department = "Neurology"
            recommended_tests.extend(["CT Scan", "Neuro Exam", "EEG"])
            reasoning.append("Neurological symptoms detected")
            
        # Abdominal symptoms
        elif any(s in symptoms for s in ['abdominal pain', 'nausea', 'vomiting', 'diarrhea']):
            predicted_department = "Gastroenterology"
            recommended_tests.extend(["Abdominal Ultrasound", "Blood Work"])
            reasoning.append("Gastrointestinal symptoms detected")
            
        # Trauma/Injury
        elif any(s in symptoms for s in ['injury', 'trauma', 'fracture', 'bleeding']):
            predicted_department = "Emergency/Orthopedics"
            recommended_tests.extend(["X-ray", "CT Scan"])
            reasoning.append("Trauma-related symptoms detected")
            
        # Fever/Infection
        elif temp > 38.5:
            predicted_department = "Internal Medicine/Infectious Disease"
            recommended_tests.extend(["Blood Culture", "Urine Culture", "Imaging"])
            reasoning.append("Fever/infection pattern detected")

        # Condition-aware routing adjustments
        if any(c in previous_conditions for c in ['heart disease', 'hypertension']) and any(
            s in symptoms for s in ['chest pain', 'shortness of breath', 'palpitations']
        ):
            predicted_department = "Cardiology"
            risk_score = min(1.0, risk_score + 0.1)
            recommended_tests.extend(["Echocardiogram"])
            reasoning.append("Cardiac history with cardiac symptoms")

        if any(c in previous_conditions for c in ['asthma', 'copd']) and any(
            s in symptoms for s in ['shortness of breath', 'wheezing', 'breathing difficulty']
        ):
            predicted_department = "Pulmonology"
            risk_score = min(1.0, risk_score + 0.1)
            recommended_tests.extend(["Spirometry", "ABG"])
            reasoning.append("Pulmonary history with respiratory symptoms")

        if any(c in previous_conditions for c in ['diabetes', 'kidney disease']) and temp > 38.5:
            predicted_department = "Internal Medicine/Infectious Disease"
            risk_score = min(1.0, risk_score + 0.08)
            recommended_tests.extend(["Renal Function Test", "Blood Glucose"])
            reasoning.append("Comorbidity raises infection risk")

        if gender == 'female' and any(s in symptoms for s in ['pelvic pain', 'lower abdominal pain']):
            predicted_department = "Gynecology"
            recommended_tests.extend(["Pelvic Ultrasound", "Urine Pregnancy Test"])
            reasoning.append("Female-specific pelvic symptoms detected")

        # Re-evaluate priority after condition-based adjustments
        if risk_score >= 0.8:
            priority_level = "Critical"
        elif risk_score >= 0.6:
            priority_level = "High"
        elif risk_score >= 0.4:
            priority_level = "Medium"
        else:
            priority_level = "Low"

        # Remove duplicate tests while preserving order
        deduped_tests = list(dict.fromkeys(recommended_tests))
        
        return {
            "predicted_department": predicted_department,
            "priority_level": priority_level,
            "risk_score": round(risk_score, 3),
            "confidence": round(0.75 + (risk_score * 0.25), 3),
            "recommended_tests": deduped_tests,
            "reasoning": reasoning if reasoning else ["Assessment based on vitals and symptom profile"],
            "vitals_analysis": vitals
        }
        
    except Exception as e:
        # Fallback if ML fails
        return {
            "predicted_department": "General Medicine",
            "priority_level": "Medium",
            "risk_score": 0.5,
            "confidence": 0.5,
            "recommended_tests": ["CBC", "Blood Tests"],
            "reasoning": ["Fallback assessment used due to prediction engine error"],
            "error": str(e)
        }


@triage_bp.route('', methods=['GET'])
@jwt_required()
def list_triages():
    """
    Get list of triages.
    
    Query Parameters:
        - page: int (default: 1)
        - limit: int (default: 10)
        - patient_id: str (filter by patient)
        - status: str (filter by status)
    
    Returns:
        JSON: List of triages with pagination
    """
    try:
        hospital_id = get_hospital_from_jwt()
        triages_collection = get_triages_collection()
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        patient_id = request.args.get('patient_id')
        status = request.args.get('status')
        
        skip = (page - 1) * limit
        
        # Build query
        query = {"hospital_id": hospital_id}
        
        if patient_id:
            query["patient_id"] = patient_id
        if status:
            query["status"] = status
        
        # Get total count
        total = triages_collection.count_documents(query)
        
        # Get paginated results
        triages = list(triages_collection.find(query)
                      .sort("created_at", -1)
                      .skip(skip)
                      .limit(limit))
        
        # Convert ObjectId to string
        for triage in triages:
            triage['_id'] = str(triage['_id'])
        
        return jsonify({
            "triages": triages,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@triage_bp.route('', methods=['POST'])
@jwt_required()
def create_triage():
    """
    Create a new triage assessment with ML predictions.
    
    Required JSON fields: (see TriageSchema)
    
    Returns:
        JSON: Created triage with ML predictions
    """
    try:
        hospital_id = get_hospital_from_jwt()
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Missing request body"}), 400

        # Populate server-controlled fields before validation.
        data['hospital_id'] = hospital_id
        data['nurse_id'] = user_id
        data['status'] = 'completed'

        # Validate schema
        schema = TriageSchema()
        errors = schema.validate(data)
        if errors:
            return jsonify({"error": "Validation failed", "details": errors}), 400

        data['created_at'] = datetime.utcnow()
        data['updated_at'] = datetime.utcnow()
        
        # Get ML predictions
        ml_predictions = predict_triage_assessment(data)
        data.update(ml_predictions)
        
        triages_collection = get_triages_collection()
        result = triages_collection.insert_one(data)
        data['_id'] = str(result.inserted_id)
        
        return jsonify(data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@triage_bp.route('/<triage_id>', methods=['GET'])
@jwt_required()
def get_triage(triage_id):
    """
    Get triage details.
    
    Args:
        triage_id (str): Triage record ID
        
    Returns:
        JSON: Triage details
    """
    try:
        hospital_id = get_hospital_from_jwt()
        triages_collection = get_triages_collection()
        
        triage = triages_collection.find_one({
            "hospital_id": hospital_id,
            "_id": ObjectId(triage_id)
        })
        
        if not triage:
            return jsonify({"error": "Triage not found"}), 404
        
        triage['_id'] = str(triage['_id'])
        return jsonify(triage), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@triage_bp.route('/<triage_id>', methods=['PUT'])
@jwt_required()
def update_triage(triage_id):
    """
    Update triage assessment.
    
    Args:
        triage_id (str): Triage record ID
        
    Returns:
        JSON: Updated triage data
    """
    try:
        hospital_id = get_hospital_from_jwt()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        
        triages_collection = get_triages_collection()
        
        # Remove fields that shouldn't be updated
        data.pop('hospital_id', None)
        data.pop('created_at', None)
        data.pop('nurse_id', None)
        data['updated_at'] = datetime.utcnow()
        
        result = triages_collection.update_one(
            {"hospital_id": hospital_id, "_id": ObjectId(triage_id)},
            {"$set": data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Triage not found"}), 404
        
        triage = triages_collection.find_one({
            "hospital_id": hospital_id,
            "_id": ObjectId(triage_id)
        })
        
        triage['_id'] = str(triage['_id'])
        return jsonify(triage), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@triage_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict_triage():
    """
    Get ML predictions for a set of symptoms and vitals (without creating record).
    
    Useful for preview before submitting.
    
    Returns:
        JSON: ML predictions
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        
        predictions = predict_triage_assessment(data)
        return jsonify(predictions), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
