# MediTriage AI

Intelligent Patient Triage & Department Routing System

Revolutionizing emergency care with AI-driven triage, explainable risk prediction, and smart hospital routing.

---

## Table of Contents
- Project Overview
- Problem Statement
- Proposed Solution
- Key Features & Novelty
- AI / ML Design
- Synthetic Data Engine
- System Architecture
- Tech Stack
- Repository Structure
- Setup & Run Instructions
- Model Training & Evaluation
- Security, Privacy & Ethics
- Testing
- Future Enhancements
- Contributing
- License

---

## Project Overview

MediTriage AI is a full-stack, hackathon-ready system that brings machine learning and explainable AI to emergency department triage. It assesses patient risk in real time, predicts priority level (Emergency / Urgent / Non-Urgent), recommends an appropriate department, and provides transparent explanations of predictions to support clinical decision-making.

## Problem Statement

Emergency Departments (EDs) struggle with:

- Overcrowding and long wait times
- Misprioritization of patients
- Increased morbidity and mortality due to delayed care
- Heavy workload on clinicians
- Rigid, rule-based triage systems that don't scale or account for complex symptom combinations

Traditional triage systems are often manual, subjective, and unable to generalize across complex symptom patterns. MediTriage AI addresses these gaps with data-driven triage, explainability, and workflow integration.

## Proposed Solution

MediTriage AI combines a real-time triage engine, role-based clinical workflows, and an explainability layer so clinicians can trust and act on model outputs. The system:

- Computes a continuous Risk Score (0–100)
- Classifies Priority Level (Emergency / Urgent / Non-Urgent)
- Recommends medical department routing (Cardiology, Neurology, Pulmonology, etc.)
- Provides feature-level explanations for each prediction
- Integrates patient history, vitals, and symptom inputs
- Uses synthetic data generation to train models without PHI

## Key Features & Novelty

- AI-Powered Triage Engine: Multi-output ML model for risk scoring, priority classification, and department recommendation.
- Explainable AI (XAI): Feature importance and symptom contributions for transparent decisions.
- Synthetic Medical Data Engine: Rule-guided probabilistic generator for privacy-preserving training data.
- Role-based Workflows: Nurse registration, vitals entry; Doctor dashboard with assigned patients and AI insights; Patient portal for status tracking.
- Secure document upload & storage for reports, labs, and prescriptions.
- Multilingual UI support and theming (light/dark).

Novelty (major differentiators):

- Combines synthetic data + explainable ML + automated triage routing in a single end-to-end system.
- Real-time scoring and department recommendation not commonly found in open triage tools.

## AI / ML Design

### Model Inputs
Collected from the triage form and patient records:

- Basic demographics: age, gender
- Symptoms: free-text + symptom tags (chest pain, dyspnea, fever, nausea, dizziness, etc.)
- Medical history flags: diabetes, hypertension, heart disease, asthma, cancer, kidney disease, free-text history
- Vitals: heart rate, blood pressure, temperature, respiratory rate, SpO2

### Model Outputs

- Risk Score: continuous 0–100
- Priority Level: Emergency / Urgent / Non-Urgent (multi-class)
- Recommended Department: e.g., Cardiology, Neurology, Pulmonology, General Medicine, Gastroenterology, Emergency Care

### Algorithms

- Primary model: Random Forest Classifier (fast, robust to mixed data types, provides feature importance)
- Multi-output configuration (one model with multi-task targets or separate models depending on training pipeline)
- Explainability via feature importance (tree-based importances, SHAP can be integrated for fine-grained explanations)

### Model Files & Location

- Trained models and encoders are stored under `backend/models/` (e.g., `risk_model.joblib`, `risk_encoder.joblib`). See [backend/models](backend/models).

## Synthetic Data Engine

The synthetic data generator uses rule-guided probabilistic sampling to produce realistic patient records. It models correlations between symptoms and vitals, balances classes for training, and enables development without real PHI.

Key aspects:

- Realistic symptom-vital correlations (e.g., chest pain ↔ elevated heart rate)
- Balanced class distribution across priority levels
- Configurable scenarios for edge-cases and rare presentations
- Used only for training; not for production inference

## System Architecture

High level flow:

Frontend (React + Vite) ↔ Backend API (Flask) ↔ ML Engine (Scikit-learn) ↔ MongoDB

Component responsibilities:

- Frontend (`frontend/ui`): Triage forms, dashboards for nurses/doctors, patient portal, authentication UI
- Backend (`backend/app.py`, routes): REST APIs, authentication (JWT), RBAC, document upload handling
- ML Engine (`backend/train_model.py`, `backend/predict.py`): model training, inference endpoints, synthetic data generation
- Database (MongoDB): patient records, audit logs, document metadata

Data flow:

- Nurse submits triage form → Backend validates and stores record → Backend calls ML inference → ML returns risk, priority, department + explanation → Backend stores results and notifies relevant dashboards

## Tech Stack

- Frontend: React, Vite, Tailwind / MUI
- Backend: Python, Flask (or Django optional), REST API, JWT auth
- Machine Learning: Python, scikit-learn, pandas, numpy, joblib
- Database: MongoDB (Atlas recommended)
- DevOps: Git, GitHub, optional Docker & docker-compose

## Repository Structure (high level)

Pragyan/ (root)

- backend/
  - app.py — main application server ([backend/app.py](backend/app.py))
  - train_model.py — training script ([backend/train_model.py](backend/train_model.py))
  - predict.py — inference utilities
  - models/ — saved model artifacts ([backend/models](backend/models))
  - risk_engine/ — preprocessing & explainability helpers
- frontend/
  - ui/ — React UI ([frontend/ui](frontend/ui))
- docs/ — design docs, architecture diagrams

Adjust paths in your local clone if files differ.

## Setup & Run Instructions

Prerequisites:

- Python 3.10+ (recommended)
- Node 18+ / npm
- MongoDB (local or Atlas)

Backend (development):

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
# create .env as needed (MONGO_URI, JWT_SECRET, STORAGE paths)
python app.py
```

Frontend (development):

```bash
cd frontend/ui
npm install
npm run dev
```

Docker (optional):

- Use the included `docker-compose.yml` in `backend/` to run the API + MongoDB for local testing.

## Model Training & Evaluation

Generate synthetic data and train models locally:

```bash
cd backend
# Generate synthetic dataset
python train_model.py --generate-synthetic
# Train model
python train_model.py --train
```

Trained artifacts will be saved to `backend/models/` as `*.joblib` files. Update the model path in `app.py` or config to load during startup.

Evaluation & explainability:

- Use provided unit tests and scripts in `backend/tests` (if present) to validate model performance and explanation outputs.
- Consider running SHAP explanations on hold-out samples for clinical review before deployment.

## API Overview

Example endpoints (implementations are in `backend/routes`):

- `POST /api/triage` — submit triage form and receive risk results
- `GET /api/patient/:id` — fetch patient record and triage history
- `POST /api/auth/login` — obtain JWT token
- `POST /api/docs/upload` — upload medical documents (PDF)

Authentication: JWT tokens + RBAC. Roles: `nurse`, `doctor`, `patient`, `admin`.

## Security, Privacy & Ethics

- No real PHI required for training — synthetic data used by default
- All model outputs are explainable and intended to be decision-support (human-in-the-loop)
- Store documents encrypted at rest and serve via authenticated endpoints
- Recommend clinical governance: model validation with clinician stakeholders before live use

## Testing

- Backend tests: run `pytest` in `backend/` if tests are present (`tests_socketio.py` etc.)
- Frontend tests: unit tests with Jest and E2E with Cypress under `frontend/ui/cypress`

## Future Enhancements

- Integrate hospital EHR (HL7/FHIR) for real patient data ingestion (with strict governance)
- Add deep learning models for free-text triage (clinical BERT) to boost accuracy
- Real-time ambulance triage & wearable device integrations
- Predictive bed & resource availability module

## Contributing

We welcome contributions. Suggested workflow:

1. Fork the repo and create a feature branch
2. Follow the existing code style and tests
3. Open a PR with a clear description and associated issue

Optional: Add `CONTRIBUTING.md` with CI rules and commit message conventions.

## Impact

By automating and supporting triage decisions with explainable AI, MediTriage AI aims to:

- Speed up emergency response
- Reduce clinician workload
- Improve patient outcomes through better prioritization
