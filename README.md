# VendorBridge

Procurement ERP for SMBs. Build RFQs, collect vendor quotations, issue purchase orders, and track invoices in one place.

Built for the Odoo Hackathon. Demo data, 4 user roles matching the problem statement, role-scoped access, PDF export, in-app password reset, RFQ attachments, vendor rating.

## Stack

- Next.js 16 (App Router, async params/searchParams)
- React 19
- TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui (Base UI)
- Drizzle ORM + better-sqlite3
- Better Auth 1.6.14 (credential + session, scrypt)
- Recharts (analytics)
- jsPDF (client-side PDF generation)
- Zod (validation)

## Prerequisites

- **Bun 1.3+** (recommended) — works out of the box, fastest install
- **OR** Node.js 20+ with npm or pnpm
- Git
- macOS, Linux, or Windows (WSL recommended for Windows)

## Quick start (Bun — recommended)

```bash
# 1. clone
git clone https://github.com/DevAgarwal2/vendorbridge-x-odooksv.git
cd vendorbridge-x-odooksv

# 2. install dependencies + trust postinstall scripts (needed for better-sqlite3)
bun install
bun pm trust --all
# `bun pm trust --all` lets better-sqlite3 download its native binding.
# Without this step you'll see "Could not locate the bindings file" later.

# 3. env file
cp .env.example .env
# Generate a secret (or use the one already in .env.example for the demo):
#   openssl rand -base64 32
# Paste it into .env as BETTER_AUTH_SECRET=...

# 4. push the drizzle schema to sqlite.db (creates the DB on first run)
bun run db:push
# should print: [i] No changes detected   (or "create table ..." on first run)

# 5. start the dev server in one terminal — leave it running
bun run dev
# should print: ✓ Ready in ~2s, listening on http://localhost:3000

# 6. in a SECOND terminal, seed the app data + demo users
bun run seed          # vendors, RFQs, quotations, POs, invoices
bun run seed:users    # 4 demo users (admin / manager / officer / vendor, all password: demo1234)
# Note: seed:users hits the live /api/auth/sign-up/email endpoint, so the
# dev server from step 5 must be running.

# 7. open the app
open http://localhost:3000
# (or just paste http://localhost:3000 in your browser)
```

That's it. The login page has one-click "Sign in as…" buttons for each demo role.

## Quick start (npm / pnpm)

```bash
git clone https://github.com/DevAgarwal2/vendorbridge-x-odooksv.git
cd vendorbridge-x-odooksv

npm install
# or: pnpm install

cp .env.example .env
# generate a secret and paste it:
#   openssl rand -base64 32

npm run db:push

# in one terminal:
npm run dev

# in a second terminal (dev server must be running):
npm run seed
npm run seed:users

open http://localhost:3000
```

## Demo accounts

All passwords are `demo1234`.

| Email | Role | What they can do |
|---|---|---|
| `admin@vendorbridge.io` | Admin | Manage users + vendors, view analytics |
| `manager@vendorbridge.io` | Manager | Approve quotations, monitor workflow, mark invoices paid |
| `officer@vendorbridge.io` | Procurement Officer | Create RFQs, compare quotes, generate POs + invoices |
| `vendor@vendorbridge.io` | Vendor | View assigned RFQs, submit quotations |

There's a one-click "Sign in as…" row on the login page. If a demo login fails, re-run `npm run seed:users` — it deterministically resets all four demo passwords to `demo1234`.

## Roles & permissions

Four roles, each scoped tightly to the problem statement. `lib/rbac.ts` is the source of truth.

- **Admin** — manage users, manage vendors, view analytics. Cannot create RFQs/POs.
- **Manager / Approver** — approve or reject procurement requests, monitor the workflow end-to-end, mark invoices paid. Cannot create vendors/RFQs/POs.
- **Procurement Officer** — full RFQ → PO → invoice workflow. Cannot approve, cannot create vendors.
- **Vendor** — only sees RFQs they were invited to, submits quotations, views their own POs. No admin pages.

When a user tries to do something outside their role, the action returns an `ActionResult` with an error message that names exactly which role can do it (e.g. `"This action can only be performed by Procurement Officer. You are signed in as Admin."`). The UI shows this as a toast.

## Available scripts

```bash
bun run dev                # dev server (http://localhost:3000)
bun run build              # production build
bun run start              # serve production build
bun run lint               # eslint (must stay clean)
bun run db:push            # sync drizzle schema → sqlite.db
bun run seed               # seed vendors, RFQs, quotations, POs, invoices
bun run seed:users         # seed 4 demo users (idempotent — re-run to fix login issues)
bun run test:rbac          # schema + role permission tests
bun run test:e2e           # HTTP routes + validation
bun run test:actions       # server-action permission + zod enforcement
bun run test:workflow      # full RFQ → PO → invoice flow
bun run test:pdf           # PO/Invoice/RFQ/Quotation PDFs
bun run test:report        # 6-page report PDF
bun run test:password      # in-app password reset
bun run test:role-scope    # 4 roles match problem-statement spec
bun run test:alert         # out-of-scope action error messages
```

## Project layout

