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
import os
import re
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
SYMPTOM_KEYWORDS = {
    "chest pain": ["chest pain", "angina", "chest tightness", "chest discomfort"],
    "difficulty breathing": ["difficulty breathing", "shortness of breath", "dyspnea", "breathless", "wheezing"],
    "severe headache": ["severe headache", "migraine", "head pain", "thunderclap headache"],
    "abdominal pain": ["abdominal pain", "stomach pain", "belly pain", "epigastric pain"],
    "fever": ["fever", "febrile", "high temperature", "chills"],
    "nausea": ["nausea", "vomiting", "queasy", "emesis"],
    "dizziness": ["dizziness", "vertigo", "lightheaded"],
    "confusion": ["confusion", "disorientation", "altered mental status"],
    "loss of consciousness": ["loss of consciousness", "unconscious", "syncope", "passed out", "blackout"],
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
        return "", "none"
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
        extracted = "\n".join(chunks).strip()
        if extracted:
            return extracted, "text"
    except Exception:
        pass

    # OCR fallback for scanned/image-only PDFs.
    try:
        import pypdfium2 as pdfium  # type: ignore
        import pytesseract  # type: ignore

        # Raises if Tesseract executable is not available in PATH.
        pytesseract.get_tesseract_version()

        ocr_pages = max(1, int(os.environ.get('EHR_OCR_MAX_PAGES', '5')))
        render_scale = max(1.0, float(os.environ.get('EHR_OCR_RENDER_SCALE', '2.0')))
        document = pdfium.PdfDocument(pdf_bytes)
        total_pages = len(document)
        page_limit = min(total_pages, ocr_pages)
        text_chunks = []

        for page_index in range(page_limit):
            page = document[page_index]
            bitmap = page.render(scale=render_scale)
            pil_image = bitmap.to_pil()
            page_text = pytesseract.image_to_string(pil_image) or ""
            if page_text.strip():
                text_chunks.append(page_text)

        ocr_text = "\n".join(text_chunks).strip()
        if ocr_text:
            return ocr_text, "ocr"
        return "", "none"
    except ImportError:
        return "", "ocr_dependencies_missing"
    except Exception:
        return "", "ocr_failed"


def _extract_conditions_from_text(text):
    lowered = (text or "").lower()
    if not lowered:
        return []
    matches = []
    for canonical, keywords in CONDITION_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            matches.append(canonical)
    return matches


def _extract_symptoms_from_text(text):
    lowered = (text or "").lower()
    if not lowered:
        return []
    matches = []
    for canonical, keywords in SYMPTOM_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            matches.append(canonical)
    return matches


def _extract_vitals_from_text(text):
    lowered = (text or "").lower()
    if not lowered:
        return {}
    vitals = {}

    bp_match = re.search(r'(?:bp|blood pressure)\s*[:\-]?\s*(\d{2,3})\s*/\s*(\d{2,3})', lowered)
    if bp_match:
        vitals['blood_pressure'] = f"{bp_match.group(1)}/{bp_match.group(2)}"

    hr_match = re.search(r'(?:heart rate|hr|pulse)\s*[:\-]?\s*(\d{2,3})', lowered)
    if hr_match:
        vitals['heart_rate'] = int(hr_match.group(1))

    temp_match = re.search(r'(?:temp|temperature)\s*[:\-]?\s*([0-9]{2,3}(?:\.[0-9])?)\s*([fc])?', lowered)
    if temp_match:
        temp_val = float(temp_match.group(1))
        unit = temp_match.group(2)
        # Keep Fahrenheit values as-is; downstream preprocessing converts >45 to Celsius.
        if unit == 'c' and temp_val < 45:
            vitals['temperature'] = temp_val
        else:
            vitals['temperature'] = temp_val

    spo2_match = re.search(r'(?:spo2|oxygen saturation|o2 sat)\s*[:\-]?\s*(\d{2,3})\s*%?', lowered)
    if spo2_match:
        vitals['oxygen_saturation'] = int(spo2_match.group(1))

    rr_match = re.search(r'(?:respiratory rate|rr)\s*[:\-]?\s*(\d{1,2})', lowered)
    if rr_match:
        vitals['respiratory_rate'] = int(rr_match.group(1))

    return vitals


def _dedupe_preserve(items):
    seen = set()
    result = []
    for item in items:
        value = str(item or '').strip()
        key = value.lower()
        if not value or key in seen:
            continue
        seen.add(key)
        result.append(value)
    return result


def _coerce_int(value, default=0):
    if value is None:
        return default
    try:
        if isinstance(value, str) and not value.strip():
            return default
        return int(float(value))
    except Exception:
        return default


def _coerce_float(value, default=0.0):
    if value is None:
        return default
    try:
        if isinstance(value, str) and not value.strip():
            return default
        return float(value)
    except Exception:
        return default


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
        # If triage provided a blood_group, update patient record
        try:
            bg = triage_data.get('blood_group') or triage_data.get('blood_type') or triage_data.get('blood_group')
            if bg:
                patients_collection.update_one(
                    {"hospital_id": hospital_id, "patient_id": patient_id},
                    {"$set": {"blood_group": bg, "updated_at": datetime.utcnow()}}
                )
        except Exception:
            pass
        return patient_id

    patient_doc = {
        "hospital_id": hospital_id,
        "patient_id": patient_id,
        "name": triage_data.get("name", "Unknown Patient"),
        "age": int(triage_data.get("age") or 0),
        "gender": triage_data.get("gender", "Other"),
        "blood_group": triage_data.get('blood_group') or triage_data.get('blood_type') or None,
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
                extracted_text, extraction_mode = _extract_pdf_text(pdf_bytes)
                extracted_conditions = _extract_conditions_from_text(extracted_text)
                extracted_symptoms = _extract_symptoms_from_text(extracted_text)
                extracted_vitals = _extract_vitals_from_text(extracted_text)
                data['ehr_extracted_conditions'] = extracted_conditions
                data['ehr_extracted_symptoms'] = extracted_symptoms
                data['ehr_extracted_vitals'] = extracted_vitals
                if not extracted_text.strip():
                    if extraction_mode == 'ocr_dependencies_missing':
                        data['ehr_processing_note'] = 'No readable PDF text. OCR fallback unavailable; install pytesseract, pypdfium2, Pillow, and Tesseract OCR.'
                    elif extraction_mode == 'ocr_failed':
                        data['ehr_processing_note'] = 'No readable PDF text. OCR fallback failed during processing.'
                    else:
                        data['ehr_processing_note'] = 'No readable text found in PDF (possibly scanned/image-only document).'
                elif extraction_mode == 'ocr':
                    data['ehr_processing_note'] = 'EHR processed using OCR fallback.'
            else:
                data['ehr_extracted_conditions'] = []
                data['ehr_extracted_symptoms'] = []
                data['ehr_extracted_vitals'] = {}
        else:
            data = request.get_json()
        
        if not data:
            return jsonify({"error": "Missing request body"}), 400

        # Normalize list fields for both JSON and multipart payloads.
        data['symptoms'] = _coerce_list_field(data.get('symptoms'))
        data['previous_conditions'] = _coerce_list_field(data.get('previous_conditions'))
        data['current_medications'] = _coerce_list_field(data.get('current_medications'))
        ehr_conditions = _coerce_list_field(data.get('ehr_extracted_conditions'))
        ehr_symptoms = _coerce_list_field(data.get('ehr_extracted_symptoms'))
        data['severity'] = _coerce_int(data.get('severity'), 5)
        data['age'] = _coerce_int(data.get('age'), 0)
        data['heart_rate'] = _coerce_int(data.get('heart_rate'), 0)
        data['respiratory_rate'] = _coerce_int(data.get('respiratory_rate'), 16)
        data['oxygen_saturation'] = _coerce_int(data.get('oxygen_saturation'), 98)
        data['temperature'] = _coerce_float(data.get('temperature'), 37.0)

        if ehr_symptoms:
            data['symptoms'] = _dedupe_preserve(data['symptoms'] + ehr_symptoms)
        if ehr_conditions:
            data['previous_conditions'] = _dedupe_preserve(data['previous_conditions'] + ehr_conditions)
            data['ehr_extracted_conditions'] = ehr_conditions

        ehr_vitals = data.get('ehr_extracted_vitals') if isinstance(data.get('ehr_extracted_vitals'), dict) else {}
        if ehr_vitals:
            if (not data.get('blood_pressure') or str(data.get('blood_pressure')).strip() in {'', '120/80'}) and ehr_vitals.get('blood_pressure'):
                data['blood_pressure'] = str(ehr_vitals['blood_pressure'])
            if _coerce_int(data.get('heart_rate'), 0) in (0, 72) and ehr_vitals.get('heart_rate') is not None:
                data['heart_rate'] = _coerce_int(ehr_vitals.get('heart_rate'), data['heart_rate'])
            if round(_coerce_float(data.get('temperature'), 37.0), 1) in (37.0, 98.6) and ehr_vitals.get('temperature') is not None:
                data['temperature'] = _coerce_float(ehr_vitals.get('temperature'), data['temperature'])
            if _coerce_int(data.get('respiratory_rate'), 16) == 16 and ehr_vitals.get('respiratory_rate') is not None:
                data['respiratory_rate'] = _coerce_int(ehr_vitals.get('respiratory_rate'), data['respiratory_rate'])
            if _coerce_int(data.get('oxygen_saturation'), 98) == 98 and ehr_vitals.get('oxygen_saturation') is not None:
                data['oxygen_saturation'] = _coerce_int(ehr_vitals.get('oxygen_saturation'), data['oxygen_saturation'])

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
        patients_collection = get_patients_collection()

        # Check for an existing latest triage for this patient
        existing_triage = triages_collection.find_one(
            {"hospital_id": hospital_id, "patient_id": patient_id},
            sort=[("created_at", -1)]
        )

        if existing_triage:
            # Save a copy of the existing triage into the patient's triage history
            try:
                copy_to_archive = dict(existing_triage)
                copy_to_archive['_id'] = str(copy_to_archive.get('_id'))
                patients_collection.update_one(
                    {"hospital_id": hospital_id, "patient_id": patient_id},
                    {"$push": {"triage_history": {"triage": copy_to_archive, "archived_at": datetime.utcnow()}}}
                )
            except Exception:
                # If archiving fails, continue but log server-side
                pass

            # Update the existing triage document instead of inserting a duplicate
            update_payload = dict(data)
            update_payload.pop('hospital_id', None)
            update_payload.pop('created_at', None)
            update_payload['updated_at'] = datetime.utcnow()
            triages_collection.update_one(
                {"_id": existing_triage['_id']},
                {"$set": update_payload}
            )

            # Return the updated triage
            updated = triages_collection.find_one({"_id": existing_triage['_id']})
            updated['_id'] = str(updated['_id'])
            return jsonify(updated), 200

        # No existing triage -- insert a new record
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
