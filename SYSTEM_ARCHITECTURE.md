# System Architecture Guide - MediTriage

Complete technical overview of the healthcare system architecture, data flow, and integration points.

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + TypeScript)           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages (Triage, Patients, Doctors, etc.)              │   │
│  │  ↓                                                    │   │
│  │  React Context (Auth, App State)                     │   │
│  │  ↓                                                    │   │
│  │  Service Layer (APIClient Wrapper)                   │   │
│  │  ↓                                                    │   │
│  │  HTTP Fetch (with JWT)                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓ HTTPS                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY / Router                       │
│  (CORS Enabled, JWT Verification)                           │
└─────────────────────────────────────────────────────────────┘
                           ↓

┌──────────────────────────────────────────────────────────────┐
│              BACKEND (Flask Python)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Flask Routes (auth, patient, doctor, nurse, triage)   │ │
│  │ ↓                                                      │ │
│  │ Authentication Middleware (JWT Validation)            │ │
│  │ ↓                                                      │ │
│  │ Route Handlers & Business Logic                       │ │
│  │ ├─ Hospital Isolation (filter by hospital_id)         │ │
│  │ ├─ Data Validation (Marshmallow Schemas)              │ │
│  │ └─ ML Predictions (Risk Engine)                       │ │
│  │ ↓                                                      │ │
│  │ MongoDB Database Layer                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Risk Engine (ML)                                       │ │
│  │ ├─ Vital Signs Analysis                                │ │
│  │ ├─ Symptom Pattern Matching                            │ │
│  │ └─ Department Routing Logic                            │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                           ↓

┌──────────────────────────────────────────────────────────────┐
│                       MONGODB                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Collections:                                           │ │
│  │ • users (hospital staff)                               │ │
│  │ • patients (patient records)                           │ │
│  │ • doctors (doctor profiles)                            │ │
│  │ • nurses (nurse profiles)                              │ │
│  │ • triages (patient assessments)                        │ │
│  │ • predictions (ML results cache)                       │ │
│  │ • hospitals (hospital data)                            │ │
│  │ • bed_assignments (bed management)                     │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow

```
User Login Request
    ↓
┌─────────────────────────────────┐
│ Step 1: Hospital Selection       │
│ User selects hospital from list  │
│ GET /api/auth/hospitals          │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ Step 2: Staff ID + Password      │
│ Enter Staff ID (DOC001, etc.)    │
│ Enter password                   │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ POST /api/auth/login             │
│ ├─ Validate hospital exists      │
│ ├─ Find user by staff_id         │
│ ├─ Check password (hash compare) │
│ ├─ Check if first login          │
│ └─ Generate JWT token            │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ First Login Flow?                │
├─ YES → Request new password     │
│        POST /api/auth/login      │
│        (with needs_password)     │
│        ↓                         │
│        Set new password          │
│        POST /api/auth/change-pw  │
│        ↓                         │
│        Redirect to dashboard     │
│                                 │
├─ NO → Direct to dashboard      │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ JWT Token Generated              │
│ ├─ user_id                       │
│ ├─ hospital_id (KEY!)            │
│ ├─ role (doctor/nurse/admin)     │
│ ├─ staff_id                      │
│ └─ 1-hour expiry                 │
└─────────────────────────────────┘
    ↓
[Stored in localStorage as 'access_token']
    ↓
[Sent with every API request]
Authorization: Bearer {token}
```

---

## 🔄 API Request Flow

```
Frontend Component
    ↓
Service Layer (e.g., PatientService.getPatients())
    ↓
APIClient.request(endpoint, options)
    ├─ Get token from localStorage
    ├─ Build full URL
    ├─ Add Authorization header
    └─ Inject hospital_id from JWT claims
    ↓
Fetch API (HTTP POST/GET/PUT/DELETE)
    ↓
Backend Flask App
    ├─ JWT Middleware validates token
    ├─ Extracts hospital_id from JWT
    ├─ Route handler receives request
    ├─ Validates data (Marshmallow schema)
    ├─ Filters by hospital_id (multi-tenancy)
    ├─ Queries MongoDB
    └─ Returns response
    ↓
APIClient processes response
    ├─ Parse JSON
    ├─ Check for errors
    ├─ On 401: Clear token, logout user
    └─ Return data or throw error
    ↓
Service method returns data
    ↓
Component receives data
    ↓
Update component state
    ↓
Re-render UI with data
```