```
app/
  (auth)/          login, register, forgot-password
  (dashboard)/     dashboard, vendors, rfqs, quotations, POs, invoices, reports, settings
  api/auth/        Better Auth handler
components/
  ui/              shadcn primitives + star-rating + realtime-search
  layout/          sidebar, top bar
  quotations/      QuotationActions (approve + generate-PO buttons)
  rfqs/            RFQ attachments uploader
  vendors/         vendor rating cell + editor
  settings/        profile + password form
  reports/         6-page PDF export
lib/
  db/              drizzle schema + singleton (PRAGMA foreign_keys=ON)
  rbac.ts          pure: types, ROLE_PERMISSIONS, hasPermission, getRolesWithPermission
  rbac-server.ts   server-only: requireUser, requirePermission, AuthError
  validation.ts    zod schemas for every form
  actions.ts       every server action (RBAC + zod + audit log)
  pdf.ts           PO / Invoice / RFQ / Quotation / Report PDF generators
  queries.ts       read-only query helpers (dashboard, report)
  auth.ts          Better Auth config
  session.ts       better-auth session helper (server-only)
scripts/           seeders + test suites
public/uploads/    RFQ attachments (gitignored, .gitkeep preserved)
```

## Data model

SQLite, single file (`sqlite.db`). Foreign keys are ON; cascading deletes are explicit. Indexes on every join/filter column. See `lib/db/schema.ts` for the full picture.

Tables: `user`, `session`, `account`, `vendors`, `rfqs`, `rfqLineItems`, `rfqVendors`, `rfqAttachments`, `quotations`, `quotationLineItems`, `purchaseOrders`, `poItems`, `invoices`, `activityLogs`.

## Environment variables

`.env.example` is committed. Copy it to `.env` and set the secret.

```
BETTER_AUTH_SECRET=<32+ random chars>   # required, used to sign sessions
BETTER_AUTH_URL=http://localhost:3000   # base URL of the app
```

Generate a secret: `openssl rand -base64 32`. The demo `.env.example` already has a working dev secret so you can run immediately.

## Troubleshooting

**"Could not locate the bindings file" on `bun run db:push` or `bun run dev`**
The `better-sqlite3` native binding wasn't downloaded. Fix:
```bash
bun pm trust --all
# or for npm:
npm rebuild better-sqlite3
```

**Build error: `'DEFAULT_MIGRATION_TABLE' is not exported from 'kysely'`**
Kysely 0.29.x removed `DEFAULT_MIGRATION_TABLE` from its main entry, which breaks Better Auth 1.6.14's kysely-adapter. The `overrides` block in `package.json` pins kysely to 0.28.17. If you see this, your `node_modules` is stale:
```bash
rm -rf node_modules bun.lock
bun install
bun pm trust --all
```

**Demo login fails with "Invalid email or password"**
The demo passwords may have stale hashes (e.g. from a previous version of the code). Re-run the seeder — it's idempotent and resets all four passwords to `demo1234`:
```bash
bun run seed:users
```

**`Internal Server Error` on `/api/auth/sign-in/email`**
Almost always means the dev server hasn't compiled the route yet. First request is slow on cold start; reload the page. If it persists, check the terminal running `bun run dev` for the actual error.

**Port 3000 already in use**
```bash
lsof -ti :3000 | xargs kill -9
```

**`better-sqlite3` errors after pulling new code**
Wipe and reinstall:
```bash
rm -rf node_modules .next bun.lock
bun install
bun pm trust --all
```

**`seed:users` hangs or errors with `ConnectionRefused`**
The dev server (`bun run dev`) must be running before you run `seed:users`, because the seeder hits `/api/auth/sign-up/email` over HTTP.

## Security notes

- All server actions verify role + permission before touching the DB (`requirePermission` in `lib/rbac-server.ts`).
- All inputs go through zod schemas before being persisted (`lib/validation.ts`).
- Passwords are scrypt-hashed via Better Auth and stored on the `account` table.
- Password reset is in-app only — the user enters email + new password. Sessions are invalidated. (No email integration in the spec.)
- No file path is ever reflected back to the client. Uploaded filenames are sanitized + stored under a crypto hash (`/public/uploads/rfq/`).
- `.env` is gitignored. Don't commit your `BETTER_AUTH_SECRET`.

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
> bun install && bun pm trust --all
> cp .env.example .env
> # set BETTER_AUTH_SECRET in .env to: openssl rand -base64 32
> bun run db:push
> bun run dev      # leave this terminal running
> # in a second terminal:
> bun run seed && bun run seed:users
> ```
> Open <http://localhost:3000>. Demo logins (password `demo1234`): `admin@`, `manager@`, `officer@`, `vendor@vendorbridge.io` (all `vendorbridge.io`).
> Stack: Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui (Base UI), Drizzle + better-sqlite3, Better Auth 1.6.14, Kysely 0.28.17 (pinned via overrides), Zod. Use `bun`. Read `README.md`, `lib/db/schema.ts`, `lib/rbac.ts`, and `lib/actions.ts` before changing anything. Run `bun run lint` and `npx tsc --noEmit` before declaring done. If you hit "Could not locate the bindings file", run `bun pm trust --all` then restart `bun run dev`. If you hit "DEFAULT_MIGRATION_TABLE is not exported from kysely", delete `node_modules` and `bun.lock` and re-run `bun install`.
