-- ERP Solution Database Schema
-- MS SQL Server

-- =====================================================
-- 1. USERS & AUTHENTICATION
-- =====================================================

IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
CREATE TABLE dbo.Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(500) NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(20),
    Role NVARCHAR(50) DEFAULT 'User',
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    UpdatedDate DATETIME DEFAULT GETDATE(),
    LastLoginDate DATETIME
);

CREATE INDEX IX_Users_Email ON dbo.Users(Email);

-- =====================================================
-- 2. ACCOUNTING MODULE
-- =====================================================

IF OBJECT_ID('dbo.Accounts', 'U') IS NOT NULL DROP TABLE dbo.Accounts;
CREATE TABLE dbo.Accounts (
    AccountId INT PRIMARY KEY IDENTITY(1,1),
    AccountCode NVARCHAR(50) NOT NULL UNIQUE,
    AccountName NVARCHAR(255) NOT NULL,
    AccountType NVARCHAR(50), -- Asset, Liability, Equity, Income, Expense
    Description NVARCHAR(500),
    Balance DECIMAL(18,2) DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

IF OBJECT_ID('dbo.Transactions', 'U') IS NOT NULL DROP TABLE dbo.Transactions;
CREATE TABLE dbo.Transactions (
    TransactionId INT PRIMARY KEY IDENTITY(1,1),
    TransactionDate DATETIME NOT NULL,
    Description NVARCHAR(500),
    Amount DECIMAL(18,2) NOT NULL,
    DebitAccountId INT NOT NULL,
    CreditAccountId INT NOT NULL,
    CreatedBy INT NOT NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (DebitAccountId) REFERENCES dbo.Accounts(AccountId),
    FOREIGN KEY (CreditAccountId) REFERENCES dbo.Accounts(AccountId),
    FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(UserId)
);

IF OBJECT_ID('dbo.Invoices', 'U') IS NOT NULL DROP TABLE dbo.Invoices;
CREATE TABLE dbo.Invoices (
    InvoiceId INT PRIMARY KEY IDENTITY(1,1),
    InvoiceNumber NVARCHAR(50) NOT NULL UNIQUE,
    InvoiceDate DATETIME NOT NULL,
    DueDate DATETIME,
    CustomerId INT,
    TotalAmount DECIMAL(18,2),
    PaidAmount DECIMAL(18,2) DEFAULT 0,
    Status NVARCHAR(50) DEFAULT 'Draft', -- Draft, Sent, Paid, Overdue
    CreatedBy INT NOT NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(UserId)
);

-- =====================================================
-- 3. INVENTORY MODULE
-- =====================================================

IF OBJECT_ID('dbo.Warehouses', 'U') IS NOT NULL DROP TABLE dbo.Warehouses;
CREATE TABLE dbo.Warehouses (
    WarehouseId INT PRIMARY KEY IDENTITY(1,1),
    WarehouseName NVARCHAR(255) NOT NULL,
    Location NVARCHAR(500),
    Manager INT,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (Manager) REFERENCES dbo.Users(UserId)
);

IF OBJECT_ID('dbo.Items', 'U') IS NOT NULL DROP TABLE dbo.Items;
CREATE TABLE dbo.Items (
    ItemId INT PRIMARY KEY IDENTITY(1,1),
    ItemCode NVARCHAR(50) NOT NULL UNIQUE,
    ItemName NVARCHAR(255) NOT NULL,
    Description NVARCHAR(500),
    UnitPrice DECIMAL(18,2),
    ReorderLevel INT DEFAULT 10,
    CreatedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

IF OBJECT_ID('dbo.Stock', 'U') IS NOT NULL DROP TABLE dbo.Stock;
CREATE TABLE dbo.Stock (
    StockId INT PRIMARY KEY IDENTITY(1,1),
    ItemId INT NOT NULL,
    WarehouseId INT NOT NULL,
    Quantity INT DEFAULT 0,
    LastUpdated DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ItemId) REFERENCES dbo.Items(ItemId),
    FOREIGN KEY (WarehouseId) REFERENCES dbo.Warehouses(WarehouseId),
    UNIQUE(ItemId, WarehouseId)
);

-- =====================================================
-- 4. ORDERS MODULE
-- =====================================================

IF OBJECT_ID('dbo.Customers', 'U') IS NOT NULL DROP TABLE dbo.Customers;
CREATE TABLE dbo.Customers (
    CustomerId INT PRIMARY KEY IDENTITY(1,1),
    CustomerName NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255),
    Phone NVARCHAR(20),
    Address NVARCHAR(500),
    City NVARCHAR(100),
    Country NVARCHAR(100),
    CreditLimit DECIMAL(18,2),
    CreatedDate DATETIME DEFAULT GETDATE()
);

