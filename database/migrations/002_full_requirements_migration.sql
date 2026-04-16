-- ============================================================
-- ERP FULL REQUIREMENTS MIGRATION
-- Covers all 14 requirements from DIMA site visit
-- PostgreSQL — Safe ALTER (no data loss)
-- ============================================================

-- ============================================================
-- REQ #14 — FOUNDATION: Company Settings, Sequences, Roles
-- (Built first — everything else depends on these)
-- ============================================================

CREATE TABLE IF NOT EXISTS company_settings (
    id                   SERIAL PRIMARY KEY,
    company_name         VARCHAR(255),
    company_address      TEXT,
    city                 VARCHAR(100),
    state                VARCHAR(100),
    pincode              VARCHAR(10),
    country              VARCHAR(100) DEFAULT 'India',
    phone                VARCHAR(20),
    email                VARCHAR(255),
    website              VARCHAR(255),
    gst_number           VARCHAR(20),
    pan_number           VARCHAR(20),
    cin_number           VARCHAR(30),
    logo_path            VARCHAR(500),
    financial_year_start VARCHAR(5) DEFAULT '04-01',
    base_currency        VARCHAR(10) DEFAULT 'INR',
    date_format          VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    updated_date         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS number_sequences (
    id               SERIAL PRIMARY KEY,
    document_type    VARCHAR(50) UNIQUE,
    prefix           VARCHAR(20),
    current_number   INT DEFAULT 0,
    format           VARCHAR(50),
    reset_yearly     BOOLEAN DEFAULT TRUE,
    financial_year   VARCHAR(10),
    updated_date     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles_permissions (
    id           SERIAL PRIMARY KEY,
    role_name    VARCHAR(50) UNIQUE,
    permissions  JSONB,
    description  VARCHAR(300),
    created_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id             SERIAL PRIMARY KEY,
    user_id        INT REFERENCES Users(UserId),
    action         VARCHAR(50),
    module         VARCHAR(100),
    reference_type VARCHAR(50),
    reference_id   INT,
    old_values     JSONB,
    new_values     JSONB,
    ip_address     VARCHAR(50),
    user_agent     VARCHAR(500),
    created_date   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- REQ #04 — FINANCE: Tax Master, Financial Periods
-- ============================================================

CREATE TABLE IF NOT EXISTS tax_master (
    id           SERIAL PRIMARY KEY,
    tax_name     VARCHAR(100),
    tax_type     VARCHAR(50),
    tax_rate     DECIMAL(5,2),
    account_id   INT REFERENCES Accounts(AccountId),
    is_active    BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_periods (
    id           SERIAL PRIMARY KEY,
    period_name  VARCHAR(50),
    start_date   DATE,
    end_date     DATE,
    is_closed    BOOLEAN DEFAULT FALSE,
    closed_by    INT REFERENCES Users(UserId),
    closed_date  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id             SERIAL PRIMARY KEY,
    account_id     INT REFERENCES Accounts(AccountId),
    transaction_id INT REFERENCES Transactions(TransactionId),
    entry_type     VARCHAR(5),
    amount         DECIMAL(18,2),
    balance_after  DECIMAL(18,2),
    period_id      INT REFERENCES financial_periods(id),
    entry_date     TIMESTAMP DEFAULT NOW(),
    narration      VARCHAR(500)
);

-- Alter Accounts — hierarchy + GST fields
ALTER TABLE Accounts
    ADD COLUMN IF NOT EXISTS parent_account_id   INT REFERENCES Accounts(AccountId),
    ADD COLUMN IF NOT EXISTS account_level        INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS account_group        VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_group             BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS opening_balance      DECIMAL(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS opening_balance_type VARCHAR(5) DEFAULT 'DR',
    ADD COLUMN IF NOT EXISTS currency             VARCHAR(10) DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS tax_rate             DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS is_tax_account       BOOLEAN DEFAULT FALSE;

-- ============================================================
-- REQ #03 — CUSTOMER & SUPPLIER: GST, Currency
-- ============================================================

CREATE TABLE IF NOT EXISTS currencies (
    id            SERIAL PRIMARY KEY,
    code          VARCHAR(10) UNIQUE,
    name          VARCHAR(100),
    symbol        VARCHAR(5),
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    is_active     BOOLEAN DEFAULT TRUE,
    updated_date  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gst_fetch_log (
    id           SERIAL PRIMARY KEY,
    gst_number   VARCHAR(20),
    fetched_data JSONB,
    fetched_by   INT REFERENCES Users(UserId),
    fetched_date TIMESTAMP DEFAULT NOW(),
    status       VARCHAR(20)
);

ALTER TABLE Customers
    ADD COLUMN IF NOT EXISTS currency          VARCHAR(10) DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS gst_number        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS gst_verified      BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS gst_trade_name    VARCHAR(255),
    ADD COLUMN IF NOT EXISTS gst_legal_name    VARCHAR(255),
    ADD COLUMN IF NOT EXISTS gst_status        VARCHAR(50),
    ADD COLUMN IF NOT EXISTS gst_state_code    VARCHAR(10),
    ADD COLUMN IF NOT EXISTS pan_number        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS customer_type     VARCHAR(50) DEFAULT 'Domestic',
    ADD COLUMN IF NOT EXISTS credit_days       INT DEFAULT 30,
    ADD COLUMN IF NOT EXISTS contact_person    VARCHAR(100),
    ADD COLUMN IF NOT EXISTS alt_phone         VARCHAR(20),
    ADD COLUMN IF NOT EXISTS website           VARCHAR(255),
    ADD COLUMN IF NOT EXISTS state             VARCHAR(100),
    ADD COLUMN IF NOT EXISTS pincode           VARCHAR(10);

ALTER TABLE Suppliers
    ADD COLUMN IF NOT EXISTS currency          VARCHAR(10) DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS supplier_type     VARCHAR(50) DEFAULT 'Material Supplier',
    ADD COLUMN IF NOT EXISTS gst_number        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS gst_verified      BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS gst_trade_name    VARCHAR(255),
    ADD COLUMN IF NOT EXISTS gst_legal_name    VARCHAR(255),
    ADD COLUMN IF NOT EXISTS gst_status        VARCHAR(50),
    ADD COLUMN IF NOT EXISTS gst_state_code    VARCHAR(10),
    ADD COLUMN IF NOT EXISTS pan_number        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS contact_person    VARCHAR(100),
    ADD COLUMN IF NOT EXISTS alt_phone         VARCHAR(20),
    ADD COLUMN IF NOT EXISTS website           VARCHAR(255),
    ADD COLUMN IF NOT EXISTS state             VARCHAR(100),
    ADD COLUMN IF NOT EXISTS pincode           VARCHAR(10),
    ADD COLUMN IF NOT EXISTS bank_name         VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bank_account      VARCHAR(50),
    ADD COLUMN IF NOT EXISTS bank_ifsc         VARCHAR(20);

-- ============================================================
-- REQ #01 — ITEM MASTER: Category / Subcategory / Type
-- ============================================================

CREATE TABLE IF NOT EXISTS item_categories (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    description  VARCHAR(500),
    is_active    BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_subcategories (
    id           SERIAL PRIMARY KEY,
    category_id  INT REFERENCES item_categories(id),
    name         VARCHAR(100) NOT NULL,
    description  VARCHAR(500),
    is_active    BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_types (
    id              SERIAL PRIMARY KEY,
    subcategory_id  INT REFERENCES item_subcategories(id),
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(500),
    is_active       BOOLEAN DEFAULT TRUE,
    created_date    TIMESTAMP DEFAULT NOW()
);

ALTER TABLE Items
    ADD COLUMN IF NOT EXISTS category_id     INT REFERENCES item_categories(id),
    ADD COLUMN IF NOT EXISTS subcategory_id  INT REFERENCES item_subcategories(id),
    ADD COLUMN IF NOT EXISTS type_id         INT REFERENCES item_types(id),
    ADD COLUMN IF NOT EXISTS item_number     VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(20) DEFAULT 'PCS',
    ADD COLUMN IF NOT EXISTS hsn_code        VARCHAR(20);

-- ============================================================
-- REQ #02 — INVENTORY: Stock Locations, Opening Stock, Movements
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_locations (
    id             SERIAL PRIMARY KEY,
    warehouse_id   INT REFERENCES Warehouses(WarehouseId),
    rack           VARCHAR(50),
    row            VARCHAR(50),
    bin            VARCHAR(50),
    location_code  VARCHAR(100),
    is_active      BOOLEAN DEFAULT TRUE,
    created_date   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opening_stock (
    id            SERIAL PRIMARY KEY,
    item_id       INT REFERENCES Items(ItemId),
    warehouse_id  INT REFERENCES Warehouses(WarehouseId),
    location_id   INT REFERENCES stock_locations(id),
    quantity      DECIMAL(10,2),
    unit_cost     DECIMAL(18,2),
    total_value   DECIMAL(18,2),
    entry_date    DATE,
    entered_by    INT REFERENCES Users(UserId),
    created_date  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id              SERIAL PRIMARY KEY,
    item_id         INT REFERENCES Items(ItemId),
    warehouse_id    INT REFERENCES Warehouses(WarehouseId),
    from_location   INT REFERENCES stock_locations(id),
    to_location     INT REFERENCES stock_locations(id),
    movement_type   VARCHAR(50),
    quantity        DECIMAL(10,2),
    reference_type  VARCHAR(50),
    reference_id    INT,
    moved_by        INT REFERENCES Users(UserId),
    moved_date      TIMESTAMP DEFAULT NOW(),
    notes           VARCHAR(500)
);

ALTER TABLE Stock
    ADD COLUMN IF NOT EXISTS location_id          INT REFERENCES stock_locations(id),
    ADD COLUMN IF NOT EXISTS opening_qty          DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unit_cost            DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS total_value          DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS is_high_value        BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS high_value_threshold DECIMAL(18,2);

-- ============================================================
-- REQ #05 — GENERAL JOURNAL: Lines, Workflow, Approval
-- ============================================================

CREATE TABLE IF NOT EXISTS journal_lines (
    id             SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES Transactions(TransactionId),
    account_id     INT REFERENCES Accounts(AccountId),
    entry_type     VARCHAR(5),
    amount         DECIMAL(18,2),
    tax_id         INT REFERENCES tax_master(id),
    tax_amount     DECIMAL(18,2) DEFAULT 0,
    description    VARCHAR(500),
    line_order     INT
);

CREATE TABLE IF NOT EXISTS journal_approval_log (
    id             SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES Transactions(TransactionId),
    action         VARCHAR(50),
    action_by      INT REFERENCES Users(UserId),
    action_date    TIMESTAMP DEFAULT NOW(),
    remarks        VARCHAR(500)
);

ALTER TABLE Transactions
    ADD COLUMN IF NOT EXISTS journal_number    VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS status            VARCHAR(20) DEFAULT 'Draft',
    ADD COLUMN IF NOT EXISTS narration         VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS tax_amount        DECIMAL(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS other_charges     DECIMAL(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_amount      DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS submitted_by      INT REFERENCES Users(UserId),
    ADD COLUMN IF NOT EXISTS submitted_date    TIMESTAMP,
    ADD COLUMN IF NOT EXISTS verified_by       INT REFERENCES Users(UserId),
    ADD COLUMN IF NOT EXISTS verified_date     TIMESTAMP,
    ADD COLUMN IF NOT EXISTS posted_by         INT REFERENCES Users(UserId),
    ADD COLUMN IF NOT EXISTS posted_date       TIMESTAMP,
    ADD COLUMN IF NOT EXISTS period_id         INT REFERENCES financial_periods(id),
    ADD COLUMN IF NOT EXISTS reference_type    VARCHAR(50),
    ADD COLUMN IF NOT EXISTS reference_number  VARCHAR(50),
    ADD COLUMN IF NOT EXISTS is_reversed       BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS reversed_by_id    INT;

-- ============================================================
-- REQ #06 — SALES: Proforma Invoice, Advance Payment
-- ============================================================

CREATE TABLE IF NOT EXISTS proforma_invoices (
    id                SERIAL PRIMARY KEY,
    pi_number         VARCHAR(50) UNIQUE,
    pi_date           DATE NOT NULL,
    valid_until       DATE,
    sales_order_id    INT REFERENCES SalesOrders(SalesOrderId),
    customer_id       INT REFERENCES Customers(CustomerId),
    subtotal          DECIMAL(18,2),
    tax_amount        DECIMAL(18,2),
    other_charges     DECIMAL(18,2),
    total_amount      DECIMAL(18,2),
    advance_requested DECIMAL(18,2),
    currency          VARCHAR(10) DEFAULT 'INR',
    status            VARCHAR(50) DEFAULT 'Draft',
    notes             TEXT,
    created_by        INT REFERENCES Users(UserId),
    created_date      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proforma_invoice_lines (
    id           SERIAL PRIMARY KEY,
    pi_id        INT REFERENCES proforma_invoices(id),
    item_id      INT REFERENCES Items(ItemId),
    description  VARCHAR(500),
    quantity     DECIMAL(10,2),
    unit_price   DECIMAL(18,2),
    discount_pct DECIMAL(5,2) DEFAULT 0,
    tax_id       INT REFERENCES tax_master(id),
    tax_amount   DECIMAL(18,2),
    line_total   DECIMAL(18,2)
);

CREATE TABLE IF NOT EXISTS advance_payments (
    id             SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE,
    sales_order_id INT REFERENCES SalesOrders(SalesOrderId),
    customer_id    INT REFERENCES Customers(CustomerId),
    pi_id          INT REFERENCES proforma_invoices(id),
    payment_date   DATE NOT NULL,
    amount         DECIMAL(18,2),
    payment_mode   VARCHAR(50),
    reference_number VARCHAR(100),
    bank_account   VARCHAR(100),
    status         VARCHAR(50) DEFAULT 'Received',
    notes          VARCHAR(500),
    created_by     INT REFERENCES Users(UserId),
    created_date   TIMESTAMP DEFAULT NOW()
);

ALTER TABLE SalesOrders
    ADD COLUMN IF NOT EXISTS customer_po_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS customer_po_date   DATE,
    ADD COLUMN IF NOT EXISTS customer_po_doc    VARCHAR(500),
    ADD COLUMN IF NOT EXISTS advance_percent    DECIMAL(5,2) DEFAULT 75.00,
    ADD COLUMN IF NOT EXISTS advance_amount     DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS balance_amount     DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS payment_terms      VARCHAR(500),
    ADD COLUMN IF NOT EXISTS delivery_terms     VARCHAR(500),
    ADD COLUMN IF NOT EXISTS so_type            VARCHAR(50) DEFAULT 'Domestic',
    ADD COLUMN IF NOT EXISTS currency           VARCHAR(10) DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS exchange_rate      DECIMAL(10,4) DEFAULT 1;

-- ============================================================
-- REQ #07 — PURCHASE: Material Request, GRN, Quotation
-- ============================================================

CREATE TABLE IF NOT EXISTS material_requests (
    id              SERIAL PRIMARY KEY,
    mr_number       VARCHAR(50) UNIQUE,
    request_date    DATE NOT NULL,
    required_date   DATE,
    request_type    VARCHAR(50),
    reference_id    INT,
    reference_type  VARCHAR(50),
    status          VARCHAR(50) DEFAULT 'Pending',
    requested_by    INT REFERENCES Users(UserId),
    approved_by     INT REFERENCES Users(UserId),
    approved_date   TIMESTAMP,
    notes           VARCHAR(500),
    created_date    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS material_request_lines (
    id            SERIAL PRIMARY KEY,
    mr_id         INT REFERENCES material_requests(id),
    item_id       INT REFERENCES Items(ItemId),
    required_qty  DECIMAL(10,2),
    available_qty DECIMAL(10,2),
    shortage_qty  DECIMAL(10,2),
    unit          VARCHAR(20),
    notes         VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS supplier_quotations (
    id               SERIAL PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE,
    mr_id            INT REFERENCES material_requests(id),
    supplier_id      INT REFERENCES Suppliers(SupplierId),
    quotation_date   DATE,
    valid_until      DATE,
    total_amount     DECIMAL(18,2),
    currency         VARCHAR(10),
    delivery_days    INT,
    payment_terms    VARCHAR(200),
    status           VARCHAR(50),
    notes            TEXT,
    created_by       INT REFERENCES Users(UserId),
    created_date     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_quotation_lines (
    id            SERIAL PRIMARY KEY,
    quotation_id  INT REFERENCES supplier_quotations(id),
    item_id       INT REFERENCES Items(ItemId),
    quantity      DECIMAL(10,2),
    unit_price    DECIMAL(18,2),
    tax_id        INT REFERENCES tax_master(id),
    tax_amount    DECIMAL(18,2),
    line_total    DECIMAL(18,2),
    delivery_date DATE
);

CREATE TABLE IF NOT EXISTS goods_receipts (
    id           SERIAL PRIMARY KEY,
    grn_number   VARCHAR(50) UNIQUE,
    receipt_date DATE NOT NULL,
    po_id        INT REFERENCES PurchaseOrders(PurchaseOrderId),
    supplier_id  INT REFERENCES Suppliers(SupplierId),
    warehouse_id INT REFERENCES Warehouses(WarehouseId),
    status       VARCHAR(50) DEFAULT 'Draft',
    received_by  INT REFERENCES Users(UserId),
    notes        VARCHAR(500),
    created_date TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goods_receipt_lines (
    id            SERIAL PRIMARY KEY,
    grn_id        INT REFERENCES goods_receipts(id),
    item_id       INT REFERENCES Items(ItemId),
    po_qty        DECIMAL(10,2),
    received_qty  DECIMAL(10,2),
    accepted_qty  DECIMAL(10,2),
    rejected_qty  DECIMAL(10,2),
    location_id   INT REFERENCES stock_locations(id),
    unit_price    DECIMAL(18,2),
    notes         VARCHAR(300)
);

ALTER TABLE PurchaseOrders
    ADD COLUMN IF NOT EXISTS mr_id           INT REFERENCES material_requests(id),
    ADD COLUMN IF NOT EXISTS quotation_id    INT REFERENCES supplier_quotations(id),
    ADD COLUMN IF NOT EXISTS payment_terms   VARCHAR(200),
    ADD COLUMN IF NOT EXISTS delivery_terms  VARCHAR(200),
    ADD COLUMN IF NOT EXISTS currency        VARCHAR(10) DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS exchange_rate   DECIMAL(10,4) DEFAULT 1,
    ADD COLUMN IF NOT EXISTS grn_status      VARCHAR(50) DEFAULT 'Pending',
    ADD COLUMN IF NOT EXISTS invoice_status  VARCHAR(50) DEFAULT 'Pending';

-- ============================================================
-- REQ #08 — MANUFACTURING: Production Plan, WIP, QA
-- ============================================================

CREATE TABLE IF NOT EXISTS production_plans (
    id                SERIAL PRIMARY KEY,
    plan_number       VARCHAR(50) UNIQUE,
    plan_date         DATE,
    plan_period_start DATE,
    plan_period_end   DATE,
    status            VARCHAR(50) DEFAULT 'Draft',
    created_by        INT REFERENCES Users(UserId),
    approved_by       INT REFERENCES Users(UserId),
    notes             TEXT,
    created_date      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_plan_lines (
    id              SERIAL PRIMARY KEY,
    plan_id         INT REFERENCES production_plans(id),
    item_id         INT REFERENCES Items(ItemId),
    bom_id          INT REFERENCES BillOfMaterials(BOMId),
    planned_qty     DECIMAL(10,2),
    work_order_id   INT REFERENCES WorkOrders(WorkOrderId),
    scheduled_date  DATE,
    notes           VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS wip_tracking (
    id            SERIAL PRIMARY KEY,
    work_order_id INT REFERENCES WorkOrders(WorkOrderId),
    stage         VARCHAR(100),
    stage_order   INT,
    status        VARCHAR(50) DEFAULT 'Pending',
    started_at    TIMESTAMP,
    completed_at  TIMESTAMP,
    assigned_to   INT REFERENCES Users(UserId),
    quantity_in   DECIMAL(10,2),
    quantity_out  DECIMAL(10,2),
    scrap_qty     DECIMAL(10,2) DEFAULT 0,
    notes         VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS quality_checks (
    id            SERIAL PRIMARY KEY,
    qc_number     VARCHAR(50) UNIQUE,
    work_order_id INT REFERENCES WorkOrders(WorkOrderId),
    item_id       INT REFERENCES Items(ItemId),
    check_date    DATE NOT NULL,
    inspected_by  INT REFERENCES Users(UserId),
    total_qty     DECIMAL(10,2),
    passed_qty    DECIMAL(10,2),
    failed_qty    DECIMAL(10,2),
    status        VARCHAR(50),
    remarks       VARCHAR(500),
    created_date  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality_check_parameters (
    id              SERIAL PRIMARY KEY,
    qc_id           INT REFERENCES quality_checks(id),
    parameter_name  VARCHAR(100),
    expected_value  VARCHAR(100),
    actual_value    VARCHAR(100),
    result          VARCHAR(20),
    notes           VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS production_material_issues (
    id            SERIAL PRIMARY KEY,
    work_order_id INT REFERENCES WorkOrders(WorkOrderId),
    item_id       INT REFERENCES Items(ItemId),
    warehouse_id  INT REFERENCES Warehouses(WarehouseId),
    location_id   INT REFERENCES stock_locations(id),
    issued_qty    DECIMAL(10,2),
    issued_by     INT REFERENCES Users(UserId),
    issued_date   TIMESTAMP DEFAULT NOW(),
    notes         VARCHAR(300)
);

ALTER TABLE WorkOrders
    ADD COLUMN IF NOT EXISTS bom_id          INT REFERENCES BillOfMaterials(BOMId),
    ADD COLUMN IF NOT EXISTS planned_start   TIMESTAMP,
    ADD COLUMN IF NOT EXISTS planned_end     TIMESTAMP,
    ADD COLUMN IF NOT EXISTS actual_start    TIMESTAMP,
    ADD COLUMN IF NOT EXISTS actual_end      TIMESTAMP,
    ADD COLUMN IF NOT EXISTS assigned_to     INT REFERENCES Users(UserId),
    ADD COLUMN IF NOT EXISTS priority        VARCHAR(20) DEFAULT 'Normal',
    ADD COLUMN IF NOT EXISTS notes           TEXT,
    ADD COLUMN IF NOT EXISTS sales_order_id  INT REFERENCES SalesOrders(SalesOrderId);

ALTER TABLE BillOfMaterials
    ADD COLUMN IF NOT EXISTS bom_version     VARCHAR(20) DEFAULT 'v1',
    ADD COLUMN IF NOT EXISTS description     VARCHAR(500),
    ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(20),
    ADD COLUMN IF NOT EXISTS production_qty  DECIMAL(10,2) DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_default      BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS approved_by     INT REFERENCES Users(UserId),
    ADD COLUMN IF NOT EXISTS approved_date   TIMESTAMP;

ALTER TABLE BOMDetails
    ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(20),
    ADD COLUMN IF NOT EXISTS scrap_percent   DECIMAL(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_optional     BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS notes           VARCHAR(300);

-- ============================================================
-- REQ #09 — INVOICING: GST Lines, Packing List, HSN Codes
-- ============================================================

CREATE TABLE IF NOT EXISTS hsn_codes (
    id          SERIAL PRIMARY KEY,
    hsn_code    VARCHAR(20) UNIQUE,
    description VARCHAR(500),
    cgst_rate   DECIMAL(5,2),
    sgst_rate   DECIMAL(5,2),
    igst_rate   DECIMAL(5,2),
    is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS invoice_lines (
    id               SERIAL PRIMARY KEY,
    invoice_id       INT REFERENCES Invoices(InvoiceId),
    item_id          INT REFERENCES Items(ItemId),
    description      VARCHAR(500),
    hsn_code         VARCHAR(20),
    quantity         DECIMAL(10,2),
    unit_of_measure  VARCHAR(20),
    unit_price       DECIMAL(18,2),
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount  DECIMAL(18,2) DEFAULT 0,
    taxable_amount   DECIMAL(18,2),
    cgst_rate        DECIMAL(5,2),
    cgst_amount      DECIMAL(18,2) DEFAULT 0,
    sgst_rate        DECIMAL(5,2),
    sgst_amount      DECIMAL(18,2) DEFAULT 0,
    igst_rate        DECIMAL(5,2),
    igst_amount      DECIMAL(18,2) DEFAULT 0,
    line_total       DECIMAL(18,2)
);

CREATE TABLE IF NOT EXISTS packing_lists (
    id               SERIAL PRIMARY KEY,
    pl_number        VARCHAR(50) UNIQUE,
    pl_date          DATE NOT NULL,
    sales_order_id   INT REFERENCES SalesOrders(SalesOrderId),
    invoice_id       INT REFERENCES Invoices(InvoiceId),
    customer_id      INT REFERENCES Customers(CustomerId),
    shipping_marks   VARCHAR(500),
    gross_weight     DECIMAL(10,3),
    net_weight       DECIMAL(10,3),
    no_of_packages   INT,
    package_type     VARCHAR(50),
    port_of_loading  VARCHAR(100),
    port_of_discharge VARCHAR(100),
    vessel_flight    VARCHAR(100),
    bl_awb_number    VARCHAR(100),
    country_of_origin VARCHAR(100) DEFAULT 'India',
    created_by       INT REFERENCES Users(UserId),
    created_date     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packing_list_lines (
    id              SERIAL PRIMARY KEY,
    pl_id           INT REFERENCES packing_lists(id),
    item_id         INT REFERENCES Items(ItemId),
    description     VARCHAR(500),
    quantity        DECIMAL(10,2),
    unit_of_measure VARCHAR(20),
    gross_weight    DECIMAL(10,3),
    net_weight      DECIMAL(10,3),
    package_no      VARCHAR(50)
);

ALTER TABLE Invoices
    ADD COLUMN IF NOT EXISTS invoice_type       VARCHAR(30) DEFAULT 'Tax Invoice',
    ADD COLUMN IF NOT EXISTS sales_order_id     INT REFERENCES SalesOrders(SalesOrderId),
    ADD COLUMN IF NOT EXISTS grn_id             INT REFERENCES goods_receipts(id),
    ADD COLUMN IF NOT EXISTS po_id              INT REFERENCES PurchaseOrders(PurchaseOrderId),
    ADD COLUMN IF NOT EXISTS invoice_category   VARCHAR(20) DEFAULT 'Sales',
    ADD COLUMN IF NOT EXISTS subtotal           DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS discount_amount    DECIMAL(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cgst_amount        DECIMAL(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sgst_amount        DECIMAL(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS igst_amount        DECIMAL(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS other_charges      DECIMAL(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS currency           VARCHAR(10) DEFAULT 'INR',
    ADD COLUMN IF NOT EXISTS exchange_rate      DECIMAL(10,4) DEFAULT 1,
    ADD COLUMN IF NOT EXISTS place_of_supply    VARCHAR(100),
    ADD COLUMN IF NOT EXISTS supply_type        VARCHAR(20) DEFAULT 'Intra-state',
    ADD COLUMN IF NOT EXISTS billing_address    TEXT,
    ADD COLUMN IF NOT EXISTS shipping_address   TEXT,
    ADD COLUMN IF NOT EXISTS payment_terms      VARCHAR(200),
    ADD COLUMN IF NOT EXISTS bank_details       TEXT,
    ADD COLUMN IF NOT EXISTS terms_conditions   TEXT,
    ADD COLUMN IF NOT EXISTS e_invoice_number   VARCHAR(100),
    ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS is_fully_paid      BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_payment_date  DATE,
    ADD COLUMN IF NOT EXISTS payment_status     VARCHAR(30) DEFAULT 'Unpaid';

-- ============================================================
-- REQ #10 — PAYMENT HANDLING
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
    id              SERIAL PRIMARY KEY,
    payment_number  VARCHAR(50) UNIQUE,
    payment_date    DATE NOT NULL,
    payment_type    VARCHAR(20),
    party_type      VARCHAR(20),
    party_id        INT,
    amount          DECIMAL(18,2),
    currency        VARCHAR(10) DEFAULT 'INR',
    exchange_rate   DECIMAL(10,4) DEFAULT 1,
    payment_mode    VARCHAR(50),
    reference_number VARCHAR(100),
    bank_account    VARCHAR(100),
    status          VARCHAR(30) DEFAULT 'Draft',
    notes           VARCHAR(500),
    created_by      INT REFERENCES Users(UserId),
    posted_by       INT REFERENCES Users(UserId),
    posted_date     TIMESTAMP,
    created_date    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_allocations (
    id               SERIAL PRIMARY KEY,
    payment_id       INT REFERENCES payments(id),
    invoice_id       INT REFERENCES Invoices(InvoiceId),
    allocated_amount DECIMAL(18,2),
    allocation_date  TIMESTAMP DEFAULT NOW(),
    notes            VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS payment_advances (
    id               SERIAL PRIMARY KEY,
    payment_id       INT REFERENCES payments(id),
    sales_order_id   INT REFERENCES SalesOrders(SalesOrderId),
    po_id            INT REFERENCES PurchaseOrders(PurchaseOrderId),
    advance_amount   DECIMAL(18,2),
    adjusted_amount  DECIMAL(18,2) DEFAULT 0,
    balance_amount   DECIMAL(18,2),
    is_fully_adjusted BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- REQ #11 — ASSETS: Categories, Depreciation, Maintenance
-- ============================================================

CREATE TABLE IF NOT EXISTS asset_categories (
    id                      SERIAL PRIMARY KEY,
    category_name           VARCHAR(100),
    depreciation_method     VARCHAR(20) DEFAULT 'SLM',
    depreciation_rate       DECIMAL(5,2),
    useful_life_years       INT,
    asset_account_id        INT REFERENCES Accounts(AccountId),
    depreciation_account_id INT REFERENCES Accounts(AccountId),
    accumulated_dep_account INT REFERENCES Accounts(AccountId),
    is_active               BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS depreciation_schedules (
    id                  SERIAL PRIMARY KEY,
    asset_id            INT REFERENCES Assets(AssetId),
    schedule_date       DATE,
    period_start        DATE,
    period_end          DATE,
    opening_book_value  DECIMAL(18,2),
    depreciation_amount DECIMAL(18,2),
    closing_book_value  DECIMAL(18,2),
    status              VARCHAR(20) DEFAULT 'Scheduled',
    journal_id          INT REFERENCES Transactions(TransactionId),
    posted_date         TIMESTAMP,
    posted_by           INT REFERENCES Users(UserId)
);

CREATE TABLE IF NOT EXISTS asset_maintenance (
    id                    SERIAL PRIMARY KEY,
    asset_id              INT REFERENCES Assets(AssetId),
    maintenance_date      DATE,
    maintenance_type      VARCHAR(50),
    description           TEXT,
    cost                  DECIMAL(18,2),
    vendor                VARCHAR(200),
    next_maintenance_date DATE,
    performed_by          VARCHAR(200),
    created_by            INT REFERENCES Users(UserId),
    created_date          TIMESTAMP DEFAULT NOW()
);

ALTER TABLE Assets
    ADD COLUMN IF NOT EXISTS asset_category_id       INT REFERENCES asset_categories(id),
    ADD COLUMN IF NOT EXISTS supplier_id             INT REFERENCES Suppliers(SupplierId),
    ADD COLUMN IF NOT EXISTS useful_life_years       INT,
    ADD COLUMN IF NOT EXISTS depreciation_method     VARCHAR(20) DEFAULT 'SLM',
    ADD COLUMN IF NOT EXISTS depreciation_rate       DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS salvage_value           DECIMAL(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS accumulated_depreciation DECIMAL(18,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS book_value              DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS last_depreciation_date  DATE,
    ADD COLUMN IF NOT EXISTS depreciation_account_id INT REFERENCES Accounts(AccountId),
    ADD COLUMN IF NOT EXISTS asset_account_id        INT REFERENCES Accounts(AccountId),
    ADD COLUMN IF NOT EXISTS disposed_date           DATE,
    ADD COLUMN IF NOT EXISTS disposal_value          DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS warranty_expiry         DATE,
    ADD COLUMN IF NOT EXISTS insurance_expiry        DATE,
    ADD COLUMN IF NOT EXISTS serial_number           VARCHAR(100),
    ADD COLUMN IF NOT EXISTS make_model              VARCHAR(200),
    ADD COLUMN IF NOT EXISTS department              VARCHAR(100),
    ADD COLUMN IF NOT EXISTS assigned_to             INT REFERENCES Users(UserId);

-- ============================================================
-- REQ #12 — WORKFLOW: Delivery Orders, Traceability
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_orders (
    id              SERIAL PRIMARY KEY,
    do_number       VARCHAR(50) UNIQUE,
    do_date         DATE NOT NULL,
    sales_order_id  INT REFERENCES SalesOrders(SalesOrderId),
    work_order_id   INT REFERENCES WorkOrders(WorkOrderId),
    customer_id     INT REFERENCES Customers(CustomerId),
    delivery_date   DATE,
    delivery_address TEXT,
    transport_mode  VARCHAR(50),
    transporter     VARCHAR(200),
    lr_number       VARCHAR(100),
    vehicle_number  VARCHAR(50),
    status          VARCHAR(50) DEFAULT 'Pending',
    dispatched_by   INT REFERENCES Users(UserId),
    dispatched_date TIMESTAMP,
    delivered_date  DATE,
    notes           TEXT,
    created_by      INT REFERENCES Users(UserId),
    created_date    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_order_lines (
    id           SERIAL PRIMARY KEY,
    do_id        INT REFERENCES delivery_orders(id),
    item_id      INT REFERENCES Items(ItemId),
    quantity     DECIMAL(10,2),
    warehouse_id INT REFERENCES Warehouses(WarehouseId),
    location_id  INT REFERENCES stock_locations(id)
);

CREATE TABLE IF NOT EXISTS so_traceability (
    id              SERIAL PRIMARY KEY,
    sales_order_id  INT REFERENCES SalesOrders(SalesOrderId),
    work_order_id   INT REFERENCES WorkOrders(WorkOrderId),
    mr_id           INT REFERENCES material_requests(id),
    po_id           INT REFERENCES PurchaseOrders(PurchaseOrderId),
    grn_id          INT REFERENCES goods_receipts(id),
    do_id           INT REFERENCES delivery_orders(id),
    invoice_id      INT REFERENCES Invoices(InvoiceId),
    payment_id      INT REFERENCES payments(id),
    created_date    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_status (
    id             SERIAL PRIMARY KEY,
    reference_type VARCHAR(50),
    reference_id   INT,
    stage          VARCHAR(100),
    status         VARCHAR(50),
    updated_by     INT REFERENCES Users(UserId),
    updated_date   TIMESTAMP DEFAULT NOW(),
    notes          VARCHAR(500)
);

-- ============================================================
-- REQ #13 — COMMUNICATION: Notifications, Email Log
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_templates (
    id            SERIAL PRIMARY KEY,
    template_name VARCHAR(100),
    event_type    VARCHAR(100),
    subject       VARCHAR(255),
    body_html     TEXT,
    body_text     TEXT,
    is_active     BOOLEAN DEFAULT TRUE,
    created_date  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_log (
    id              SERIAL PRIMARY KEY,
    event_type      VARCHAR(100),
    reference_type  VARCHAR(50),
    reference_id    INT,
    recipient_email VARCHAR(255),
    recipient_name  VARCHAR(200),
    subject         VARCHAR(255),
    status          VARCHAR(30) DEFAULT 'Pending',
    sent_date       TIMESTAMP,
    error_message   VARCHAR(500),
    created_date    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_notifications (
    id             SERIAL PRIMARY KEY,
    user_id        INT REFERENCES Users(UserId),
    title          VARCHAR(200),
    message        TEXT,
    type           VARCHAR(50),
    reference_type VARCHAR(50),
    reference_id   INT,
    is_read        BOOLEAN DEFAULT FALSE,
    created_date   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_config (
    id            SERIAL PRIMARY KEY,
    smtp_host     VARCHAR(200),
    smtp_port     INT,
    smtp_user     VARCHAR(200),
    smtp_password VARCHAR(500),
    from_email    VARCHAR(200),
    from_name     VARCHAR(200),
    is_active     BOOLEAN DEFAULT TRUE,
    updated_date  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES — for performance on frequently queried columns
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_items_category      ON Items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_subcategory   ON Items(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_items_number        ON Items(item_number);
CREATE INDEX IF NOT EXISTS idx_stock_location      ON Stock(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON Invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_fully_paid ON Invoices(is_fully_paid);
CREATE INDEX IF NOT EXISTS idx_payments_party      ON payments(party_type, party_id);
CREATE INDEX IF NOT EXISTS idx_wip_workorder       ON wip_tracking(work_order_id);
CREATE INDEX IF NOT EXISTS idx_qc_workorder        ON quality_checks(work_order_id);
CREATE INDEX IF NOT EXISTS idx_dep_schedule_asset  ON depreciation_schedules(asset_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user     ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_user          ON system_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_traceability_so     ON so_traceability(sales_order_id);

-- ============================================================
-- SEED: Default data for sequences, currencies, company
-- ============================================================

INSERT INTO number_sequences (document_type, prefix, format, financial_year) VALUES
('SO',  'SO',  'SO-YYYY-NNNN',  '2026-27'),
('PO',  'PO',  'PO-YYYY-NNNN',  '2026-27'),
('INV', 'INV', 'INV-YYYY-NNNN', '2026-27'),
('PI',  'PI',  'PI-YYYY-NNNN',  '2026-27'),
('JNL', 'JNL', 'JNL-YYYY-NNNN', '2026-27'),
('MR',  'MR',  'MR-YYYY-NNNN',  '2026-27'),
('GRN', 'GRN', 'GRN-YYYY-NNNN', '2026-27'),
('WO',  'WO',  'WO-YYYY-NNNN',  '2026-27'),
('DO',  'DO',  'DO-YYYY-NNNN',  '2026-27'),
('QC',  'QC',  'QC-YYYY-NNNN',  '2026-27'),
('PAY', 'PAY', 'PAY-YYYY-NNNN', '2026-27'),
('ADV', 'ADV', 'ADV-YYYY-NNNN', '2026-27'),
('ITM', 'ITM', 'ITM-NNNNN',     '2026-27')
ON CONFLICT (document_type) DO NOTHING;

INSERT INTO currencies (code, name, symbol, exchange_rate) VALUES
('INR', 'Indian Rupee',   '₹',  1.0000),
('USD', 'US Dollar',      '$',  83.5000),
('EUR', 'Euro',           '€',  90.2000),
('GBP', 'British Pound',  '£', 105.8000),
('AED', 'UAE Dirham',     'د.إ', 22.7000)
ON CONFLICT (code) DO NOTHING;

INSERT INTO company_settings (company_name, country, base_currency, financial_year_start)
VALUES ('My Company', 'India', 'INR', '04-01')
ON CONFLICT DO NOTHING;

INSERT INTO tax_master (tax_name, tax_type, tax_rate) VALUES
('GST 5%',   'GST',  5.00),
('GST 12%',  'GST', 12.00),
('GST 18%',  'GST', 18.00),
('GST 28%',  'GST', 28.00),
('CGST 2.5%','CGST', 2.50),
('SGST 2.5%','SGST', 2.50),
('CGST 6%',  'CGST', 6.00),
('SGST 6%',  'SGST', 6.00),
('CGST 9%',  'CGST', 9.00),
('SGST 9%',  'SGST', 9.00),
('IGST 5%',  'IGST', 5.00),
('IGST 12%', 'IGST',12.00),
('IGST 18%', 'IGST',18.00),
('IGST 28%', 'IGST',28.00)
ON CONFLICT DO NOTHING;

INSERT INTO user_roles_permissions (role_name, description, permissions) VALUES
('Admin',      'Full access to all modules', '{"all": true}'::jsonb),
('Manager',    'Can approve, view reports',  '{"approve": true, "view": true, "create": true}'::jsonb),
('Accountant', 'Finance module access',      '{"accounting": true, "invoices": true, "payments": true}'::jsonb),
('Store',      'Inventory access',           '{"inventory": true, "grn": true}'::jsonb),
('Production', 'Manufacturing access',       '{"manufacturing": true, "wip": true}'::jsonb),
('Sales',      'Sales module access',        '{"sales": true, "customers": true}'::jsonb)
ON CONFLICT (role_name) DO NOTHING;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
