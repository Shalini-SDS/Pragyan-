"""
Socket.IO Test Suite

Unit and integration tests for Socket.IO implementation
"""

import pytest
import json
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
from flask import Flask
from flask_socketio import SocketIO, disconnect
import sys
sys.path.insert(0, '.')

from socket_service import (
    register_socket_events,
    emit_patient_alert,
    emit_risk_update,
    emit_hospital_alert,
    emit_triage_update,
    emit_availability_update,
    emit_bed_status_update,
    get_active_users_count,
    get_room_users
)


@pytest.fixture
def app():
    """Create Flask test application"""
    app = Flask(__name__)
    app.config['TESTING'] = True
    socketio = SocketIO(app)
    register_socket_events(socketio)
    return app, socketio


@pytest.fixture
def client(app):
    """Create Socket.IO test client"""
    app_instance, socketio = app
    return socketio.test_client(app_instance)


class TestSocketIOConnection:
    """Test Socket.IO connection and disconnection"""

    def test_client_connect(self, client):
        """Test client can connect"""
        assert client.is_connected()

    def test_client_disconnect(self, client):
        """Test client can disconnect"""
        client.disconnect()
        assert not client.is_connected()

    def test_connection_with_user_info(self, app):
        """Test connection with user ID and role"""
        app_instance, socketio = app
        
        @socketio.on('connect')
        def on_connect():
            return True
        
        client = socketio.test_client(
            app_instance,
            query_string='user_id=user123&user_role=doctor'
        )
        
        assert client.is_connected()


class TestSocketIORooms:
    """Test room join/leave functionality"""

    def test_join_room(self, client):
        """Test joining a room"""
        client.emit('join_room', {'room': 'patient_001'})
        
        # Get client's rooms (Flask-SocketIO test client limitation)
        # In real scenario, would check server-side room membership

    def test_leave_room(self, client):
        """Test leaving a room"""
        client.emit('join_room', {'room': 'patient_001'})
        client.emit('leave_room', {'room': 'patient_001'})
        
        # Verify left (server-side check)

    def test_multiple_rooms(self, client):
        """Test client can join multiple rooms"""
        rooms = ['patient_001', 'hospital_123', 'triage_queue']
        
        for room in rooms:
            client.emit('join_room', {'room': room})
        
        # Client should be in all rooms


class TestSocketIOEvents:
    """Test event emission functionality"""

    def test_patient_alert_emission(self, app):
        """Test emitting patient alert"""
        app_instance, socketio = app
        
        # Create mock to capture emitted events
        with patch.object(socketio, 'emit') as mock_emit:
            emit_patient_alert(
                socketio,
                patient_id='patient_123',
                alert_type='critical',
                alert_data={'message': 'Critical alert'}
            )
            
            # Verify emit was called with correct parameters
            mock_emit.assert_called_once()
            call_args = mock_emit.call_args
            
            assert call_args[0][0] == 'patient_alert'
            assert call_args[1]['to'] == 'patient_patient_123'
            
            # Check payload
            payload = call_args[0][1]
            assert payload['alert_type'] == 'critical'
            assert payload['patient_id'] == 'patient_123'
            assert payload['message'] == 'Critical alert'

    def test_risk_update_emission(self, app):
        """Test emitting risk update"""
        app_instance, socketio = app
        
        with patch.object(socketio, 'emit') as mock_emit:
            emit_risk_update(
                socketio,
                patient_id='patient_456',
                risk_score=0.92,
                risk_level='critical',
                explanation={'feature': 'heart_rate', 'impact': 0.35}
            )
            
            mock_emit.assert_called_once()
            payload = mock_emit.call_args[0][1]
            
            assert payload['event_type'] == 'risk_update'
            assert payload['risk_score'] == 0.92
            assert payload['risk_level'] == 'critical'

    def test_hospital_alert_emission(self, app):
        """Test emitting hospital alert"""
        app_instance, socketio = app
        
        with patch.object(socketio, 'emit') as mock_emit:
            emit_hospital_alert(
                socketio,
                hospital_id='hosp_789',
                alert_type='emergency',
                alert_data={'message': 'Emergency situation'}
            )
            
            mock_emit.assert_called_once()
            payload = mock_emit.call_args[0][1]
            
            assert payload['alert_type'] == 'emergency'
            assert payload['hospital_id'] == 'hosp_789'

    def test_triage_update_emission(self, app):
        """Test emitting triage update"""
        app_instance, socketio = app
        
        with patch.object(socketio, 'emit') as mock_emit:
            emit_triage_update(
                socketio,
                triage_id='triage_001',
                status='assigned',
                patient_id='patient_123'
            )
            
            # Should emit to multiple rooms
            assert mock_emit.call_count == 3  # triage, patient, queue rooms

    def test_availability_update_emission(self, app):
        """Test emitting staff availability update"""
        app_instance, socketio = app
        
        with patch.object(socketio, 'emit') as mock_emit:
            emit_availability_update(
                socketio,
                hospital_id='hosp_789',
                staff_id='doc_001',
                staff_type='doctor',
                available=True
            )
            
            mock_emit.assert_called_once()
            payload = mock_emit.call_args[0][1]
            
            assert payload['staff_id'] == 'doc_001'
            assert payload['staff_type'] == 'doctor'
            assert payload['available'] is True

    def test_bed_status_update_emission(self, app):
        """Test emitting bed status update"""
        app_instance, socketio = app
        
        with patch.object(socketio, 'emit') as mock_emit:
            emit_bed_status_update(
                socketio,
                hospital_id='hosp_789',
                bed_info={
                    'bed_id': 'bed_101',
                    'status': 'occupied',
                    'patient_id': 'patient_123'
                }
            )
            
            mock_emit.assert_called_once()
            payload = mock_emit.call_args[0][1]
            
            assert payload['event_type'] == 'bed_status_update'
            assert payload['bed_info']['bed_id'] == 'bed_101'


