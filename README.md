<p align="center">
  <img src="public/logo.png" alt="LeadForge Logo" width="120" height="120" />
</p>

<h1 align="center">LeadForge</h1>
<p align="center"><strong>Intelligent Lead Distribution Engine</strong></p>

<p align="center">
  A production-grade mini lead distribution system with fair allocation, real-time dashboards, webhook idempotency, and concurrency-safe operations.<br/>
  <em>Inspired by <a href="https://prowider.co">Prowider</a></em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/SSE-Real_Time-6366f1?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-22c55e?style=flat-square" />
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [Running Locally](#running-locally)
- [API Reference](#api-reference)
- [Allocation Algorithm](#allocation-algorithm)
- [Concurrency Handling](#concurrency-handling)
- [Webhook Idempotency](#webhook-idempotency)
- [Real-Time Updates](#real-time-updates)
- [Additional Engineering Features](#additional-engineering-features)
- [Screenshots](#screenshots)
- [Project Structure](#project-structure)

---

## Overview

LeadForge is a simplified version of a real-world **lead generation and distribution system**. When a customer submits a service enquiry:

1. The system saves the enquiry as a **lead**
2. The lead is **automatically assigned** to **exactly 3 providers** based on business rules
3. **Mandatory providers** always receive certain service leads
4. **Remaining slots** are filled via **fair round-robin rotation**
5. Provider dashboards update in **real-time** without page refresh
6. **Webhook idempotency** ensures payment confirmations are processed exactly once

---

## Live Demo

> 🔗 **[Live Demo URL]** — *(Add your deployment URL here)*

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) | Full-stack React framework |
| **Language** | TypeScript | Type safety across frontend & backend |
| **Database** | MongoDB Atlas | Cloud-hosted document database |
| **ORM** | Mongoose | Schema validation & atomic operations |
| **Validation** | Zod | Runtime type checking for API inputs |
| **Real-Time** | Server-Sent Events (SSE) | Live dashboard updates |
| **Styling** | Inline Styles + Tailwind | Dark theme UI |

---

## Architecture

```
CLIENT (Next.js)
├── /request-service     → Customer lead form
├── /dashboard           → Provider dashboard (SSE real-time)
└── /test-tools          → Webhook simulation & concurrency testing

API LAYER (Next.js API Routes)
├── POST /api/leads      → Create lead + trigger allocation
├── GET  /api/providers  → List providers with quota
├── GET  /api/providers/[id]/sse → SSE stream
├── POST /api/webhooks/payment   → Idempotent webhook
├── POST /api/test/generate-leads → Concurrent test
└── GET  /api/health     → System health check

ALLOCATION ENGINE
├── Phase 1: Mandatory Assignment (business rules)
├── Phase 2: Fair Round-Robin (persisted rotation state)
├── Atomic MongoDB operations for concurrency safety
└── Audit logging for every decision

DATABASE (MongoDB Atlas)
├── services          → 3 service types
├── providers         → 8 providers (quota: 10 each)
├── leads             → Customer enquiries
├── leadassignments   → Provider ↔ Lead mapping
├── rotationstates    → Persisted round-robin index
├── webhookevents     → Idempotency tracking
└── auditlogs         → Full audit trail
```

---

## Features

### ✅ Feature 1 — Public Customer Form (`/request-service`)
- **Fields**: Name, Phone Number, City, Service Type (dropdown), Description
- **Duplicate Rule**: Same phone + same service = rejected (enforced at **database level** via unique compound index)
- **Validation**: Zod schema validation with 10-digit Indian phone number format
- Auto-triggers lead allocation after submission

### ✅ Feature 2 — Lead Distribution (Core Logic)
- Exactly **3 providers** assigned per lead
- **Mandatory rules** enforced first
- **Fair round-robin rotation** for remaining slots
- Monthly quota (10) respected with atomic operations
- Concurrency-safe under simultaneous requests

### ✅ Feature 3 — Provider Dashboard (`/dashboard`)
- Sidebar with all 8 providers
- Remaining quota + leads received count
- Full assigned leads table with assignment type

### ✅ Feature 4 — Real-Time Dashboard Update
- **Server-Sent Events (SSE)** connection per provider
- Dashboard auto-updates within 2 seconds of new lead
- Live connection status indicator
- No page refresh needed

### ✅ Feature 5 — Webhook Simulation (`/test-tools`)
- **Reset Provider Quota** — simulates successful payment
- **Webhook Burst (5x same key)** — tests idempotency
- **Generate 10 Leads** — tests concurrency
- Activity log showing all results

---

## Setup & Installation

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org))
- **MongoDB Atlas** free account ([create one](https://www.mongodb.com/atlas))

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/leadforge.git
cd leadforge

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your MongoDB Atlas URI

# 4. Seed the database
npm run seed

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Environment Variables

Create a `.env.local` file with:

```env
# DATABASE (REQUIRED)
# Get from: https://cloud.mongodb.com → Database → Connect → Drivers
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/leadforge?retryWrites=true&w=majority

# APP CONFIG
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# RAZORPAY (Test Mode — for webhook simulation)
# Get from: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# SSE CONFIG
SSE_POLL_INTERVAL_MS=2000
```

---

## Database Seeding

```bash
npm run seed
```

This creates:
- **3 Services**: Service 1, Service 2, Service 3
- **8 Providers**: Provider 1–8 (quota: 10 each)
- **Rotation State**: Initialized at index 0 for all services
- **Database Indexes**: All unique and compound indexes

---

## Running Locally

```bash
npm run dev
```

| Route | Purpose |
|-------|---------|
| `/` | Landing page with system stats |
| `/request-service` | Customer service request form |
| `/dashboard` | Provider dashboard with real-time updates |
| `/test-tools` | Webhook simulation & concurrency testing |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/services` | List all services |
| `POST` | `/api/leads` | Create lead + trigger allocation |
| `GET` | `/api/leads` | List recent leads |
| `GET` | `/api/providers` | List all providers with quota |
| `GET` | `/api/providers/[id]` | Provider details + assigned leads |
| `GET` | `/api/providers/[id]/sse` | SSE stream for real-time updates |
| `POST` | `/api/webhooks/payment` | Idempotent webhook for quota reset |
| `POST` | `/api/test/generate-leads` | Generate 10 concurrent test leads |
| `POST` | `/api/test/reset-quotas` | Reset all provider quotas |
| `GET` | `/api/health` | System health check |
| `GET` | `/api/stats` | System-wide statistics |

---

## Allocation Algorithm

### Two-Phase Approach

**Phase 1 — Mandatory Assignment**:

| Service | Mandatory Provider(s) |
|---------|----------------------|
| Service 1 | Provider 1 |
| Service 2 | Provider 5 |
| Service 3 | Provider 1 AND Provider 4 |

**Phase 2 — Fair Round-Robin**:

| Service | Rotation Pool |
|---------|--------------|
| Service 1 | Provider 2, 3, 4 |
| Service 2 | Provider 6, 7, 8 |
| Service 3 | Provider 2, 3, 5, 6, 7, 8 |

The rotation index is **persisted in MongoDB** (`rotationstates` collection), ensuring fair distribution survives server restarts.

---

## Concurrency Handling

### Multi-Layer Defense

1. **Atomic `findOneAndUpdate`** — Quota increment only succeeds if provider is under limit:
   ```javascript
   Provider.findOneAndUpdate(
     { _id: providerId, currentMonthLeads: { $lt: monthlyQuota } },
     { $inc: { currentMonthLeads: 1 } }
   );
   ```

2. **Unique Compound Indexes** — Database-level prevention:
   - `leads.{phoneNumber, serviceId}` — No duplicate leads
   - `leadassignments.{leadId, providerId}` — No double assignments

3. **Rollback on Failure** — If assignment creation fails after quota increment, the quota is atomically decremented back.

---

## Webhook Idempotency

### How It Works

1. Every webhook must include a **UUID `idempotencyKey`**
2. System attempts to insert a `WebhookEvent` document (unique index on key)
3. If key already exists → **duplicate detected**, return cached response
4. If key is new → **process the webhook**, mark as `processed`

### Proof

The **Test Tools** page has a "Fire 5 Webhooks (Same Key)" button. Running it shows:
- ✅ 1 processed
- 🔄 4 deduplicated
- Only 1 quota reset happens, regardless of how many times the webhook is called

---

## Real-Time Updates

### Server-Sent Events (SSE)

- Dashboard connects to `/api/providers/[id]/sse`
- Server polls database every 2 seconds
- Only sends data when changes are detected
- Built-in auto-reconnection
- Live connection status indicator in dashboard navbar

### Why SSE over WebSocket?

- One-way communication is sufficient (server → client)
- Built-in auto-reconnect (no manual reconnection logic)
- Works with standard HTTP infrastructure
- Simpler to implement and maintain

---

## Additional Engineering Features

These features go **beyond the assignment requirements** to demonstrate production-readiness:

| Feature | Description |
|---------|-------------|
| 🆔 **Request ID Tracking** | Every API request gets a unique UUID for log tracing |
| 📋 **Audit Logging** | Every lead creation, assignment, and webhook is logged |
| 🛡️ **Rate Limiting** | IP-based rate limiting (10 req/min for leads, 30/min for webhooks) |
| ❤️ **Health Check** | `GET /api/health` returns database status, uptime, version |
| 📊 **System Stats** | `GET /api/stats` returns aggregate metrics |
| ✅ **Zod Validation** | Type-safe runtime validation for all API inputs |
| 🔄 **Connection Pooling** | Mongoose connection reuse across serverless invocations |
| ⚙️ **Graceful Error Handling** | Consistent error format with codes, messages, and details |

---

## Project Structure

```
leadforge/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── health/route.ts       # Health check
│   │   │   ├── leads/route.ts        # Lead CRUD + allocation
│   │   │   ├── providers/
│   │   │   │   ├── route.ts          # List providers
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # Provider details
│   │   │   │       └── sse/route.ts  # SSE real-time stream
│   │   │   ├── services/route.ts     # List services
│   │   │   ├── stats/route.ts        # System statistics
│   │   │   ├── test/
│   │   │   │   ├── generate-leads/route.ts  # Concurrent test
│   │   │   │   └── reset-quotas/route.ts    # Quota reset
│   │   │   └── webhooks/
│   │   │       └── payment/route.ts  # Idempotent webhook
│   │   ├── dashboard/page.tsx        # Provider dashboard
│   │   ├── request-service/page.tsx  # Customer form
│   │   ├── test-tools/page.tsx       # Testing panel
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Design tokens
│   ├── lib/
│   │   ├── allocation.ts            # Core allocation engine
│   │   ├── db.ts                    # MongoDB connection
│   │   ├── rate-limit.ts            # Rate limiter
│   │   ├── rules.ts                 # Business rules config
│   │   └── validations.ts           # Zod schemas
│   ├── models/
│   │   ├── AuditLog.ts              # Audit trail
│   │   ├── Lead.ts                  # Lead document
│   │   ├── LeadAssignment.ts        # Assignment junction
│   │   ├── Provider.ts              # Provider document
│   │   ├── RotationState.ts         # Round-robin state
│   │   ├── Service.ts              # Service document
│   │   └── WebhookEvent.ts         # Webhook idempotency
│   └── scripts/
│       └── seed.ts                  # Database seeder
├── ENGINEERING.md                   # Detailed engineering docs
├── .env.example                     # Environment template
├── package.json
└── README.md                        # This file
```

---

## Author

**Mayank Singh** — Built with ❤️ as a full-stack engineering assignment

📧 Inspired by [Prowider](https://prowider.co) — connecting users with local service professionals

---

<p align="center">
  <sub>LeadForge — Where leads meet their perfect providers ⚡</sub>
</p>
