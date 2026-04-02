-- Seed data for ERP System

-- =====================================================
-- 1. INSERT DEFAULT ACCOUNTS
-- =====================================================

INSERT INTO dbo.Accounts (AccountCode, AccountName, AccountType, Description)
VALUES 
('1000', 'Cash', 'Asset', 'Cash account'),
('1100', 'Accounts Receivable', 'Asset', 'Customer payments'),
('1500', 'Equipment', 'Asset', 'Office equipment'),
('2000', 'Accounts Payable', 'Liability', 'Supplier payments'),
('3000', 'Common Stock', 'Equity', 'Share capital'),
('4000', 'Sales Revenue', 'Income', 'Product sales'),
('5000', 'Cost of Goods Sold', 'Expense', 'COGS'),
('6000', 'Operating Expenses', 'Expense', 'General operating expenses');

-- =====================================================
-- 2. INSERT WAREHOUSES
-- =====================================================

INSERT INTO dbo.Warehouses (WarehouseName, Location)
VALUES 
('Main Warehouse', 'Building A, Floor 1'),
('Secondary Warehouse', 'Building B, Floor 2'),
('Distribution Center', 'Downtown Location');

-- =====================================================
-- 3. INSERT SAMPLE ITEMS
-- =====================================================

INSERT INTO dbo.Items (ItemCode, ItemName, Description, UnitPrice, ReorderLevel)
VALUES 
('PROD001', 'Widget A', 'Standard widget product', 50.00, 20),
('PROD002', 'Widget B', 'Premium widget product', 75.00, 15),
('PROD003', 'Component X', 'Electronic component', 25.00, 50),
('PROD004', 'Component Y', 'Mechanical component', 30.00, 35),
('PROD005', 'Raw Material Z', 'Base material', 10.00, 100);

-- =====================================================
-- 4. INSERT SAMPLE CUSTOMERS
-- =====================================================

INSERT INTO dbo.Customers (CustomerName, Email, Phone, City, Country, CreditLimit)
VALUES 
('ABC Corporation', 'contact@abc.com', '555-1234', 'New York', 'USA', 50000.00),
('XYZ Industries', 'sales@xyz.com', '555-5678', 'Los Angeles', 'USA', 75000.00),
('Global Traders', 'info@global.com', '555-9012', 'Chicago', 'USA', 100000.00);

-- =====================================================
-- 5. INSERT SAMPLE SUPPLIERS
-- =====================================================

INSERT INTO dbo.Suppliers (SupplierName, Email, Phone, City, Country, PaymentTerms)
VALUES 
('Supplier One', 'sales@supplier1.com', '555-2000', 'Detroit', 'USA', 'Net 30'),
('Supplier Two', 'contact@supplier2.com', '555-3000', 'Houston', 'USA', 'Net 45'),
('Global Supplier', 'export@globalsupply.com', '555-4000', 'Toronto', 'Canada', 'Net 60');

-- =====================================================
-- 6. INSERT INITIAL STOCK LEVELS
-- =====================================================

INSERT INTO dbo.Stock (ItemId, WarehouseId, Quantity)
SELECT i.ItemId, w.WarehouseId, 100
FROM dbo.Items i, dbo.Warehouses w;

-- =====================================================
-- 7. INSERT SAMPLE PROJECTS
-- =====================================================

INSERT INTO dbo.Projects (ProjectName, Description, StartDate, EndDate, Status, Budget)
VALUES 
('Website Redesign', 'Complete redesign of company website', '2026-01-01', '2026-06-30', 'In Progress', 50000.00),
('Mobile App Development', 'Develop iOS and Android mobile applications', '2026-02-01', '2026-12-31', 'Planning', 100000.00),
('System Migration', 'Migrate legacy systems to cloud infrastructure', '2026-03-01', '2026-09-30', 'Planning', 75000.00);
