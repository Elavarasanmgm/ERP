-- ERP Solution Database Schema
-- PostgreSQL version (converted from MS SQL Server)

-- =====================================================
-- 1. USERS & AUTHENTICATION
-- =====================================================

DROP TABLE IF EXISTS Timesheets CASCADE;
DROP TABLE IF EXISTS ProjectTasks CASCADE;
DROP TABLE IF EXISTS Projects CASCADE;
DROP TABLE IF EXISTS WorkOrders CASCADE;
DROP TABLE IF EXISTS BOMDetails CASCADE;
DROP TABLE IF EXISTS BillOfMaterials CASCADE;
DROP TABLE IF EXISTS PurchaseOrderDetails CASCADE;
DROP TABLE IF EXISTS PurchaseOrders CASCADE;
DROP TABLE IF EXISTS SalesOrderDetails CASCADE;
DROP TABLE IF EXISTS SalesOrders CASCADE;
DROP TABLE IF EXISTS Suppliers CASCADE;
DROP TABLE IF EXISTS Customers CASCADE;
DROP TABLE IF EXISTS Stock CASCADE;
DROP TABLE IF EXISTS Items CASCADE;
DROP TABLE IF EXISTS Warehouses CASCADE;
DROP TABLE IF EXISTS Invoices CASCADE;
DROP TABLE IF EXISTS Transactions CASCADE;
DROP TABLE IF EXISTS Accounts CASCADE;
DROP TABLE IF EXISTS Assets CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

CREATE TABLE Users (
    UserId SERIAL PRIMARY KEY,
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHash VARCHAR(500) NOT NULL,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Phone VARCHAR(20),
    Role VARCHAR(50) DEFAULT 'User',
    permissions JSONB,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedDate TIMESTAMP DEFAULT NOW(),
    UpdatedDate TIMESTAMP DEFAULT NOW(),
    LastLoginDate TIMESTAMP
);

CREATE INDEX IX_Users_Email ON Users(Email);

-- =====================================================
-- 2. ACCOUNTING MODULE
-- =====================================================

