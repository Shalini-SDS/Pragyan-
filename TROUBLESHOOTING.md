# Troubleshooting Guide - MediTriage

Complete troubleshooting guide for common issues and solutions.

---

## 🔧 Common Backend Issues

### Issue 1: MongoDB Connection Error

**Error Message**:
```
Error: Failed to connect to MongoDB
pymongo.errors.ConnectionFailure: connection attempt timed out
```

**Causes**:
- MongoDB is not running
- Incorrect MONGO_URI in .env
- MongoDB port not accessible
- Network firewall blocking connection

**Solutions**:

**Option A: Local MongoDB**
```bash
# Check if MongoDB is installed
mongod --version

# Start MongoDB (keep this terminal running)
mongod

# MongoDB should start on mongodb://localhost:27017
```

**Option B: MongoDB Atlas (Cloud)**
```bash
# In .env file, update to:
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/healthcare_db?retryWrites=true&w=majority

# Make sure:
# 1. Username and password are correct
# 2. Cluster is created
# 3. IP whitelist includes your IP
# 4. Database name matches (healthcare_db)
```

**Verification**:
```bash
# Test connection with mongo shell
mongosh "mongodb://localhost:27017"
# Should connect successfully
```

---

### Issue 2: Port Already in Use

**Error Message**:
```
Error: Address family for hostname not supported
OSError: [Errno 98] Address already in use
```

**Solution**:

**Windows**:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Result might show:
# TCP    127.0.0.1:5000    0.0.0.0:0    LISTENING    12345

# Kill the process
taskkill /PID 12345 /F

# Verify port is free
netstat -ano | findstr :5000  # Should show nothing
```

**Mac/Linux**:
```bash
# Find process using port 5000
lsof -i :5000

# Result might show:
# COMMAND  PID    USER   FD  TYPE DEVICE SIZE/OFF NODE NAME
# python   123    user    4u  IPv4 0x1234      0t0  TCP localhost:5000

# Kill the process
kill -9 123

# Verify
lsof -i :5000  # Should show nothing
```

**Alternative**: Use different port
```bash
# In app.py, change:
if __name__ == '__main__':
    app.run(debug=True, port=5001)  # Change to 5001

# Or via environment:
export FLASK_PORT=5001
python app.py
```

---

### Issue 3: Dependencies Not Installed

**Error Message**:
```
ModuleNotFoundError: No module named 'flask'
ImportError: cannot import name 'Flask'
```

**Solution**:

```bash
# Activate virtual environment (if using one)
# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

# Install all dependencies
pip install -r requirements.txt

# Verify installation
python -c "import flask; print(flask.__version__)"
# Should print: 3.0.0
```

**Troubleshooting**:
```bash
# Clear pip cache and reinstall
pip install --no-cache-dir -r requirements.txt

# Or force reinstall specific package
pip install --force-reinstall flask==3.0.0

# Check what's installed
pip list | grep -i flask
```

---

### Issue 4: JWT Secret Key Not Set

**Error Message**:
```
RuntimeError: The Flask app has not been configured with a SECRET_KEY
```

**Solution**:

```bash
# Add to .env file:
JWT_SECRET_KEY=my-super-secret-key-change-in-production

# Or set directly in terminal:
# Windows:
set JWT_SECRET_KEY=my-super-secret-key

# Mac/Linux:
export JWT_SECRET_KEY=my-super-secret-key

# Then start Flask
python app.py
```

**For Production**:
```bash
# Use a strong random key (generate one):
python -c "import secrets; print(secrets.token_hex(32))"

# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1

# Use this value in .env and keep it secret!
```

---

### Issue 5: Database Seeding Error

**Error Message**:
```
Error: Cannot seed database - collection already exists
pymongo.errors.OperationFailure: E11000 duplicate key error
```

**Solution**:

```bash
# Clear existing data and reseed
python init_db.py

# This will:
# 1. Drop existing collections
# 2. Create new indexes
# 3. Insert sample data

# If that fails, manually clear:
# 1. Open MongoDB client:
mongosh

# 2. Switch to database:
use healthcare_db

# 3. Drop all collections:
db.users.deleteMany({})
db.patients.deleteMany({})
db.doctors.deleteMany({})
db.nurses.deleteMany({})
db.triages.deleteMany({})
db.hospitals.deleteMany({})

# 4. Reseed:
python init_db.py
```

---

### Issue 6: Login Endpoint Returns 500 Error

**Error Message**:
```
POST /api/auth/login
500 Internal Server Error
```

**Debugging**:

```bash
# Check backend logs - look for stack trace

