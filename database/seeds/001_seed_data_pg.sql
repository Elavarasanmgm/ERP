-- ERP Seed Data (PostgreSQL version)

-- =====================================================
-- 1. USERS
-- =====================================================
-- Permissions JSON strings
-- Admin/Manager: All true
-- User: Dashboard only by default

INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Phone, Role, permissions) VALUES
('admin@erp.com',    '$2a$10$aGmsrKprZ/C3sdVqQDZ.Reh4arFJXdlyC4GTq8E3ihxoKU0Dlffci', 'Admin',   'User',    '555-0001', 'Admin',   '{"dashboard":true,"accounting":{"entries":true,"accounts":true,"invoices":true,"payments":true,"customers":true,"suppliers":true,"reports":true},"inventory":{"items":true,"stock":true,"locations":true,"opening":true,"movements":true},"orders":{"sales":true,"purchase":true,"requests":true,"quotes":true,"receipts":true,"trace":true},"manufacturing":{"workorders":true,"bom":true,"planning":true,"kanban":true,"quality":true},"hr":{"employees":true,"attendance":true,"leaves":true,"payroll":true},"crm":{"leads":true,"opportunities":true,"contacts":true,"activities":true},"assets":{"list":true,"depreciation":true,"maintenance":true,"reports":true},"quality":{"inspections":true,"nonconformance":true,"corrective":true,"metrics":true},"planning":{"production":true,"mrp":true,"orders":true,"capacity":true,"forecasts":true},"projects":{"list":true,"timesheets":true},"supplychain":{"vendors":true,"requisitions":true,"receipts":true,"performance":true},"master":true}'),
('john@erp.com',     '$2a$10$aGmsrKprZ/C3sdVqQDZ.Reh4arFJXdlyC4GTq8E3ihxoKU0Dlffci', 'John',    'Smith',   '555-0002', 'Manager', '{"dashboard":true,"accounting":{"entries":true,"accounts":true,"invoices":true,"payments":true,"customers":true,"suppliers":true,"reports":true},"inventory":{"items":true,"stock":true,"locations":true,"opening":true,"movements":true},"orders":{"sales":true,"purchase":true,"requests":true,"quotes":true,"receipts":true,"trace":true},"manufacturing":{"workorders":true,"bom":true,"planning":true,"kanban":true,"quality":true},"hr":{"employees":true,"attendance":true,"leaves":true,"payroll":true},"crm":{"leads":true,"opportunities":true,"contacts":true,"activities":true},"assets":{"list":true,"depreciation":true,"maintenance":true,"reports":true},"quality":{"inspections":true,"nonconformance":true,"corrective":true,"metrics":true},"planning":{"production":true,"mrp":true,"orders":true,"capacity":true,"forecasts":true},"projects":{"list":true,"timesheets":true},"supplychain":{"vendors":true,"requisitions":true,"receipts":true,"performance":true},"master":false}'),
('sarah@erp.com',    '$2a$10$aGmsrKprZ/C3sdVqQDZ.Reh4arFJXdlyC4GTq8E3ihxoKU0Dlffci', 'Sarah',   'Johnson', '555-0003', 'User',    '{"dashboard":true,"accounting":{"entries":false,"accounts":false,"invoices":false,"payments":false,"customers":false,"suppliers":false,"reports":false},"inventory":{"items":false,"stock":false,"locations":false,"opening":false,"movements":false},"orders":{"sales":false,"purchase":false,"requests":false,"quotes":false,"receipts":false,"trace":false},"manufacturing":{"workorders":false,"bom":false,"planning":false,"kanban":false,"quality":false},"hr":{"employees":false,"attendance":false,"leaves":false,"payroll":false},"crm":{"leads":false,"opportunities":false,"contacts":false,"activities":false},"assets":{"list":false,"depreciation":false,"maintenance":false,"reports":false},"quality":{"inspections":false,"nonconformance":false,"corrective":false,"metrics":false},"planning":{"production":false,"mrp":false,"orders":false,"capacity":false,"forecasts":false},"projects":{"list":false,"timesheets":false},"supplychain":{"vendors":false,"requisitions":false,"receipts":false,"performance":false},"master":false}'),
('mike@erp.com',     '$2a$10$aGmsrKprZ/C3sdVqQDZ.Reh4arFJXdlyC4GTq8E3ihxoKU0Dlffci', 'Mike',    'Williams','555-0004', 'User',    '{"dashboard":true,"accounting":{"entries":false,"accounts":false,"invoices":false,"payments":false,"customers":false,"suppliers":false,"reports":false},"inventory":{"items":false,"stock":false,"locations":false,"opening":false,"movements":false},"orders":{"sales":false,"purchase":false,"requests":false,"quotes":false,"receipts":false,"trace":false},"manufacturing":{"workorders":false,"bom":false,"planning":false,"kanban":false,"quality":false},"hr":{"employees":false,"attendance":false,"leaves":false,"payroll":false},"crm":{"leads":false,"opportunities":false,"contacts":false,"activities":false},"assets":{"list":false,"depreciation":false,"maintenance":false,"reports":false},"quality":{"inspections":false,"nonconformance":false,"corrective":false,"metrics":false},"planning":{"production":false,"mrp":false,"orders":false,"capacity":false,"forecasts":false},"projects":{"list":false,"timesheets":false},"supplychain":{"vendors":false,"requisitions":false,"receipts":false,"performance":false},"master":false}'),
('emily@erp.com',    '$2a$10$aGmsrKprZ/C3sdVqQDZ.Reh4arFJXdlyC4GTq8E3ihxoKU0Dlffci', 'Emily',   'Davis',   '555-0005', 'Manager', '{"dashboard":true,"accounting":{"entries":true,"accounts":true,"invoices":true,"payments":true,"customers":true,"suppliers":true,"reports":true},"inventory":{"items":true,"stock":true,"locations":true,"opening":true,"movements":true},"orders":{"sales":true,"purchase":true,"requests":true,"quotes":true,"receipts":true,"trace":true},"manufacturing":{"workorders":true,"bom":true,"planning":true,"kanban":true,"quality":true},"hr":{"employees":true,"attendance":true,"leaves":true,"payroll":true},"crm":{"leads":true,"opportunities":true,"contacts":true,"activities":true},"assets":{"list":true,"depreciation":true,"maintenance":true,"reports":true},"quality":{"inspections":true,"nonconformance":true,"corrective":true,"metrics":true},"planning":{"production":true,"mrp":true,"orders":true,"capacity":true,"forecasts":true},"projects":{"list":true,"timesheets":true},"supplychain":{"vendors":true,"requisitions":true,"receipts":true,"performance":true},"master":false}');

