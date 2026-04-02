# ERP System - Quick Start & Usage Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MS SQL Server 2019+ running on DESKTOP-ASUHSNB
- Database: `ERPSolution` created
- User: `WebAdmin` with password `ela999438S!`

### Starting the Servers

#### 1. Start Backend API (Port 5000)
```bash
cd c:\ERP\backend
node src/app.js
```
Expected output: `[INFO] Server running on port 5000`

#### 2. Start Frontend (Port 3000)
```bash
cd c:\ERP\frontend
npm run dev
```
Expected output: `VITE v5.4.21 ready in X ms`

### Access the Application
- **Frontend URL:** http://localhost:3000
- **API URL:** http://localhost:5000

---

## 📊 Module Breakdown & Usage

### 🧮 ACCOUNTING MODULE
**Location:** http://localhost:3000/accounting

Manage all financial operations:

#### Chart of Accounts
- Create account codes (1000, 1100, 2000, etc.)
- Set account types: Asset, Liability, Equity, Income, Expense
- View account balances
- **API:** `POST /api/accounting/accounts`

#### Journal Entries
- Record double-entry transactions
- Select debit and credit accounts
- Track transaction dates
- View GL audit trail
- **API:** `POST /api/accounting/journal`

#### Financial Reports
- **Trial Balance:** View all accounts with debit/credit balances
- **Income Statement:** See revenues less expenses for period
- Both reports auto-calculate from journal entries
- **API:** `GET /api/accounting/trial-balance`, `GET /api/accounting/income-statement`

#### Customers
- Add customer records
- Set credit limits
- Track contact information
- Used for sales orders and invoices
- **API:** `POST /api/accounting/customers`

#### Invoices
- Create invoices for customers
- Set invoice numbers and due dates
- Track invoice status (Draft, Sent, Paid)
- **API:** `POST /api/accounting/invoices`

---

### 📦 INVENTORY MODULE
**Location:** http://localhost:3000/inventory

Manage stock and materials:

#### Items
- Create item catalog with SKU codes
- Set unit prices
- Assign categories (Raw Materials, Finished Goods, etc.)
- View all items in database
- **API:** `POST /api/inventory/items`

#### Stock Levels
- View quantity by warehouse location
- Check reorder levels
- See last count date
- **API:** `GET /api/inventory/stock`
- **Adjust Stock:** `PUT /api/inventory/stock/adjust`

---

### 📋 ORDERS MODULE
**Location:** http://localhost:3000/orders

Manage sales and purchases:

#### Sales Orders
- Create sales orders for customers
- Set order dates and due dates
- Track total order amounts
- Monitor order status (Draft, Confirmed, Shipped, Delivered)
- **API:** `POST /api/orders/sales-orders`

#### Purchase Orders
- Create POs from suppliers
- Manage supplier order terms
- Track PO status
- Compare to received quantities
- **API:** `POST /api/orders/purchase-orders`

---

### ⚙️ MANUFACTURING MODULE
**Location:** http://localhost:3000/manufacturing

Manage production:

#### Bill of Materials (BOM)
- Define product recipes
- List component items and quantities
- Version control BOMs
- Required for Work Order generation
- **API:** `POST /api/manufacturing/boms`

#### Work Orders
- Create work orders for production runs
- Link to BOMs for automated material lists
- Set production dates and quantities
- Track completion status
- **API:** `POST /api/manufacturing/work-orders`

---

### 📁 PROJECTS MODULE
**Location:** http://localhost:3000/projects

Manage projects and time:

#### Projects
- Create project records with codes
- Set start and end dates
- Track project progress percentage
- Monitor status (Planning, Active, Completed, On Hold)
- **API:** `POST /api/projects/projects`

#### Timesheets
- Log hours worked on projects
- Record work date
- Add task descriptions
- Track by team member
- Useful for project costing and resource planning
- **API:** `POST /api/projects/timesheets`

---

## 🔑 Authentication

### Create Account
1. Go to http://localhost:3000
2. Click "Don't have an account? Register"
3. Fill in: First Name, Last Name, Email, Password
4. Click "Register"
5. Redirects to login page

### Login
1. Enter email and password
2. Click "Sign In"
3. JWT token stored in browser localStorage
4. Valid for 7 days

---

## 🗄️ Database Schema

