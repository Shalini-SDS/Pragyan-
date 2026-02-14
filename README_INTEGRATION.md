# MediTriage - Fully Integrated Healthcare Management System

A comprehensive healthcare management system with ML-powered patient triage, staff authentication, and hospital information management.

## 🎯 Features

### Authentication & Authorization
- ✅ Hospital-based login with Hospital ID + Staff ID
- ✅ Password setup on first login
- ✅ Role-based access control (Doctor, Nurse, Admin)
- ✅ JWT-based session management
- ✅ Secure password hashing

### Patient Management
- ✅ Patient registration and profiles
- ✅ Medical history tracking
- ✅ Vital signs recording
- ✅ Patient search and filtering
- ✅ CRUD operations

### Triage & ML Predictions
- ✅ AI-powered patient assessment
- ✅ Automatic department routing based on symptoms
- ✅ Risk scoring and priority levels (Low, Medium, High, Critical)
- ✅ Vital signs analysis
- ✅ Recommended tests generation
- ✅ Confidence scores for predictions

### Staff Management
- ✅ Doctor profiles with specializations
- ✅ Nurse management with shift assignments
- ✅ Staff directory and availability
- ✅ Department-based filtering

### Hospital Management
- ✅ Multi-hospital support
- ✅ Hospital overview dashboard
- ✅ Department statistics
- ✅ Bed management
- ✅ Real-time statistics

## 🏗️ Architecture

### Backend Stack
- **Framework**: Flask (Python)
- **Database**: MongoDB
- **Authentication**: JWT (Flask-JWT-Extended)
- **API**: RESTful API with CORS support
- **Task Queue**: Celery (optional, for async operations)
- **ML**: Scikit-learn, SHAP for explainability

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI + Tailwind CSS
- **Routing**: React Router v7
- **HTTP Client**: Fetch API with custom wrapper
- **State Management**: React Context API

### Data Storage
- **MongoDB Collections**:
  - `users` - Hospital staff accounts
  - `patients` - Patient records
  - `doctors` - Doctor profiles
  - `nurses` - Nurse profiles
  - `triages` - Patient assessments
  - `predictions` - ML prediction results
  - `hospitals` - Hospital information
  - `bed_assignments` - Bed management

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or Atlas)

### Step 1: Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "MONGO_URI=mongodb://localhost:27017/healthcare_db" > .env
echo "JWT_SECRET_KEY=your-secret-key" >> .env
echo "FRONTEND_URL=http://localhost:5173" >> .env

# Initialize database with sample data
python init_db.py

# Start Flask server
python app.py
```

Backend runs on: `http://localhost:5000`

### Step 2: Frontend Setup

```bash
# Navigate to frontend
cd frontend/ui

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 📱 Usage

### Login Flow

1. **First Visit**: 
   - Select hospital from dropdown
   - Enter your Staff ID (e.g., DOC001, NURSE001)
   - Set your password on first login
   - You'll be redirected to the dashboard

2. **Subsequent Logins**:
   - Select hospital
   - Enter Staff ID
   - Enter password
   - Access granted

### Sample Credentials

**Hospital**: City Medical Center (HOSP001)
- Doctor: 
  - Staff ID: `DOC001`
  - Password: `password123`
- Nurse:
  - Staff ID: `NURSE001`
  - Password: `password123`

**Hospital**: Riverside General Hospital (HOSP002)
- Doctor:
  - Staff ID: `DOC001`
  - Password: `password123`

### Key Pages

- **Home**: Overview and quick stats
- **Triage**: Patient assessment with ML predictions
- **Hospital Overview**: Statistics and department info
- **Doctors**: Doctor directory
- **Nurses**: Nurse management
- **Patients**: Patient records

## 🔄 API Endpoints

### Authentication
```
POST   /api/auth/hospitals           # Get hospitals
POST   /api/auth/login               # Login
POST   /api/auth/change-password     # Change password
GET    /api/auth/me                  # Current user
```

### Patients
```
GET    /api/patient                  # List patients
POST   /api/patient                  # Create patient
GET    /api/patient/<id>             # Get patient
PUT    /api/patient/<id>             # Update patient
DELETE /api/patient/<id>             # Delete patient
```

### Doctors
```
GET    /api/doctor                   # List doctors
POST   /api/doctor                   # Create doctor
GET    /api/doctor/<staff_id>        # Get doctor
PUT    /api/doctor/<staff_id>        # Update doctor
DELETE /api/doctor/<staff_id>        # Delete doctor
```

### Nurses
```
GET    /api/nurse                    # List nurses
POST   /api/nurse                    # Create nurse
GET    /api/nurse/<staff_id>         # Get nurse
PUT    /api/nurse/<staff_id>         # Update nurse
DELETE /api/nurse/<staff_id>         # Delete nurse
```

### Triage (with ML)
```
GET    /api/triage                   # List triages
POST   /api/triage                   # Create triage (with predictions)
GET    /api/triage/<id>              # Get triage
PUT    /api/triage/<id>              # Update triage
POST   /api/triage/predict           # Get predictions (no record)
```

### Hospital
```
GET    /api/hospital                 # Hospital info
GET    /api/hospital/stats/overview  # Statistics
GET    /api/hospital/departments     # Department list
```

## 🧠 ML Triage Prediction

The system analyzes:

1. **Symptoms**: Chest pain, breathing issues, fever, etc.
2. **Vital Signs**: Heart rate, BP, temperature, O2 saturation
3. **Medical History**: Previous conditions and medications
4. **Severity Score**: 1-10 scale assessment

**Output**:
- Predicted department (Cardiology, Neurology, etc.)
- Priority level (Low, Medium, High, Critical)
- Risk score (0-1)
- Confidence level
- Recommended tests

## 📊 Database Schema

### Users Collection
```javascript
{
  hospital_id: String,
  staff_id: String,
  name: String,
  email: String,
  role: String, // doctor, nurse, admin
  password: String, // hashed
  department: String,
  specialization: String,
  is_active: Boolean,
  created_at: Date,
  last_login: Date
}
```

### Triages Collection
```javascript
{
  patient_id: String,
  nurse_id: String,
  hospital_id: String,
  blood_pressure: String,
  heart_rate: Number,
  temperature: Number,
  oxygen_saturation: Number,
  symptoms: [String],
  predicted_department: String,
  priority_level: String,
  risk_score: Number,
  confidence: Number,
  recommended_tests: [String],
  created_at: Date
}
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with pbkdf2-sha256
- CORS protection
- MongoDB indexes for performance
- Role-based access control
- Secure hospital data isolation

