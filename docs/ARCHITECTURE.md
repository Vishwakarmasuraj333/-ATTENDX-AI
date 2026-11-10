# AttendX AI – Technical Architecture & UML Specifications

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client["Presentation Tier (Client Layer)"]
        UI["React 18 + TypeScript SPA"]
        Cam["HTML5 MediaDevices Webcam API"]
        WSClient["WebSocket Live Client"]
    end

    subgraph Gateway["Reverse Proxy & Gateway Tier"]
        Nginx["Nginx Edge Proxy :80"]
    end

    subgraph AppTier["Application & Inference Tier"]
        FastAPI["FastAPI Async REST Service :8000"]
        WSHub["WebSocket Broadcast Manager"]
        AuthMgr["JWT Auth & RBAC Guard"]
        CryptoSvc["AES-256 Fernet Crypto Service"]
        
        subgraph MLEngine["Computer Vision & ML Pipeline"]
            YuNet["YuNet DNN Face Detector"]
            SFace["SFace Casia-WebFace Recognizer"]
            PAD["Multi-Cue Passive Liveness Detector"]
            RiskAI["Explainable Risk Analyzer"]
        end
    end

    subgraph DataTier["Persistence Tier"]
        Postgres[("PostgreSQL 16 Engine / SQLite")]
        Storage[("Local / Cloud Uploads Directory")]
    end

    UI -->|HTTPS / REST| Nginx
    WSClient -->|WSS Protocol| Nginx
    Cam --> UI
    Nginx --> FastAPI
    Nginx --> WSHub
    FastAPI --> AuthMgr
    FastAPI --> CryptoSvc
    FastAPI --> MLEngine
    FastAPI --> Postgres
    FastAPI --> Storage
```

---

## 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    COLLEGES ||--o{ DEPARTMENTS : contains
    COLLEGES ||--o{ ACADEMIC_YEARS : defines
    DEPARTMENTS ||--o{ COURSES : offers
    DEPARTMENTS ||--o{ FACULTY : employs
    DEPARTMENTS ||--o{ SUBJECTS : oversees
    COURSES ||--o{ SEMESTERS : comprises
    COURSES ||--o{ CLASSES : structures
    CLASSES ||--o{ DIVISIONS : divides
    DIVISIONS ||--o{ STUDENTS : enrolls
    DIVISIONS ||--o{ TIMETABLES : schedules
    USERS ||--o{ AUDIT_LOGS : generates
    USERS ||--o| STUDENTS : authenticates
    USERS ||--o| FACULTY : authenticates
    ROLES ||--o{ USERS : classifies
    ROLES ||--o{ ROLE_PERMISSIONS : authorizes
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : grants
    STUDENTS ||--o{ FACE_TEMPLATES : owns
    STUDENTS ||--o{ CONSENT_RECORDS : authorizes
    STUDENTS ||--o{ ATTENDANCE_RECORDS : logs
    FACULTY ||--o{ ATTENDANCE_SESSIONS : supervises
    ATTENDANCE_SESSIONS ||--o{ ATTENDANCE_RECORDS : tracks
    ATTENDANCE_SESSIONS ||--o{ FACE_VERIFICATION_EVENTS : monitors
    ATTENDANCE_RECORDS ||--o{ ATTENDANCE_CORRECTIONS : disputes

    COLLEGES {
        int id PK
        string name
        string code
        string current_academic_year
    }

    STUDENTS {
        int id PK
        string enrollment_number UK
        string roll_number
        string full_name
        string email UK
        int department_id FK
        int division_id FK
        boolean biometric_enrolled
    }

    FACE_TEMPLATES {
        int id PK
        int student_id FK
        text encrypted_embedding
        int embedding_dimension
        float quality_score
        int sample_index
        boolean is_active
    }

    ATTENDANCE_RECORDS {
        int id PK
        int session_id FK
        int student_id FK
        date date
        string status
        string attendance_source
        float confidence_score
        boolean liveness_verified
    }
```