### Key Tables:
- **Users** - User accounts and roles
- **Accounts** - Chart of accounts (ledger)
- **Transactions** - Journal entries
- **Items** - Inventory items
- **Stock** - Warehouse stock levels
- **Customers** - Customer master data
- **Suppliers** - Supplier master data
- **SalesOrders** & **SalesOrderDetails** - Sales transactions
- **PurchaseOrders** & **PurchaseOrderDetails** - Purchase transactions
- **BillOfMaterials** & **BOMDetails** - Manufacturing recipes
- **WorkOrders** - Production orders
- **Projects** - Project master data
- **ProjectTasks** - Individual tasks within projects
- **Timesheets** - Time tracking entries
- **Invoices** - Billing records

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Header
All requests (except /auth endpoints) require:
```
Authorization: Bearer <JWT_TOKEN>
```

### Response Format
```json
{
  "message": "Success message",
  "data": [],
  "error": null
}
```

### Common Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request (missing fields, validation error)
- `401` - Unauthorized (invalid/missing JWT)
- `404` - Not Found
- `500` - Server Error

### Example: Get Accounts
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/accounting/accounts
```

---

## 💡 Sample Workflows

### Workflow 1: Record a Sale
1. **Accounting → Customers** - Add customer
2. **Orders → Sales Orders** - Create sales order for customer
3. **Accounting → Invoices** - Create invoice
4. **Accounting → Journal Entries** - Record sale transaction
5. **Accounting → Income Statement** - View revenue

### Workflow 2: Manufacturing Run
1. **Inventory → Items** - Create product and component items
2. **Manufacturing → BOM** - Define bill of materials with components
3. **Manufacturing → Work Orders** - Create production run
4. **Inventory → Stock Levels** - Check material availability
5. **Inventory → Stock Adjust** - Consume materials, add finished goods

### Workflow 3: Team Project
1. **Projects** - Create project
2. **Projects** - Create project tasks
3. **Projects → Timesheets** - Team logs hours daily
4. **Projects** - Monitor progress percentage
5. **Projects → Timesheets** - Run timesheet reports for billing

---

## 🔧 Configuration

### Backend (.env)
```
DB_SERVER=DESKTOP-ASUHSNB
DB_USER=WebAdmin
DB_PASSWORD=ela999438S!
DB_NAME=ERPSolution
JWT_SECRET=your-secret-key
PORT=5000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

---

## ⚠️ Common Issues & Solutions

### Issue: Can't connect to database
**Solution:** Verify SQL Server is running and credentials are correct in backend/.env

### Issue: CORS error
**Solution:** Ensure backend is running and `CORS_ORIGIN=http://localhost:3000` in .env

### Issue: 404 on API endpoints
**Solution:** Backend may not be running. Check port 5000 is listening.

### Issue: JWT token expired
**Solution:** Logout and login again. Token valid for 7 days.

### Issue: Module pages blank
**Solution:** Check browser console for errors. Ensure backend is serving data.

---

## 📈 Scalability Notes

The system is built for scalability:
- Connection pooling for database
- Stateless API design (horizontal scaling ready)
- Docker containerization included
- Modular frontend components
- Easily add new modules by creating controller + routes + React component

---

## 🎓 Development Tips

### Adding a New Endpoint
1. Create handler in appropriate controller
2. Add route in corresponding routes file
3. Import route in app.js
4. Test with Postman or curl

### Adding a New React Component
1. Create component file in pages/[module-name]/
2. Export the component
3. Import in main module page (Accounting.jsx, etc.)
4. Add to tabs/navigation
5. Style with Tailwind + module CSS

### Debugging
- Backend logs in terminal: `[INFO]`, `[ERROR]`
- Frontend: Browser DevTools Console
- Database: Use SQL Server Management Studio

---

## 📞 Support

For issues or questions:
1. Check the logs (backend console, browser console)
2. Verify all servers are running (ports 5000, 3000)
3. Check database connection
4. Review IMPLEMENTATION_COMPLETE.md for detailed features

---

## ✨ You're Ready!

The ERP system is fully functional. Start by:
1. Creating a user account (register)
2. Logging in
3. Creating sample data in each module
4. Exploring the financial reports
5. Customizing as needed for your business

Enjoy your ERP system! 🚀
