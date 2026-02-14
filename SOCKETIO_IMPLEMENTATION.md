# Socket.IO Implementation Guide

## Overview

Socket.IO has been integrated into both the backend (Flask) and frontend (React) to enable real-time communication for emergency alerts, risk updates, triage status changes, and staff availability updates.

## Backend Setup

### 1. Updated Dependencies
```bash
pip install Flask-SocketIO==5.3.5
pip install python-socketio==5.10.0
pip install python-engineio==4.8.0
```

### 2. Extensions Module (`extensions.py`)
Socket.IO is initialized as a Flask extension:

```python
from flask_socketio import SocketIO

socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode='threading',
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25
)
```

### 3. Application Factory (`app.py`)
- `socketio.init_app(app)` initializes Socket.IO
- Event handlers are registered via `register_socket_events(socketio)`
- Application runs with `socketio.run()` instead of `app.run()`

### 4. Socket Service Module (`socket_service.py`)

Provides utility functions for emitting real-time events:

#### Connection Management
```python
def register_socket_events(socketio):
    """Register all Socket.IO event handlers"""
    
    @socketio.on('connect')
    def handle_connect():
        # User connects
        
    @socketio.on('disconnect')
    def handle_disconnect():
        # User disconnects
        
    @socketio.on('join_room')
    def on_join_room(data):
        # User joins a room
        
    @socketio.on('leave_room')
    def on_leave_room(data):
        # User leaves a room
```

#### Event Emission Functions

**1. Patient Alerts**
```python
emit_patient_alert(
    socketio=socketio,
    patient_id='patient_123',
    alert_type='critical',  # 'critical', 'warning', 'info'
    alert_data={
        'message': 'Critical condition detected',
        'severity': 'high'
    }
)
```

**2. Risk Score Updates**
```python
emit_risk_update(
    socketio=socketio,
    patient_id='patient_123',
    risk_score=0.92,
    risk_level='critical',
    explanation={'feature': 'heart_rate', 'impact': 'high'}
)
```

**3. Hospital-Wide Alerts**
```python
emit_hospital_alert(
    socketio=socketio,
    hospital_id='hosp_456',
    alert_type='emergency',  # 'emergency', 'capacity', 'system'
    alert_data={'message': 'Emergency situation'}
)
```

**4. Triage Updates**
```python
emit_triage_update(
    socketio=socketio,
    triage_id='triage_789',
    status='assigned',  # 'pending', 'triaged', 'assigned'
    patient_id='patient_123'
)
```

**5. Staff Availability**
```python
emit_availability_update(
    socketio=socketio,
    hospital_id='hosp_456',
    staff_id='doc_001',
    staff_type='doctor',  # 'doctor' or 'nurse'
    available=True
)
```

**6. Bed Status**
```python
emit_bed_status_update(
    socketio=socketio,
    hospital_id='hosp_456',
    bed_info={
        'bed_id': 'bed_101',
        'status': 'occupied',
        'patient_id': 'patient_123'
    }
)
```

### 5. Integration in API Routes

Example from your risk prediction API:

```python
from socket_service import emit_patient_alert, emit_risk_update

@api_bp.route('/risk/predict', methods=['POST'])
def predict_risk():
    # ... perform prediction ...
    
    # Emit real-time alert
    emit_patient_alert(
        socketio=socketio,
        patient_id=patient_id,
        alert_type='critical' if risk_score > 0.8 else 'warning',
        alert_data={'score': risk_score, 'explanation': explanation}
    )
    
    emit_risk_update(
        socketio=socketio,
        patient_id=patient_id,
        risk_score=risk_score,
        risk_level=risk_level,
        explanation=explanation
    )
```

### 6. Integration in Celery Tasks

```python
from socket_service import emit_risk_update
from extensions import socketio

@celery.task
def predict_patient_risk_async(patient_id):
    # ... perform async prediction ...
    
    emit_risk_update(
        socketio=socketio,
        patient_id=patient_id,
        risk_score=predicted_risk,
        risk_level=risk_level,
        explanation=explanation
    )
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend/ui
npm install socket.io-client@^4.7.2
```

### 2. Socket Service (`src/app/services/socketService.ts`)

The `SocketService` class provides a singleton instance for Socket.IO:

```typescript
import { getSocketService } from '../services/socketService';

const socketService = getSocketService();
await socketService.connect(userId, userRole);
```

#### Key Methods
```typescript
// Connect/Disconnect
connect(userId: string, userRole: string): Promise<void>
disconnect(): void

// Room Management
joinRoom(room: string): void
leaveRoom(room: string): void
joinPatientRoom(patientId: string): void
leavePatientRoom(patientId: string): void
joinHospitalRoom(hospitalId: string): void
leaveHospitalRoom(hospitalId: string): void
joinTriageQueue(): void
leaveTriageQueue(): void

// Event Listeners
on(event: string, callback: Function): void
off(event: string, callback: Function): void

// Status
isConnected(): boolean
```

### 3. Alert Context (`src/app/context/AlertContext.tsx`)

Manages real-time alerts globally:

```typescript
import { useAlerts } from '../context/AlertContext';

function MyComponent() {
  const { alerts, unreadCount, addAlert, removeAlert } = useAlerts();
  
  return <>{/* render alerts */}</>;
}
```

#### Available Alerts
- `patient_alert` - Patient emergency alerts
- `risk_updated` - Risk score changes
- `triage_updated` - Triage status updates
- `hospital_alert` - Hospital-wide alerts
- `staff_availability_changed` - Staff availability updates
- `bed_status_changed` - Bed status updates

### 4. Socket.IO Hook (`src/app/hooks/useSocketIO.ts`)

Manages Socket.IO connection lifecycle:

```typescript
import { useSocketIO } from '../hooks/useSocketIO';

function PatientMonitor() {
  const {
    joinPatientMonitoring,
    leavePatientMonitoring,
    joinHospitalUpdates,
    joinTriageQueue
  } = useSocketIO();
  
  useEffect(() => {
    joinPatientMonitoring(patientId);
    joinHospitalUpdates(hospitalId);
    
    return () => {
      leavePatientMonitoring(patientId);
    };
  }, [patientId]);
}
```

### 5. Real-Time Alerts Panel (`src/app/components/RealtimeAlertsPanel.tsx`)

Visual component to display alerts:

```typescript
import RealtimeAlertsPanel from '../components/RealtimeAlertsPanel';

function Layout() {
  return (
    <header>
      <RealtimeAlertsPanel />
    </header>
  );
}
```

### 6. Integration in App Structure

Update `src/app/App.tsx` to wrap with `AlertProvider`:

```typescript
import { AlertProvider } from './context/AlertContext';
import { AuthProvider } from './context/AuthContext';
import RealtimeAlertsPanel from './components/RealtimeAlertsPanel';

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <Layout>
          <RealtimeAlertsPanel />
          <Routes>
            {/* routes */}
          </Routes>
        </Layout>
      </AuthProvider>
    </AlertProvider>
  );
}
```

## Room Architecture

Rooms are used to target specific recipients:

```
patient_{patientId}        - All users monitoring this patient
hospital_{hospitalId}      - All users in this hospital
triage_{triageId}         - Users monitoring this triage
triage_queue              - All users monitoring triage queue
```

## Event Flow Example

### Risk Alert Scenario

1. **Backend**: Patient risk assessment triggers
```python
# In risk prediction API
emit_patient_alert(
    socketio, 
    patient_id='P123',
    alert_type='critical',
    alert_data={'message': 'High risk detected', 'score': 0.95}
)
```

2. **Socket.IO**: Event emitted to `patient_P123` room

3. **Frontend**: AlertContext receives event
```typescript
socketService.on('patient_alert', (data) => {
  addAlert({
    type: 'critical',
    source: 'patient_alert',
    title: 'Patient P123 Alert',
    message: 'High risk detected',
    data
  });
});
```

4. **UI**: RealtimeAlertsPanel displays the alert with notification badge

## Docker Compose Configuration

The existing docker-compose.yml works with Socket.IO:
- API service listens on port 5000 for both HTTP and WebSocket
- Redis is available for session persistence (if needed)
- Celery workers can emit events during async tasks

## Configuration

### Backend Environment Variables

Add to `.env`:
```env
FLASK_ENV=development
SOCKET_IO_CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Environment Variables

Add to `.env.local`:
```env
VITE_API_URL=http://localhost:5000
```

## Testing Socket.IO

### Backend Test
```bash
# Start Flask with Socket.IO
python app.py

# In another terminal, test with curl
curl http://localhost:5000/
```

### Frontend Test
```bash
# Dev server includes Socket.IO client
npm run dev

# Open browser console to see connection logs
# Look for: "✅ Connected to Socket.IO server"
```

### Manual Testing with Python
```python
from socketio import Client
import asyncio

sio = Client()

@sio.on('patient_alert')
def on_message(data):
    print('Alert received:', data)

sio.connect('http://localhost:5000?user_id=user1&user_role=doctor')
sio.emit('join_room', {'room': 'patient_P123'})
```

## Performance Considerations

1. **Connection Pooling**: Socket.IO uses connection pooling for multiple rooms
2. **Memory**: Active connections stored in `active_connections` dict
3. **Scalability**: For production, consider Redis adapter:
   ```python
   from socketio import RedisManager
   socketio = SocketIO(client_manager=RedisManager(redis_url))
   ```

4. **Reconnection**: Clients automatically reconnect with exponential backoff

## Troubleshooting

### Connection Issues
- Check CORS configuration
- Verify backend is running with `socketio.run()`
- Check browser console for connection errors

### Missing Alerts
- Verify room subscriptions with `socketio.emit('join_room', ...)`
- Check that backend is using correct room name format
- Verify event listeners are registered with `socketService.on()`

### High Memory Usage
- Clean up disconnected sessions
- Limit alert history retention
- Monitor active connections with `get_active_users_count()`

## Next Steps

1. Integrate Socket.IO into risk prediction routes
2. Add Socket.IO events to triage workflow
3. Implement bed status tracking with Socket.IO
4. Add notifications to nurse call system
5. Create Socket.IO monitoring dashboard
