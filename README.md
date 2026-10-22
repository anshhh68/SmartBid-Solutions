# SmartBid Solutions — Modern Government Tender & GeM Management Platform

A feature-rich, high-performance web platform built to completely replace the legacy Google Sites presence of **SmartBid Solutions** (Ahmedabad, Gujarat) with an enterprise-grade portal modeled after modern tender discovery aggregators like Tender18, but with bespoke UI/UX, transparent service portfolios, user dashboards, and an administration CRM.

---

## 🌟 Key Highlights & Capabilities

### 1. Public Discovery & Marketing Portal
- **High-Converting Hero & Visual Identity:** Shield emblem branding with deep navy (`#1A5C8A`), sky blue (`#0EA5E9`), and amber gold (`#F59E0B`) color system.
- **Tender Discovery Engine (`/tenders`):** Live full-text search across titles, authority departments, and reference numbers. Multi-faceted filters by category, location, state, status (`ACTIVE`, `CLOSED`), value range, and closing date.
- **Tender Detail Showcase (`/tenders/:id`):** Real-time countdown clock, scope of work, key milestone dates (opening, closing, pre-bid), eligibility criteria, official documents/NIT notices, and instant 1-click WhatsApp enquiry assistance.
- **Service Portfolios (`/services`, `/services/:slug`):** Dedicated landing pages for:
  - GeM Registration & Profile Management
  - E-Tender Bidding & Tender Preparation
  - Vendor Assessment & OEM Approval
  - Class-3 Digital Signature Certificate (DSC)
  - ISO Certification Consulting (9001, 14001, 27001, 45001)
  - Tender Document Scrutiny & Consortium Advisory
- **Company Profile (`/about`):** Detailed narrative of SmartBid Solutions, mission, values, core milestones, and executive leadership.
- **Contact & Inquiry Desk (`/contact`):** Lead intake form, direct phone lines (+91 70162 35257 / +91 85117 22588), WhatsApp integration, and Google Maps embed.
- **FAQ Knowledge Base (`/faq`):** Interactive accordion grouped by GeM, Bidding, and General procurement queries.
- **Compliance & Legal (`/privacy-policy`, `/terms-and-conditions`):** Dynamic Markdown-rendered legal pages.

### 2. User & Bidder Dashboard (`/dashboard`)
- **Executive Metric Overview:** Real-time count of saved tenders, active alerts, and support tickets.
- **Upcoming Deadlines Feed:** Automatically tracks closing dates on bookmarked tenders with urgency alerts (e.g. "2 days left").
- **Saved Tenders (`/dashboard/saved`):** Bookmark manager with quick links to view or remove opportunities.
- **Procurement Keyword Alerts (`/dashboard/alerts`):** Custom keywords, categories, and state criteria configuration for proactive opportunity tracking.
- **Consultation Tickets (`/dashboard/enquiries`):** Status tracking (`NEW`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) with advisor notes and direct WhatsApp follow-up.
- **Profile & Security (`/dashboard/profile`):** Update personal details, mobile/WhatsApp coordinates, and change password.

### 3. Enterprise Administration CRM (`/admin`)
- **Executive Operations Center (`/admin`):** Live charts of platform operations, new lead feeds, closing tender alerts, and system health.
- **Tender Registry (`/admin/tenders`):** Full CRUD for tenders, publication status toggle, and batch JSON import.
- **Tender Form (`/admin/tenders/new`, `/admin/tenders/:id/edit`):** Manage tender details, dates, budgets, EMD, and document attachments.
- **Categories Taxonomy (`/admin/categories`):** Industry category management with automatic slug generation and tender counters.
- **Lead & Enquiry Management (`/admin/enquiries`):** Lead intake CRM with status assignment, internal team notes, and quick caller actions.
- **User Account Directory (`/admin/users`):** View registered bidders, roles, engagement levels, and account activation toggle.
- **Service Content Editor (`/admin/services`):** Modify public service offerings and descriptions.
- **Subscription Packages Editor (`/admin/plans`):** Adjust pricing, feature sets, and "Most Popular" tags.
- **Client Testimonials (`/admin/testimonials`):** Review and feature client testimonials with star ratings.
- **FAQ Management (`/admin/faqs`):** Add and organize questions by category.
- **Site Settings (`/admin/settings`):** Manage corporate addresses, phone numbers, WhatsApp lines, and footer messaging.
- **Immutable Audit Trail (`/admin/audit-logs`):** Security log capturing operator actions, timestamps, and target entities.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + TypeScript + Vite |
| **Styling & UI** | Tailwind CSS v4 + Lucide React Icons |
| **State & Data Fetching** | TanStack React Query v5 + Axios |
| **Forms & Validation** | React Hook Form + Zod |
| **Data Visualization** | Recharts |
| **Notifications** | React Hot Toast |
| **Routing** | React Router DOM v7 |
| **Backend Runtime** | Node.js + Express.js |
| **Database ORM** | PostgreSQL + Prisma ORM |
| **Authentication** | JWT (JSON Web Tokens) + bcryptjs password hashing |
| **Security & Middleware** | Role-based Authorization (`USER`, `ADMIN`), CORS, Rate-limiting |