# Common causes:
# 1. Hospital ID doesn't exist
# 2. Staff ID not in database
# 3. Password comparison failing

# Test with curl:
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "hospital_id": "HOSP001",
    "staff_id": "DOC001",
    "password": "password123"
  }'

# Should return:
# {"access_token": "eyJ0eXAiOiJK...", "success": true}
```

**Solution**:

```bash
# Check if sample data was seeded:
mongosh
use healthcare_db
db.hospitals.findOne()     # Should exist
db.users.findOne()         # Should exist

# If empty, reseed:
python init_db.py

# Verify credentials match:
db.users.find({staff_id: "DOC001"})  # Should return 1 user
```

---

### Issue 7: Triage Predictions Return Wrong Format

**Error Message**:
```
KeyError: 'predicted_department'
TypeError: 'NoneType' object is not subscriptable
```

**Solution**:

```bash
# Check if model files exist:
ls -la backend/models/

# Should show:
# risk_model.joblib
# risk_encoder.joblib

# If missing, rebuild:
python backend/train_model.py

# Or check if fallback is working:
# In predictor.py, enable debug:
import logging
logging.basicConfig(level=logging.DEBUG)

# Then run triage and check logs
```

---

## 🎨 Common Frontend Issues

### Issue 8: Frontend Port Already in Use

**Error Message**:
```
EADDRINUSE: address already in use :::5173
```

**Solution**:

**Windows**:
```bash
# Find process using port 5173
netstat -ano | findstr :5173

# Kill it
taskkill /PID <PID> /F
```

**Mac/Linux**:
```bash
# Find and kill
lsof -i :5173
kill -9 <PID>
```

**Alternative**: Change port
```bash
# In vite.config.ts:
export default defineConfig({
  server: {
    port: 5174  // Change to different port
  }
})

# Or via environment:
export VITE_PORT=5174
npm run dev
```

---

### Issue 9: npm Install Fails

**Error Message**:
```
npm ERR! code ERESOLVE
npm ERR! not ok
```

**Solution**:

```bash
# Option A: Use legacy peer deps
npm install --legacy-peer-deps

# Option B: Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Option C: Use different Node version
node --version  # Check current
nvm install 18  # Or use nvm/nvm-windows to switch versions
npm install
```

---

### Issue 10: Login Shows "Invalid Hospital"

**Error Message**:
```
Error: Hospital not found
```

**Debugging**:

```bash
# Check if hospitals were seeded:
mongosh
use healthcare_db
db.hospitals.find()  # Should show hospitals

# If empty, reseed database:
python init_db.py
```

**Solution**:

```bash
# Verify hospitals in database:
mongosh
use healthcare_db

# List all hospitals:
db.hospitals.find().pretty()

# Should show:
# {
#   "_id": "HOSP001",
#   "name": "City Medical Center",
#   "location": "Downtown"
# }

# If not matching, update frontend dropdown or database
```

---

### Issue 11: API Call Returns 401 Unauthorized

**Error Message**:
```
Error: User is not authenticated
401 Unauthorized
```

**Causes**:
- JWT token expired
- Token not sent correctly
- Token malformed

**Solution**:

```bash
# Check token in browser console:
localStorage.getItem('access_token')

# Should return a long JWT string starting with "eyJ..."

# If empty or null:
# 1. Login again
# 2. Check AuthContext.tsx for token storage

# Verify token format:
# 1. Go to jwt.io
# 2. Paste your token
# 3. Verify it decodes correctly
# 4. Check expiry date

# If token is correct but still 401:
# Check backend is sending Authorization header:
# In browser DevTools → Network tab → select request → Headers
# Should show: Authorization: Bearer eyJ0eXAi...
```

---

### Issue 12: Page Shows "Loading..." Forever

**Error Message**:
```
(No error, just spinning loader)
```

**Causes**:
- API call not responding
- Network error
- Infinite loop in component

**Solution**:

```bash
# Check browser console (F12):
# Look for network errors with status 0, connection timeout, etc.

# Check backend is running:
curl http://localhost:5000/api/auth/hospitals

# Check frontend .env file exists:
cat frontend/ui/.env.development
# Should have: VITE_API_BASE_URL=http://localhost:5000/api

# Check if API endpoint exists:
# In backend, verify route is registered in api/__init__.py
# And endpoint is decorated with @auth_required if needed