-- =====================================================
-- 2. ACCOUNTS (Chart of Accounts)
-- =====================================================
INSERT INTO Accounts (AccountCode, AccountName, AccountType, Description, Balance) VALUES
('1000', 'Cash',                 'Asset',     'Cash account',                  250000.00),
('1100', 'Accounts Receivable',  'Asset',     'Customer payments due',         180000.00),
('1500', 'Equipment',            'Asset',     'Office equipment',               75000.00),
('2000', 'Accounts Payable',     'Liability', 'Supplier payments due',          90000.00),
('3000', 'Common Stock',         'Equity',    'Share capital',                 500000.00),
('4000', 'Sales Revenue',        'Income',    'Product sales revenue',         320000.00),
('5000', 'Cost of Goods Sold',   'Expense',   'Direct cost of goods sold',     140000.00),
('6000', 'Operating Expenses',   'Expense',   'General operating expenses',     60000.00);

-- =====================================================
-- 3. WAREHOUSES
-- =====================================================
INSERT INTO Warehouses (WarehouseName, Location, Manager) VALUES
('Main Warehouse',       'Building A, Floor 1', 2),
('Secondary Warehouse',  'Building B, Floor 2', 3),
('Distribution Center',  'Downtown Location',   4);

-- =====================================================
-- 4. ITEMS
-- =====================================================
INSERT INTO Items (ItemCode, ItemName, Description, UnitPrice, ReorderLevel) VALUES
('PROD001', 'Widget A',       'Standard widget product',  50.00,  20),
('PROD002', 'Widget B',       'Premium widget product',   75.00,  15),
('PROD003', 'Component X',    'Electronic component',     25.00,  50),
('PROD004', 'Component Y',    'Mechanical component',     30.00,  35),
('PROD005', 'Raw Material Z', 'Base raw material',        10.00, 100);

