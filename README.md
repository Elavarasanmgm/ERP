# ERP System - Enterprise Resource Planning Solution

A modern, scalable ERP system built with **Node.js**, **Express.js**, **React.js**, and **MS SQL Server**.

## ✅ STATUS: FULLY IMPLEMENTED

All 5 modules are **complete and operational**:
- ✅ **Accounting Module** - Chart of Accounts, Journal Entries, Financial Reports, Invoices
- ✅ **Inventory Module** - Item Catalog, Stock Levels, Warehouse Management
- ✅ **Orders Module** - Sales Orders, Purchase Orders, Customer/Supplier Management
- ✅ **Manufacturing Module** - Bill of Materials, Work Order Management
- ✅ **Projects Module** - Project Management, Task Tracking, Timesheets

For detailed implementation information, see [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)

## 🎯 Project Overview

This ERP solution provides comprehensive business management across all core business functions. The system is designed with a clean architecture, modern technology stack, and fully customizable UI with NO ERPNext dependencies.

## 🏗️ Technology Stack

### Backend
- **Node.js** 18+ with Express.js 4.18.2
- **MS SQL Server** (DESKTOP-ASUHSNB / ERPSolution)
- **JWT** for authentication (7-day expiration)
- **Bcrypt** for secure password hashing
- **CORS** enabled for frontend communication
- **Helmet** for security headers
- **Winston** for logging

### Frontend
- **React.js** 18.2.0
- **React Router** for SPA navigation
- **Redux Toolkit** for state management
- **Tailwind CSS** 3.3.6 for styling
- **Material-UI** 5.14.12 components
- **Axios** 1.6.2 for API calls
- **Recharts** for data visualization

### Database
- **MS SQL Server** 2019+
- **14 interconnected tables**
- Connection pooling via mssql package
- Parameterized queries for security

### Infrastructure
- **Docker** & **Docker Compose** for containerization
- **Nginx** as reverse proxy
- **Vite** 5.4.21 as frontend build tool

## 📁 Project Structure

```
ERP/
├── backend/                    # Node.js API Server (Port 5000)
│   ├── src/
│   │   ├── config/            # DB, Auth, Logger config
│   │   ├── controllers/       # 6 module controllers
│   │   ├── routes/            # 6 API route files
│   │   ├── middleware/        # Auth, Error handling
│   │   ├── utils/             # Logger utility
│   │   └── app.js             # Express setup with all routes
│   ├── package.json           # 548 dependencies installed
│   ├── .env                   # SQL Server credentials
│   └── Dockerfile
│
├── frontend/                   # React.js Application (Port 3000)
│   ├── src/
│   │   ├── pages/            # 5 module pages + 15 sub-components
│   │   ├── components/       # Shared Layout, Navbar, Sidebar
│   │   ├── services/         # Axios API client
│   │   ├── store/            # Redux slices & store
│   │   ├── styles/           # Tailwind + component CSS
│   │   ├── App.jsx           # Router setup
│   │   └── index.jsx         # React entry point
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env
│   └── Dockerfile
│
├── database/
│   ├── migrations/           # Schema with 14 tables
│   └── seeds/               # Sample data
│
└── IMPLEMENTATION_COMPLETE.md  # Detailed feature list
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── store/             # Redux store & slices
│   │   ├── styles/            # CSS files
│   │   ├── utils/             # Helper utilities
│   │   └── App.jsx            # Main app component
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── index.html
│
├── database/
│   ├── migrations/            # SQL Server schema files
│   ├── seeds/                 # Sample data scripts
│   └── schema.sql             # Main schema
│
├── docker-compose.yml         # Docker orchestration
├── nginx.conf                 # Reverse proxy configuration
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MS SQL Server instance running (DESKTOP-ASUHSNB)
- Docker & Docker Compose (optional, for containerized setup)

### Local Development Setup

#### 1. Database Setup
Connect to your MS SQL Server and run:
```sql
-- Open SQL Server Management Studio or SQL Query Editor
-- Run the schema creation script
-- Location: ./database/migrations/001_create_schema.sql

