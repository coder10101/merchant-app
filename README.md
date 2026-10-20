# Merchant Payments & Operations Platform

A production-oriented merchant onboarding and payments operations backend platform built with **NestJS 10**, **TypeScript (Strict Mode)**, **PostgreSQL (TypeORM with reviewed migrations)**, **Redis**, and **BullMQ**.

---

# Key Features & Architecture
- **Authentication & RBAC**: JWT token issuance, bcrypt password hashing, and role guards (`ADMIN`, `REVIEWER`, `SALES`).
- **Strict Object-Level Authorization**:
  - `SALES` users can view and edit **only** the applications they created.
  - Integration tests explicitly verify that a Sales user cannot read or modify another user's application by ID (`403 Forbidden`).
  - Only the assigned `REVIEWER` may record a risk decision on an application (`403 Forbidden` for unassigned reviewers).
- **Finite State Machine & Concurrency Control**:
  - Strict lifecycle transitions: `DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED / REJECTED`.
  - Applications can **only** be modified in `DRAFT` or `ACTION_REQUIRED`. Edits to submitted/reviewed applications return `400 Bad Request`.
  - Optimistic locking via TypeORM's `@VersionColumn()` to prevent lost updates under concurrent access.
- **Asynchronous Risk Review (BullMQ & Redis)**:
  - Submitting an application enqueues a background job via BullMQ.
  - Worker simulates third-party KYB/fraud verification with realistic latency and risk scoring.
  - **Idempotency**: Deterministic job keys (`risk-eval:${application.id}:${version}`) and worker-level checks prevent duplicate processing.
  - **Resilience**: Configured with 3 retry attempts and exponential backoff.
- **Audit Trail & Sensitive Data Protection**:
  - Immutable audit logging in PostgreSQL (`audit_logs`) capturing entity, action, user, and state snapshots.
  - Centralized sensitive data masking utility (`maskTaxId()`) redacting Tax IDs (`***-**-1234`).
  - Passwords and raw tokens are excluded from entities and audit logs.
- **OpenAPI / Swagger Documentation**: Interactive API testing sandbox at `/api/docs`.

---

## Quickstart (Local Development)

### Prerequisites
- Node.js 20+ (Node 24 supported)
- Docker & Docker Compose

### 1. Start Backing Infrastructure
Spin up PostgreSQL 16 and Redis 7 in Docker:
```bash
docker compose up -d
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Database Migrations
Execute reviewed TypeORM migrations against PostgreSQL:
```bash
npm run migration:run
```

### 4. Seed Test Accounts
Preload the platform with test users:
```bash
npm run seed
```

### 5. Start the Server
```bash
npm run start:dev
```
- API running at: `http://localhost:3000`
- Interactive Swagger documentation at: `http://localhost:3000/api/docs`

---

## Pre-Seeded Test Accounts

All accounts share the default password: **`Password123!`**

| Role | Email | Purpose / Testing Scenario |
| :--- | :--- | :--- |
| **`ADMIN`** | `admin@platform.test` | Full operational oversight, application assignment, decisions. |
| **`REVIEWER`** | `reviewer@platform.test` | Reviews applications, records risk decisions (`APPROVE`, `REJECT`, `REQUEST_INFO`). |
| **`SALES`** | `sales1@platform.test` | Creates and manages draft applications (User A). |
| **`SALES`** | `sales2@platform.test` | Separate sales agent used to verify object-level security isolation (User B). |

---

## Running Automated Tests

### Unit Tests
Tests core business rules, state machine invariants, and authorization logic:
```bash
npm test
```

### Integration / E2E Tests (Supertest)
Boots the full NestJS application, hits live HTTP endpoints, and **explicitly proves that authorization rules cannot be bypassed**:
```bash
npm run test:e2e
```

## Engineering Process & AI Disclosure

- **System Design & Implementation**: The domain modeling, state lifecycle, object-level authorization, and Git branching workflow were directed and implemented step-by-step according to the platform specification.
- **AI Tool Usage**: Claude was used selectively as an interactive pair-programming tool for NestJS syntax lookups, decorator references, and boilerplate scaffolding.
- **Verification**: Every database migration, API endpoint, and authorization rule was manually verified in PostgreSQL and Swagger, and comprehensively covered by unit and E2E integration test suites.