-- =====================================================
-- 5. STOCK
-- =====================================================
INSERT INTO Stock (ItemId, WarehouseId, Quantity) VALUES
(1, 1, 200), (1, 2, 150), (1, 3,  80),
(2, 1, 120), (2, 2,  90), (2, 3,  60),
(3, 1, 500), (3, 2, 300), (3, 3, 200),
(4, 1, 350), (4, 2, 200), (4, 3, 150),
(5, 1, 800), (5, 2, 600), (5, 3, 400);

-- =====================================================
-- 6. CUSTOMERS
-- =====================================================
INSERT INTO Customers (CustomerName, Email, Phone, Address, City, Country, CreditLimit) VALUES
('ABC Corporation',  'contact@abc.com',    '555-1234', '123 Main St',    'New York',    'USA',    50000.00),
('XYZ Industries',   'sales@xyz.com',      '555-5678', '456 Oak Ave',    'Los Angeles', 'USA',    75000.00),
('Global Traders',   'info@global.com',    '555-9012', '789 Pine Rd',    'Chicago',     'USA',   100000.00),
('Tech Solutions',   'tech@solutions.com', '555-3456', '321 Elm St',     'Houston',     'USA',    60000.00),
('Prime Goods Ltd',  'prime@goods.com',    '555-7890', '654 Cedar Blvd', 'Phoenix',     'USA',    80000.00);

-- =====================================================
-- 7. SUPPLIERS
-- =====================================================
INSERT INTO Suppliers (SupplierName, Email, Phone, Address, City, Country, PaymentTerms) VALUES
('Supplier One',    'sales@supplier1.com',   '555-2000', '10 Industrial Rd', 'Detroit',   'USA',    'Net 30'),
('Supplier Two',    'contact@supplier2.com', '555-3000', '20 Factory Lane',  'Houston',   'USA',    'Net 45'),
('Global Supplier', 'export@globalsupply.com','555-4000','30 Trade Blvd',    'Toronto',   'Canada', 'Net 60'),
('FastParts Co',    'fast@parts.com',        '555-5000', '40 Supply St',     'Seattle',   'USA',    'Net 15'),
('BestMaterials',   'info@bestmat.com',      '555-6000', '50 Source Ave',    'Dallas',    'USA',    'Net 30');

-- =====================================================
-- 8. SALES ORDERS
-- =====================================================
INSERT INTO SalesOrders (OrderNumber, OrderDate, DeliveryDate, CustomerId, TotalAmount, Status, CreatedBy) VALUES
('SO-2026-001', '2026-01-05', '2026-01-20', 1, 12500.00, 'Delivered',  2),
('SO-2026-002', '2026-01-15', '2026-02-01', 2, 22500.00, 'Shipped',    2),
('SO-2026-003', '2026-02-01', '2026-02-15', 3,  8750.00, 'Confirmed',  3),
('SO-2026-004', '2026-02-20', '2026-03-10', 4, 15000.00, 'Pending',    3),
('SO-2026-005', '2026-03-01', '2026-03-20', 5, 31250.00, 'Pending',    2);

-- =====================================================
-- 9. SALES ORDER DETAILS
-- =====================================================
INSERT INTO SalesOrderDetails (SalesOrderId, ItemId, Quantity, UnitPrice, LineTotal) VALUES
(1, 1, 100, 50.00,  5000.00),
(1, 2,  50, 75.00,  3750.00),
(1, 3, 150, 25.00,  3750.00),
(2, 2, 200, 75.00, 15000.00),
(2, 4, 250, 30.00,  7500.00),
(3, 1,  75, 50.00,  3750.00),
(3, 3, 200, 25.00,  5000.00),
(4, 2, 100, 75.00,  7500.00),
(4, 5, 750, 10.00,  7500.00),
(5, 1, 250, 50.00, 12500.00),
(5, 2, 125, 75.00,  9375.00),
(5, 3, 375, 25.00,  9375.00);

