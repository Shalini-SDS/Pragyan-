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
    get_patients_collection
)
from models.user_model import TriageSchema
from risk_engine.predictor import RiskPredictor
from datetime import datetime
from bson.objectid import ObjectId
from io import BytesIO
import json
import uuid

triage_bp = Blueprint('triage', __name__)
CONDITION_KEYWORDS = {
    "diabetes": ["diabetes", "diabetic", "dm"],
    "hypertension": ["hypertension", "high blood pressure", "htn"],
    "heart disease": ["heart disease", "cad", "coronary artery disease", "mi", "myocardial infarction"],
    "asthma": ["asthma"],
    "copd": ["copd", "chronic obstructive pulmonary disease"],
    "kidney disease": ["kidney disease", "ckd", "chronic kidney disease", "renal failure"],
    "cancer": ["cancer", "malignancy", "carcinoma"],
    "stroke": ["stroke", "cva", "cerebrovascular accident"],
}


def get_hospital_from_jwt():
    """Extract hospital_id from JWT claims."""
    claims = get_jwt()
    return claims.get('hospital_id')


def _coerce_list_field(raw_value):
    if raw_value is None:
        return []
    if isinstance(raw_value, list):
        return [str(item).strip() for item in raw_value if str(item).strip()]
    if isinstance(raw_value, str):
        text = raw_value.strip()
        if not text:
            return []
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except Exception:
            pass
        return [item.strip() for item in text.replace(";", ",").split(",") if item.strip()]
    return [str(raw_value).strip()]


def _extract_pdf_text(pdf_bytes):
    if not pdf_bytes:
        return ""
    try:
        try:
            from pypdf import PdfReader
        except Exception:
            from PyPDF2 import PdfReader  # type: ignore
        reader = PdfReader(BytesIO(pdf_bytes))
        chunks = []
        for page in reader.pages:
            page_text = page.extract_text() or ""
            if page_text:
                chunks.append(page_text)
        return "\n".join(chunks)
    except Exception:
        return ""


def _extract_conditions_from_text(text):
    lowered = (text or "").lower()
    if not lowered:
        return []
    matches = []
    for canonical, keywords in CONDITION_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            matches.append(canonical)
    return matches


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
        return predictor.predict_triage(triage_data)
    except Exception as e:
        return {
            "risk_level": "Medium",
            "priority_score": 50,
            "recommended_department": "General Medicine",
            "confidence": 0.5,
            "explainability": {
                "top_contributing_features": [],
                "reasoning": "Fallback assessment used due to prediction engine error."
            },
            "predicted_department": "General Medicine",
            "priority_level": "Medium",
            "risk_score": 50,
            "reasoning": ["Fallback assessment used due to prediction engine error"],
            "recommended_tests": [],
            "error": str(e)
        }


def ensure_patient_exists(hospital_id, triage_data):
    """Create a patient with generated ID if not present in triage input."""
    patients_collection = get_patients_collection()
    patient_id = triage_data.get('patient_id')

    if not patient_id:
        patient_id = f"PAT-{uuid.uuid4().hex[:8].upper()}"
        triage_data['patient_id'] = patient_id

    existing = patients_collection.find_one({"hospital_id": hospital_id, "patient_id": patient_id, "is_active": True})
    if existing:
        return patient_id

    patient_doc = {
        "hospital_id": hospital_id,
        "patient_id": patient_id,
        "name": triage_data.get("name", "Unknown Patient"),
        "age": int(triage_data.get("age") or 0),
        "gender": triage_data.get("gender", "Other"),
        "contact_number": triage_data.get("contact_number", "N/A"),
        "guardian_name": triage_data.get("guardian_name"),
        "guardian_contact": triage_data.get("guardian_contact"),
        "medical_history": triage_data.get("previous_conditions", []),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    patients_collection.insert_one(patient_doc)
    return patient_id


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
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            upload = request.files.get('ehr_pdf')
            if upload and upload.filename:
                filename = upload.filename
                if not filename.lower().endswith('.pdf'):
                    return jsonify({"error": "EHR upload must be a PDF file"}), 400

                pdf_bytes = upload.read()
                data['ehr_filename'] = filename
                data['ehr_content_type'] = upload.content_type or 'application/pdf'
                data['ehr_size_bytes'] = len(pdf_bytes)

                extracted_conditions = _extract_conditions_from_text(_extract_pdf_text(pdf_bytes))
                if extracted_conditions:
                    data['ehr_extracted_conditions'] = extracted_conditions
            else:
                data['ehr_extracted_conditions'] = []
        else:
            data = request.get_json()
        
        if not data:
            return jsonify({"error": "Missing request body"}), 400

        # Normalize list fields for both JSON and multipart payloads.
        data['symptoms'] = _coerce_list_field(data.get('symptoms'))
        data['previous_conditions'] = _coerce_list_field(data.get('previous_conditions'))
        data['current_medications'] = _coerce_list_field(data.get('current_medications'))
        ehr_conditions = _coerce_list_field(data.get('ehr_extracted_conditions'))
        if ehr_conditions:
            combined = data['previous_conditions'] + ehr_conditions
            deduped = []
            seen = set()
            for item in combined:
                key = item.strip().lower()
                if not key or key in seen:
                    continue
                seen.add(key)
                deduped.append(item)
            data['previous_conditions'] = deduped
            data['ehr_extracted_conditions'] = ehr_conditions

        # Ensure patient exists / generate patient_id if omitted.
        patient_id = ensure_patient_exists(hospital_id, data)
        data['patient_id'] = patient_id

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