# Debug in component:
// Add console.log in useEffect
useEffect(() => {
  console.log('Fetching data for:', endpoint);
  PatientService.getPatients()
    .then(data => console.log('Got data:', data))
    .catch(err => console.error('Error:', err));
}, []);
```

---

### Issue 13: Triage Form Shows Empty Results

**Error Message**:
```
(Form submits but no results displayed)
```

**Solution**:

```bash
# 1. Check backend API works:
curl -X POST http://localhost:5000/api/triage/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "blood_pressure": "140/90",
    "heart_rate": 95,
    "temperature": 38.2,
    "respiratory_rate": 20,
    "oxygen_saturation": 96,
    "symptoms": ["chest pain"],
    "severity": 7
  }'

# Should return prediction JSON with department, priority, etc.

# 2. Check TriageService response format:
// In PatientTriagePage.tsx, add debug:
const predictions = await TriageService.predictTriage(data);
console.log('Predictions:', predictions);

# 3. Check if results component is rendering:
// Look for <div className="results"> or similar
// Verify state is updated correctly
```

---

### Issue 14: Authentication Dialog Not Showing

**Error Message**:
```
(Blank page or no login form)
```

**Solution**:

```bash
# 1. Check App.tsx renders AuthDialog:
// Should have:
// {!user && <AuthDialog />}

# 2. Check AuthDialog is properly exported:
export default AuthDialog;

# 3. Check CSS is loaded:
// F12 → Elements → Check if styles applied

# 4. Check component is mounted:
// F12 → Console:
console.log(document.querySelector('[aria-label="Auth Dialog"]'))

# 5. Verify AuthContext is initialized:
// Check App.tsx wraps with AuthProvider
// <AuthProvider>
//   <App />
// </AuthProvider>
```

---

## 🔗 Integration Issues

### Issue 15: Frontend Cannot Connect to Backend

**Error Message**:
```
Failed to fetch
NetworkError: Failed to execute 'fetch' on 'Window'
CORS error
```

**Causes**:
- Backend not running
- Wrong API URL
- CORS not enabled
- Port mismatch

**Solution**:

```bash
# 1. Verify backend is running:
curl http://localhost:5000/api/auth/hospitals
# Should return JSON

# 2. Check frontend .env file:
cat frontend/ui/.env.development
# Should have: VITE_API_BASE_URL=http://localhost:5000/api

# 3. Check CORS config in backend:
# In config.py:
# CORS_ORIGINS should include http://localhost:5173

# 4. Verify ports match:
# Backend on 5000 ✓
# Frontend on 5173 ✓
# .env.development says 5000 ✓

# 5. Check browser console (F12):
# Network tab → failed request
# Check Response and CORS headers
```

---

### Issue 16: Data Not Persisting in Database

**Error Message**:
```
(Data created but disappears on refresh)
```

**Causes**:
- Save API call not working
- Database write failed
- Transaction issue

**Solution**:

```bash
# 1. Verify data was saved:
mongosh
use healthcare_db
db.patients.find()  # Should show saved patients

# 2. Check API response:
// In DevTools → Network tab
// Select POST /patient request
// Check Response status is 200 or 201
// Check response contains _id

# 3. Add debug logging:
// In PatientService.ts:
static async createPatient(data) {
  console.log('Creating patient:', data);
  const response = await APIClient.post('/patient', data);
  console.log('Response:', response);
  return response;
}

# 4. Check backend logs:
# Terminal running Flask should show:
# POST /api/patient 201 CREATED
# If it shows 400 or 500, check validation errors
```

---

## 🗄️ Database Issues

### Issue 17: MongoDB Connection String Invalid

**Error Message**:
```
MongoParseError: Invalid scheme, expected 'mongodb' or 'mongodb+srv'
```

**Solution**:

```bash
# Check format is correct:

# Local MongoDB:
MONGO_URI=mongodb://localhost:27017/healthcare_db

# MongoDB Atlas:
MONGO_URI=mongodb+srv://username:password@cluster0.abcde.mongodb.net/healthcare_db?retryWrites=true&w=majority

# NOT:
MONGO_URI=mongodb://mongodb.com/path  # ✗ Wrong
MONGO_URI=mongod://localhost:27017    # ✗ Wrong

# Common mistakes:
# 1. Typo: "mongdb" instead of "mongodb"
# 2. Missing credentials: mongodb+srv://cluster.mongodb.net
# 3. Wrong database name: healthcare_d (missing 'b')
```

---

### Issue 18: Collections Not Being Created

**Error Message**:
```
Error: Collection not found
pymongo.errors.OperationFailure
```

**Solution**:

```bash
# Run initialization:
python backend/init_db.py

# Check if collections created:
mongosh
use healthcare_db
show collections

# Should show:
# hospitals
# users
# patients
# doctors
# nurses
# triages
# predictions
# bed_assignments