-- =====================================================
-- 10. PURCHASE ORDERS
-- =====================================================
INSERT INTO PurchaseOrders (PONumber, OrderDate, DeliveryDate, SupplierId, TotalAmount, Status, CreatedBy) VALUES
('PO-2026-001', '2026-01-03', '2026-01-18', 1,  5000.00, 'Received',  2),
('PO-2026-002', '2026-01-20', '2026-02-05', 2,  9000.00, 'Received',  2),
('PO-2026-003', '2026-02-05', '2026-02-20', 3,  6500.00, 'Confirmed', 3),
('PO-2026-004', '2026-02-25', '2026-03-15', 4,  3000.00, 'Pending',   3),
('PO-2026-005', '2026-03-05', '2026-03-25', 5, 12000.00, 'Pending',   2);

-- =====================================================
-- 11. PURCHASE ORDER DETAILS
-- =====================================================
INSERT INTO PurchaseOrderDetails (PurchaseOrderId, ItemId, Quantity, UnitPrice, LineTotal) VALUES
(1, 3, 100, 20.00, 2000.00),
(1, 5, 300,  10.00, 3000.00),
(2, 4, 200, 22.00, 4400.00),
(2, 5, 460, 10.00, 4600.00),
(3, 1,  50, 40.00, 2000.00),
(3, 2,  60, 60.00, 3600.00),
(3, 3,  36, 25.00,  900.00),
(4, 3, 100, 20.00, 2000.00),
(4, 4,  33, 30.00,  990.00),
(5, 1, 150, 40.00, 6000.00),
(5, 2, 100, 60.00, 6000.00);

-- =====================================================
-- 12. TRANSACTIONS
-- =====================================================
INSERT INTO Transactions (TransactionDate, Description, Amount, DebitAccountId, CreditAccountId, CreatedBy) VALUES
('2026-01-05', 'Sales revenue - SO-2026-001',   12500.00, 2, 6, 2),
('2026-01-15', 'Sales revenue - SO-2026-002',   22500.00, 2, 6, 2),
('2026-01-18', 'Payment to Supplier One',         5000.00, 4, 1, 2),
('2026-02-01', 'Sales revenue - SO-2026-003',    8750.00, 2, 6, 3),
('2026-02-05', 'Payment to Supplier Two',         9000.00, 4, 1, 2),
('2026-02-20', 'Sales revenue - SO-2026-004',   15000.00, 2, 6, 3),
('2026-03-01', 'Sales revenue - SO-2026-005',   31250.00, 2, 6, 2),
('2026-03-10', 'Operating expenses - March',      5000.00, 8, 1, 1);

-- =====================================================
-- 13. INVOICES
-- =====================================================
INSERT INTO Invoices (InvoiceNumber, InvoiceDate, DueDate, CustomerId, TotalAmount, PaidAmount, Status, CreatedBy) VALUES
('INV-2026-001', '2026-01-05', '2026-02-05', 1, 12500.00, 12500.00, 'Paid',    2),
('INV-2026-002', '2026-01-15', '2026-02-15', 2, 22500.00, 22500.00, 'Paid',    2),
('INV-2026-003', '2026-02-01', '2026-03-01', 3,  8750.00,  8750.00, 'Paid',    3),
('INV-2026-004', '2026-02-20', '2026-03-20', 4, 15000.00,     0.00, 'Sent',    3),
('INV-2026-005', '2026-03-01', '2026-04-01', 5, 31250.00,     0.00, 'Draft',   2);

-- =====================================================
-- 14. BILL OF MATERIALS
-- =====================================================
INSERT INTO BillOfMaterials (ProductId) VALUES (1), (2);

INSERT INTO BOMDetails (BOMId, ComponentId, Quantity) VALUES
(1, 3, 2.00),
(1, 5, 5.00),
(2, 3, 3.00),
(2, 4, 2.00),
(2, 5, 4.00);

-- =====================================================
-- 15. WORK ORDERS
-- =====================================================
INSERT INTO WorkOrders (WorkOrderNumber, ProductId, Quantity, StartDate, EndDate, Status, CreatedBy) VALUES
('WO-2026-001', 1, 500, '2026-01-10', '2026-01-25', 'Completed',   2),
('WO-2026-002', 2, 300, '2026-02-01', '2026-02-20', 'In Progress', 2),
('WO-2026-003', 1, 400, '2026-03-01', '2026-03-15', 'Planned',     3);