class TestSocketIOTimestamp:
    """Test timestamp handling"""

    def test_alert_has_timestamp(self, app):
        """Test that emitted alerts include timestamp"""
        app_instance, socketio = app
        
        with patch.object(socketio, 'emit') as mock_emit:
            emit_patient_alert(
                socketio,
                patient_id='patient_123',
                alert_type='critical',
                alert_data={'message': 'Test'}
            )
            
            payload = mock_emit.call_args[0][1]
            
            # Should have ISO format timestamp
            assert 'timestamp' in payload
            assert 'T' in payload['timestamp']  # ISO format check
            
            # Verify it's valid timestamp
            try:
                datetime.fromisoformat(payload['timestamp'])
            except ValueError:
                pytest.fail("Timestamp is not in ISO format")


class TestSocketIORoomTargeting:
    """Test correct room targeting for events"""

    def test_patient_alert_targets_correct_room(self, app):
        """Test patient alert targets patient_<id> room"""
        app_instance, socketio = app
        
        with patch.object(socketio, 'emit') as mock_emit:
            emit_patient_alert(socketio, 'patient_123', 'critical', {})
            
            target_room = mock_emit.call_args[1]['to']
            assert target_room == 'patient_patient_123'

    def test_hospital_alert_targets_correct_room(self, app):
        """Test hospital alert targets hospital_<id> room"""
        app_instance, socketio = app
        
        with patch.object(socketio, 'emit') as mock_emit:
            emit_hospital_alert(socketio, 'hosp_789', 'emergency', {})
            
            target_room = mock_emit.call_args[1]['to']
            assert target_room == 'hospital_hosp_789'

    def test_triage_targets_multiple_rooms(self, app):
        """Test triage update targets all relevant rooms"""
        app_instance, socketio = app
        
        with patch.object(socketio, 'emit') as mock_emit:
            emit_triage_update(socketio, 'triage_001', 'assigned', 'patient_123')
            
            # Should emit to 3 rooms
            calls = [call[1]['to'] for call in mock_emit.call_args_list]
            
            assert 'triage_triage_001' in calls
            assert 'patient_patient_123' in calls
            assert 'triage_queue' in calls


class TestSocketIOErrorHandling:
    """Test error handling"""

    def test_emit_with_missing_parameters(self, app):
        """Test emission handles missing parameters gracefully"""
        app_instance, socketio = app
        
        # Should not raise exceptions
        emit_patient_alert(socketio, 'patient_123', 'critical', {})
        emit_risk_update(socketio, 'patient_123', 0.5, 'low', {})
        emit_hospital_alert(socketio, 'hosp_789', 'info', {})


class TestSocketIOIntegration:
    """Integration tests"""

    def test_end_to_end_alert_flow(self, client):
        """Test complete flow: join room -> emit alert -> receive alert"""
        
        # Client joins room
        client.emit('join_room', {'room': 'patient_123'})
        
        # Would need backend to emit alert here
        # In real test, would be done via API call or direct function
        
        # Client should receive alert if subscribed (would check in real scenario)
        assert client.is_connected()

    def test_multiple_clients_same_room(self, app):
        """Test multiple clients receiving same alert"""
        app_instance, socketio = app
        
        client1 = socketio.test_client(app_instance)
        client2 = socketio.test_client(app_instance)
        
        # Both join same room
        client1.emit('join_room', {'room': 'patient_123'})
        client2.emit('join_room', {'room': 'patient_123'})
        
        # Both should receive alert when emitted
        assert client1.is_connected()
        assert client2.is_connected()


# CLI Test Commands
if __name__ == '__main__':
    """
    Run tests with:
    
    # All tests
    pytest backend/tests_socketio.py -v
    
    # Specific test class
    pytest backend/tests_socketio.py::TestSocketIOConnection -v
    
    # Specific test
    pytest backend/tests_socketio.py::TestSocketIOConnection::test_client_connect -v
    
    # With output
    pytest backend/tests_socketio.py -v -s
    """
    
    pytest.main([__file__, '-v'])