# If empty, debug init_db.py:
# 1. Check MongoDB connection
# 2. Check if errors are being caught silently
# 3. Add debug prints:

print("Connecting to MongoDB...")
try:
    db = client.healthcare_db
    print("Connected!")
except Exception as e:
    print(f"Error: {e}")
```

---

### Issue 19: Index Not Working

**Error Message**:
```
Query is slow / not using index
```

**Solution**:

```bash
# Verify indexes exist:
mongosh
use healthcare_db
db.users.getIndexes()

# Should show:
# [
#   { v: 2, key: { _id: 1 } },
#   { v: 2, key: { hospital_id: 1, staff_id: 1 }, unique: true }
# ]

# If indexes missing, recreate:
# Option A: Reseed database
python init_db.py

# Option B: Manually create
mongosh
use healthcare_db

# Create compound index:
db.users.createIndex(
  { hospital_id: 1, staff_id: 1 },
  { unique: true }
)

# Verify index usage:
db.users.find({hospital_id: "HOSP001"}).explain("executionStats")
# Look for: "executionStage": { "stage": "COLLSCAN" } → No index
# Or:      "executionStage": { "stage": "IXSCAN" } → Using index ✓
```

---

## 🆘 How to Get More Help

### Enable Debug Logging

**Backend**:
```python
# In app.py, add:
import logging
logging.basicConfig(level=logging.DEBUG)

# Or for specific module:
log = logging.getLogger(__name__)
log.debug("Debugging message")
log.error("Error message")
log.info("Info message")
```

**Frontend**:
```javascript
// In DevTools Console:
localStorage.debug = '*'; // Enable all debug messages
console.log('Debugging:', data); // Add your own

// Watch network requests:
// F12 → Network tab → Enable recording
// Make your request
// Check status, headers, response
```

### Check Logs

**Backend Logs**:
```bash
# Terminal where `python app.py` runs
# Look for:
# [2026-02-15 10:00:00] POST /api/auth/login - 200 OK
# [ERROR] Connection failed to MongoDB
```

**Frontend Logs**:
```bash
# Browser Console (F12 → Console)
# or check browser storage:
# F12 → Application → Local Storage → access_token
```

---

### Useful Commands

```bash
# Test API endpoint with Bearer token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"hospital_id":"HOSP001","staff_id":"DOC001","password":"password123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"

# Use token in next request:
curl -X GET http://localhost:5000/api/patient \
  -H "Authorization: Bearer $TOKEN"

# Check database directly:
mongosh "mongodb://localhost:27017/healthcare_db"

# Run tests (when available):
pytest backend/tests/
npm test  # frontend tests
```

---

### When to Ask for Help

Document:
1. ✅ Error message (full text)
2. ✅ What you were doing
3. ✅ Steps to reproduce
4. ✅ Backend logs
5. ✅ Frontend console errors
6. ✅ Environment (OS, Node version, Python version)
7. ✅ Screenshots/videos if helpful

**Example Issue Report**:
```
Title: Login fails with "Hospital not found"

Steps:
1. Navigate to http://localhost:5173
2. Select "City Medical Center" from dropdown
3. Enter DOC001 as Staff ID
4. Enter password123
5. Click Login

Error:
POST /api/auth/login
Response: 400 Bad Request
{ "error": "Hospital not found" }

Environment:
- OS: Windows 11
- Node: 18.x
- Python: 3.9
- MongoDB: 6.0

Logs:
[Backend terminal output pasted here]
[Browser console output pasted here]
```

---

## ✅ Verification Checklist

Use this to verify everything is working:

```bash
# 1. MongoDB running
mongosh --eval "db.version()"  # Should print version

# 2. Backend running
curl http://localhost:5000/api/auth/hospitals  # Should return JSON

# 3. Frontend running
curl http://localhost:5173  # Should return HTML

# 4. Database seeded
mongosh --eval "use healthcare_db; db.hospitals.countDocuments()"  # Should show 2

# 5. Can login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"hospital_id":"HOSP001","staff_id":"DOC001","password":"password123"}'  # Should return token

# 6. Can create patient (with token from step 5)
curl -X POST http://localhost:5000/api/patient \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"John","last_name":"Doe"}'  # Should return 201

# 7. Frontend loads without errors
# Open http://localhost:5173 in browser
# F12 → Console → Should see no errors

# 8. Can login from UI
# Select hospital, enter credentials, click Login
# Should redirect to dashboard
```

---

**Last Updated**: February 15, 2026  
**Version**: 1.0  
**Maintained By**: Development Team
