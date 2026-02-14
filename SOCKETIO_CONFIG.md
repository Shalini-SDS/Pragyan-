# Socket.IO Configuration Guide

## Environment Setup

### Backend Configuration

Create or update `.env` file in the `backend/` directory:

```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your-secret-key-change-in-production

# Database Configuration
MONGO_URI=mongodb://admin:password@localhost:27017/healthcare_db?authSource=admin

# Redis Configuration (for Celery and Socket.IO message broker)
REDIS_URL=redis://localhost:6379/0

# Model Configuration
MODEL_PATH=risk_engine/model.joblib

# Socket.IO Configuration
SOCKET_IO_CORS_ORIGINS=http://localhost:5173,http://localhost:3000
SOCKET_IO_ASYNC_MODE=threading
SOCKET_IO_PING_TIMEOUT=60
SOCKET_IO_PING_INTERVAL=25
SOCKET_IO_LOGGER=True
```

### Frontend Configuration

Create `.env.local` file in `frontend/ui/`:

```env
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=10000
```

Update `vite.config.ts` if needed:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
```

## Docker Configuration

The docker-compose.yml is already configured. Verify these settings:

```yaml
# API Service
api:
  environment:
    SOCKET_IO_CORS_ORIGINS: http://localhost:5173,http://localhost:3000
    
