# VendorBridge

Procurement ERP for SMBs. Build RFQs, collect vendor quotations, issue purchase orders, and track invoices in one place.

Built for the Odoo Hackathon. Demo data, 5 user roles, role-scoped access, PDF export, in-app password reset, RFQ attachments, vendor rating.

## Stack

- Next.js 16 (App Router, async params/searchParams)
- React 19
- TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui (Base UI)
- Drizzle ORM + better-sqlite3
- Better Auth (credential + session)
- Recharts (analytics)
- jsPDF (client-side PDF generation)
- Zod (validation)

## Prerequisites

- Bun 1.3+ (recommended) **or** Node.js 20+ with npm/pnpm
- Git

## Setup

```bash
# 1. clone
git clone <your-repo-url>
cd odoo-hackathon

# 2. install dependencies
bun install
# or: npm install / pnpm install

# 3. env file
cp .env.example .env
# then edit .env and set BETTER_AUTH_SECRET to a random 32+ char string
# a dev one is already committed to .env for the demo — replace before deploying

# 4. push the schema to sqlite
bun run db:push
# or: npx drizzle-kit push

# 5. seed demo data + demo users
bun run seed
bun run seed:users

# 6. start the dev server
bun run dev
# or: npm run dev
```

Open <http://localhost:3000>.

## Demo accounts

All passwords are `demo1234`.

| Email | Role | What they can do |
|---|---|---|
| `admin@vendorbridge.io` | Admin | Manage users + vendors, view analytics |
| `manager@vendorbridge.io` | Manager | Review RFQs, approve quotations, view analytics |
| `officer@vendorbridge.io` | Procurement Officer | Create RFQs, compare quotes, raise POs |
| `finance@vendorbridge.io` | Finance | Approve POs, manage invoices, view reports |
| `vendor@vendorbridge.io` | Vendor | View assigned RFQs, submit quotations |

There's a one-click "Sign in as..." row on the login page.

## Roles & permissions

Five roles, each scoped tightly per the problem statement. `lib/rbac.ts` is the source of truth.

- **Admin** — users + vendors + analytics. Cannot create RFQs/POs.
- **Manager** — review pipeline, approve RFQs/POs, analytics. Cannot create vendors/RFQs/POs.
- **Procurement Officer** — full RFQ → PO workflow. Cannot approve or create vendors.
- **Finance** — PO approval + invoice management + reports. Cannot create RFQs/vendors.
- **Vendor** — only sees RFQs they were invited to, submits quotations. No admin pages.

## Available scripts

```bash
bun run dev                # dev server
bun run build              # production build
bun run start              # serve production build
bun run lint               # eslint
bun run db:push            # sync drizzle schema → sqlite.db
bun run seed               # seed vendors, RFQs, quotations, POs, invoices
bun run seed:users         # seed 5 demo users (idempotent)
bun run test:rbac          # 10 tests: schema + role permissions
bun run test:e2e           # 16 tests: HTTP routes + validation
bun run test:guards        # 4 tests: server-action auth guards
bun run test:actions       # 17 tests: permission + zod enforcement
bun run test:workflow      # 11 tests: full RFQ → PO → invoice flow
bun run test:pdf           # 4 tests: PO/Invoice/RFQ/Quotation PDFs
bun run test:report        # 6-page report PDF
bun run test:password      # 11 tests: in-app password reset
bun run test:role-scope    # 5 tests: roles match problem-statement spec
```

## Project layout

```
app/
  (auth)/          login, register, forgot-password
  (dashboard)/     dashboard, vendors, rfqs, quotations, POs, invoices, reports, settings
  api/auth/        Better Auth handler
components/
  ui/              shadcn primitives + star-rating
  layout/          sidebar, top bar
  rfqs/            RFQ attachments uploader
  vendors/         vendor rating cell + editor
  settings/        profile + password form
  reports/         6-page PDF export
lib/
  db/              drizzle schema + singleton (PRAGMA foreign_keys=ON)
  rbac.ts          roles × permissions, requirePermission helper
  validation.ts    zod schemas for every form
  actions.ts       every server action (RBAC + zod + audit log)
  pdf.ts           PO / Invoice / RFQ / Quotation / Report PDF generators
  queries.ts       read-only query helpers (dashboard, report)
  auth.ts          Better Auth config
scripts/           seeders + test suites
public/uploads/    RFQ attachments (gitignored, .gitkeep preserved)
```

## Data model

SQLite, single file (`sqlite.db`). Foreign keys are ON; cascading deletes are explicit. Indexes on every join/filter column. See `lib/db/schema.ts` for the full picture.

Tables: `user`, `session`, `account`, `vendors`, `rfqs`, `rfqLineItems`, `rfqVendors`, `rfqAttachments`, `quotations`, `quotationLineItems`, `purchaseOrders`, `poItems`, `invoices`, `activityLogs`.

## Security notes

- All server actions verify role + permission before touching the DB (`requirePermission`).
- All inputs go through zod schemas before being persisted (`lib/validation.ts`).
- Passwords are scrypt-hashed via Better Auth and stored on the `account` table.
- Password reset is in-app only — the user enters email + new password. Sessions are invalidated. (No email integration in the spec.)
- No file path is ever reflected back to the client. Uploaded filenames are sanitized + stored under a crypto hash (`/public/uploads/rfq/`).
- `.env` is gitignored. Don't commit your `BETTER_AUTH_SECRET`.

## Environment variables

```
BETTER_AUTH_SECRET=<32+ random chars>   # required, used to sign sessions
BETTER_AUTH_URL=http://localhost:3000   # base URL of the app
```

Generate a secret: `openssl rand -base64 32`.

## Things this project does not do

- No email sending. The problem statement didn't require it. Reset is in-app; the "Email" button on PDFs opens `mailto:`.
- No payment integration. PO/invoice status is tracked manually.
- No multi-tenant separation. Single org per deployment.
- No dark mode. Light theme only — that's a deliberate design choice for the procurement-ledger aesthetic.

## Setting up with a coding agent

Paste this into your assistant:

> ```
> git clone https://github.com/DevAgarwal2/vendorbridge-x-odooksv.git
> cd vendorbridge-x-odooksv
> bun install
> cp .env.example .env
> # set BETTER_AUTH_SECRET in .env to: openssl rand -base64 32
> npm run db:push
> npm run seed
> npm run seed:users
> npm run dev
> ```
> Open <http://localhost:3000>. Demo logins (password `demo1234`): `admin@`, `manager@`, `officer@`, `finance@`, `vendor@vendorbridge.io` (all `vendorbridge.io`).
> Stack: Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui (Base UI), Drizzle + better-sqlite3, Better Auth, Zod. Use `bun`. Read `README.md`, `lib/db/schema.ts`, `lib/rbac.ts`, and `lib/actions.ts` before changing anything. Run `npm run lint` and `npx tsc --noEmit` before declaring done.
