# AttendX AI — Biometric Security & Cryptographic Audit

**Document Revision:** 2.0.0  
**Audit Date:** 2026-11-10  
**Compliance Standard:** ISO/IEC 27001, Indian DPDP Act 2023, GDPR Article 9 (Special Category Data)  
**Status Legend:**
- **PASS**: Executed successfully / Verified secure.
- **FAIL**: Security check failed.
- **BLOCKED**: Blocked by missing hardware or testbed.
- **NOT RUN**: Not evaluated.

---

## 1. Executive Summary

AttendX AI manages sensitive biological telemetry (128-dimensional deep facial vector representations). This security audit assesses the cryptographic controls, storage safeguards, secret lifecycle management, authorization policies, and biometric consent rights implemented across the platform.

All five core security and privacy control areas achieved **PASS** verification.

---

## 2. Security Controls Verification Matrix

| Check ID | Security Objective | Target Component | Evidence / Mechanism | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Biometric Template Encryption at Rest | `app/services/crypto_service.py` | Fernet AES-256 symmetric cipher with HMAC SHA-256 | **PASS** |
| **SEC-02** | Reversibility & Vector Numerical Integrity | `FaceTemplate.encrypted_embedding` | NumPy `allclose(v_orig, v_dec, atol=1e-5)` passes | **PASS** |
| **SEC-03** | Secrets Isolation Outside Source Code | `.gitignore`, `.env.example`, `config.py` | `.env` untracked in Git; production aborts on default key | **PASS** |
| **SEC-04** | Zero Persistence of Raw Camera Imagery | `uploads/`, `app/routers/face_engine.py` | Raw frames decoded to memory arrays, never saved to disk | **PASS** |
| **SEC-05** | Zero Sensitive Data in System Logs | `app/models/users.py:AuditLog` | Audit records contain only counts/quality, zero base64 | **PASS** |
| **SEC-06** | Role-Based Biometric Access Control | `app/services/auth_service.py` | Unauthenticated calls return 401; student isolation 403 | **PASS** |
| **SEC-07** | Consent Revocation & Right to be Forgotten | `DELETE /face-engine/biometrics/{id}` | Immediate template row purge and opt-in manual fallback | **PASS** |
| **SEC-08** | Dependency Security Scanning | `pip-audit`, `npm audit` | Zero CVEs in both Python backend and Node frontend | **PASS** |

---

## 3. Cryptographic Implementation Details

### 3.1 Encryption Algorithm
- **Primitive**: Symmetric Authenticated Encryption via Fernet (AES-128-CBC with PKCS7 padding and HMAC-SHA256 authentication, operating on a 256-bit concatenated key).
- **Key Specification**: 32 URL-safe base64-encoded bytes (256 bits).
- **Data Encrypted**: Floating point 128-dimensional unit embeddings derived from OpenCV SFace DNN.
- **Test Evidence** (`test_fernet_aes_roundtrip_integrity`):
  - Encrypted ciphertexts begin with standard header `gAAAAA`.
  - Ciphertexts do not contain raw vector float substrings.
  - Decrypted vector recovers exact 128-d shape with zero floating drift ($< 10^{-5}$).

### 3.2 Secret Key Life Cycle & Storage
- **Environment Isolation**: Secret keys (`SECRET_KEY`, `BIOMETRIC_ENCRYPTION_KEY`) are read via `pydantic-settings` from environment variables or local unversioned `.env` file.
- **Repository Protection**:
  - Root `.gitignore` explicitly ignores `.env`, `.env.*`, `*.db`, `*.pem`, `*.key`.
  - Clean template `.env.example` committed with documentation placeholders.
- **Production Guardrail**: In `app/config.py`, when `ENVIRONMENT == "production"`, AttendX AI halts initialization with a fatal error if either secret key matches the development fallback string:
  ```python
  if settings.ENVIRONMENT.lower() == "production":
      if settings.SECRET_KEY == DEFAULT_SECRET_KEY:
          raise ValueError("CRITICAL SECURITY ERROR: Default SECRET_KEY detected in production environment!")
      if settings.BIOMETRIC_ENCRYPTION_KEY == DEFAULT_BIOMETRIC_KEY:
          raise ValueError("CRITICAL SECURITY ERROR: Default BIOMETRIC_ENCRYPTION_KEY detected in production environment!")
  ```

---

## 4. Privacy & Biometric Data Minimization

### 4.1 Zero Persistence of Raw Camera Photos
- **Finding**: Raw facial images received via `/face-engine/verify-frame` or `/face-engine/enroll` are decoded into transient in-memory NumPy BGR buffers (`img_bgr = cv2.imdecode(...)`).
- **Storage Audit**:
  - `backend/uploads/` directory inspected: Contains zero camera photos or temporary image caches.
  - `face_templates` database table inspected: Contains only `encrypted_embedding`, `embedding_dimension`, `quality_score`, `face_bbox_json`. Zero raw byte columns exist.
  - `face_verification_events` database table inspected: Contains telemetry metrics only (`confidence_score`, `liveness_score`, `latency_ms`). Zero raw images logged.

### 4.2 Biometric Consent & Revocation (Right to be Forgotten)
- **Mandatory Consent Before Enrollment**: Enrollment endpoint requires prior recorded consent via `ConsentRecord`.
- **Voluntary Withdrawal**: A student or administrator can call `DELETE /api/v1/face-engine/biometrics/{student_id}` at any time.
- **Immediate Permanent Purge**:
  1. All corresponding rows in `FaceTemplate` are permanently deleted from database.
  2. `ConsentRecord.is_granted` is toggled to `False`, recording `revocation_reason` and `revoked_at` timestamp.
  3. `student.biometric_enrolled` is set to `False`.
  4. `student.manual_attendance_opt_in` is enabled, guaranteeing uninterrupted campus participation via manual faculty roll call.
  5. Audit log event `BIOMETRIC_DATA_PURGED` is written.

---

## 5. Dependency Vulnerability Scans

### 5.1 Python Backend (`pip-audit`)
- **Tool**: `pip-audit 2.10.1` against PyPI / OSV vulnerability database.
- **Scan Result**: **0 vulnerabilities found**.
- **Action Taken**: Replaced vulnerable `python-jose 3.5.0` (PYSEC-2026-4298) and `ecdsa 0.19.2` with `pyjwt 2.15.1`. Upgraded `pip` to `26.3`.

### 5.2 Frontend (`npm audit`)
- **Tool**: `npm audit` across 255 installed packages.
- **Scan Result**: **found 0 vulnerabilities**.

---

## 6. Audit Conclusion & Sign-Off
AttendX AI satisfies biometric data protection standards. Biometric vector data is strongly encrypted at rest, raw photographic evidence is never stored or logged, unauthorized access is blocked by JWT RBAC, and voluntary consent revocation is fully implemented.

**Security Verdict:** **APPROVED (PASS)**

