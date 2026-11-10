# Software Requirements Specification (SRS)
## AttendX AI – Intelligent Face Recognition Attendance & Smart Campus Management System
**Document Version:** 2.0.0  
**Target Qualification:** Master of Science in Information Technology (MSc IT) Major Project  
**Status:** Approved & Implemented  

---

### 1. Introduction
#### 1.1 Purpose
The purpose of this document is to specify the functional, non-functional, biometric, privacy, and architectural requirements for **AttendX AI**, an enterprise-grade Smart Campus Management Platform powered by deep learning facial recognition, presentation attack detection (PAD), and explainable absenteeism analytics.

#### 1.2 Scope
AttendX AI provides automated, touchless, and fraud-resistant attendance recording for higher education campuses. It eliminates proxy attendance, manual register overhead, and administrative latency by deploying real-time OpenCV YuNet and SFace models, cryptographic template protection, and institutional governance workflows.

#### 1.3 Intended Audience
- Software Engineers & Machine Learning Practitioners
- University Examination & Academic Boards
- Institutional System Administrators & Privacy Audit Officers
- MSc IT Project Examiners & Academic Evaluators

---

### 2. Overall Description
#### 2.1 Product Perspective
AttendX AI is a decoupled, modern multi-tier web system comprising:
1. **Frontend Presentation Layer:** Single Page Application (SPA) built using React.js 18+, TypeScript, Tailwind CSS, and Framer Motion.
2. **Backend Application Layer:** Asynchronous Python FastAPI microservice architecture with WebSocket live event streaming.
3. **Computer Vision & AI Inference Engine:** OpenCV DNN FaceDetectorYN (YuNet) and FaceRecognizerSF (SFace) producing 128-dimensional unit embeddings, paired with multi-cue passive anti-spoofing algorithms.
4. **Data Persistence Layer:** Fully normalized PostgreSQL database managed through SQLAlchemy ORM and Alembic migrations.

#### 2.2 User Personas & Roles
| Role | Responsibilities & Access Scope |
| :--- | :--- |
| **Super Admin** | Multi-campus configuration, college registration, global audit inspections. |
| **College Admin**| Academic structure management, faculty assignments, system-wide report exports. |
| **Head of Department (HOD)** | Departmental curriculum, course syllabus, timetable dispute reviews. |
| **Faculty** | Lecture attendance session host, live camera supervisor, manual override authority. |
| **Class Coordinator**| Cohort representative, student registration assistance, batch attendance auditor. |
| **Student** | Self-service portal access, personal attendance trajectory, dispute filing. |

---

### 3. System Features & Functional Requirements

#### 3.1 Authentication & Role-Based Access Control (RBAC)
- **FR-AUTH-01:** System shall authenticate users via cryptographically salted bcrypt password hashes.
- **FR-AUTH-02:** System shall issue stateless JSON Web Tokens (JWT) signed with HMAC-SHA256.
- **FR-AUTH-03:** Backend routes must enforce role verification at the endpoint level.

#### 3.2 Academic Structure & College Hierarchy
- **FR-ACAD-01:** The system shall model institutional hierarchy: `College → Department → Course → Academic Year → Semester → Class → Division → Subject`.
- **FR-ACAD-02:** All entities must support dynamic CRUD operations without hardcoded constraints.

#### 3.3 Student & Faculty Management
- **FR-STU-01:** Every student must possess a unique institutional `enrollment_number` and cohort `roll_number`.
- **FR-STU-02:** System shall support bulk CSV ingestion with row-level validation and error reporting.
- **FR-FAC-01:** Faculty members shall be allocated specific subjects and divisions with conflict isolation.

#### 3.4 Biometric Registration Engine
- **FR-BIO-01:** Biometric enrollment shall require informed consent declaration storage prior to template extraction.
- **FR-BIO-02:** Engine must capture 3 distinct angular samples (Frontal, Left, Right).
- **FR-BIO-03:** Engine shall assess Laplacian blur variance (threshold $\ge 50.0$), brightness, and bounding box dimensions.
- **FR-BIO-04:** Raw images must never be permanently retained; derived 128-d floating point embeddings must be encrypted with AES-256 before database insertion.

#### 3.5 Live Face Recognition & Attendance
- **FR-LIV-01:** Live video frame inference must process within 1200ms latency.
- **FR-LIV-02:** Engine must evaluate presentation attack detection (PAD) using 2D FFT spectral moiré analysis, chrominance dispersion, and specular reflection modeling.
- **FR-LIV-03:** Match verification shall compute cosine similarity against division-enrolled templates with threshold $\ge 0.65$.
- **FR-LIV-04:** System shall prevent duplicate attendance events within the same lecture session.
- **FR-LIV-05:** Real-time check-in events must broadcast over WebSockets to supervisory dashboards.

#### 3.6 Explainable AI Absenteeism Risk
- **FR-XAI-01:** Attendance percentage shall compute as:
  $$\text{Attendance \%} = \left(\frac{\text{Present} + \text{Late}}{\text{Total Eligible} - \text{Excused}}\right) \times 100$$
- **FR-XAI-02:** System shall categorize students into Low, Moderate, High, and Critical risk tiers.
- **FR-XAI-03:** System must generate transparent, natural-language risk factors without automated black-box academic penalties.

#### 3.7 Institutional Reporting
- **FR-REP-01:** Export formatted PDF reports featuring letterheads, KPI summary tables, and date stamps.
- **FR-REP-02:** Export structured Excel (XLSX) spreadsheets for college MIS integration.

---

### 4. Non-Functional Requirements
- **NFR-PERF-01:** Average verification latency per frame $\le 250\text{ms}$ on commodity x86 hardware.
- **NFR-SEC-01:** Zero raw biometric vector leakage in REST API payloads.
- **NFR-PRIV-01:** GDPR/DPDP compliance: Full voluntary consent revocation and permanent template erasure within 1 transaction.
- **NFR-AVAIL-01:** System availability target of 99.5% uptime during academic operating hours.