---

## 👥 Multi-Tenancy Implementation

The system isolates data by hospital using JWT claims:

```typescript
// JWT Payload Structure
{
  user_id: "UUID",
  hospital_id: "HOSP001",  // ← CRITICAL for filtering
  role: "doctor",
  staff_id: "DOC001",
  iat: 1234567890,
  exp: 1234571490
}
```

### How Hospital Isolation Works

```python
# Backend Route Example
@auth_required  # Middleware extracts hospital_id from JWT
def get_patients():
    hospital_id = get_jwt_claims()['hospital_id']  # From token
    
    # ALL queries filtered by hospital_id
    patients = patients_collection.find(
        {'hospital_id': hospital_id}  # ← Data isolation
    )
    return patients
```

### Benefits
✅ Complete data isolation between hospitals
✅ No cross-hospital data leaks
✅ Automatic filtering via JWT
✅ Scalable to thousands of hospitals
✅ Secure multi-tenancy model

---

## 🧠 ML/AI Triage Engine

### Input Data
```javascript
{
  patient_id: "P001",
  blood_pressure: "140/90",
  heart_rate: 95,
  temperature: 38.2,
  respiratory_rate: 20,
  oxygen_saturation: 96,
  symptoms: ["chest pain", "shortness of breath"],
  severity: 7
}
```

### Prediction Process

```
Input Vital Signs
    ↓
┌──────────────────────────────────┐
│ 1. Vital Signs Analysis          │
│ ├─ Heart Rate Abnormality        │
│ │  (critical: <40 or >120)       │
│ ├─ Blood Pressure Assessment     │
│ │  (critical: >180/120)          │
│ ├─ Temperature Check             │
│ │  (abnormal: >38.5°C or <36°C)  │
│ ├─ Respiratory Rate              │
│ │  (abnormal: >24 or <12)        │
│ └─ O2 Saturation                 │
│    (critical: <90%)              │
└──────────────────────────────────┘
    ↓
┌──────────────────────────────────┐
│ 2. Risk Scoring (0-1 scale)      │
│ Formula:                         │
│ base_score = vital_abnormalities │
│ if high_fever OR low_O2:         │
│   risk_score += 0.2              │
│ if extreme_vitals:               │
│   risk_score += 0.3              │
└──────────────────────────────────┘
    ↓
┌──────────────────────────────────┐
│ 3. Department Routing            │
│                                  │
│ IF symptoms contain:             │
│ • "chest pain" → Cardiology      │
│ • "head pain"  → Neurology       │
│ • "fever"      → Infectious Dis. │
│ • "trauma"     → Emergency       │
│ • "abdominal"  → Gastroenterol.  │
│                                  │
│ DEFAULT: Internal Medicine       │
└──────────────────────────────────┘
    ↓
┌──────────────────────────────────┐
│ 4. Priority Level Assignment     │
│                                  │
│ IF risk_score > 0.8:             │
│   priority = "CRITICAL"          │
│ ELSE IF risk_score > 0.6:        │
│   priority = "HIGH"              │
│ ELSE IF risk_score > 0.4:        │
│   priority = "MEDIUM"            │
│ ELSE:                            │
│   priority = "LOW"               │
└──────────────────────────────────┘
    ↓
┌──────────────────────────────────┐
│ 5. Generate Recommendations      │
│                                  │
│ Recommended Tests:               │
│ • ECG (chest symptoms)           │
│ • Troponin (cardiac)             │
│ • CT Brain (neuro)               │
│ • Chest X-ray (respiratory)      │
│ • Blood Work (general)           │
└──────────────────────────────────┘
    ↓
Output JSON
{
  predicted_department: "Cardiology",
  priority_level: "HIGH",
  risk_score: 0.72,
  confidence: 0.85,
  recommended_tests: ["ECG", "Troponin", "Chest X-ray"]
}
```

