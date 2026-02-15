"""
Appointment Routes Module

Patient can request appointments.
Doctor can view and update appointment request status.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from datetime import datetime
from bson.objectid import ObjectId
from database.mongo import (
    get_appointments_collection,
    get_patients_collection,
    get_doctors_collection,
    get_triages_collection,
    get_users_collection,
)

appointment_bp = Blueprint('appointment', __name__)


def _hospital_id():
    return get_jwt().get("hospital_id")


def _role():
    return get_jwt().get("role")


def _doctor_staff_id():
    claims = get_jwt()
    if claims.get("staff_id"):
        return claims.get("staff_id")
    identity = get_jwt_identity()
    try:
        user = get_users_collection().find_one({"_id": ObjectId(identity)})
        if user:
            return user.get("staff_id")
    except Exception:
        return None
    return None


@appointment_bp.route('/request', methods=['POST'])
@jwt_required()
def request_appointment():
    if _role() != "patient":
        return jsonify({"error": "Only patients can request appointments"}), 403

    data = request.get_json() or {}
    doctor_staff_id = data.get("doctor_staff_id")
    preferred_datetime = data.get("preferred_datetime")
    reason = data.get("reason")

    if not doctor_staff_id:
        return jsonify({"error": "doctor_staff_id is required"}), 400

    hospital_id = _hospital_id()
    patient_id = get_jwt().get("patient_id")

    doctors = get_doctors_collection()
    doctor = doctors.find_one({
        "hospital_id": hospital_id,
        "staff_id": doctor_staff_id,
        "is_active": True
    })
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    appointments = get_appointments_collection()
    now = datetime.utcnow()
    appointment = {
        "hospital_id": hospital_id,
        "patient_id": patient_id,
        "doctor_staff_id": doctor_staff_id,
        "doctor_name": doctor.get("name"),
        "department": doctor.get("department"),
        "preferred_datetime": preferred_datetime,
        "reason": reason,
        "status": "pending",
        "created_at": now,
        "updated_at": now,
    }
    res = appointments.insert_one(appointment)
    appointment["_id"] = str(res.inserted_id)
    return jsonify(appointment), 201


@appointment_bp.route('', methods=['GET'])
@jwt_required()
def list_appointments():
    hospital_id = _hospital_id()
    role = _role()
    appointments = get_appointments_collection()

    query = {"hospital_id": hospital_id}
    if role == "patient":
        query["patient_id"] = get_jwt().get("patient_id")
    elif role == "doctor":
        doctor_staff_id = _doctor_staff_id()
        if not doctor_staff_id:
            return jsonify({"error": "Unable to determine doctor staff_id"}), 400
        query["doctor_staff_id"] = doctor_staff_id
    elif role not in {"nurse", "admin", "staff"}:
        return jsonify({"error": "Unauthorized role"}), 403

    status = request.args.get("status")
    if status:
        query["status"] = status

    docs = list(appointments.find(query).sort("created_at", -1))
    patients = get_patients_collection()
    triages = get_triages_collection()

    for doc in docs:
        doc["_id"] = str(doc["_id"])
        patient = patients.find_one(
            {"hospital_id": hospital_id, "patient_id": doc.get("patient_id")},
            {"_id": 0, "patient_id": 1, "name": 1, "age": 1, "gender": 1, "contact_number": 1}
        )
        latest_triage = triages.find_one(
            {"hospital_id": hospital_id, "patient_id": doc.get("patient_id")},
            sort=[("created_at", -1)]
        )
        if latest_triage and latest_triage.get("_id"):
            latest_triage["_id"] = str(latest_triage["_id"])
        doc["patient_profile"] = patient
        doc["latest_triage"] = latest_triage

    return jsonify({"appointments": docs}), 200


@appointment_bp.route('/<appointment_id>/status', methods=['PUT'])
@jwt_required()
def update_appointment_status(appointment_id):
    if _role() != "doctor":
        return jsonify({"error": "Only doctors can update appointment status"}), 403

    data = request.get_json() or {}
    status = data.get("status")
    if status not in {"approved", "confirmed", "rejected"}:
        return jsonify({"error": "status must be one of approved, confirmed, rejected"}), 400

    hospital_id = _hospital_id()
    doctor_staff_id = _doctor_staff_id()
    if not doctor_staff_id:
        return jsonify({"error": "Unable to determine doctor staff_id"}), 400

    appointments = get_appointments_collection()
    update = {
        "status": status,
        "doctor_note": data.get("doctor_note"),
        "updated_at": datetime.utcnow(),
    }

    result = appointments.update_one(
        {"_id": ObjectId(appointment_id), "hospital_id": hospital_id, "doctor_staff_id": doctor_staff_id},
        {"$set": update}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Appointment not found"}), 404

    appt = appointments.find_one({"_id": ObjectId(appointment_id)})
    appt["_id"] = str(appt["_id"])
    return jsonify(appt), 200
