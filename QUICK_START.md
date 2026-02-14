# 🚀 Quick Start Guide - MediTriage

Get the healthcare system up and running in minutes!

## ⏱️ 5-Minute Setup

### Prerequisites
- Python 3.8+ ✓
- Node.js 16+ ✓
- MongoDB (local or cloud) ✓
- Git ✓

---

## Step 1: Start MongoDB (1 minute)

### Option A: Local MongoDB
```bash
# If MongoDB is installed locally
mongod
# MongoDB will run on mongodb://localhost:27017
```

### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Note it down for later

---

## Step 2: Backend Setup (2 minutes)

```bash
# Navigate to backend folder
cd backend

# Create and activate virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with MongoDB connection
# Windows:
echo MONGO_URI=mongodb://localhost:27017/healthcare_db > .env
echo JWT_SECRET_KEY=dev-secret-key-change-in-production >> .env
echo FRONTEND_URL=http://localhost:5173 >> .env

# Mac/Linux:
cat > .env << EOF
MONGO_URI=mongodb://localhost:27017/healthcare_db
JWT_SECRET_KEY=dev-secret-key-change-in-production
FRONTEND_URL=http://localhost:5173
EOF

# Seed database with sample data
python init_db.py

# Start the backend server
python app.py
```

**Expected Output**:
```
 * Running on http://localhost:5000
 * Debugger is active
 * Press CTRL+C to quit
```

✅ **Backend is now running!**

---

## Step 3: Frontend Setup (2 minutes)

Open a **NEW terminal window** (keep backend running)

```bash
# Navigate to frontend
cd frontend/ui

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected Output**:
```
  VITE v5.x.x  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

✅ **Frontend is now running!**

---

## Step 4: Login and Test (2 minutes)

1. **Open**: http://localhost:5173
2. **Login with**:
   - Hospital: `City Medical Center`
   - Staff ID: `DOC001`
   - Password: `password123`

3. **Click "Login"** → Should redirect to dashboard

✅ **You're in!**

---

## 🎯 What to Test First

### Test #1: Triage Form
1. Click **"Triage"** in sidebar
2. Enter patient info
3. Fill symptoms and vital signs
4. Click **"Assess Patient"**
5. ✅ See ML predictions!

### Test #2: Patient List
1. Click **"Patients"** in sidebar
2. See existing patients from database
3. Click patient to view details

### Test #3: Hospital Overview
1. Click **"Hospital Overview"**
2. See stats: patients, doctors, nurses
3. View department breakdown

### Test #4: Doctor Directory
1. Click **"Doctors"** in sidebar
2. See all doctors at hospital
3. Filter by specialty

---

## 📊 Available Test Accounts

### Hospital 1: City Medical Center (HOSP001)

| Role | Staff ID | Password |
|------|----------|----------|
| Doctor | DOC001 | password123 |
| Nurse | NURSE001 | password123 |
| Doctor | DOC002 | password123 |
| Nurse | NURSE002 | password123 |

### Hospital 2: Riverside General (HOSP002)

| Role | Staff ID | Password |
|------|----------|----------|
| Doctor | DOC001 | password123 |
| Nurse | NURSE001 | password123 |

---

## 🔍 Verify Everything Works

### Backend Health Check
```bash
# In a new terminal
curl -X GET http://localhost:5000/api/auth/hospitals
```

Should return:
```json
[
  {
    "_id": "HOSP001",
    "name": "City Medical Center",
    "location": "Downtown"
  },
  {
    "_id": "HOSP002",
    "name": "Riverside General Hospital",
    "location": "Suburbs"
  }
]
```

### Frontend Health Check
- Open: http://localhost:5173
- Should show login page with hospital dropdown
- Hospital dropdown should show both hospitals

---

## 📱 API Endpoints You Can Test