---

## 📊 Database Schema Details

### Users Collection

```javascript
{
  _id: ObjectId(),
  hospital_id: "HOSP001",
  staff_id: "DOC001",             // Unique per hospital
  name: "Dr. John Doe",
  email: "doc@hospital.com",
  password_hash: "hashed...",
  role: "doctor",                 // doctor, nurse, admin, staff
  department: "Cardiology",
  specialization: "Interventional Cardiology",
  license_number: "LIC123456",
  qualifications: ["MD", "Board Certified"],
  is_active: true,
  password_changed_at: "2026-02-01T10:00:00Z",
  needs_password_reset: false,
  created_at: "2026-01-01T10:00:00Z",
  last_login: "2026-02-15T14:30:00Z",
  
  // Indexes on:
  // - (hospital_id, staff_id) UNIQUE
  // - hospital_id
  // - department
}
```

### Patients Collection

```javascript
{
  _id: ObjectId(),
  patient_id: "P001",
  hospital_id: "HOSP001",
  first_name: "John",
  last_name: "Smith",
  date_of_birth: "1980-05-15",
  gender: "M",
  blood_type: "O+",
  contact_number: "+1-555-0123",
  email: "john@email.com",
  emergency_contact_name: "Jane Smith",
  emergency_contact_phone: "+1-555-0124",
  
  // Medical Info
  allergies: ["Penicillin", "Shellfish"],
  current_medications: ["Metformin", "Lisinopril"],
  previous_conditions: ["Diabetes Type 2", "Hypertension"],
  
  medical_history: [
    {
      condition: "Myocardial Infarction",
      date: "2022-03-15",
      treating_doctor: "DOC001"
    }
  ],
  
  is_active: true,
  created_at: "2026-02-01T09:00:00Z",
  last_updated: "2026-02-15T14:30:00Z",
  
  // Indexes on:
  // - (hospital_id, patient_id) UNIQUE
  // - hospital_id
  // - last_name
}
```

### Triages Collection

```javascript
{
  _id: ObjectId(),
  triage_id: "T001",
  hospital_id: "HOSP001",
  patient_id: "P001",
  nurse_id: "NURSE001",
  
  // Vital Signs
  blood_pressure: "140/90",
  heart_rate: 95,                    // bpm
  temperature: 38.2,                 // Celsius
  respiratory_rate: 20,              // breaths/min
  oxygen_saturation: 96,             // percentage
  
  // Symptoms & Assessment
  symptoms: ["chest pain", "shortness of breath"],
  severity_score: 7,                 // 1-10 scale
  patient_notes: "Patient reports sharp chest pain...",
  
  // ML Predictions
  predicted_department: "Cardiology",
  priority_level: "HIGH",            // CRITICAL/HIGH/MEDIUM/LOW
  risk_score: 0.72,                  // 0-1 scale
  confidence_level: 0.85,            // 0-1 scale
  recommended_tests: ["ECG", "Troponin", "Chest X-ray"],
  
  // Status
  status: "completed",               // pending/completed/reviewed
  reviewed_by: "DOC001",
  review_date: "2026-02-15T14:35:00Z",
  
  // Timestamps
  created_at: "2026-02-15T14:30:00Z",
  updated_at: "2026-02-15T14:35:00Z",
  
  // Indexes on:
  // - hospital_id
  // - patient_id
  // - nurse_id
  // - created_at (DESC)
  // - priority_level
}
```

### Doctors Collection (Denormalized)