## 📦 Project Structure

```
Pragyan/
├── backend/
│   ├── api/
│   │   ├── auth_routes.py
│   │   ├── patient_routes.py
│   │   ├── doctor_routes.py
│   │   ├── nurse_routes.py
│   │   ├── hospital_routes.py
│   │   ├── triage_routes.py
│   │   └── __init__.py
│   ├── database/
│   │   └── mongo.py
│   ├── models/
│   │   └── user_model.py
│   ├── risk_engine/
│   │   ├── predictor.py
│   │   ├── model_loader.py
│   │   └── preprocess.py
│   ├── services/
│   │   ├── patient_service.py
│   │   └── risk_service.py
│   ├── utils/
│   │   ├── auth_utils.py
│   │   └── validators.py
│   ├── app.py
│   ├── config.py
│   ├── extensions.py
│   ├── init_db.py
│   └── requirements.txt
│
└── frontend/
    └── ui/
        ├── src/
        │   └── app/
        │       ├── components/
        │       ├── context/
        │       │   ├── AuthContext.tsx
        │       │   └── AppContext.tsx
        │       ├── pages/
        │       │   ├── PatientTriagePage.tsx
        │       │   ├── DoctorsPage.tsx
        │       │   ├── NursesPage.tsx
        │       │   ├── PatientsPage.tsx
        │       │   └── ...
        │       ├── services/
        │       │   ├── PatientService.ts
        │       │   ├── DoctorService.ts
        │       │   ├── NurseService.ts
        │       │   ├── TriageService.ts
        │       │   └── HospitalService.ts
        │       └── utils/
        │           └── apiClient.ts
        ├── .env.development
        ├── .env.production
        └── package.json
```

## 🧪 Testing

### Manual Testing

1. **Authentication**:
   ```
   1. Visit http://localhost:5173
   2. Click "Login"
   3. Select hospital
   4. Enter Staff ID and password
   5. Verify redirect to dashboard
   ```

2. **Triage Assessment**:
   ```
   1. Navigate to Triage page
   2. Fill patient info and symptoms
   3. Verify ML predictions appear
   4. Check database for records in "triages" collection
   ```

3. **Patient Management**:
   ```
   1. Create new patient
   2. View patient list
   3. Update patient info
   4. Verify changes in MongoDB
   ```

### API Testing with cURL

```bash
# Get hospitals
curl -X GET http://localhost:5000/api/auth/hospitals

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"hospital_id":"HOSP001","staff_id":"DOC001","password":"password123"}'

# List patients (with token)
curl -X GET http://localhost:5000/api/patient \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Deployment

### Production Checklist

- [ ] Set up MongoDB Atlas or self-hosted MongoDB
- [ ] Configure environment variables
- [ ] Enable HTTPS/SSL
- [ ] Set secure JWT secret key
- [ ] Configure CORS for production domain
- [ ] Set up logging and monitoring
- [ ] Configure database backups
- [ ] Set up CI/CD pipeline
- [ ] Load test the application
- [ ] Security audit

### Deployment Platforms

**Backend**:
- AWS (EC2, ECS, Lambda)
- Google Cloud (Cloud Run, App Engine)
- Azure (App Service)
- Heroku
- DigitalOcean

**Frontend**:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Azure Static Web Apps

## 📝 Environment Variables

### Backend (.env)
```
FLASK_ENV=production
SECRET_KEY=your-secret-key
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/healthcare_db
JWT_SECRET_KEY=your-jwt-secret
FRONTEND_URL=https://meditriage.example.com
CORS_ORIGINS=https://meditriage.example.com
```

### Frontend (.env.production)
```
VITE_API_BASE_URL=https://api.meditriage.example.com/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 💡 Future Enhancements

- [ ] Video call consultation features
- [ ] Mobile app (React Native)
- [ ] Advanced ML models (neural networks)
- [ ] Prescription management
- [ ] Telemedicine integration
- [ ] Analytics dashboard
- [ ] Appointment scheduling
- [ ] SMS/Email notifications
- [ ] Insurance integration
- [ ] Multi-language support

## 🆘 Support

For issues and questions:
1. Check existing GitHub issues
2. Create detailed bug report
3. Include logs and error messages
4. Provide reproduction steps

## 📧 Contact

- Project Lead: [Your Name]
- Email: support@meditriage.com
- Documentation: [Link to docs]

---

**Last Updated**: February 2026
**Version**: 1.0.0