IF OBJECT_ID('dbo.Suppliers', 'U') IS NOT NULL DROP TABLE dbo.Suppliers;
CREATE TABLE dbo.Suppliers (
    SupplierId INT PRIMARY KEY IDENTITY(1,1),
    SupplierName NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255),
    Phone NVARCHAR(20),
    Address NVARCHAR(500),
    City NVARCHAR(100),
    Country NVARCHAR(100),
    PaymentTerms NVARCHAR(100),
    CreatedDate DATETIME DEFAULT GETDATE()
);

IF OBJECT_ID('dbo.SalesOrders', 'U') IS NOT NULL DROP TABLE dbo.SalesOrders;
CREATE TABLE dbo.SalesOrders (
    SalesOrderId INT PRIMARY KEY IDENTITY(1,1),
    OrderNumber NVARCHAR(50) NOT NULL UNIQUE,
    OrderDate DATETIME NOT NULL,
    DeliveryDate DATETIME,
    CustomerId INT NOT NULL,
    TotalAmount DECIMAL(18,2),
    Status NVARCHAR(50) DEFAULT 'Pending', -- Pending, Confirmed, Shipped, Delivered
    CreatedBy INT NOT NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CustomerId) REFERENCES dbo.Customers(CustomerId),
    FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(UserId)
);

IF OBJECT_ID('dbo.SalesOrderDetails', 'U') IS NOT NULL DROP TABLE dbo.SalesOrderDetails;
CREATE TABLE dbo.SalesOrderDetails (
    OrderDetailId INT PRIMARY KEY IDENTITY(1,1),
    SalesOrderId INT NOT NULL,
    ItemId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2),
    LineTotal DECIMAL(18,2),
    FOREIGN KEY (SalesOrderId) REFERENCES dbo.SalesOrders(SalesOrderId),
    FOREIGN KEY (ItemId) REFERENCES dbo.Items(ItemId)
);

IF OBJECT_ID('dbo.PurchaseOrders', 'U') IS NOT NULL DROP TABLE dbo.PurchaseOrders;
CREATE TABLE dbo.PurchaseOrders (
    PurchaseOrderId INT PRIMARY KEY IDENTITY(1,1),
    PONumber NVARCHAR(50) NOT NULL UNIQUE,
    OrderDate DATETIME NOT NULL,
    DeliveryDate DATETIME,
    SupplierId INT NOT NULL,
    TotalAmount DECIMAL(18,2),
    Status NVARCHAR(50) DEFAULT 'Pending', -- Pending, Confirmed, Received
    CreatedBy INT NOT NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (SupplierId) REFERENCES dbo.Suppliers(SupplierId),
    FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(UserId)
);

IF OBJECT_ID('dbo.PurchaseOrderDetails', 'U') IS NOT NULL DROP TABLE dbo.PurchaseOrderDetails;
CREATE TABLE dbo.PurchaseOrderDetails (
    OrderDetailId INT PRIMARY KEY IDENTITY(1,1),
    PurchaseOrderId INT NOT NULL,
    ItemId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2),
    LineTotal DECIMAL(18,2),
    FOREIGN KEY (PurchaseOrderId) REFERENCES dbo.PurchaseOrders(PurchaseOrderId),
    FOREIGN KEY (ItemId) REFERENCES dbo.Items(ItemId)
);

-- =====================================================
-- 5. MANUFACTURING MODULE
-- =====================================================

IF OBJECT_ID('dbo.BillOfMaterials', 'U') IS NOT NULL DROP TABLE dbo.BillOfMaterials;
CREATE TABLE dbo.BillOfMaterials (
    BOMId INT PRIMARY KEY IDENTITY(1,1),
    ProductId INT NOT NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (ProductId) REFERENCES dbo.Items(ItemId)
);

IF OBJECT_ID('dbo.BOMDetails', 'U') IS NOT NULL DROP TABLE dbo.BOMDetails;
CREATE TABLE dbo.BOMDetails (
    BOMDetailId INT PRIMARY KEY IDENTITY(1,1),
    BOMId INT NOT NULL,
    ComponentId INT NOT NULL,
    Quantity DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (BOMId) REFERENCES dbo.BillOfMaterials(BOMId),
    FOREIGN KEY (ComponentId) REFERENCES dbo.Items(ItemId)
);

