# Production Deployment Checklist

## Pre-Deployment Verification

### ✓ Code Quality
- [ ] All modules have comprehensive docstrings
- [ ] Error handling implemented throughout
- [ ] Request validation on all endpoints
- [ ] Clean code without print debugging
- [ ] No hardcoded credentials or secrets
- [ ] All imports organized and necessary

### ✓ Configuration
- [ ] .env file created from .env.example
- [ ] SECRET_KEY set to strong random value
- [ ] MONGO_URI configured for production database
- [ ] REDIS_URL configured for production Redis
- [ ] MODEL_PATH points to valid trained model
- [ ] FLASK_ENV set to "production"
- [ ] Debug mode disabled

### ✓ Database
- [ ] MongoDB connection tested
- [ ] Database authentication configured
- [ ] Collections created (patients, predictions)
- [ ] Database backup strategy in place
- [ ] Indexes created on frequently queried fields
- [ ] Database replication configured (if available)

### ✓ Caching & Message Queue
- [ ] Redis connection tested
- [ ] Redis persistence enabled
- [ ] Celery workers configured
- [ ] Celery beat scheduler configured (if needed)
- [ ] Task result expiration configured

### ✓ Machine Learning
- [ ] Random Forest model trained and validated
- [ ] Model saved using joblib format
- [ ] Model path accessible and permissions correct
- [ ] Model performance metrics documented
- [ ] Feature encoding matches training data
- [ ] SHAP calculations tested and optimized

### ✓ Security
- [ ] HTTPS/SSL certificates obtained
- [ ] API authentication implemented
- [ ] Rate limiting implemented
- [ ] Input validation comprehensive
- [ ] SQL injection prevention verified
- [ ] CORS configured appropriately
- [ ] Security headers set
- [ ] Sensitive data encrypted

### ✓ Testing
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] API endpoint tests passing
- [ ] Load testing completed
- [ ] Error scenarios tested
- [ ] Edge cases handled
- [ ] Performance meets requirements

### ✓ Monitoring & Logging
- [ ] Logging configured to file/service
- [ ] Application metrics collection enabled
- [ ] Error tracking (Sentry, etc.) configured
- [ ] Health check endpoints working
- [ ] Uptime monitoring configured
- [ ] Alerting rules defined
- [ ] Log rotation configured

### ✓ Documentation
- [ ] API documentation complete and accurate
- [ ] Setup guide written
- [ ] Deployment guide written
- [ ] Troubleshooting guide available
- [ ] Code comments clear and helpful
- [ ] README.md updated

### ✓ Dependencies
- [ ] requirements.txt updated with all packages
- [ ] All dependencies tested in production environment
- [ ] No unused dependencies
- [ ] Vulnerable dependencies updated
- [ ] Python version compatibility verified
- [ ] Virtual environment tested

### ✓ Performance
- [ ] Response times within SLA
- [ ] Database queries optimized
- [ ] Model inference time acceptable
- [ ] Memory usage within limits
- [ ] CPU usage normal under load
- [ ] Caching strategy effective
- [ ] Concurrent request handling verified

### ✓ Backup & Disaster Recovery
- [ ] Database backups automated
- [ ] Model backups in place
- [ ] Configuration backups stored
- [ ] Disaster recovery plan documented
- [ ] Restore procedure tested
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined

## Deployment Steps

1. **Preparation**
   ```bash
   # Create production environment
   python -m venv venv_prod
   source venv_prod/bin/activate  # or venv_prod\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

2. **Configuration**
   ```bash
   # Create production .env
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Database Migration**
   ```bash
   # Verify MongoDB connection
   mongodump --uri="$MONGO_URI" --archive=/path/to/backup.archive
   ```

4. **Model Deployment**
   ```bash
   # Copy trained model to production location
   cp model.joblib /path/to/production/risk_engine/model.joblib
   ```

5. **Application Start**
   ```bash
   # Option A: Direct start
   python app.py
   
   # Option B: Gunicorn (recommended)
   gunicorn --workers 4 --bind 0.0.0.0:5000 'app:create_app()'
   
   # Option C: Docker
   docker build -t healthcare-risk-api .
   docker run -p 5000:5000 --env-file .env healthcare-risk-api
   ```

6. **Worker Start**
   ```bash
   # Terminal 1: Celery worker
   celery -A tasks.celery_app worker --loglevel=info
   
   # Terminal 2: Flower monitoring
   celery -A tasks.celery_app flower --port=5555
   ```

7. **Health Verification**
   ```bash
   # Test health endpoint
   curl http://localhost:5000/health
   
   # Test API endpoint
   curl -X POST http://localhost:5000/api/risk/predict \
     -H "Content-Type: application/json" \
     -d '{"patient_id":"P001",...}'
   ```

8. **Load Balancer Configuration**
   ```nginx
   # Example nginx configuration
   upstream healthcare_api {
       server localhost:5000;
       server localhost:5001;
       server localhost:5002;
   }
   
   server {
       listen 80;
       server_name api.example.com;
       
       location / {
           proxy_pass http://healthcare_api;
           proxy_set_header Host $host;
       }
   }
   ```

## Post-Deployment Verification

- [ ] API responds to requests
- [ ] Health check endpoint working
- [ ] Predictions returning correct format
- [ ] SHAP explanations included
- [ ] Results stored in MongoDB
- [ ] Celery tasks executing
- [ ] Flower UI accessible
- [ ] Logs being written
- [ ] Monitoring alerts active
- [ ] Backups running

## Rollback Procedure

If deployment fails:

1. **Stop Services**
   ```bash
   # Stop API server
   pkill gunicorn
   
   # Stop Celery workers
   pkill -f "celery worker"
   ```

2. **Restore Previous Version**
   ```bash
   # Switch to previous version
   git checkout previous-version
   
   # Restore model
   cp model.joblib.backup risk_engine/model.joblib
   
   # Restore database
   mongorestore --uri="$MONGO_URI" /path/to/backup.archive
   ```

3. **Restart Services**
   ```bash
   # Restart with previous version
   gunicorn --workers 4 --bind 0.0.0.0:5000 'app:create_app()'
   celery -A tasks.celery_app worker --loglevel=info
   ```

4. **Verify Operation**
   ```bash
   curl http://localhost:5000/health
   ```

## Maintenance Schedule

### Daily
- [ ] Monitor API health
- [ ] Check error rates
- [ ] Review performance metrics
- [ ] Verify backups completed

### Weekly
- [ ] Review logs for issues
- [ ] Check database size
- [ ] Monitor model performance
- [ ] Update security patches

### Monthly
- [ ] Full backup verification
- [ ] Performance analysis
- [ ] Dependency updates
- [ ] Security audit
- [ ] Capacity planning review

### Quarterly
- [ ] Model retraining evaluation
- [ ] Architecture review
- [ ] Disaster recovery drill
- [ ] Security penetration testing

## Contacts & Escalation

**On-Call Support:** [Contact Information]

**Database Administrator:** [Contact Information]

**Security Team:** [Contact Information]

**Operations Team:** [Contact Information]

## Sign-Off

- [ ] Development Team Lead
- [ ] QA Lead
- [ ] Operations Lead
- [ ] Security Lead

**Deployment Date:** ________________

**Deployed By:** ________________

**Approved By:** ________________
