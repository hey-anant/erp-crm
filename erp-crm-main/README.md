# ERP-CRM Operations Portal

A modern full-stack ERP & CRM web application designed for wholesale, distribution, and retail operations. The portal covers customer CRM, inventory tracking, stock movements, and sales challan dispatch workflows.

## Features

- **JWT Authentication & RBAC**: Admin, Sales, Warehouse, and Accounts roles.
- **Customer CRM**: Lead management, search, categorization, and follow-up notes.
- **Inventory Control**: Opening stock, min-stock alerts, warehouse locations, and audit logs.
- **Sales Challans**: Draft & Confirmed dispatch orders with price snapshots.
- **Automated Stock Sync**: Dispatches automatically validate and reduce available inventory.
- **Responsive Interface**: Clean desktop and mobile workspace.

---

## Test Accounts

All demo accounts use password: `password123`

- `admin@northstar.com` (Administrator)
- `sales@northstar.com` (Sales Executive)
- `warehouse@northstar.com` (Warehouse Manager)
- `accounts@northstar.com` (Accounts)

---

## Supabase Database Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Run the schema migration found in:
   `supabase/migrations/20260902091826_create_erp_crm_schema.sql`
4. Copy your **Project URL** and **Anon Public Key** from **Settings → API**.

---

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   JWT_SECRET=your-secret-key
   PORT=3000
   ```
3. Build the frontend:
   ```bash
   npm run build
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open [http://localhost:3000](http://localhost:3000).

---

## Vercel Deployment

This project is pre-configured for seamless 1-click deployment to **Vercel** with full-stack support (Vite Static Frontend + Express Serverless API via `api/index.js` & `vercel.json`):

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your repository.
4. Add the following **Environment Variables** in the Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `JWT_SECRET`
5. Click **Deploy**.