---

## 📁 Repository Structure

```
d:/Smart Bid Solutions wp/
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Footer, UI primitives
│   │   ├── contexts/        # AuthContext (JWT management & session sync)
│   │   ├── layouts/         # PublicLayout, DashboardLayout, AdminLayout
│   │   ├── lib/             # Axios API client instance with auth interceptor
│   │   ├── pages/
│   │   │   ├── public/      # Home, TenderList, TenderDetail, Services, Pricing, About, Contact, FAQ, StaticPage
│   │   │   ├── auth/        # Login, Register
│   │   │   ├── dashboard/   # Dashboard, SavedTenders, MyAlerts, MyEnquiries, Profile
│   │   │   └── admin/       # AdminDashboard, AdminTenders, AdminTenderForm, AdminEnquiries, AdminUsers, AdminServices, AdminPlans, AdminSettings, AdminTestimonials, AdminFAQs, AdminCategories, AdminAuditLogs
│   │   ├── App.tsx          # Master routing configuration with code splitting
│   │   ├── index.css        # Tailwind CSS imports & theme tokens
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── controllers/     # Controller business logic
│   │   ├── middleware/      # Auth, role check, error handler
│   │   ├── routes/          # auth, tenders, enquiries, users, admin, services, plans, public
│   │   ├── utils/           # Winston logger, helpers
│   │   └── index.js         # Express app initialization
│   ├── prisma/
│   │   ├── schema.prisma    # Complete relational database models
│   │   └── seed.js          # Database seeder with realistic mock tenders, categories, services, plans
│   ├── .env                 # Environment variables
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **PostgreSQL** instance running locally or hosted on Supabase / Neon / AWS RDS

---

### Step 1: Backend Setup & Database Initialization

1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Configure `.env` in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:password@localhost:5432/smartbid_db?schema=public"
   JWT_SECRET="smartbid_super_secret_jwt_key_change_in_production_2025"
   JWT_EXPIRES_IN="7d"
   FRONTEND_URL="http://localhost:5173"
   ```

3. Push the Prisma schema and seed database with starter data:
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Start the backend API server:
   ```bash
   npm run dev
   # Server runs at http://localhost:5000
   ```

---

### Step 2: Frontend Setup & Development Server

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   # Portal runs at http://localhost:5173
   ```

3. (Optional) Run production build validation:
   ```bash
   npm run build
   ```

---

## 🔑 Demo Access Credentials

The database seeder provisions two ready-to-use accounts for evaluation:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@smartbidsolutions.in` | `Admin@123` | Full access to `/admin` CRM, tenders, CMS & user management |
| **Bidder / User** | `demo@example.com` (or `user@example.com`) | `Demo@1234` (or `User@123`) | Access to `/dashboard`, saved tenders, custom alerts & enquiries |

*Note: The Login page also features "Admin Demo" and "User Demo" 1-click buttons for rapid testing.*

---

## 📞 Business Coordinates (SmartBid Solutions)
- **Office Address:** B-402, Titanium City Centre, Prahlad Nagar, Ahmedabad, Gujarat 380015
- **Phone Lines:** +91 70162 35257 | +91 85117 22588
- **Email:** info@smartbidsolutions.in
- **Services:** GeM Portal Registration, E-Tender Bid Preparation, Class-3 DSC, ISO Consulting