---

## 3. Sequence Diagram: Biometric Face Registration Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Faculty / Administrator
    actor Student as Enrolling Student
    participant WebUI as Frontend SPA
    participant Cam as Webcam Hardware
    participant API as FastAPI Backend
    participant ML as YuNet & SFace Engine
    participant Crypto as Fernet AES-256 Service
    participant DB as Database Engine

    Admin->>WebUI: Select student from roster
    WebUI->>Student: Display Biometric Consent Form
    Student->>WebUI: Check informed consent & submit
    WebUI->>API: POST /api/v1/face-engine/consent
    API->>DB: Insert ConsentRecord (timestamp, IP, version)
    API-->>WebUI: Consent registered successfully

    WebUI->>Cam: Activate video sensor
    loop 3 Distinct Capture Angles (Frontal, Left, Right)
        Cam-->>WebUI: Raw video frame capture
        WebUI->>WebUI: Display alignment reticle & guidelines
        Admin->>WebUI: Trigger snapshot
    end

    WebUI->>API: POST /api/v1/face-engine/enroll (3 base64 frames)
    API->>ML: Detect face & extract bounding box (YuNet)
    ML->>ML: Assess quality (Laplacian variance >= 50, Brightness)
    ML->>ML: Extract 128-d normalized embedding (SFace)
    API->>Crypto: encrypt_embedding(vector)
    Crypto-->>API: Encrypted token string
    API->>DB: Store in FACE_TEMPLATES table
    API->>DB: Set Student.biometric_enrolled = True
    API->>DB: Write AuditLog entry
    API-->>WebUI: Enrollment Complete & Verified
    WebUI-->>Admin: Show confirmation badge
```

---

## 4. Sequence Diagram: Live Face Attendance & WebSocket Broadcast

```mermaid
sequenceDiagram
    autonumber
    actor Faculty as Course Instructor
    actor Student as Student in Hall
    participant Cam as Classroom Camera
    participant UI as Live Attendance Screen
    participant API as FastAPI Face Router
    participant ML as Liveness & Matching Engine
    participant DB as PostgreSQL Database
    participant WS as WebSocket Hub

    Faculty->>UI: Select active lecture session & Click Start
    UI->>WS: Connect ws://host/api/v1/face-engine/ws/attendance/{id}
    WS-->>UI: WebSocket Connected

    loop Continuous Verification Loop (Every 1200ms)
        Cam->>UI: Video frame capture
        UI->>API: POST /api/v1/face-engine/verify-frame (Session ID, Frame)
        API->>DB: Load enrolled candidates for this division
        API->>ML: Run YuNet face detection
        alt Face Detected
            API->>ML: Passive Liveness (2D FFT, Laplacian, Cr-Cb Chroma)
            alt Liveness Check Passed
                API->>ML: Cosine Similarity Matching vs Enrolled Templates
                alt Top Match Score >= 0.65
                    API->>DB: Query existing AttendanceRecord
                    alt Record is currently Absent
                        API->>DB: Update Record status = Present
                        API->>DB: Record FaceVerificationEvent
                        API->>WS: Broadcast {type: ATTENDANCE_MARKED, student_name, time}
                        WS-->>UI: Deliver real-time event packet
                        UI->>UI: Play audio chime & increment Present counter
                    else Already Marked Present
                        API-->>UI: Result: Already Marked (Suppress duplicate)
                    end
                else Match Score < 0.65
                    API-->>UI: Result: Unknown Individual (Red overlay)
                end
            else Liveness Check Failed (Screen/Paper Spoof)
                API->>DB: Log Spoof Detected Event
                API-->>UI: Result: Presentation Attack Alert
            end
        else No Face
            API-->>UI: Result: Empty frame
        end
        UI->>UI: Render Bounding Boxes & HUD overlay
    end
```