```javascript
{
  _id: ObjectId(),
  hospital_id: "HOSP001",
  staff_id: "DOC001",
  
  // Personal Info
  first_name: "John",
  last_name: "Doe",
  email: "doc@hospital.com",
  
  // Professional Info
  specialization: "Interventional Cardiology",
  department: "Cardiology",
  license_number: "LIC123456",
  license_expiry: "2027-12-31",
  qualifications: ["MD", "Board Certified Cardiology"],
  experience_years: 10,
  
  // Availability
  available_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  available_hours: "09:00-17:00",
  
  // Contact
  office_phone: "+1-555-0100",
  
  // Metadata
  is_active: true,
  created_at: "2026-01-01T10:00:00Z",
  
  // Indexes on:
  // - (hospital_id, staff_id) UNIQUE
  // - department
  // - specialization
}
```

### Nurses Collection

```javascript
{
  _id: ObjectId(),
  hospital_id: "HOSP001",
  staff_id: "NURSE001",
  
  // Personal Info
  first_name: "Jane",
  last_name: "Johnson",
  email: "nurse@hospital.com",
  
  // Professional Info
  department: "Emergency",
  license_number: "LIC654321",
  license_expiry: "2027-06-30",
  qualifications: ["RN", "BSN"],
  
  // Schedule
  shift: "morning",                  // morning/afternoon/night
  shift_hours: "07:00-15:00",
  
  // Contact
  mobile_phone: "+1-555-0110",
  
  // Metadata
  is_active: true,
  created_at: "2026-01-01T10:00:00Z",
  
  // Indexes on:
  // - (hospital_id, staff_id) UNIQUE
  // - department
  // - shift
}
```

---

## 🔌 Frontend Service Layer Pattern

### Pattern Overview

```
Component
    ↓
useService Hook
    ↓
Service Layer (e.g., PatientService)
    ├─ APIClient.get()
    ├─ APIClient.post()
    ├─ APIClient.put()
    └─ APIClient.delete()
    ↓
APIClient (Centralized)
    ├─ Get JWT from storage
    ├─ Build URL
    ├─ Add headers
    ├─ Handle errors
    └─ Return parsed JSON
    ↓
Fetch API (HTTP)
    ↓
Backend
```

### Example: PatientService

```typescript
// src/app/services/PatientService.ts
export class PatientService {
  static async getPatients(page = 1, limit = 10, search = '') {
    return APIClient.get('/patient', {
      page,
      limit,
      search
    });
    // Automatically adds:
    // - Authorization header with JWT
    // - Hospital ID from JWT claims (backend)
  }
  
  static async createPatient(data) {
    return APIClient.post('/patient', data);
    // Backend:
    // 1. Validates JWT
    // 2. Extracts hospital_id from JWT
    // 3. Adds hospital_id to data
    // 4. Saves to MongoDB in hospital's context
  }
}
```

---

## 🛡️ Security Architecture

### JWT Claim Structure
```javascript
{
  "sub": "user_id",
  "hospital_id": "HOSP001",      // Used for filtering
  "role": "doctor",              // For RBAC
  "staff_id": "DOC001",          // User identifier
  "iat": 1708025400,             // Issued at
  "exp": 1708029000              // Expiry (1 hour)
}
```

### Security Features

1. **Authentication**
   - JWT tokens for stateless auth
   - Password hashing with pbkdf2_sha256
   - Token expiry (1 hour)

2. **Authorization**
   - Role-based access control (RBAC)
   - Hospital-based data isolation
   - JWT claim validation

3. **Data Protection**
   - CORS enabled for frontend origin only
   - MongoDB indexes for performance
   - Soft deletes (is_active flag)
   - Timestamps for audit trail

4. **API Security**
   - JWT middleware on all routes
   - Input validation (Marshmallow schemas)
   - SQL injection protection (MongoDB)
   - HTTPS in production

---

## 📈 Scaling Considerations

### Horizontal Scaling

```
Load Balancer
    ↓
┌─────────────────────┬──────────────────────┐
│  Flask Instance 1   │  Flask Instance 2    │
└─────────────────────┴──────────────────────┘
    ↓                  ↓
┌──────────────────────────────────────────┐
│  MongoDB (Sharded Cluster)               │
│  Shard by hospital_id                    │
└──────────────────────────────────────────┘
```

