# Local Service Request Management System

A production-ready, minimalist, full-stack **Local Service Request Management System** designed for a college cloud architecture project. Built with **React (Vite) + Tailwind CSS**, an **Express.js (Node)** backend, and a deployed **Supabase PostgreSQL** cloud database.

---

## 🚀 Features & Architecture

- **Minimalist & Modern UI**: Built with Tailwind CSS, Plus Jakarta Sans typography, and Lucide icons.
- **Strictly 3 Service Categories**: Restricted to exactly:
  1. ⚡ **Electrician** (`id: 1`)
  2. 🔧 **Plumber** (`id: 2`)
  3. ❄️ **AC Repair** (`id: 3`)
- **Three Core Role Portals**:
  - **Customer Portal**: Select from the 3 categories, submit service requests with location and preferred date, track live request status (`PENDING` ➔ `ACCEPTED` ➔ `IN_PROGRESS` ➔ `COMPLETED`), and submit 1–5 star reviews with comments.
  - **Provider Portal**: Filter available requests in their specialized trade, claim and accept jobs, update status in real-time (`ACCEPTED` ➔ `IN_PROGRESS` ➔ `COMPLETED`), and toggle active working availability.
  - **Admin Portal**: Executive KPI metrics (Total, Pending, Active, Completed, Providers, Average System Rating), category distribution breakdown, request dispatching & manual technician assignment modal, and chronological audit log.
- **1-Click Demo Role Switcher**: Instant switching between Customer, Electrician, Plumber, AC Repair, and Admin accounts directly from the top navigation bar for seamless live presentations and evaluations.
- **Robust Database Pooling**: Configured with `pg.Pool` connected to Supabase's IPv4 connection pooler (`aws-0-ap-northeast-2.pooler.supabase.com`) with SSL enabled.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Lucide React |
| **Backend** | Express.js 5, Node.js, `pg` (PostgreSQL client pool), `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv` |
| **Database** | Supabase Cloud PostgreSQL (Schema: `users`, `service_categories`, `service_providers`, `service_requests`, `assignments`, `reviews`) |

---

## ⚡ Local Execution Commands

### Option A: Run Concurrently with One Command (Recommended)

From the project root directory (`LocalServiceSystem`):

```bash
# 1. Run both backend & frontend concurrently:
npm run dev
```

- **Backend** will run on: `http://localhost:8080` (Health check: `http://localhost:8080/health`)
- **Frontend** will run on: `http://localhost:5173` (with `/api` proxied to backend)

---

### Option B: Run in Separate Terminals

#### Terminal 1 — Backend:
```bash
cd backend
npm start
```

#### Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
```

---

## 📦 Database Seeding & Demo Accounts

To reset or seed realistic demo accounts and sample service requests at any time:

```bash
npm run seed
```

### Pre-configured Demo Accounts:
| Role | Email | Password | Trade / Specialty |
|---|---|---|---|
| **Customer** | `customer@demo.com` | `password123` | N/A |
| **Provider** | `electrician@demo.com` | `password123` | ⚡ Electrician |
| **Provider** | `plumber@demo.com` | `password123` | 🔧 Plumber |
| **Provider** | `ac_tech@demo.com` | `password123` | ❄️ AC Repair |
| **Admin** | `admin@demo.com` | `password123` | System Administrator |

---

## 📡 API Endpoints Reference

### Health Check
- `GET /health` — DB pool status & server health

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new Customer or Provider
- `POST /api/auth/login` — Sign in with email and password
- `GET /api/auth/me` — Authenticated profile
- `GET /api/auth/demo-users` — Available demo accounts for quick switching

### Categories (`/api/categories`)
- `GET /api/categories` — Returns strictly the 3 allowed categories

### Service Requests (`/api/requests`)
- `POST /api/requests` — Customer creates service request
- `GET /api/requests` — Filtered by role (Customer sees own; Provider sees category/assigned; Admin sees all)
- `GET /api/requests/:id` — Request details with assignment & review
- `PATCH /api/requests/:id/status` — Update status (`ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
- `POST /api/requests/:id/assign` — Assign technician to request

### Providers (`/api/providers`)
- `GET /api/providers` — List providers, specialty, rating, and completed jobs
- `PATCH /api/providers/availability` — Toggle technician availability

### Reviews (`/api/reviews`)
- `POST /api/reviews` — Customer submits 1–5 star rating and comment
- `GET /api/reviews` — Get reviews by provider or request

### Admin (`/api/admin`)
- `GET /api/admin/stats` — Dashboard statistics
- `GET /api/admin/activity` — Chronological audit feed
- `GET /api/admin/users` — List registered users