```bash
# Get hospitals
curl -X GET http://localhost:5000/api/auth/hospitals

# Login (get JWT token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "hospital_id": "HOSP001",
    "staff_id": "DOC001",
    "password": "password123"
  }'

# Get current user (replace TOKEN with actual JWT)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# List patients
curl -X GET "http://localhost:5000/api/patient?page=1&limit=10" \
  -H "Authorization: Bearer TOKEN"
```

---

## ❌ Troubleshooting

### Issue: MongoDB Connection Error
```
Error: Failed to connect to MongoDB
```
**Solution**: 
- Check MongoDB is running: `mongod` in terminal
- OR check MONGO_URI in .env is correct

### Issue: Port 5000 Already in Use
```
Error: Address already in use
```
**Solution**:
```bash
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

### Issue: Port 5173 Already in Use
**Solution**: Same as above, change port in vite.config.ts

### Issue: npm install fails
```
npm ERR! code ERESOLVE
```
**Solution**:
```bash
npm install --legacy-peer-deps
```

### Issue: Dependencies missing
```
ModuleNotFoundError: No module named 'flask'
```
**Solution**:
```bash
pip install -r requirements.txt
```

### Issue: Login fails with "Invalid credentials"
**Solution**: 
- Double-check Staff ID (case-sensitive)
- Double-check hospital selection
- Try resetting database: `python init_db.py`

---

## 🔄 Restart Everything

If something goes wrong:

```bash
# Terminal 1: Stop everything
Ctrl + C

# Terminal 2: Stop everything
Ctrl + C

# Clear Python cache
cd backend
find . -type d -name __pycache__ -exec rm -r {} +

# Reinitialize database
python init_db.py

# Restart backend
python app.py
```

Then in new terminal:
```bash
cd frontend/ui
npm run dev
```

---

## 📖 Next Steps

### Learn the System
1. Read [README_INTEGRATION.md](./README_INTEGRATION.md) for full documentation
2. Check [INTEGRATION_GUIDE.md](./backend/INTEGRATION_GUIDE.md) for API details
3. Review code in `backend/api/` for endpoint implementations

### Customize for Your Hospital
1. Edit `backend/init_db.py` to add your hospital
2. Run `python init_db.py` to reload database
3. Test with new credentials

### Connect to Production MongoDB
1. Create MongoDB Atlas cluster
2. Copy connection string
3. Update MONGO_URI in `.env`
4. Restart backend

### Deploy to Production
See deployment section in [README_INTEGRATION.md](./README_INTEGRATION.md)

---

## 💡 Key Features to Try

- ✅ **Multi-Hospital Support**: Login to different hospitals
- ✅ **ML Triage**: Get automatic department predictions
- ✅ **Patient Records**: Full patient history tracking
- ✅ **Staff Directory**: View doctors and nurses
- ✅ **Real-time Stats**: Hospital overview dashboard
- ✅ **Password Reset**: First-time login setup
- ✅ **Secure Auth**: JWT-based authentication

---

## 🆘 Still Need Help?

### Check Database
```bash
# Open MongoDB client
mongosh  # or mongo

# Check healthcare_db
use healthcare_db

# See all collections
show collections

# View sample patient
db.patients.findOne()

# View sample triage
db.triages.findOne()
```

### Check Logs
- **Backend Logs**: Look in terminal where `python app.py` runs
- **Frontend Logs**: Open browser DevTools (F12) → Console tab
- **MongoDB Logs**: Check MongoDB terminal

### Common Commands

```bash
# Backend - Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Frontend - Clean node_modules
rm -r node_modules
npm install

# Database - Reset completely
python init_db.py  # Reinitializes with sample data
```

---

## 📞 Support

For issues:
1. Check this file's troubleshooting section
2. Read full documentation
3. Check terminal outputs for error messages
4. Try restarting everything

---

**🎉 Congratulations!** Your healthcare system is up and running! 

Start with Test #1 (Triage Form) to see the ML predictions in action.

**Happy coding!**