### Performance Optimizations

1. **Database**
   - Indexes on frequently queried fields
   - Connection pooling
   - Query optimization
   - Sharding by hospital_id

2. **API**
   - Caching with Redis
   - Pagination for large datasets
   - Compression (GZIP)
   - Rate limiting

3. **Frontend**
   - Code splitting
   - Lazy loading components
   - Caching strategies
   - Optimized bundle size

---

## 🔄 Data Consistency

### Transactionality Approach

```
1. User Submits Triage Form
    ↓
2. Validate Input (schemas)
    ↓
3. Get ML Predictions
    ↓
4. Create/Update Patient (transaction 1)
    ↓
5. Create Triage Record (transaction 2)
    ↓
6. Update Patient recent_triages (transaction 3)
    ↓
7. Return success to frontend
    ↓
8. Frontend shows confirmation
```

### Error Handling

```
If Step 4 fails:
├─ Rollback (don't create triage)
└─ Return error to frontend

If Step 5 fails:
├─ Attempt rollback of Step 4
└─ Return error to frontend

If Step 6 fails:
├─ Log for manual reconciliation
└─ Return partial success
```

---

## 🚀 Deployment Architecture

### Development
```
localhost:5000 (Backend)   ←  localhost:5173 (Frontend)
↓
mongodb://localhost:27017 (Local MongoDB)
```

### Staging
```
staging-api.herokuapp.com  ←  staging-ui.vercel.app
↓
MongoDB Atlas (M2 tier)
```

### Production
```
api.meditriage.com         ←  meditriage.com
↓
MongoDB Atlas (M10+ tier - production grade)
```

---

## 📞 Integration Points

### External Systems (Future)

1. **Email Service**
   - Password reset emails
   - Appointment notifications
   - Report delivery

2. **SMS Service**
   - Patient notifications
   - Alert messages

3. **Payment Gateway**
   - Insurance billing
   - Patient payments

4. **PHR (Personal Health Record)**
   - Data export
   - Integration with other hospitals

5. **Analytics**
   - Patient outcomes tracking
   - Department performance
   - Wait time analytics

---

## 📊 Monitoring & Observability

### Key Metrics

1. **API Performance**
   - Response time
   - Error rate
   - Request volume

2. **Database**
   - Query performance
   - Connection pool usage
   - Disk space

3. **Infrastructure**
   - CPU usage
   - Memory usage
   - Network throughput

### Logging Strategy

```
Level    | Use Case
---------|------------------
DEBUG    | Development, tracing
INFO     | Normal operations
WARNING  | Degraded service
ERROR    | Failed operations
CRITICAL | System down
```

---

## 🔗 Component Relationships

### Frontend-Backend Contract

```typescript
// Frontend sends
{
  blood_pressure: "140/90",
  heart_rate: 95,
  temperature: 38.2,
  respiratory_rate: 20,
  oxygen_saturation: 96,
  symptoms: ["chest pain"],
  severity: 7
}

// Backend returns
{
  predicted_department: "Cardiology",
  priority_level: "HIGH",
  risk_score: 0.72,
  confidence_level: 0.85,
  recommended_tests: ["ECG", "Troponin"]
}
```

### State Management Flow

```
User Action
    ↓
Component State Update
    ↓
Service Method Call
    ↓
APIClient Request
    ↓
Backend Processing
    ↓
Response to Client
    ↓
Context State Update
    ↓
Component Re-render
```

---

## 🎯 Future Enhancements

### Phase 2
- [ ] Video consultation endpoints
- [ ] Advanced ML models (neural networks)
- [ ] Real-time notifications (WebSockets)
- [ ] Appointment scheduling

### Phase 3
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Prescription management
- [ ] Insurance integration

### Phase 4
- [ ] Telemedicine infrastructure
- [ ] Advanced reporting
- [ ] Integration with external providers
- [ ] International support

---

**Architecture Last Updated**: February 2026
**Version**: 1.0
