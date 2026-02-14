"""
Socket.IO Service Module

Handles real-time communication for:
- Emergency alerts
- Patient risk level changes
- Triage updates
- Doctor/Nurse availability status
- Hospital bed availability
"""

from flask_socketio import emit, join_room, leave_room, rooms
from flask import request, session
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Track active connections
active_connections = {}
room_users = {}


def register_socket_events(socketio):
    """
    Register all Socket.IO events.
    
    Args:
        socketio: Flask-SocketIO instance
    """
    
    @socketio.on('connect')
    def handle_connect():
        """Handle client connection"""
        sid = request.sid
        user_id = request.args.get('user_id')
        user_role = request.args.get('user_role')
        
        active_connections[sid] = {
            'user_id': user_id,
            'user_role': user_role,
            'connected_at': datetime.utcnow().isoformat()
        }
        
        logger.info(f"User {user_id} ({user_role}) connected: {sid}")
        emit('connection_response', {
            'status': 'connected',
            'sid': sid,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection"""
        sid = request.sid
        if sid in active_connections:
            user_info = active_connections.pop(sid)
            logger.info(f"User {user_info['user_id']} disconnected: {sid}")
        
        # Clean up room assignments
        for room_name, users_in_room in list(room_users.items()):
            if sid in users_in_room:
                users_in_room.remove(sid)
    
    
    @socketio.on('join_room')
    def on_join_room(data):
        """Join a real-time update room (hospital, patient, doctor)"""
        room = data.get('room')
        sid = request.sid
        
        if sid in active_connections:
            join_room(room)
            
            if room not in room_users:
                room_users[room] = []
            room_users[room].append(sid)
            
            logger.info(f"User {active_connections[sid]['user_id']} joined room {room}")
            emit('room_joined', {
                'room': room,
                'status': 'joined',
                'timestamp': datetime.utcnow().isoformat()
            }, to=sid)
    
    
    @socketio.on('leave_room')
    def on_leave_room(data):
        """Leave a real-time update room"""
        room = data.get('room')
        sid = request.sid
        
        leave_room(room)
        
        if room in room_users and sid in room_users[room]:
            room_users[room].remove(sid)
        
        logger.info(f"User {active_connections[sid]['user_id']} left room {room}")
        emit('room_left', {
            'room': room,
            'status': 'left',
            'timestamp': datetime.utcnow().isoformat()
        }, to=sid)
    
    
    return socketio


def emit_patient_alert(socketio, patient_id, alert_type, alert_data):
    """
    Emit patient alert to subscribed clients.
    
    Args:
        socketio: Flask-SocketIO instance
        patient_id: Patient ID for room targeting
        alert_type: Type of alert ('critical', 'warning', 'info')
        alert_data: Alert payload
    """
    room = f'patient_{patient_id}'
    payload = {
        'alert_type': alert_type,
        'patient_id': patient_id,
        'timestamp': datetime.utcnow().isoformat(),
        **alert_data
    }
    
    socketio.emit('patient_alert', payload, to=room)
    logger.info(f"Alert emitted for patient {patient_id}: {alert_type}")


def emit_risk_update(socketio, patient_id, risk_score, risk_level, explanation):
    """
    Emit risk score update to subscribed clients.
    
    Args:
        socketio: Flask-SocketIO instance
        patient_id: Patient ID
        risk_score: Risk probability (0-1)
        risk_level: Risk category ('low', 'medium', 'high', 'critical')
        explanation: SHAP explanation
    """
    room = f'patient_{patient_id}'
    payload = {
        'event_type': 'risk_update',
        'patient_id': patient_id,
        'risk_score': risk_score,
        'risk_level': risk_level,
        'explanation': explanation,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    socketio.emit('risk_updated', payload, to=room)
    logger.info(f"Risk update for patient {patient_id}: {risk_level}")


def emit_hospital_alert(socketio, hospital_id, alert_type, alert_data):
    """
    Emit hospital-wide alert.
    
    Args:
        socketio: Flask-SocketIO instance
        hospital_id: Hospital ID
        alert_type: Type of alert ('emergency', 'capacity', 'system')
        alert_data: Alert payload
    """
    room = f'hospital_{hospital_id}'
    payload = {
        'alert_type': alert_type,
        'hospital_id': hospital_id,
        'timestamp': datetime.utcnow().isoformat(),
        **alert_data
    }
    
    socketio.emit('hospital_alert', payload, to=room)
    logger.info(f"Hospital alert emitted for {hospital_id}: {alert_type}")


def emit_triage_update(socketio, triage_id, status, patient_id):
    """
    Emit triage status update.
    
    Args:
        socketio: Flask-SocketIO instance
        triage_id: Triage ID
        status: Triage status ('pending', 'triaged', 'assigned')
        patient_id: Associated patient ID
    """
    rooms_to_emit = [
        f'triage_{triage_id}',
        f'patient_{patient_id}',
        'triage_queue'
    ]
    
    payload = {
        'event_type': 'triage_update',
        'triage_id': triage_id,
        'patient_id': patient_id,
        'status': status,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    for room in rooms_to_emit:
        socketio.emit('triage_updated', payload, to=room)
    
    logger.info(f"Triage update: {triage_id} -> {status}")


def emit_availability_update(socketio, hospital_id, staff_id, staff_type, available):
    """
    Emit doctor/nurse availability update.
    
    Args:
        socketio: Flask-SocketIO instance
        hospital_id: Hospital ID
        staff_id: Staff member ID
        staff_type: 'doctor' or 'nurse'
        available: Boolean availability status
    """
    room = f'hospital_{hospital_id}'
    payload = {
        'event_type': 'availability_update',
        'hospital_id': hospital_id,
        'staff_id': staff_id,
        'staff_type': staff_type,
        'available': available,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    socketio.emit('staff_availability_changed', payload, to=room)
    logger.info(f"Availability update: {staff_type} {staff_id} -> {available}")


def emit_bed_status_update(socketio, hospital_id, bed_info):
    """
    Emit hospital bed availability update.
    
    Args:
        socketio: Flask-SocketIO instance
        hospital_id: Hospital ID
        bed_info: Bed information dict
    """
    room = f'hospital_{hospital_id}'
    payload = {
        'event_type': 'bed_status_update',
        'hospital_id': hospital_id,
        'bed_info': bed_info,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    socketio.emit('bed_status_changed', payload, to=room)
    logger.info(f"Bed status update for hospital {hospital_id}")


def get_active_users_count():
    """Get count of active connections"""
    return len(active_connections)


def get_room_users(room):
    """Get list of users in a specific room"""
    return room_users.get(room, [])
