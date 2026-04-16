#!/bin/bash
set -e

echo "=== ERP Database Initialization ==="

# Run migrations in order
echo "Running migrations..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /init-scripts/001_create_schema_pg.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /init-scripts/002_full_requirements_migration.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /init-scripts/003_planning_module_fix.sql
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /init-scripts/004_add_warehouse_active.sql

# Run seeds
echo "Running seeds..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /init-scripts/001_seed_data_pg.sql

echo "=== Database initialization complete ==="
