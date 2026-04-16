-- Migration to add IsActive column to Warehouses table
ALTER TABLE Warehouses ADD COLUMN IsActive BOOLEAN DEFAULT TRUE;
