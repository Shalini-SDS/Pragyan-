# Socket.IO API Reference Card

## Backend API Reference

### Initialization

```python
# In extensions.py
from flask_socketio import SocketIO

socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode='threading'
)

# In app.py
from extensions import socketio
socketio.init_app(app)
register_socket_events(socketio)

# Run
socketio.run(app, host='0.0.0.0', port=5000)
```

### Patient Alerts

```python
from socket_service import emit_patient_alert

emit_patient_alert(
    socketio=socketio,
    patient_id='patient_123',              # Required
    alert_type='critical',                  # 'critical', 'warning', 'info'
    alert_data={                           # Info payload
        'message': 'Critical condition',
        'vitals': {...}
    }
)
# Room: patient_patient_123
# Event: patient_alert
```

### Risk Updates

```python
from socket_service import emit_risk_update

emit_risk_update(
    socketio=socketio,
    patient_id='patient_123',               # Required
    risk_score=0.92,                        # Float 0-1, Required
    risk_level='critical',                  # 'low', 'medium', 'high', 'critical', Required
    explanation={                           # SHAP/LIME explanation
        'top_features': [...],
        'shap_values': [...]
    }
)
# Room: patient_patient_123
# Event: risk_updated
```

### Hospital Alerts

```python
from socket_service import emit_hospital_alert

emit_hospital_alert(
    socketio=socketio,
    hospital_id='hosp_456',                 # Required
    alert_type='emergency',                 # 'emergency', 'capacity', 'system'
    alert_data={
        'message': 'Emergency situation',
        'details': {...}
    }
)
# Room: hospital_hosp_456
# Event: hospital_alert
```

### Triage Updates

```python
from socket_service import emit_triage_update

emit_triage_update(
    socketio=socketio,
    triage_id='triage_001',                 # Required
    status='assigned',                      # 'pending', 'triaged', 'assigned'
    patient_id='patient_123'                # (optional but recommended)
)
# Rooms: triage_triage_001, patient_patient_123, triage_queue
# Event: triage_updated
```

### Availability Updates

```python
from socket_service import emit_availability_update

emit_availability_update(
    socketio=socketio,
    hospital_id='hosp_456',                 # Required
    staff_id='doc_001',                     # Required
    staff_type='doctor',                    # 'doctor' or 'nurse', Required
    available=True                          # Boolean, Required
)
# Room: hospital_hosp_456
# Event: staff_availability_changed
```

### Bed Status

```python
from socket_service import emit_bed_status_update

emit_bed_status_update(
    socketio=socketio,
    hospital_id='hosp_456',                 # Required
    bed_info={                              # Required
        'bed_id': 'bed_101',
        'status': 'occupied',
        'patient_id': 'patient_123',
        'ward': 'ICU',
        'floor': '3'
    }
)
# Room: hospital_hosp_456
# Event: bed_status_changed
```

### Monitoring

```python
from socket_service import get_active_users_count, get_room_users

# Get total active connections
active = get_active_users_count()  # Returns: int

# Get users in specific room
users = get_room_users('patient_123')  # Returns: list of session IDs
```

---

## Frontend API Reference

### Initialize Socket Service

```typescript
import { getSocketService } from '../services/socketService';

const socketService = getSocketService();

// Connect when user logs in
await socketService.connect(userId, userRole);

// Disconnect when user logs out
socketService.disconnect();
```

### Room Subscription

```typescript
// Patient Monitoring
socketService.joinPatientRoom(patientId);
socketService.leavePatientRoom(patientId);

// Hospital Updates
socketService.joinHospitalRoom(hospitalId);
socketService.leaveHospitalRoom(hospitalId);

// Triage Queue
socketService.joinTriageQueue();
socketService.leaveTriageQueue();

// Generic Room
socketService.joinRoom('custom_room');
socketService.leaveRoom('custom_room');
```

### Event Listeners

```typescript
// Register listener
socketService.on('patient_alert', (data) => {
  console.log('Alert:', data);
});

// Unregister listener
socketService.off('patient_alert', callback);

// Available events:
// - patient_alert
// - risk_updated
// - triage_updated
// - hospital_alert
// - staff_availability_changed
// - bed_status_changed
// - connection_response
// - room_joined
// - room_left
```

### Hooks

```typescript
import { useSocketIO } from '../hooks/useSocketIO';
import { useAlerts } from '../context/AlertContext';

function MyComponent() {
  // Socket.IO management
  const { 
    joinPatientMonitoring,
    leavePatientMonitoring,
    joinHospitalUpdates,
    leaveHospitalUpdates,
    joinTriageQueue,
    leaveTriageQueue
  } = useSocketIO();

  // Alert management
  const {
    alerts,                    // Alert[]
    unreadCount,              // number
    addAlert,                 // (alert) => void
    removeAlert,              // (id) => void
    markAsRead,               // (id) => void
    clearAll                  // () => void
  } = useAlerts();

  return <div>{/* render */}</div>;
}
```

### Alert Context

```typescript
import { AlertProvider } from '../context/AlertContext';

// Wrap app with provider
<AlertProvider>
  <App />
</AlertProvider>
```

### Alert Object

```typescript
interface Alert {
  id: string;                  // Unique ID
  type: AlertType;            // 'critical' | 'warning' | 'info' | 'success'
  source: AlertSource;        // Event type
  title: string;              // Short title
  message: string;            // Message text
  data: any;                  // Full event payload
  timestamp: string;          // ISO 8601
  read: boolean;              // Read status
}
```