-- =====================================================
-- 16. PROJECTS
-- =====================================================
INSERT INTO Projects (ProjectName, Description, StartDate, EndDate, Status, ProjectManager, Budget, CreatedBy) VALUES
('Website Redesign',       'Complete redesign of company website',              '2026-01-01', '2026-06-30', 'In Progress', 2, 50000.00,  1),
('Mobile App Development', 'Develop iOS and Android mobile applications',       '2026-02-01', '2026-12-31', 'Planning',    3, 100000.00, 1),
('System Migration',       'Migrate legacy systems to cloud infrastructure',    '2026-03-01', '2026-09-30', 'Planning',    4, 75000.00,  1);

-- =====================================================
-- 17. PROJECT TASKS
-- =====================================================
INSERT INTO ProjectTasks (ProjectId, TaskName, Description, AssignedTo, StartDate, EndDate, Priority, Status) VALUES
(1, 'UI Design',          'Design new UI mockups',          3, '2026-01-01', '2026-01-31', 'High',   'Done'),
(1, 'Frontend Dev',       'Implement React frontend',       4, '2026-02-01', '2026-03-31', 'High',   'In Progress'),
(1, 'Backend API',        'Build REST API endpoints',       2, '2026-02-01', '2026-04-30', 'High',   'In Progress'),
(1, 'Testing & QA',       'Test all features',              5, '2026-05-01', '2026-06-15', 'Medium', 'To Do'),
(2, 'Requirements',       'Gather app requirements',        3, '2026-02-01', '2026-02-28', 'High',   'Done'),
(2, 'iOS Development',    'Build iOS application',          4, '2026-03-01', '2026-09-30', 'High',   'To Do'),
(2, 'Android Development','Build Android application',      5, '2026-03-01', '2026-09-30', 'High',   'To Do'),
(3, 'Infrastructure Setup','Setup cloud infrastructure',    2, '2026-03-01', '2026-05-31', 'Critical','In Progress'),
(3, 'Data Migration',     'Migrate existing data',          3, '2026-06-01', '2026-08-31', 'High',   'To Do');

-- =====================================================
-- 18. TIMESHEETS
-- =====================================================
INSERT INTO Timesheets (EmployeeId, ProjectId, TaskId, WorkDate, HoursWorked, Description, Status) VALUES
(3, 1, 1, '2026-01-10', 8.0, 'Completed homepage mockup',       'Approved'),
(3, 1, 1, '2026-01-11', 7.5, 'Completed dashboard mockup',      'Approved'),
(4, 1, 2, '2026-02-05', 8.0, 'Setup React project structure',   'Approved'),
(4, 1, 2, '2026-02-06', 8.0, 'Built navigation components',     'Submitted'),
(2, 1, 3, '2026-02-05', 6.0, 'Designed API schema',             'Approved'),
(2, 1, 3, '2026-02-06', 7.0, 'Implemented auth endpoints',      'Submitted'),
(3, 2, 5, '2026-02-10', 8.0, 'Requirements gathering session',  'Approved'),
(2, 3, 8, '2026-03-05', 8.0, 'Cloud infra setup - AWS',         'Submitted');

-- =====================================================
-- 19. ASSETS
-- =====================================================
INSERT INTO Assets (AssetCode, AssetName, AssetType, PurchaseDate, PurchasePrice, CurrentValue, Location, Status) VALUES
('AST-001', 'Dell Server R740',      'IT Equipment',  '2024-01-15', 15000.00, 12000.00, 'Server Room A',      'Active'),
('AST-002', 'Forklift Model X200',   'Machinery',     '2023-06-01', 35000.00, 28000.00, 'Main Warehouse',     'Active'),
('AST-003', 'Office Printer HP LaserJet', 'Equipment', '2024-03-10',  1200.00,   900.00, 'Office Floor 2',    'Active'),
('AST-004', 'Delivery Van - Ford Transit', 'Vehicle',  '2023-01-20', 45000.00, 36000.00, 'Parking Lot A',     'Active'),
('AST-005', 'CNC Machine Model Z',   'Machinery',     '2022-11-05', 80000.00, 60000.00, 'Manufacturing Floor','Active');