IF OBJECT_ID('dbo.WorkOrders', 'U') IS NOT NULL DROP TABLE dbo.WorkOrders;
CREATE TABLE dbo.WorkOrders (
    WorkOrderId INT PRIMARY KEY IDENTITY(1,1),
    WorkOrderNumber NVARCHAR(50) NOT NULL UNIQUE,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    StartDate DATETIME,
    EndDate DATETIME,
    Status NVARCHAR(50) DEFAULT 'Planned', -- Planned, In Progress, Completed
    CreatedBy INT NOT NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProductId) REFERENCES dbo.Items(ItemId),
    FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(UserId)
);

-- =====================================================
-- 6. PROJECTS MODULE
-- =====================================================

IF OBJECT_ID('dbo.Projects', 'U') IS NOT NULL DROP TABLE dbo.Projects;
CREATE TABLE dbo.Projects (
    ProjectId INT PRIMARY KEY IDENTITY(1,1),
    ProjectName NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    StartDate DATETIME,
    EndDate DATETIME,
    Status NVARCHAR(50) DEFAULT 'Planning', -- Planning, In Progress, On Hold, Completed
    ProjectManager INT,
    Budget DECIMAL(18,2),
    CreatedBy INT NOT NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProjectManager) REFERENCES dbo.Users(UserId),
    FOREIGN KEY (CreatedBy) REFERENCES dbo.Users(UserId)
);

IF OBJECT_ID('dbo.ProjectTasks', 'U') IS NOT NULL DROP TABLE dbo.ProjectTasks;
CREATE TABLE dbo.ProjectTasks (
    TaskId INT PRIMARY KEY IDENTITY(1,1),
    ProjectId INT NOT NULL,
    TaskName NVARCHAR(255) NOT NULL,
    Description NVARCHAR(500),
    AssignedTo INT,
    StartDate DATETIME,
    EndDate DATETIME,
    Priority NVARCHAR(50), -- Low, Medium, High, Critical
    Status NVARCHAR(50) DEFAULT 'To Do', -- To Do, In Progress, Done
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProjectId) REFERENCES dbo.Projects(ProjectId),
    FOREIGN KEY (AssignedTo) REFERENCES dbo.Users(UserId)
);

IF OBJECT_ID('dbo.Timesheets', 'U') IS NOT NULL DROP TABLE dbo.Timesheets;
CREATE TABLE dbo.Timesheets (
    TimesheetId INT PRIMARY KEY IDENTITY(1,1),
    EmployeeId INT NOT NULL,
    ProjectId INT,
    TaskId INT,
    WorkDate DATE NOT NULL,
    HoursWorked DECIMAL(5,2),
    Description NVARCHAR(500),
    Status NVARCHAR(50) DEFAULT 'Draft', -- Draft, Submitted, Approved
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (EmployeeId) REFERENCES dbo.Users(UserId),
    FOREIGN KEY (ProjectId) REFERENCES dbo.Projects(ProjectId),
    FOREIGN KEY (TaskId) REFERENCES dbo.ProjectTasks(TaskId)
);

-- =====================================================
-- 7. ASSETS MODULE
-- =====================================================

IF OBJECT_ID('dbo.Assets', 'U') IS NOT NULL DROP TABLE dbo.Assets;
CREATE TABLE dbo.Assets (
    AssetId INT PRIMARY KEY IDENTITY(1,1),
    AssetCode NVARCHAR(50) NOT NULL UNIQUE,
    AssetName NVARCHAR(255) NOT NULL,
    AssetType NVARCHAR(100),
    PurchaseDate DATETIME,
    PurchasePrice DECIMAL(18,2),
    CurrentValue DECIMAL(18,2),
    Location NVARCHAR(255),
    Status NVARCHAR(50) DEFAULT 'Active', -- Active, Inactive, Disposed
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Create indexes for frequently queried tables
CREATE INDEX IX_Transactions_Date ON dbo.Transactions(TransactionDate);
CREATE INDEX IX_Invoices_Date ON dbo.Invoices(InvoiceDate);
CREATE INDEX IX_Stock_Item ON dbo.Stock(ItemId);
CREATE INDEX IX_SalesOrders_Date ON dbo.SalesOrders(OrderDate);
CREATE INDEX IX_PurchaseOrders_Date ON dbo.PurchaseOrders(OrderDate);
CREATE INDEX IX_Projects_Status ON dbo.Projects(Status);
CREATE INDEX IX_ProjectTasks_Status ON dbo.ProjectTasks(Status);