### UI Component

```typescript
import RealtimeAlertsPanel from '../components/RealtimeAlertsPanel';

// Add to your layout
<header>
  <RealtimeAlertsPanel />
</header>
```

---

## Common Patterns

### Pattern 1: Monitor Patient on Page Load

```typescript
function PatientDetailsPage({ patientId }) {
  const { joinPatientMonitoring, leavePatientMonitoring } = useSocketIO();
  const { alerts } = useAlerts();

  useEffect(() => {
    joinPatientMonitoring(patientId);
    return () => leavePatientMonitoring(patientId);
  }, [patientId]);

  const patientAlerts = alerts.filter(a => 
    a.data?.patient_id === patientId
  );

  return (
    <div>
      <h1>Patient {patientId}</h1>
      <p>Critical Alerts: {patientAlerts.filter(a => a.type === 'critical').length}</p>
    </div>
  );
}
```

### Pattern 2: Listen for Specific Alert Type

```typescript
function RiskMonitor({ patientId }) {
  const [riskLevel, setRiskLevel] = useState('low');

  useEffect(() => {
    const socketService = getSocketService();

    socketService.on('risk_updated', (data) => {
      if (data.patient_id === patientId) {
        setRiskLevel(data.risk_level);
      }
    });
  }, [patientId]);

  return <div>Risk Level: {riskLevel}</div>;
}
```

### Pattern 3: Emit Alert from Backend API

```python
@app.route('/api/risk/predict', methods=['POST'])
@jwt_required()
def predict_risk():
    patient_id = request.json['patient_id']
    
    # Predict
    risk = predict_patient_risk(patient_id)
    
    # Emit alert
    if risk['score'] > 0.8:
        emit_risk_update(
            socketio,
            patient_id=patient_id,
            risk_score=risk['score'],
            risk_level=risk['level'],
            explanation=risk['explanation']
        )
    
    return jsonify(risk)
```

### Pattern 4: Emit from Celery Task

```python
@celery.task
def monitor_patient_health(patient_id):
    socketio = get_socketio_instance()
    
    while True:
        vitals = get_patient_vitals(patient_id)
        
        if is_critical(vitals):
            emit_patient_alert(
                socketio,
                patient_id,
                'critical',
                {'vitals': vitals}
            )
        
        sleep(30)
```

### Pattern 5: Hospital-wide Notification

```python
@app.route('/api/hospital/alert', methods=['POST'])
@jwt_required()
def send_hospital_alert():
    hospital_id = request.json['hospital_id']
    message = request.json['message']
    
    emit_hospital_alert(
        socketio,
        hospital_id=hospital_id,
        alert_type='emergency',
        alert_data={'message': message}
    )
    
    return jsonify({'status': 'sent'})
```

---

## Testing

### Backend Test

```bash
# Run all Socket.IO tests
pytest backend/tests_socketio.py -v

# Run specific test
pytest backend/tests_socketio.py::TestSocketIOConnection::test_client_connect -v

# With coverage
pytest backend/tests_socketio.py --cov
```

### Frontend Connection Check

```javascript
// In browser console
const socketService = window.__socketService; // If exposed globally
console.log('Connected:', socketService.isConnected());
console.log('Socket:', socketService.getSocket());
```

### Manual Backend Test

```bash
python3 -i app.py

>>> from socket_service import emit_patient_alert
>>> emit_patient_alert(socketio, 'test_patient', 'critical', {'msg': 'test'})
```

---

## Environment Variables

### Backend (.env)

```env
# Essential
SOCKET_IO_CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Optional
SOCKET_IO_ASYNC_MODE=threading
SOCKET_IO_PING_TIMEOUT=60
SOCKET_IO_PING_INTERVAL=25
SOCKET_IO_LOGGER=True
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:5000
```

---

## Error Handling

### Backend

```python
try:
    emit_patient_alert(socketio, patient_id, 'critical', {})
except Exception as e:
    logger.error(f"Failed to emit alert: {e}")
    # Fallback: store in database
```

### Frontend

```typescript
socketService.on('socket_error', (error) => {
  console.error('Socket error:', error);
  // Fallback: show fallback UI
});
```

---

## Performance Tips

1. **Use WebSocket only** (no polling):
   ```typescript
   const socket = io(url, { transports: ['websocket'] });
   ```

2. **Limit message size**:
   ```python
   socketio = SocketIO(max_http_buffer_size=1e6)
   ```

3. **Auto-cleanup alerts**:
   - Info alerts auto-remove after 10 seconds
   - Critical alerts persist until dismissed

4. **Rate limit alerts**:
   ```python
   if limiter.is_allowed(patient_id):
       emit_patient_alert(...)
   ```

---

## Debugging

### Enable Logging

```python
# backend/config.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check Connections

```python
from socket_service import get_active_users_count
print(f"Active: {get_active_users_count()}")
```

### Browser DevTools

1. **Console**: Look for `✅ Connected to Socket.IO server`
2. **Network**: Check WebSocket connection status
3. **Storage**: Check localStorage for tokens

---

## Migration Guide (If Upgrading)

From basic polling to Socket.IO:
1. Remove polling requests
2. Add Socket.IO listeners
3. Update UI to use Alert context
4. Test with RealtimeAlertsPanel
5. Monitor performance improvement

---

**Quick Reference Version**: 1.0
**Last Updated**: February 15, 2026
