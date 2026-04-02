# ERP System Development Guide

## Quick Start Commands

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Docker Development
```bash
docker-compose up --build
```

## Database Setup

### Connect to SQL Server
```
Server: DESKTOP-ASUHSNB
Authentication: SQL Server Authentication
Username: WebAdmin
Password: ela999438S!
Database: ERPSolution
```

### Run Migration
```sql
-- Navigate to: database/migrations/001_create_schema.sql
-- Execute the entire script in SQL Server Management Studio
```

### Seed Sample Data (Optional)
```sql
-- Navigate to: database/seeds/001_seed_data.sql
-- Execute the entire script
```

## Module Development Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Project setup
- [x] Database schema
- [x] Authentication system
- [x] Basic API structure

### Phase 2: Accounting Module
- [ ] Create account management API
- [ ] Build invoice system
- [ ] Transaction management
- [ ] Financial report generation

### Phase 3: Inventory Module
- [ ] Item management API
- [ ] Stock tracking
- [ ] Warehouse management
- [ ] Reorder alerts

### Phase 4: Orders Module
- [ ] Sales order API
- [ ] Purchase order API
- [ ] Customer/Supplier management
- [ ] Order fulfillment

### Phase 5: Manufacturing Module
- [ ] BOM creation & management
- [ ] Work order API
- [ ] Production planning
- [ ] Material consumption

### Phase 6: Projects Module
- [ ] Project management API
- [ ] Task management
- [ ] Timesheet system
- [ ] Resource allocation

## API Endpoint Patterns

All endpoints follow RESTful conventions:

```
GET    /api/{resource}          - Get all
GET    /api/{resource}/{id}     - Get by ID
POST   /api/{resource}          - Create
PUT    /api/{resource}/{id}     - Update
DELETE /api/{resource}/{id}     - Delete
```

## Frontend Component Structure

```
Component/
├── ComponentName.jsx           - Main component
├── ComponentName.css           - Styles
├── sub-components/             - Child components
└── hooks/                      - Custom hooks
```

## State Management (Redux)

Store structure:
```
/store
├── store.js                    - Store configuration
├── slices/
│   ├── authSlice.js           - Auth state
│   ├── uiSlice.js             - UI state
│   ├── accountingSlice.js      - Accounting data
│   ├── inventorySlice.js       - Inventory data
│   └── ...
```

## API Service Pattern

```javascript
// services/api.js
export const serviceModule = {
  getAll: async () => { ... },
  getById: async (id) => { ... },
  create: async (data) => { ... },
  update: async (id, data) => { ... },
  delete: async (id) => { ... },
};
```

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Build & Deployment

### Build Backend
```bash
cd backend
npm run build  # If applicable
```

### Build Frontend
```bash
cd frontend
npm run build
# Output: dist/
```

### Run Production Build
```bash
# Backend
NODE_ENV=production npm start

# Frontend
npm run preview
```

## Logging

Backend uses Winston logger:
- **Debug**: Detailed information
- **Info**: General information
- **Warn**: Warning messages
- **Error**: Error messages

Logs are stored in `backend/logs/`

## Environment Configuration

Use `.env` files for sensitive data:
- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration

Never commit `.env` files to version control!

## Performance Tips

1. **Database Queries**
   - Use indexes on frequently queried columns
   - Limit data returned from API
   - Use pagination

2. **Frontend**
   - Code splitting with React.lazy()
   - Memoization with React.memo()
   - Optimize re-renders

3. **Caching**
   - Redux for client state
   - HTTP caching headers
   - Database query caching

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use HTTPS/SSL certificates
- [ ] Validate all user inputs
- [ ] Sanitize database queries
- [ ] Implement rate limiting
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Common Issues & Solutions

### SQL Server Connection
Problem: Cannot connect to DESKTOP-ASUHSNB
Solution:
1. Verify SQL Server is running
2. Check firewall settings
3. Confirm credentials are correct
4. Test connection in SSMS first

### Hot Module Replacement (HMR)
Problem: Frontend not auto-reloading
Solution:
```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

### Port Conflicts
Solution:
```bash
# Change ports in respective config files:
# backend: PORT env variable
# frontend: vite.config.js server.port
```

## Useful Commands

```bash
# Backend
npm install              # Install dependencies
npm run dev             # Start dev server
npm run start           # Start production
npm test                # Run tests

# Frontend
npm install             # Install dependencies
npm run dev             # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Lint code

# Docker
docker-compose up       # Start all services
docker-compose down     # Stop all services
docker-compose logs     # View logs
```

## Next Steps

1. Set up database with provided schema
2. Run backend development server
3. Run frontend development server
4. Create first test data
5. Start building modules based on roadmap

---

Happy coding! 🎉
