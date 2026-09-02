# Northstar ERP + CRM Operations Portal

A full-stack case study for a wholesale distribution company. The portal covers customer CRM, inventory, stock movement audit history, and sales challan dispatch workflows.

## Features

- JWT login with Admin, Sales, Warehouse, and Accounts roles
- Customer management with search, segmentation, statuses, and follow-up notes
- Product catalog with opening stock, minimum-stock alerts, locations, and stock movements
- Sales challans with draft and confirmed states
- Confirmation checks available stock and records OUT movements
- Product snapshot data is stored on each challan line
- Responsive operations dashboard for desktop and mobile

## Test accounts

All accounts use password `password123`:

- `admin@northstar.com`
- `sales@northstar.com`
- `warehouse@northstar.com`
- `accounts@northstar.com`

## Using your own Supabase project

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. Open the **SQL Editor** in your Supabase dashboard and run the contents of `supabase/migrations/20260902091826_create_erp_crm_schema.sql`. This creates all tables, triggers, and policies.
3. Go to **Settings → API** and copy your **Project URL** and **anon public key**.
4. Copy `.env.example` to `.env` and fill in the values:

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   JWT_SECRET=change-this-to-a-long-random-string
   PORT=3000
   ```

5. The app reads these automatically on startup via `dotenv`.

## Local setup

1. Install Node.js 18 or newer.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and fill in your Supabase credentials (see above).
4. Run the migration SQL in your Supabase SQL Editor.
5. Build the frontend with `npm run build`.
6. Start the server with `npm start`.
7. Open `http://localhost:3000` in a browser. The first launch seeds demo users and sample data automatically.

The Express server serves the compiled React application and exposes REST endpoints under `/api`.

## Architecture

The frontend is a React single-page application. Express handles authentication, authorization, validation, business rules, and REST responses. Supabase PostgreSQL stores all business data. Passwords are hashed before storage and sessions are signed JWTs.

## Deployment

Deploy as a Node web service on Render, Railway, Fly.io, or a similar provider. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `JWT_SECRET` as environment variables, run `npm install && npm run build` during the build step, and run `npm start` as the start command. Set `PORT` from the hosting provider when required.

## Assumptions and limitations

- This case study keeps the business tenant single-company.
- Stock confirmation is protected by an availability check; a production deployment should move multi-line stock confirmation into a database transaction or stored procedure for strict concurrency guarantees.
- PDF invoices, file uploads, and cloud-specific infrastructure are intentionally outside the core scope.
