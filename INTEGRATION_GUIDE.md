# Full Integration Setup Guide

## Backend Setup

### 1. Environment Variables (.env)
```
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
MONGO_URI=mongodb://localhost:27017/healthcare_db
JWT_SECRET_KEY=your-jwt-secret-key
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 2. Start Backend Server
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Backend will run on: `http://localhost:5000`

### 3. MongoDB Collections Created
- `users` - Hospital staff accounts (doctors, nurses, admins)
- `patients` - Patient demographic data
- `doctors` - Doctor profiles
- `nurses` - Nurse profiles
- `triages` - Patient triage assessments
- `predictions` - Risk predictions with ML results
- `hospitals` - Hospital information
- `bed_assignments` - Hospital bed management

## Frontend Setup

### 1. Environment Variables (.env.development)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

For production (.env.production):
```
VITE_API_BASE_URL=https://api.meditriage.example.com/api
```

### 2. Install Dependencies
```bash
cd frontend/ui
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Frontend will run on: `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/hospitals` - Get list of hospitals
- `POST /api/auth/login` - Login with hospital_id + staff_id + password
- `POST /api/auth/change-password` - Change password (JWT required)
- `POST /api/auth/logout` - Logout (JWT required)
- `GET /api/auth/me` - Get current user (JWT required)

### Patients
- `GET /api/patient` - List patients (JWT required)
- `POST /api/patient` - Create patient (JWT required)
- `GET /api/patient/<patient_id>` - Get patient (JWT required)
- `PUT /api/patient/<patient_id>` - Update patient (JWT required)
- `DELETE /api/patient/<patient_id>` - Delete patient (JWT required)

### Doctors
- `GET /api/doctor` - List doctors (JWT required)
- `POST /api/doctor` - Create doctor (JWT required)
- `GET /api/doctor/<staff_id>` - Get doctor (JWT required)
- `PUT /api/doctor/<staff_id>` - Update doctor (JWT required)
- `DELETE /api/doctor/<staff_id>` - Delete doctor (JWT required)

### Nurses
- `GET /api/nurse` - List nurses (JWT required)
- `POST /api/nurse` - Create nurse (JWT required)
- `GET /api/nurse/<staff_id>` - Get nurse (JWT required)
- `PUT /api/nurse/<staff_id>` - Update nurse (JWT required)
- `DELETE /api/nurse/<staff_id>` - Delete nurse (JWT required)

### Triage (with ML Predictions)
- `GET /api/triage` - List triages (JWT required)
- `POST /api/triage` - Create triage assessment with ML predictions (JWT required)
- `GET /api/triage/<triage_id>` - Get triage details (JWT required)
- `PUT /api/triage/<triage_id>` - Update triage (JWT required)
- `POST /api/triage/predict` - Get predictions without creating record (JWT required)

### Hospital
- `GET /api/hospital` - Get hospital info (JWT required)
- `GET /api/hospital/stats/overview` - Get hospital statistics (JWT required)
- `GET /api/hospital/departments` - Get department distribution (JWT required)

## Authentication Flow

### First-Time Login (Hospital Staff)
1. Staff selects hospital from dropdown
2. Enter Staff ID (e.g., DOC001, NURSE001)
3. Enter temporary password (if none set)
4. System redirects to password setup page
5. Staff sets new password
6. JWT token stored in localStorage

### Normal Login
1. Select Hospital
2. Enter Staff ID
3. Enter Password
4. JWT token received
5. Token used for all subsequent API calls

## Frontend Integration

### Key Services (in `src/app/services/`)
- `PatientService.ts` - Patient CRUD and retrieval
- `DoctorService.ts` - Doctor management
- `NurseService.ts` - Nurse management
- `TriageService.ts` - Triage assessments and ML predictions
- `HospitalService.ts` - Hospital info and statistics

### Key Components
- `AuthDialog.tsx` - Hospital ID + Staff ID login with password setup
- `PatientTriagePage.tsx` - Triage form with ML predictions
- `PatientsPage.tsx` - Patient list and management
- `DoctorsPage.tsx` - Doctor list and details
- `NursesPage.tsx` - Nurse list and details
- `HospitalOverviewPage.tsx` - Dashboard with statistics

### Context
- `AuthContext.tsx` - User authentication and session management
- `AppContext.tsx` - Application state management

## ML Triage Prediction

The system uses a combination of:
1. **Rule-based assessment** - Symptom-based department routing
2. **Vital Signs Analysis** - Heart rate, BP, temperature, respiratory rate, O2 saturation
3. **Risk Scoring** - Cumulative risk calculation
4. **Priority Levels** - Low, Medium, High, Critical

### Predicted Departments
- Cardiology/Pulmonology (chest pain, breathing issues)
- Neurology (headache, confusion, seizures)
- Gastroenterology (abdominal pain, nausea)
- Emergency/Orthopedics (trauma, injuries)
- Internal Medicine/Infectious Disease (fever, infection)
- General Medicine (routine cases)

## Protected Routes

All routes require login. After login, user is authenticated and can access:
- Patient pages (read/create/update/delete)
- Doctor pages
- Nurse pages
- Triage assessments
- Hospital overview

Logout clears JWT token and localStorage user data.

## Data Storage

All data is stored in MongoDB:
- Patient records linked to hospital
- Triage assessments linked to patient, nurse, and hospital
- ML predictions stored with triage records
- User sessions via JWT (stateless)

## Next Steps for Production

1. **Database**: Set up MongoDB Atlas or self-hosted MongoDB
2. **Deployment**: Deploy backend to cloud (AWS, Azure, Heroku)
3. **Frontend**: Build and deploy to CDN or server
4. **SSL/TLS**: Enable HTTPS with proper certificates
5. **Environment Variables**: Configure for production
6. **Monitoring**: Set up logging and monitoring
7. **Backup**: Configure database backups
8. **Testing**: Comprehensive automated testing

## Troubleshooting

### Backend Issues
- Check MongoDB connection: `mongodb://localhost:27017/healthcare_db`
- Verify Flask is running: `http://localhost:5000/health`
- Check CORS settings in config.py

### Frontend Issues
- Verify API URL in .env.development
- Check browser console for errors
- Ensure token is being stored in localStorage
- Check network tab for failed API calls

### Authentication Issues
- Clear localStorage and try login again
- Verify hospital_id and staff_id exist in database
- Check JWT_SECRET_KEY matches between frontend and backend