-- Then run seed data
-- Location: ./database/seeds/001_seed_data.sql
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
copy .env.example .env

# Update .env with your SQL Server credentials
# DB_SERVER=DESKTOP-ASUHSNB
# DB_USER=WebAdmin
# DB_PASSWORD=ela999438S!

# Start development server
npm run dev
```

Backend runs on `http://localhost:5000`

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

### Test Login
- **Email**: (Create a new account via Register)
- **Password**: Your password

## 📦 Core Modules

### 1. Accounting
- Account management (Chart of Accounts)
- Journal entries & transactions
- Invoice generation
- Financial reporting

### 2. Inventory Management
- Warehouse management
- Item/Product catalog
- Stock tracking
- Reorder levels

### 3. Order Management
- Sales orders
- Purchase orders
- Customer management
- Supplier management

### 4. Manufacturing
- Bill of Materials (BOM)
- Work order management
- Production planning
- Material consumption tracking

### 5. Projects
- Project creation & tracking
- Task management
- Timesheet entry
- Resource allocation

## 🔐 Security Features

- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ SQL injection prevention (parameterized queries)

## 📊 API Documentation

### Authentication Endpoints

```
POST /api/auth/login
- Body: { email, password }
- Returns: { token, user }

POST /api/auth/register
- Body: { email, password, firstName, lastName }
- Returns: { message }
```

More API endpoints will be added for each module:
- `GET /api/accounts` - Get accounts
- `GET /api/inventory/items` - Get items
- `GET /api/orders/sales` - Get sales orders
- `POST /api/orders/purchase` - Create purchase order
- And many more...

## 🐳 Docker Setup

### Build and Run with Docker Compose

```bash
docker-compose up --build
```

This will start:
- Backend API on port 5000
- Frontend on port 3000
- Nginx reverse proxy on port 80

## 📝 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DB_SERVER=DESKTOP-ASUHSNB
DB_DATABASE=ERPSolution
DB_PORT=1433
DB_USER=WebAdmin
DB_PASSWORD=ela999438S!
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

## 🧪 Development Workflow

### Adding a New Module

1. **Backend**:
   - Create controller in `src/controllers/`
   - Create routes in `src/routes/`
   - Update `src/app.js` to register routes

2. **Frontend**:
   - Create component in `src/components/`
   - Create page in `src/pages/`
   - Add route in `src/App.jsx`
   - Create service in `src/services/`

3. **Database**:
   - Create migration in `database/migrations/`
   - Run migration on SQL Server

## 🎨 UI/UX Customization

The frontend uses:
- **Tailwind CSS** for utility-based styling
- **Material-UI** for professional components
- **Custom CSS** for module-specific styles

Customize by:
1. Edit `frontend/tailwind.config.js` for theme
2. Modify CSS files in `src/styles/`
3. Update component styles in respective component files

## 🔄 Database Backup & Recovery

### Backup Database
```sql
BACKUP DATABASE [ERPSolution] 
TO DISK = 'C:\Backups\ERPSolution.bak'
```

### Restore Database
```sql
RESTORE DATABASE [ERPSolution] 
FROM DISK = 'C:\Backups\ERPSolution.bak'
```

## 📈 Scalability & Performance

- Connection pooling in MS SQL Server
- Indexed database queries
- Frontend optimization with code splitting
- Caching strategies with Redux
- Nginx reverse proxy for load balancing

## 🐛 Troubleshooting

### Database Connection Issues
```
Error: Connection timeout
Solution: Verify SQL Server is running and credentials are correct
Check: DESKTOP-ASUHSNB server is accessible
```

### Frontend API Calls Failing
```
Error: 404 Not Found
Solution: Check backend is running on port 5000
Verify CORS_ORIGIN in backend .env matches frontend URL
```

### Port Already in Use
```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## 📚 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [MS SQL Server Documentation](https://docs.microsoft.com/en-us/sql/)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💼 Support

For issues, questions, or suggestions:
- Document the issue clearly
- Include error messages and logs
- Describe steps to reproduce

---

**Ready to revolutionize your business management!** 🚀
