# ERP-CRM Operations Portal

A modern full-stack ERP & CRM web application designed for wholesale, distribution, and retail operations. The portal covers customer CRM, inventory tracking, stock movements audit log, and sales challan dispatch workflows.

---

##  Core Features

- **JWT Authentication & RBAC**: Admin, Sales, Warehouse, and Accounts roles with permissions.
- **Customer CRM**:
  - Add, Edit, and Search customers.
  - Customer categorization: Retail, Wholesale, Distributor.
  - Status pipeline: Lead, Active, Inactive.
  - Customer details popup modal with follow-up history and new note logging.
- **Product & Inventory Management**:
  - Add & Edit products with SKU, Unit Price, Opening Stock, Min-Stock Alert, and Warehouse Location.
  - Low-stock visual alerts and dashboard notifications.
  - **Stock Movement Log**: Real-time audit history of every stock change (+/- quantity, IN/OUT type, reason, user, timestamp).
  - **Adjust Stock Action**: Manual stock adjustments for shipments received, damages, or audit reconciliations.
- **Sales Challans Dispatch Flow**:
  - Auto-generated Challan Number.
  - Customer selection with multi-product line items and quantity selection.
  - Product price & SKU snapshotting at order time.
  - Save as **Draft** or **Confirmed**.
  - **Confirm Dispatch**: Automatically validates stock and records `OUT` stock movements to deduct warehouse inventory.
  - **Cancel Challan**: Cancel draft orders.
  - **Challan Detail Modal**: Detailed breakdown of line items, unit prices, and quantities.

---

##  Test Accounts

All demo accounts use password: `password123`

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **Admin** | `admin@northstar.com` | Full Operations (Customers, Inventory, Challans) |
| **Sales** | `sales@northstar.com` | CRM Management, Create, Confirm & Cancel Challans |
| **Warehouse** | `warehouse@northstar.com` | Product Catalog, Adjust Stock, Movement Audit Logs |
| **Accounts** | `accounts@northstar.com` | Read-only Operations View |

---

##  Database Setup (Supabase PostgreSQL)

1. Open your [Supabase Dashboard](https://supabase.com).
2. Run the SQL schema in **SQL Editor**:
   `supabase/migrations/20260902091826_create_erp_crm_schema.sql`
3. Copy **Project URL** and **anon public key** into `.env`.

---

##  Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
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

##  Postman Collection & API Documentation

A pre-configured Postman Collection is included in the project root:
- [`postman_collection.json`](file:///c:/Users/anant/Downloads/erp-crm-main/postman_collection.json)

Import this JSON into Postman to test all Authentication, Customer, Product, Stock Movement, and Sales Challan endpoints with automated JWT token handling.

---

##  Vercel Deployment

1. Push code to GitHub repository.
2. Import project in Vercel.
3. Set environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `JWT_SECRET`.
4. Click **Deploy**.
