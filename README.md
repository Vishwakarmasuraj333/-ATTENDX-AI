# AttendX AI – Intelligent Face Recognition Attendance & Smart Campus Management System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![OpenCV](https://img.shields.io/badge/Computer_Vision-OpenCV_YuNet_%2B_SFace-5C3EE8.svg?logo=opencv&logoColor=white)](https://opencv.org)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_TypeScript-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS_v3-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Deployment-Docker_Compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

An enterprise-grade, MSc IT Major Project delivering an intelligent, real-time facial recognition attendance platform with multi-cue presentation attack detection (PAD), cryptographically protected biometric templates, and explainable absenteeism risk analytics.

---

## 🌟 Key Highlights & Capabilities

- **Real Deep Learning Vision Pipeline:** Powered by OpenCV Zoo's official **YuNet** DNN face detector and **SFace** (Casia-WebFace) 128-dimensional embedding recognizer. No random or fabricated embeddings.
- **Multi-Cue Presentation Attack Detection (PAD):** Passive anti-spoofing analyzing 2D Fast Fourier Transform (FFT) display moiré patterns, Laplacian variance sharpness, and YCrCb chrominance dispersion.
- **Cryptographic Biometric Privacy:** Biometric templates are encrypted at rest with **AES-256 Fernet**. Raw facial photographs are never permanently stored.
- **Biometric Informed Consent & Right to Erasure:** Explicit consent workflows with one-click biometric template purging and non-biometric manual alternatives.
- **Real-Time WebSocket Event Stream:** Instant bi-directional live attendance feed broadcasting student check-ins with audio chimes and HUD overlays.
- **Explainable AI (XAI) Attendance Risk:** Identifies attendance trajectory decay (Deteriorating vs. Improving) and evaluates the statutory 75% UGC/AICTE minimum compliance threshold.
- **Multi-Tier Academic Governance:** Configurable hierarchy: `College → Department → Course → Academic Year → Semester → Class → Division → Subject`.
- **Institutional PDF & Excel Reporting:** Publication-ready PDF attendance ledgers and Excel reports generated via ReportLab and OpenPyXL.

---

## 🔐 Default Demo Accounts (Pre-Seeded)

The database comes pre-seeded with realistic institutional records for **Trinity Institute of Technology & AI (TIT-AI)**:

| Role Persona | Email Address | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **College Admin** | `admin@trinity.edu.in` | `Admin@123` | Full campus governance, student/faculty directories, system audit logs |
| **Faculty Instructor** | `sharma.it@trinity.edu.in` | `Faculty@123` | Host live attendance sessions, manual override ledger, subject allocation |
| **Faculty Instructor** | `priya.patel@trinity.edu.in` | `Faculty@123` | Classroom schedules, dispute approvals, attendance history |
| **Student** | `aarav.mehta@trinity.edu.in` | `Student@123` | Personal attendance percentage, subject breakdown, dispute filing |

---

## 🚀 Quickstart Installation Guide

### Prerequisites
- **Node.js** 20+ and **npm** 10+
- **Python** 3.11+ or 3.12+
- **Git**

---

### Method A: Local Native Execution (Fastest)

#### 1. Start the Backend API Service:
```bash
cd backend

# Create and activate virtual environment (Windows PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
pip install email-validator

# Initialize database & seed realistic college records
$env:PYTHONPATH="."
python -m app.utils.seed_data

# Run FastAPI backend (Port 8000)
python run.py
```
*The FastAPI backend will start at `http://localhost:8000`. Swagger API documentation is available at `http://localhost:8000/docs`.*

#### 2. Start the React Frontend Application:
In a separate terminal:
```bash
cd frontend

# Install dependencies
npm install

# Run Vite development server (Port 5173)
npm run dev
```
*Open `http://localhost:5173` in your web browser. Use the quick persona buttons on the login screen to sign in instantly.*

---

### Method B: Containerized Execution (Docker Compose)

```bash
# Build and start PostgreSQL, Backend API, and Frontend Nginx containers
docker-compose up --build
```
- Frontend UI: `http://localhost`
- Backend API Docs: `http://localhost:8000/docs`
- PostgreSQL Port: `5432`

---

## 🧪 Automated Testing

AttendX AI features automated test coverage spanning authentication, academic governance, session calculations, cryptographic template encryption, and liveness detection:

```bash
cd backend
$env:PYTHONPATH="."
.\venv\Scripts\pytest -v
```

**Results:**
```
tests/test_academic.py::test_list_colleges PASSED
tests/test_academic.py::test_list_departments PASSED
tests/test_academic.py::test_list_courses PASSED
tests/test_academic.py::test_list_subjects PASSED
tests/test_attendance.py::test_list_attendance_sessions PASSED
tests/test_attendance.py::test_student_attendance_history PASSED
tests/test_attendance.py::test_dashboard_analytics PASSED
tests/test_attendance.py::test_model_benchmarks PASSED
tests/test_auth.py::test_health_check PASSED
tests/test_auth.py::test_login_success PASSED
tests/test_auth.py::test_login_invalid_password PASSED
tests/test_auth.py::test_get_roles PASSED
tests/test_face_engine.py::test_biometric_template_encryption PASSED
tests/test_face_engine.py::test_liveness_detection_empty PASSED
tests/test_face_engine.py::test_face_quality_assessment PASSED
======================= 15 passed in 4.35s =======================
```

---

## 📁 Repository Directory Structure

```
attendx-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint & lifecycle
│   │   ├── config.py                # Pydantic environment settings & thresholds
│   │   ├── database.py              # SQLAlchemy engine & session factory
│   │   ├── models/                  # 18 BCNF normalized database entities
│   │   ├── schemas/                 # Pydantic request/response validation schemas
│   │   ├── routers/                 # REST endpoints & WebSocket live stream
│   │   ├── ml/
│   │   │   ├── face_pipeline.py     # YuNet face detector & SFace recognizer
│   │   │   ├── liveness_detector.py # 2D FFT spectral & Laplacian texture anti-spoofing
│   │   │   ├── risk_analyzer.py     # Explainable AI attendance risk indicator
│   │   │   └── evaluation.py        # Model benchmark & ROC metrics generator
│   │   ├── services/
│   │   │   ├── auth_service.py      # JWT authentication & RBAC guards
│   │   │   ├── crypto_service.py    # AES-256 Fernet biometric template encryption
│   │   │   └── report_service.py    # ReportLab PDF & OpenPyXL Excel generator
│   │   └── utils/seed_data.py       # Realistic institutional dataset generator
│   ├── tests/                       # Automated pytest test cases
│   ├── ml_weights/                  # ONNX deep learning model weights
│   ├── requirements.txt
│   ├── Dockerfile
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/              # Modular UI & Face Recognition components
│   │   │   ├── face/                # CameraFeed, FaceBoundingBox, LivenessIndicator
│   │   │   ├── layout/              # Sidebar, Header, Layout
│   │   │   └── ui/                  # MetricCard, Badge, Modal, Skeleton
│   │   ├── pages/                   # Enterprise SaaS Dashboard, Live Attendance, etc.
│   │   ├── context/                 # AuthContext & ThemeContext
│   │   ├── types/                   # TypeScript interfaces
│   │   └── api/client.ts            # REST client with JWT interceptor
│   ├── package.json
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docs/
│   ├── SRS.md                       # Software Requirements Specification (IEEE 830)
│   ├── ARCHITECTURE.md              # Technical Architecture & Mermaid UML diagrams
│   ├── ML_EVALUATION.md             # Model evaluation benchmarks, FAR/FRR, Anti-spoofing
│   └── MSC_IT_PROJECT_REPORT.md     # Complete MSc IT Major Project Dissertation
├── docker-compose.yml
└── README.md
```

---

## 📜 Academic Project Documentation

Comprehensive academic deliverables are available in the [`docs/`](./docs/) directory:
1. [**Software Requirements Specification (SRS)**](docs/SRS.md): IEEE 830 standard requirements document.
2. [**Architecture & UML Specifications**](docs/ARCHITECTURE.md): System architecture, ER diagram, and Sequence diagrams.
3. [**ML Evaluation Report**](docs/ML_EVALUATION.md): Quantitative model evaluation across lighting, demographics, and spoof attacks.
4. [**MSc IT Project Dissertation Report**](docs/MSC_IT_PROJECT_REPORT.md): Full 7-chapter academic project report.

---
**AttendX AI • Master of Science in Information Technology Major Project**

#   - A T T E N D X - A I  
 