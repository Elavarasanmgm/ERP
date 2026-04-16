-- Fix for Planning Module missing tables and columns

-- 1. Forecasts
DROP TABLE IF EXISTS forecasts CASCADE;
CREATE TABLE forecasts (
    id                SERIAL PRIMARY KEY,
    item_id           INT REFERENCES Items(ItemId),
    forecast_month    INT,
    forecast_year     INT,
    quantity          DECIMAL(18,2),
    confidence_level  INT DEFAULT 80,
    notes             TEXT,
    created_date      TIMESTAMP DEFAULT NOW()
);

-- 2. MRP Runs
DROP TABLE IF EXISTS mrp_runs CASCADE;
CREATE TABLE mrp_runs (
    id                SERIAL PRIMARY KEY,
    run_date          DATE DEFAULT CURRENT_DATE,
    planning_period   VARCHAR(50),
    status            VARCHAR(50) DEFAULT 'Completed',
    notes             TEXT,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- 3. Planned Orders
DROP TABLE IF EXISTS planned_orders CASCADE;
CREATE TABLE planned_orders (
    id                SERIAL PRIMARY KEY,
    item_id           INT REFERENCES Items(ItemId),
    mrp_run_id        INT REFERENCES mrp_runs(id),
    quantity          DECIMAL(18,2),
    planned_date      DATE,
    planned_start_date DATE,
    order_type        VARCHAR(50), -- E.g., 'Purchase', 'Production'
    status            VARCHAR(50) DEFAULT 'Planned',
    created_date      TIMESTAMP DEFAULT NOW()
);

-- 4. Capacity Planning
DROP TABLE IF EXISTS capacity_planning CASCADE;
CREATE TABLE capacity_planning (
    id                SERIAL PRIMARY KEY,
    resource_name     VARCHAR(255),
    available_hours   DECIMAL(10,2),
    planned_hours     DECIMAL(10,2),
    period_month      INT,
    period_year       INT,
    created_date      TIMESTAMP DEFAULT NOW()
);

-- 5. Update production_plans if columns missing
ALTER TABLE production_plans 
    ADD COLUMN IF NOT EXISTS item_id INT REFERENCES Items(ItemId),
    ADD COLUMN IF NOT EXISTS planned_qty DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS planned_start_date DATE,
    ADD COLUMN IF NOT EXISTS planned_end_date DATE,
    ADD COLUMN IF NOT EXISTS plan_period VARCHAR(50);

-- Seed some initial data for visibility
INSERT INTO forecasts (item_id, forecast_month, forecast_year, quantity, confidence_level, notes)
SELECT ItemId, 4, 2026, 500, 85, 'Spring demand' FROM Items LIMIT 2;

INSERT INTO mrp_runs (run_date, planning_period, status, notes)
VALUES (CURRENT_DATE, '2026-Q2', 'Completed', 'Initial MRP run for Q2');

INSERT INTO planned_orders (item_id, mrp_run_id, quantity, planned_date, planned_start_date, order_type, status)
SELECT ItemId, 1, 100, CURRENT_DATE + 30, CURRENT_DATE + 25, 'Production', 'Planned' FROM Items LIMIT 2;

INSERT INTO capacity_planning (resource_name, available_hours, planned_hours, period_month, period_year)
VALUES ('Main Assembly Line', 160, 120, 4, 2026),
       ('CNC Workshop', 200, 180, 4, 2026);
