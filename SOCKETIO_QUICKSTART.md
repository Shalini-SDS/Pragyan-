# Socket.IO Quick Start Guide

## Installation & Setup

### Backend

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Verify Socket.IO packages:**
   ```bash
   pip list | grep -i socket
   # Should show:
   # Flask-SocketIO==5.3.5
   # python-socketio==5.10.0
   # python-engineio==4.8.0
   ```

3. **Run the backend with Socket.IO:**
   ```bash
   python app.py
   # Output should show:
   # * Running on http://0.0.0.0:5000
   # * Socket.IO server initialized
   ```

   Or with Docker:
   ```bash
   docker-compose up api
   ```

### Frontend

1. **Install dependencies:**
   ```bash
   cd frontend/ui
   npm install
   ```

2. **Verify socket.io-client is installed:**
   ```bash
   npm list socket.io-client
   # Should show: socket.io-client@4.7.2
   ```

3. **Run the frontend dev server:**
   ```bash
   npm run dev
   # Output should show:
   # ✅ Connected to Socket.IO server
   ```

## Quick Integration

### 1. Add AlertProvider to App (Frontend)

Update `src/app/App.tsx`:

```typescript
import { AlertProvider } from './context/AlertContext';
import RealtimeAlertsPanel from './components/RealtimeAlertsPanel';

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <Layout>
          <header>
            <RealtimeAlertsPanel />
          </header>
          <Routes>
            {/* Your routes */}
          </Routes>
        </Layout>
      </AuthProvider>
    </AlertProvider>
  );
}
```

### 2. Use Socket.IO in Components

```typescript
import { useSocketIO } from '../hooks/useSocketIO';
import { useAlerts } from '../context/AlertContext';

function PatientMonitor({ patientId }) {
  const { joinPatientMonitoring, leavePatientMonitoring } = useSocketIO();
  const { alerts } = useAlerts();
  
  useEffect(() => {
    joinPatientMonitoring(patientId);
    return () => leavePatientMonitoring(patientId);
  }, [patientId]);

  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  
  return (
    <div>
      <h2>Patient {patientId}</h2>
      <p>Critical Alerts: {criticalAlerts.length}</p>
    </div>
  );
}
```

### 3. Emit Alerts from Backend

In your API routes or Celery tasks:

```python
from flask import Blueprint, request, jsonify
from extensions import socketio
from socket_service import emit_patient_alert, emit_risk_update

@app.route('/api/risk/predict', methods=['POST'])
def predict_risk():
    data = request.get_json()
    patient_id = data['patient_id']
    
    # Your prediction logic
    risk_score = model.predict(patient_data)
    
    # Emit real-time alert
    emit_patient_alert(
        socketio,
        patient_id,
        'critical' if risk_score > 0.8 else 'warning',
        {'message': f'Risk: {risk_score:.2f}', 'score': risk_score}
    )
    
    return {'risk_score': risk_score}
```

## Testing Socket.IO

### 1. Check Backend Connection

```bash
curl http://localhost:5000/health
# Should return: {"status": "healthy", ...}
```

### 2. Check Frontend Connection (Browser Console)

```javascript
// Should see these logs:
// ✅ Connected to Socket.IO server
// Connection response: {status: 'connected', ...}
```

### 3. Test Alert Emission

**Backend (Python):**
```bash
python -i app.py
>>> from app import create_app, socketio
>>> from socket_service import emit_patient_alert
>>> app = create_app()
>>> with app.app_context():
...     emit_patient_alert(socketio, 'test_patient', 'critical', {'msg': 'test'})
```

**Frontend (Browser Console):**
```javascript
// You should see alert appear in the notification panel
// And in console:
// 🚨 Patient Alert: {patient_id: "test_patient", ...}
```

### 4. Using Socket.IO Testing Tool

Install socket.io-client CLI:
```bash
npm install -g socket.io-client

# Connect to server
socket.io-client http://localhost:5000 --user_id=test_user --user_role=doctor
```

## Common Tasks

### Join Patient Monitoring
```javascript
const { joinPatientMonitoring } = useSocketIO();
joinPatientMonitoring('patient_123');
```

### Get Unread Alert Count
```javascript
const { unreadCount } = useAlerts();
console.log(`You have ${unreadCount} unread alerts`);
```

### Emit Critical Alert
```python
from socket_service import emit_patient_alert

emit_patient_alert(
    socketio,
    patient_id='patient_123',
    alert_type='critical',
    alert_data={
        'message': 'Critical condition detected',
        'vitals': {'heart_rate': 135, 'bp': '180/120'}
    }
)
```

### Clear All Alerts
```javascript
const { clearAll } = useAlerts();
clearAll();
```

## Production Checklist

- [ ] Set `SOCKET_IO_CORS_ORIGINS` in production environment
- [ ] Use Redis manager for multi-worker scaling:
  ```python
  from socketio import RedisManager
  socketio = SocketIO(client_manager=RedisManager(redis_url))
  ```
- [ ] Enable HTTPS/WSS for secure WebSocket connections
- [ ] Set up monitoring for active connections
- [ ] Configure reconnection settings for unreliable networks
- [ ] Test with multiple concurrent users
- [ ] Set up alert persistence (database or message queue)
- [ ] Configure rate limiting for events

## Troubleshooting

### Socket refuses to connect
**Problem:** `Failed to connect to Socket.IO server`

**Solutions:**
1. Verify backend is running: `curl http://localhost:5000/health`
2. Check CORS settings in `extensions.py`
3. Check browser console for errors
4. Verify port 5000 is not blocked by firewall

### Alerts not appearing
**Problem:** Alerts emitted but not showing in UI

**Solutions:**
1. Check browser console for `🚨 Patient Alert` logs
2. Verify room subscription: `console.log(socketService.getSocket().rooms)`
3. Check that AlertProvider wraps all child components
4. Verify backend is using correct room name: `patient_{patient_id}`

### High CPU/Memory usage
**Problem:** Socket.IO consuming too many resources

**Solutions:**
1. Monitor active connections: `get_active_users_count()`
2. Implement connection timeout
3. Remove old alerts from state
4. Use Redis adapter for production

## Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [Flask-SocketIO Docs](https://flask-socketio.readthedocs.io/)
- [Socket.IO Python Client](https://github.com/socketio/python-socketio)
- [Frontend Implementation](./SOCKETIO_IMPLEMENTATION.md)
- [Backend Examples](./backend/SOCKETIO_EXAMPLES.py)
