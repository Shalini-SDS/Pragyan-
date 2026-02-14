"""
Hospital Routes Module

This module defines API endpoints for hospital management.

Endpoints:
    - GET /api/hospital: Get hospital info and statistics
    - GET /api/hospital/<hospital_id>: Get specific hospital info
    - PUT /api/hospital: Update hospital info
    - GET /api/hospital/stats/overview: Get hospital overview statistics
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from database.mongo import (
    get_hospitals_collection,
    get_patients_collection,
    get_doctors_collection,
    get_nurses_collection,
    get_triages_collection
)
from datetime import datetime, timedelta

hospital_bp = Blueprint('hospital', __name__)


def get_hospital_from_jwt():
    """Extract hospital_id from JWT claims."""
    claims = get_jwt()
    return claims.get('hospital_id')


@hospital_bp.route('', methods=['GET'])
@jwt_required()
def get_hospital_info():
    """
    Get current hospital information.
    
    Returns:
        JSON: Hospital details
    """
    try:
        hospital_id = get_hospital_from_jwt()
        hospitals_collection = get_hospitals_collection()
        
        hospital = hospitals_collection.find_one(
            {"hospital_id": hospital_id, "is_active": True},
            {"_id": 0}
        )
        
        if not hospital:
            return jsonify({"error": "Hospital not found"}), 404
        
        return jsonify(hospital), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@hospital_bp.route('/stats/overview', methods=['GET'])
@jwt_required()
def get_hospital_overview():
    """
    Get hospital overview statistics for dashboard.
    
    Returns:
        JSON: Hospital statistics and key metrics
    """
    try:
        hospital_id = get_hospital_from_jwt()
        
        # Get counts
        patients_count = get_patients_collection().count_documents({
            "hospital_id": hospital_id,
            "is_active": True
        })
        
        doctors_count = get_doctors_collection().count_documents({
            "hospital_id": hospital_id,
            "is_active": True
        })
        
        nurses_count = get_nurses_collection().count_documents({
            "hospital_id": hospital_id,
            "is_active": True
        })
        
        # Get today's triages
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_triages = get_triages_collection().count_documents({
            "hospital_id": hospital_id,
            "created_at": {"$gte": today}
        })
        
        # Get triages by priority for today
        triages_collection = get_triages_collection()
        priority_distribution = {
            "Low": triages_collection.count_documents({
                "hospital_id": hospital_id,
                "priority_level": "Low",
                "created_at": {"$gte": today}
            }),
            "Medium": triages_collection.count_documents({
                "hospital_id": hospital_id,
                "priority_level": "Medium",
                "created_at": {"$gte": today}
            }),
            "High": triages_collection.count_documents({
                "hospital_id": hospital_id,
                "priority_level": "High",
                "created_at": {"$gte": today}
            }),
            "Critical": triages_collection.count_documents({
                "hospital_id": hospital_id,
                "priority_level": "Critical",
                "created_at": {"$gte": today}
            })
        }
        
        # Get department distribution
        department_stats = {}
        doctors_by_dept = get_doctors_collection().aggregate([
            {"$match": {"hospital_id": hospital_id, "is_active": True}},
            {"$group": {"_id": "$department", "count": {"$sum": 1}}}
        ])
        
        for dept in doctors_by_dept:
            department_stats[dept['_id']] = dept['count']
        
        return jsonify({
            "hospital_id": hospital_id,
            "summary": {
                "total_patients": patients_count,
                "total_doctors": doctors_count,
                "total_nurses": nurses_count,
                "todays_triages": today_triages
            },
            "priority_distribution": priority_distribution,
            "department_distribution": department_stats,
            "timestamp": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@hospital_bp.route('/departments', methods=['GET'])
@jwt_required()
def get_departments():
    """
    Get list of all departments and their staff count.
    
    Returns:
        JSON: List of departments with statistics
    """
    try:
        hospital_id = get_hospital_from_jwt()
        
        # Get doctors by department
        doctors_collection = get_doctors_collection()
        dept_stats = list(doctors_collection.aggregate([
            {"$match": {"hospital_id": hospital_id, "is_active": True}},
            {"$group": {
                "_id": "$department",
                "doctors_count": {"$sum": 1}
            }}
        ]))
        
        # Get nurses by department
        nurses_collection = get_nurses_collection()
        nurses_by_dept = list(nurses_collection.aggregate([
            {"$match": {"hospital_id": hospital_id, "is_active": True}},
            {"$group": {
                "_id": "$department",
                "nurses_count": {"$sum": 1}
            }}
        ]))
        
        # Merge data
        departments = {}
        for dept in dept_stats:
            dept_name = dept['_id']
            departments[dept_name] = {
                "name": dept_name,
                "doctors_count": dept['doctors_count'],
                "nurses_count": 0
            }
        
        for dept in nurses_by_dept:
            dept_name = dept['_id']
            if dept_name not in departments:
                departments[dept_name] = {
                    "name": dept_name,
                    "doctors_count": 0,
                    "nurses_count": dept['nurses_count']
                }
            else:
                departments[dept_name]["nurses_count"] = dept['nurses_count']
        
        return jsonify({
            "departments": list(departments.values())
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
