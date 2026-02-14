"""
Socket.IO Integration Examples

This file demonstrates how to integrate Socket.IO into your API routes
and services for real-time alerts and notifications.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import socketio
from socket_service import (
    emit_patient_alert,
    emit_risk_update,
    emit_triage_update,
    emit_hospital_alert,
    emit_availability_update,
    emit_bed_status_update
)

# Example: Patient Risk Prediction with Socket.IO
def example_risk_prediction():
    """
    Example of emitting real-time risk alerts
    """
    patient_id = "patient_123"
    risk_score = 0.92
    risk_level = "critical"
    
    # Emit alert to specific patient room
    emit_patient_alert(
        socketio=socketio,
        patient_id=patient_id,
        alert_type=risk_level,
        alert_data={
            'message': f'Patient at {risk_level} risk',
            'risk_score': risk_score,
            'timestamp': '2024-01-15T10:30:00Z',
            'recommendations': [
                'Immediate physician consultation required',
                'Consider transfer to ICU',
                'Monitor vitals every 15 minutes'
            ]
        }
    )
    
    # Also emit detailed risk update
    emit_risk_update(
        socketio=socketio,
        patient_id=patient_id,
        risk_score=risk_score,
        risk_level=risk_level,
        explanation={
            'top_features': [
                {'feature': 'heart_rate', 'impact': 0.35},
                {'feature': 'oxygen_saturation', 'impact': 0.28},
                {'feature': 'blood_pressure', 'impact': 0.22}
            ],
            'shap_values': [0.35, 0.28, 0.22]
        }
    )


# Example: Triage Queue Updates with Socket.IO
def example_triage_update():
    """
    Example of updating triage status in real-time
    """
    triage_id = "triage_001"
    patient_id = "patient_456"
    hospital_id = "hosp_789"
    
    # Notify all users monitoring this triage
    emit_triage_update(
        socketio=socketio,
        triage_id=triage_id,
        status='assigned',
        patient_id=patient_id
    )
    
    # Also notify hospital about new assignment
    emit_hospital_alert(
        socketio=socketio,
        hospital_id=hospital_id,
        alert_type='info',
        alert_data={
            'message': f'Triage {triage_id} assigned to bed 101',
            'patient_id': patient_id,
            'bed_number': '101'
        }
    )


# Example: Doctor/Nurse Availability with Socket.IO
def example_availability_change():
    """
    Example of notifying about staff availability changes
    """
    hospital_id = "hosp_789"
    doctor_id = "doc_001"
    
    # Doctor becomes available
    emit_availability_update(
        socketio=socketio,
        hospital_id=hospital_id,
        staff_id=doctor_id,
        staff_type='doctor',
        available=True
    )
    
    # Notify hospital about available doctors for assignment
    emit_hospital_alert(
        socketio=socketio,
        hospital_id=hospital_id,
        alert_type='info',
        alert_data={
            'message': f'Doctor {doctor_id} is now available',
            'staff_type': 'doctor',
            'staff_id': doctor_id,
            'available_count': 5
        }
    )


# Example: Bed Status Updates with Socket.IO
def example_bed_update():
    """
    Example of updating bed availability
    """
    hospital_id = "hosp_789"
    
    # Update bed status
    emit_bed_status_update(
        socketio=socketio,
        hospital_id=hospital_id,
        bed_info={
            'bed_id': 'bed_101',
            'status': 'occupied',
            'patient_id': 'patient_123',
            'ward': 'ICU',
            'floor': '3',
            'assigned_doctor': 'doc_001'
        }
    )
    
    # Notify hospital about bed capacity
    emit_hospital_alert(
        socketio=socketio,
        hospital_id=hospital_id,
        alert_type='capacity',
        alert_data={
            'message': 'ICU bed capacity at 85%',
            'ward': 'ICU',
            'total_beds': 20,
            'occupied_beds': 17,
            'available_beds': 3
        }
    )


# Integration Example: In Risk Prediction API Route
def integrate_socket_in_risk_prediction_route():
    """
    Shows how to integrate Socket.IO in the risk prediction endpoint
    
    Add this to your api/risk_routes.py:
    """
    example_code = '''
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from extensions import socketio
from socket_service import emit_patient_alert, emit_risk_update

risk_bp = Blueprint('risk', __name__, url_prefix='/api/risk')

@risk_bp.route('/predict', methods=['POST'])
@jwt_required()
def predict_risk():
    """Risk prediction with real-time alerts"""
    data = request.get_json()
    patient_id = data.get('patient_id')
    
    # Perform risk prediction
    # ... your model prediction code ...
    
    predicted_risk_score = 0.87  # Example
    risk_level = 'high'
    
    # Emit real-time alert
    if predicted_risk_score > 0.8:
        emit_patient_alert(
            socketio=socketio,
            patient_id=patient_id,
            alert_type='critical' if predicted_risk_score > 0.9 else 'warning',
            alert_data={
                'message': f'High risk detected: {risk_level}',
                'risk_score': predicted_risk_score
            }
        )
        
        # Emit detailed risk update with SHAP explanation
        emit_risk_update(
            socketio=socketio,
            patient_id=patient_id,
            risk_score=predicted_risk_score,
            risk_level=risk_level,
            explanation={
                # Include SHAP values and feature importance
                'top_features': [...]
            }
        )
    
    return jsonify({
        'patient_id': patient_id,
        'risk_score': predicted_risk_score,
        'risk_level': risk_level
    })
'''
    print(example_code)


# Integration Example: In Celery Task
def integrate_socket_in_celery_task():
    """
    Shows how to integrate Socket.IO in Celery tasks
    
    Add this to your tasks/risk_tasks.py:
    """
    example_code = '''
from celery import shared_task
from extensions import socketio
from socket_service import emit_risk_update
from services.risk_service import predict_risk

@shared_task
def predict_patient_risk_async(patient_id):
    """Async risk prediction task"""
    
    # Run prediction
    result = predict_risk(patient_id)
    
    # Emit real-time update
    emit_risk_update(
        socketio=socketio,
        patient_id=patient_id,
        risk_score=result['score'],
        risk_level=result['level'],
        explanation=result['explanation']
    )
    
    return result

# You can also emit updates within the task
@shared_task
def monitor_patient_health(patient_id, hospital_id):
    """Background health monitoring task"""
    
    while True:
        # Get latest vitals
        vitals = get_patient_vitals(patient_id)
        
        # Check thresholds
        if vitals['heart_rate'] > 120:
            emit_patient_alert(
                socketio=socketio,
                patient_id=patient_id,
                alert_type='warning',
                alert_data={
                    'message': 'Elevated heart rate detected',
                    'heart_rate': vitals['heart_rate']
                }
            )
        
        # Sleep and continue
        time.sleep(30)
'''
    print(example_code)


# Integration Example: In Doctor/Nurse Status Changes
def integrate_socket_in_status_changes():
    """
    Shows how to integrate Socket.IO when staff status changes
    """
    example_code = '''
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import socketio
from socket_service import emit_availability_update

staff_bp = Blueprint('staff', __name__, url_prefix='/api/staff')

@staff_bp.route('/availability', methods=['PUT'])
@jwt_required()
def update_availability():
    """Update staff availability status"""
    user_id = get_jwt_identity()
    data = request.get_json()
    available = data.get('available', True)
    hospital_id = data.get('hospital_id')
    
    # Update in database
    #staff = Staff.find_by_id(user_id)
    #staff.available = available
    #staff.save()
    
    # Get staff type
    #staff_type = 'doctor' if staff.role == 'doctor' else 'nurse'
    
    # Emit availability update
    emit_availability_update(
        socketio=socketio,
        hospital_id=hospital_id,
        staff_id=user_id,
        staff_type='doctor',  # staff_type
        available=available
    )
    
    return jsonify({
        'status': 'updated',
        'available': available
    })
'''
    print(example_code)


# Example Usage
if __name__ == '__main__':
    print("=" * 60)
    print("Socket.IO Integration Examples")
    print("=" * 60)
    
    print("\n1. Risk Prediction Alert:")
    example_risk_prediction()
    
    print("\n2. Triage Update:")
    example_triage_update()
    
    print("\n3. Availability Change:")
    example_availability_change()
    
    print("\n4. Bed Status Update:")
    example_bed_update()
