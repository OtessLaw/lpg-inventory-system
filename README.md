# LPG Cooking Gas Inventory Management System

A production-ready, full-stack **LPG Cooking Gas Inventory Management System** built with **Node.js, Express, MongoDB (Mongoose), React, Vite, and Tailwind CSS**.

The system provides precise real-time inventory tracking, backend-enforced financial calculation, concurrency-safe atomic stock deduction, stock-in receiving, stock adjustment auditing with mandatory reason tracking, sales invoice generation, and interactive daily reporting.

---

## Key Features

* **Real-time Inventory Tracking**: Authoritative stock balance tracked directly in MongoDB database.
* **Concurrency-Safe Stock Operations**: Conditional atomic updates (`$inc` + `{ currentStock: { $gte: quantity } }`) strictly enforce **Rule 1: Stock cannot become negative**.
* **Role-Based Authorization (RBAC)**:
  * **Admin**: User management, product catalog control, stock adjustment approval, supplier directory, audit trail, full reports.
  * **Staff**: Dashboard, POS sales checkout, stock-in recording, sales history, reports.
* **Automatic Sales Financial Calculations**: Backend validates item totals, subtotal, discounts, and total revenue before saving invoice records.
* **Audit Trail**: Every stock movement (`STOCK_IN`, `SALE`, `ADJUSTMENT`) creates a permanent `StockTransaction` audit record.
* **Mandatory Adjustment Reason (Rule 5)**: Manual stock adjustments require a mandatory reason (leakage, damaged cylinders, audit discrepancy).
* **Daily & Historical Reports**: Calculates Opening Stock, Received Stock, Sold LPG (kg), Adjustments, Closing Stock, and Sales Revenue for any date with CSV export.
* **Zero-Config Database Fallback**: Includes `mongodb-memory-server` fallback for zero-configuration instant local development if local MongoDB is not running.

---

## Technology Stack

* **Backend**: Node.js, Express.js, JWT Authentication, bcryptjs, Helmet, Cors, Express Rate Limit
* **Database**: MongoDB & Mongoose ORM
* **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Recharts, Axios, Lucide Icons

---

## Project Structure

```text
gas/
├── server/                    # Node.js + Express Backend
│   ├── config/                # Database connection & fallback configuration
│   ├── controllers/           # Auth, User, Product, Supplier, Inventory, Sales, Dashboard, Report controllers
│   ├── middleware/            # JWT authentication, role authorization, error handling
│   ├── models/                # Mongoose Schemas (User, Product, Supplier, StockTransaction, Sale)
│   ├── routes/                # API route definitions
│   ├── seed.js                # Database seed script
│   ├── app.js                 # Express application setup
│   └── server.js              # Server entry point
├── client/                    # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # Sidebar, Header, ProtectedRoute
│   │   ├── context/           # AuthContext (JWT & User state)
│   │   ├── layouts/           # AppLayout
│   │   ├── pages/             # Dashboard, Inventory, StockIn, Adjustment, POS Sales, History, Suppliers, Reports, Users
│   │   ├── services/          # Axios instance
│   │   └── utils/             # Formatters (GH₵ currency, kg weight)
│   ├── vite.config.js
│   └── index.html
├── package.json               # Root scripts
└── README.md
```

---

## Setup & Installation

### 1. Install Dependencies

In the root directory, run:

```bash
npm run setup
```

This command installs dependencies for root, `server`, and `client`.

### 2. Environment Configuration

The backend environment file is located at `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lpg_inventory
JWT_SECRET=lpg_inventory_super_secret_jwt_key_2026_ghana
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Seed Database

To seed initial Admin, Staff, products, suppliers, and historical transaction records:

```bash
npm run seed
```

#### Development Seed Credentials:
* **Admin**: `admin@example.com` / `ChangeThisPassword123!`
* **Staff**: `staff@example.com` / `ChangeThisPassword123!`

### 4. Run Development Application

Start both backend server and frontend Vite server concurrently:

```bash
npm run dev
```

* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000`

---

## Verification Test Flow

1. Open `http://localhost:5173/login` in your browser.
2. Click **Admin Account** or **Staff Account** quick fill button and sign in.
3. **Record Stock In**: Navigate to `/inventory/stock-in`, select **LPG Cooking Gas**, enter `500` kg, select supplier, and submit. Verify stock increases.
4. **Complete a Sale (POS)**: Navigate to `/sales/new`, select **LPG Cooking Gas**, enter `20` kg, verify line item total (GH₵ 300), select payment method, and complete sale.
5. **Verify Stock Deduction**: Check `/inventory` to confirm stock automatically decreased from 1500kg to 1480kg.
6. **Prevent Over-Sale**: Attempt to record a sale for `10,000` kg. Verify backend rejects with `INSUFFICIENT_STOCK` error.
7. **Stock Adjustment**: Navigate to `/inventory/adjustment`, select `- DECREASE STOCK`, enter `5` kg with reason "Leakage identified during inspection". Verify audit trail update.
8. **Daily Inventory Report**: Navigate to `/reports` and view mathematical calculation: `Closing Stock = Opening Stock + Stock Received - Stock Sold +/- Adjustments`.