# Frontend would connect via:
# http://healthcare_api:5000 (from within Docker network)
# http://localhost:5000 (from host machine)
```

## SSL/TLS Configuration (Production)

### Using Nginx with Socket.IO

```nginx
upstream flask_app {
    server backend:5000;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Enable WebSocket upgrade
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    location / {
        proxy_pass http://flask_app;
        proxy_http_version 1.1;
        
        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Socket.IO specific
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Update Frontend for HTTPS

```typescript
// src/app/services/socketService.ts
const url = window.location.protocol === 'https:' 
  ? 'https://' + window.location.hostname 
  : 'http://' + window.location.hostname;

const socketService = new SocketService(url);
```

## Performance Tuning

### Backend Tuning

```python
# extensions.py
socketio = SocketIO(
    # Use Redis for production multi-worker setup
    client_manager=RedisManager(redis_url),
    
    # Performance settings
    async_mode='threading',  # or 'gevent' for better scalability
    
    # Connection settings
    ping_timeout=60,          # Increase for poor networks
    ping_interval=25,         # Decrease to detect disconnects faster
    
    # Message queue
    message_queue=redis_url,  # Use Redis for message persistence
    
    # CORS settings
    cors_allowed_origins=[
        'http://localhost:5173',
        'http://localhost:3000',
        'https://yourdomain.com',
    ],
    
    # Performance
    async_handlers=True,      # Handle events asynchronously
    max_http_buffer_size=1e6, # Limit message size
    engineio_logger=False,    # Disable for production
)
```

### Frontend Tuning

```typescript
// src/app/services/socketService.ts
this.socket = io(this.url, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    
    // Performance
    transports: ['websocket'],      // Use WebSocket only (faster)
    upgrade: false,
    rejectUnauthorized: false,       // For self-signed certs
    
    // Connection
    forceNew: false,
    multiplex: true,
    
    // Timeout
    timeout: 10000,
});
```

## Multi-Worker Production Deployment

### Using Gunicorn with Gevent

```bash
# Install dependencies
pip install gunicorn gevent gevent-websocket

# Run with multiple workers
gunicorn --worker-class gevent --worker-connections 1000 \
         --workers 4 --bind 0.0.0.0:5000 app:app
```

### Using Redis Message Queue

```python
# extensions.py
from socketio import RedisManager

socketio = SocketIO(
    client_manager=RedisManager(
        redis_url=os.environ.get('REDIS_URL'),
        channel='socket.io'
    ),
    message_queue=redis_url,  # For Celery task messages
)
```

### Docker Compose Production

```yaml
version: '3.8'
services:
  api:
    image: your-registry/healthcare-api:latest
    ports:
      - "5000:5000"
    environment:
      FLASK_ENV: production
      WORKERS: 4
      WORKER_CLASS: gevent
    depends_on:
      - mongodb
      - redis
      
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certificates:/etc/nginx/certificates
    depends_on:
      - api
```

## Monitoring & Logging

### Enable Logging

```python
# config.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Specific to Socket.IO
socketio_logger = logging.getLogger('socketio')
socketio_logger.setLevel(logging.INFO)
```

### Monitor Connections

```python
# Create a monitoring endpoint
@app.route('/api/status/socket', methods=['GET'])
@jwt_required()
def socket_status():
    from socket_service import get_active_users_count, get_room_users
    
    return jsonify({
        'active_connections': get_active_users_count(),
        'rooms': {
            'triage_queue': len(get_room_users('triage_queue')),
            'hospital_123': len(get_room_users('hospital_123')),
            # Add more rooms as needed
        }
    })
```

### Frontend Monitoring

```typescript
// Log Socket.IO events
const socketService = getSocketService();

socketService.on('socket_connected', () => {
  console.log('[Socket.IO] Connected');
});

socketService.on('socket_disconnected', () => {
  console.log('[Socket.IO] Disconnected');
});

socketService.on('socket_error', (error) => {
  console.error('[Socket.IO] Error:', error);
});
```

## Troubleshooting Configuration Issues

### Issue: CORS Blocked

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
```python
# extensions.py
socketio = SocketIO(
    cors_allowed_origins=[
        'http://localhost:5173',  # Your frontend URL
        'https://yourdomain.com',
    ]
)
```

### Issue: Connection Timeout

**Symptom**: Client connects but disconnects after 30 seconds

**Solution**:
```python
# Increase ping interval
socketio = SocketIO(
    ping_timeout=120,  # 2 minutes
    ping_interval=30,  # Check every 30 seconds
)
```

### Issue: Memory Leak

**Symptom**: Memory grows continuously

**Solution**:
```python
# Implement cleanup
@socketio.on('disconnect')
def handle_disconnect():
    # Clear user data
    if sid in active_connections:
        del active_connections[sid]
```

### Issue: High Latency

**Symptom**: Alerts take seconds to appear

**Solution**:
1. Use WebSocket transport only (not polling)
2. Increase worker processes
3. Use gevent async mode
4. Monitor Redis/database performance

### Issue: Events Not Reaching Clients

**Symptom**: Alerts emitted but not received

**Checklist**:
- [ ] Client joined correct room: `socketService.joinPatientRoom(patientId)`
- [ ] Room name matches backend: `patient_<id>` format
- [ ] Client is still connected: `socketService.isConnected()`
- [ ] EventListener registered: `socketService.on('patient_alert', ...)`
- [ ] Backend SQLAlchemy session not blocking

## Rate Limiting

### Prevent Alert Spam

```python
# services/rate_limiter.py
from datetime import datetime, timedelta

class AlertRateLimiter:
    def __init__(self, max_per_minute=10):
        self.max_per_minute = max_per_minute
        self.times = {}
    
    def is_allowed(self, patient_id):
        now = datetime.utcnow()
        minute_ago = now - timedelta(minutes=1)
        
        if patient_id not in self.times:
            self.times[patient_id] = []
        
        # Remove old entries
        self.times[patient_id] = [
            t for t in self.times[patient_id] if t > minute_ago
        ]
        
        # Check limit
        if len(self.times[patient_id]) < self.max_per_minute:
            self.times[patient_id].append(now)
            return True
        
        return False

# Usage
limiter = AlertRateLimiter()

if limiter.is_allowed(patient_id):
    emit_patient_alert(socketio, patient_id, ...)
```

## Security Hardening

```python
# extensions.py
socketio = SocketIO(
    # Authentication
    ping_timeout=60,
    
    # Restrict message size
    max_http_buffer_size=1e6,  # 1MB max
    
    # CORS
    cors_allowed_origins=[
        'https://yourdomain.com',  # Only HTTPS in production
    ],
    
    # Disable vulnerable transports
    transports=['websocket'],  # WebSocket only
)

# Validate messages
@socketio.on('join_room')
def on_join_room(data):
    room = data.get('room', '').strip()
    
    # Validate room name format
    if not re.match(r'^[a-z_]+_[a-zA-Z0-9]+$', room):
        emit('error', {'message': 'Invalid room name'})
        return
    
    # Check user has permission
    user_id = get_jwt_identity()
    if not user_has_room_access(user_id, room):
        emit('error', {'message': 'Unauthorized'})
        return
    
    join_room(room)
```

## Backup & Recovery

### Alert Persistence

```python
# Store important alerts in database
from models.alert_model import Alert as AlertModel

def emit_patient_alert_with_storage(socketio, patient_id, alert_type, alert_data):
    # Emit real-time alert
    emit_patient_alert(socketio, patient_id, alert_type, alert_data)
    
    # Store in database for history
    alert = AlertModel(
        patient_id=patient_id,
        alert_type=alert_type,
        data=alert_data,
        created_at=datetime.utcnow()
    )
    alert.save()
```

### Alert Recovery

```typescript
// Load alert history on component mount
useEffect(() => {
  const loadAlertHistory = async () => {
    const response = await fetch(`/api/alerts/history?patient_id=${patientId}`);
    const alerts = await response.json();
    // Display critical alerts that occurred while offline
    alerts.forEach(alert => addAlert(alert));
  };
  
  loadAlertHistory();
}, [patientId]);
```

---

**Configuration Last Updated**: February 15, 2026