CREATE TABLE Accounts (
    AccountId SERIAL PRIMARY KEY,
    AccountCode VARCHAR(50) NOT NULL UNIQUE,
    AccountName VARCHAR(255) NOT NULL,
    AccountType VARCHAR(50),
    Description VARCHAR(500),
    Balance DECIMAL(18,2) DEFAULT 0,
    CreatedDate TIMESTAMP DEFAULT NOW(),
    IsActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE Transactions (
    TransactionId SERIAL PRIMARY KEY,
    TransactionDate TIMESTAMP NOT NULL,
    Description VARCHAR(500),
    Amount DECIMAL(18,2) NOT NULL,
    DebitAccountId INT NOT NULL REFERENCES Accounts(AccountId),
    CreditAccountId INT NOT NULL REFERENCES Accounts(AccountId),
    CreatedBy INT NOT NULL REFERENCES Users(UserId),
    CreatedDate TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IX_Transactions_Date ON Transactions(TransactionDate);

CREATE TABLE Invoices (
    InvoiceId SERIAL PRIMARY KEY,
    InvoiceNumber VARCHAR(50) NOT NULL UNIQUE,
    InvoiceDate TIMESTAMP NOT NULL,
    DueDate TIMESTAMP,
    CustomerId INT,
    TotalAmount DECIMAL(18,2),
    PaidAmount DECIMAL(18,2) DEFAULT 0,
    Status VARCHAR(50) DEFAULT 'Draft',
    CreatedBy INT NOT NULL REFERENCES Users(UserId),
    CreatedDate TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IX_Invoices_Date ON Invoices(InvoiceDate);

-- =====================================================
-- 3. INVENTORY MODULE
-- =====================================================

CREATE TABLE Warehouses (
    WarehouseId SERIAL PRIMARY KEY,
    WarehouseName VARCHAR(255) NOT NULL,
    Location VARCHAR(500),
    Manager INT REFERENCES Users(UserId),
    CreatedDate TIMESTAMP DEFAULT NOW()
);

CREATE TABLE Items (
    ItemId SERIAL PRIMARY KEY,
    ItemCode VARCHAR(50) NOT NULL UNIQUE,
    ItemName VARCHAR(255) NOT NULL,
    Description VARCHAR(500),
    UnitPrice DECIMAL(18,2),
    ReorderLevel INT DEFAULT 10,
    CreatedDate TIMESTAMP DEFAULT NOW(),
    IsActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE Stock (
    StockId SERIAL PRIMARY KEY,
    ItemId INT NOT NULL REFERENCES Items(ItemId),
    WarehouseId INT NOT NULL REFERENCES Warehouses(WarehouseId),
    Quantity INT DEFAULT 0,
    LastUpdated TIMESTAMP DEFAULT NOW(),
    UNIQUE(ItemId, WarehouseId)
);

CREATE INDEX IX_Stock_Item ON Stock(ItemId);

-- =====================================================
-- 4. ORDERS MODULE
-- =====================================================

CREATE TABLE Customers (
    CustomerId SERIAL PRIMARY KEY,
    CustomerName VARCHAR(255) NOT NULL,
    Email VARCHAR(255),
    Phone VARCHAR(20),
    Address VARCHAR(500),
    City VARCHAR(100),
    Country VARCHAR(100),
    CreditLimit DECIMAL(18,2),
    CreatedDate TIMESTAMP DEFAULT NOW()
);

CREATE TABLE Suppliers (
    SupplierId SERIAL PRIMARY KEY,
    SupplierName VARCHAR(255) NOT NULL,
    Email VARCHAR(255),
    Phone VARCHAR(20),
    Address VARCHAR(500),
    City VARCHAR(100),
    Country VARCHAR(100),
    PaymentTerms VARCHAR(100),
    CreatedDate TIMESTAMP DEFAULT NOW()
);

CREATE TABLE SalesOrders (
    SalesOrderId SERIAL PRIMARY KEY,
    OrderNumber VARCHAR(50) NOT NULL UNIQUE,
    OrderDate TIMESTAMP NOT NULL,
    DeliveryDate TIMESTAMP,
    CustomerId INT NOT NULL REFERENCES Customers(CustomerId),
    TotalAmount DECIMAL(18,2),
    Status VARCHAR(50) DEFAULT 'Pending',
    CreatedBy INT NOT NULL REFERENCES Users(UserId),
    CreatedDate TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IX_SalesOrders_Date ON SalesOrders(OrderDate);

CREATE TABLE SalesOrderDetails (
    OrderDetailId SERIAL PRIMARY KEY,
    SalesOrderId INT NOT NULL REFERENCES SalesOrders(SalesOrderId),
    ItemId INT NOT NULL REFERENCES Items(ItemId),
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2),
    LineTotal DECIMAL(18,2)
);

CREATE TABLE PurchaseOrders (
    PurchaseOrderId SERIAL PRIMARY KEY,
    PONumber VARCHAR(50) NOT NULL UNIQUE,
    OrderDate TIMESTAMP NOT NULL,
    DeliveryDate TIMESTAMP,
    SupplierId INT NOT NULL REFERENCES Suppliers(SupplierId),
    TotalAmount DECIMAL(18,2),
    Status VARCHAR(50) DEFAULT 'Pending',
    CreatedBy INT NOT NULL REFERENCES Users(UserId),
    CreatedDate TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IX_PurchaseOrders_Date ON PurchaseOrders(OrderDate);

CREATE TABLE PurchaseOrderDetails (
    OrderDetailId SERIAL PRIMARY KEY,
    PurchaseOrderId INT NOT NULL REFERENCES PurchaseOrders(PurchaseOrderId),
    ItemId INT NOT NULL REFERENCES Items(ItemId),
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2),
    LineTotal DECIMAL(18,2)
);

-- =====================================================
-- 5. MANUFACTURING MODULE
-- =====================================================

CREATE TABLE BillOfMaterials (
    BOMId SERIAL PRIMARY KEY,
    ProductId INT NOT NULL REFERENCES Items(ItemId),
    CreatedDate TIMESTAMP DEFAULT NOW(),
    IsActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE BOMDetails (
    BOMDetailId SERIAL PRIMARY KEY,
    BOMId INT NOT NULL REFERENCES BillOfMaterials(BOMId),
    ComponentId INT NOT NULL REFERENCES Items(ItemId),
    Quantity DECIMAL(10,2) NOT NULL
);

CREATE TABLE WorkOrders (
    WorkOrderId SERIAL PRIMARY KEY,
    WorkOrderNumber VARCHAR(50) NOT NULL UNIQUE,
    ProductId INT NOT NULL REFERENCES Items(ItemId),
    Quantity INT NOT NULL,
    StartDate TIMESTAMP,
    EndDate TIMESTAMP,
    Status VARCHAR(50) DEFAULT 'Planned',
    CreatedBy INT NOT NULL REFERENCES Users(UserId),
    CreatedDate TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 6. PROJECTS MODULE
-- =====================================================

CREATE TABLE Projects (
    ProjectId SERIAL PRIMARY KEY,
    ProjectName VARCHAR(255) NOT NULL,
    Description TEXT,
    StartDate TIMESTAMP,
    EndDate TIMESTAMP,
    Status VARCHAR(50) DEFAULT 'Planning',
    ProjectManager INT REFERENCES Users(UserId),
    Budget DECIMAL(18,2),
    CreatedBy INT NOT NULL REFERENCES Users(UserId),
    CreatedDate TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IX_Projects_Status ON Projects(Status);

CREATE TABLE ProjectTasks (
    TaskId SERIAL PRIMARY KEY,
    ProjectId INT NOT NULL REFERENCES Projects(ProjectId),
    TaskName VARCHAR(255) NOT NULL,
    Description VARCHAR(500),
    AssignedTo INT REFERENCES Users(UserId),
    StartDate TIMESTAMP,
    EndDate TIMESTAMP,
    Priority VARCHAR(50),
    Status VARCHAR(50) DEFAULT 'To Do',
    CreatedDate TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IX_ProjectTasks_Status ON ProjectTasks(Status);

CREATE TABLE Timesheets (
    TimesheetId SERIAL PRIMARY KEY,
    EmployeeId INT NOT NULL REFERENCES Users(UserId),
    ProjectId INT REFERENCES Projects(ProjectId),
    TaskId INT REFERENCES ProjectTasks(TaskId),
    WorkDate DATE NOT NULL,
    HoursWorked DECIMAL(5,2),
    Description VARCHAR(500),
    Status VARCHAR(50) DEFAULT 'Draft',
    CreatedDate TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 7. ASSETS MODULE
-- =====================================================

CREATE TABLE Assets (
    AssetId SERIAL PRIMARY KEY,
    AssetCode VARCHAR(50) NOT NULL UNIQUE,
    AssetName VARCHAR(255) NOT NULL,
    AssetType VARCHAR(100),
    PurchaseDate TIMESTAMP,
    PurchasePrice DECIMAL(18,2),
    CurrentValue DECIMAL(18,2),
    Location VARCHAR(255),
    Status VARCHAR(50) DEFAULT 'Active',
    CreatedDate TIMESTAMP DEFAULT NOW()
);
